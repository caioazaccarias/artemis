const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  permissoes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
}, {
  tableName: 'roles',
  timestamps: true,
});

module.exports = Role;
