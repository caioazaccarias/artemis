const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Category = require('./Category');
const Role = require('./Role');
const bcrypt = require('bcryptjs');

// Define os relacionamentos
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoria_id', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoria_id', as: 'categoriaData' });

Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'roleData' });

// Sincroniza o banco de dados e cria as tabelas se não existirem
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Tabelas sincronizadas com sucesso.');

    // Seed de Roles Padrão
    const [adminRole] = await Role.findOrCreate({ 
      where: { nome: 'Administrador' }, 
      defaults: { permissoes: ['dashboard', 'transactions', 'categories', 'users', 'roles', 'backup'] } 
    });
    const [userRole] = await Role.findOrCreate({ 
      where: { nome: 'Usuário Básico' }, 
      defaults: { permissoes: ['dashboard', 'transactions'] } 
    });

    // Migração de Usuários antigos (se role_id estiver nulo)
    const adminUsers = await User.findAll({ where: { role_id: null, role: 'admin' } });
    for (const u of adminUsers) {
      await u.update({ role_id: adminRole.id });
    }

    const basicUsers = await User.findAll({ where: { role_id: null, role: 'user' } });
    for (const u of basicUsers) {
      await u.update({ role_id: userRole.id });
    }

    // Seed: Criar administrador padrão se não houver um Administrador no sistema
    const adminExists = await User.findOne({ where: { role_id: adminRole.id } });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashSenha = await bcrypt.hash('@a1b5c3F8', salt);

      await User.create({
        nome: 'Administrador',
        email: 'admin@sistema.com',
        senha: hashSenha,
        role: 'admin',      // Mantido p/ retrocompatibilidade caso precisem
        role_id: adminRole.id, // O novo padrão
      });
      console.log('Usuário admin padrão criado (admin@sistema.com / @a1b5c3F8).');
    }
  } catch (error) {
    console.error('Erro ao sincronizar tabelas:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Transaction,
  Category,
  Role,
  syncDatabase,
};
