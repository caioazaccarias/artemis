const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'idx_users_email',
    validate: {
      isEmail: true,
    },
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  role: { // Mantém a coluna antiga temporarily, pois Sequelize pode dar problema para apagar enum caso não suportado
    type: DataTypes.STRING,
    defaultValue: 'user',
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true, // Cria colunas createdAt e updatedAt automaticamente
});

module.exports = User;
