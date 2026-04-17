const request = require('supertest');
const app = require('../server');
const { sequelize, User, Role, AppSetting } = require('../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let adminToken;
let adminUserId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const adminRole = await Role.create({
    nome: 'Admin',
    permissoes: ['dashboard', 'transactions', 'settings']
  });

  const salt = await bcrypt.genSalt(10);
  const hashSenha = await bcrypt.hash('admin@123', salt);

  const adminUser = await User.create({
    nome: 'Admin User',
    email: 'admin@test.com',
    senha: hashSenha,
    role_id: adminRole.id
  });

  adminUserId = adminUser.id;
  adminToken = jwt.sign({ id: adminUserId, email: adminUser.email, role_id: adminRole.id, permissions: ['dashboard', 'transactions', 'settings'] }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

  // Povoar AppSettings como seria feito pelo index.js
  await AppSetting.create({ key: 'commission_percentage', value: 10 });
  await AppSetting.create({ key: 'payment_fees', value: [{ id: 1, name: 'Crédito à Vista', percentage: 3.15 }] });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Settings API', () => {
  it('should get global settings', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('commission_percentage', 10);
    expect(res.body).toHaveProperty('payment_fees');
    expect(res.body.payment_fees.length).toBe(1);
  });

  it('should update commission percentage', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ commission_percentage: 15, payment_fees: [] });
    
    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get('/api/settings').set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.body.commission_percentage).toBe(15);
  });
});
