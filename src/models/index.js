const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Category = require('./Category');
const bcrypt = require('bcryptjs');

// Define os relacionamentos
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoria_id', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoria_id', as: 'categoriaData' });

// Sincroniza o banco de dados e cria as tabelas se não existirem
const syncDatabase = async () => {
  try {
    // Atenção: { alter: true } tenta atualizar a tabela para combinar com o model.
    // Em produção real é recomendado usar Migrations.
    await sequelize.sync({ alter: true });
    console.log('Tabelas sincronizadas com sucesso.');

    // Seed: Criar administrador padrão se não houver um Administrador no sistema
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashSenha = await bcrypt.hash('@a1b5c3F8', salt);

      await User.create({
        nome: 'Administrador',
        email: 'admin@sistema.com',
        senha: hashSenha,
        role: 'admin',
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
  syncDatabase,
};
