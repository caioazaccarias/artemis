const sequelize = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');

// Define os relacionamentos
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Sincroniza o banco de dados e cria as tabelas se não existirem
const syncDatabase = async () => {
  try {
    // Atenção: { alter: true } tenta atualizar a tabela para combinar com o model.
    // Em produção real é recomendado usar Migrations.
    await sequelize.sync({ alter: true });
    console.log('Tabelas sincronizadas com sucesso.');
  } catch (error) {
    console.error('Erro ao sincronizar tabelas:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Transaction,
  syncDatabase,
};
