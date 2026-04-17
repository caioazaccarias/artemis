const request = require('supertest');
const app = require('../server');
const { sequelize, User, Role, Commission, AppSetting } = require('../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let userToken;
let userId;
let mockSettings;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const role = await Role.create({ nome: 'Básico', permissoes: ['commissions'] });
  const hashSenha = await bcrypt.hash('123456', 10);
  const user = await User.create({ nome: 'Teste', email: 'vendedor@test.com', senha: hashSenha, role_id: role.id });
  
  userId = user.id;
  userToken = jwt.sign({ id: userId, email: user.email, permissions: role.permissoes, role_id: role.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

  await AppSetting.create({ key: 'commission_percentage', value: 10 });
  await AppSetting.create({ key: 'payment_fees', value: [{ id: 1, name: 'Crédito à Vista', percentage: 5 }] });
});

afterAll(async () => await sequelize.close());

describe('Commissions API', () => {
  it('should create a single commission and calculate lucro correctly', async () => {
    // Total = 1000. Peças = 100, Despesas = 50. Sem taxa de cartão.
    // Lucro esperado = 1000 - 100 - 50 = 850.
    // Comissão = 850 * 10% = 85.
    const res = await request(app)
      .post('/api/commissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        data_os: '2023-10-01', data: '2023-10-05', num_os: 'OS-001',
        cliente: 'CLIENTE A', total: 1000, tem_taxas: false,
        pecas: 100, despesas: 50, repeticao_tipo: 'single'
      });
    
    expect(res.statusCode).toBe(201);
    expect(parseFloat(res.body.lucro)).toBe(850);
    expect(parseFloat(res.body.total_comissao)).toBe(85);
  });

  it('should create a single commission with payment fee correctly', async () => {
    // Total = 1000. Taxa de 5%. Taxa_valor = 50. Peças = 0.
    // Lucro esperado = 950.
    // Comissão = 95.
    const res = await request(app)
      .post('/api/commissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        data_os: '2023-10-05', data: '2023-10-10', num_os: 'OS-002',
        cliente: 'CLIENTE B', total: 1000, 
        tem_taxas: true, taxa_id: 1, nome_taxa_aplicada: 'Crédito à Vista', valor_taxas: 50,
        pecas: 0, despesas: 0, repeticao_tipo: 'single'
      });
    
    expect(res.statusCode).toBe(201);
    expect(parseFloat(res.body.valor_taxas)).toBe(50);
    expect(parseFloat(res.body.lucro)).toBe(950);
    expect(parseFloat(res.body.total_comissao)).toBe(95);
  });

  it('should create a repeating commission (custom repetition)', async () => {
    const res = await request(app)
      .post('/api/commissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        data_os: '2023-11-01', data: '2023-11-01', num_os: 'OS-003',
        cliente: 'REPETE', total: 500, tem_taxas: false, pecas: 0, despesas: 0,
        repeticao_tipo: 'custom', repetir_vezes: 3
      });
    
    expect(res.statusCode).toBe(201);
    
    // Verificamos se existem 3 itens para essa OS
    const listRes = await request(app)
      .get(`/api/commissions?mes=12&ano=2023&search=REPETE`)
      .set('Authorization', `Bearer ${userToken}`);
    
    // Como criamos no mês 11 espalhando pra 11, 12, 01, deve retornar em dezembro
    expect(listRes.body.length).toBe(1);
    
    // O total cadastrado na base com num_os = OS-003 deve ser 3
    const totalItems = await Commission.count({ where: { num_os: 'OS-003' } });
    expect(totalItems).toBe(3);
  });

  it('should create a parent FIXO commission and provision child dynamically on GET', async () => {
    const res = await request(app)
      .post('/api/commissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        data_os: '2024-01-10', data: '2024-01-10', num_os: 'MENSAL-FIXA',
        cliente: 'FIXIN', total: 300, tem_taxas: false, pecas: 0, despesas: 0,
        repeticao_tipo: 'fixo'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.is_fixo).toBe(true);
    expect(res.body.parent_id).toBeNull();
    
    // Chamar um endpoint em março para forçar o backend a preencher dinamicamente Fevereiro e Março
    const listRes = await request(app)
      .get(`/api/commissions?mes=3&ano=2024&search=FIXIN`)
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.length).toBe(1);
    // Este item de março deve ter parent_id preenchido.
    expect(listRes.body[0].parent_id).toBe(res.body.id);
  });
});
