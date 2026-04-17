const request = require('supertest');
const app = require('../server');
const { sequelize, User, Role } = require('../src/models');
const bcrypt = require('bcryptjs');

describe('Auth API (TDD Flow)', () => {
  beforeAll(async () => {
    // Garante que o segredo JWT existe para os testes
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    // Sincroniza o banco de dados em memória antes dos testes
    await sequelize.sync({ force: true });

    // Cria os perfis iniciais necessários
    await Role.bulkCreate([
      { id: 1, nome: 'Administrador', permissoes: ['dashboard', 'users'] },
      { id: 2, nome: 'Usuário Básico', permissoes: ['dashboard'] }
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('RED: Deve retornar 401 ao tentar carregar categorias sem token', async () => {
    const response = await request(app).get('/api/categories');
    expect(response.status).toBe(401);
  });

  it('GREEN: Deve permitir o login com credenciais válidas', async () => {
    const rawPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Primeiro, cria um usuário para teste com senha HASHEADA
    await User.create({
      nome: 'Tester',
      email: 'test@artemis.com',
      senha: hashedPassword,
      role_id: 1,
      role: 'admin'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@artemis.com', senha: rawPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
