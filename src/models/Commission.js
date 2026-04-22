const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commission = sequelize.define('Commission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data_os: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  num_os: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cliente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tem_taxas: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  nome_taxa_aplicada: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  valor_taxas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  pecas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  despesas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  lucro: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  porcentagem_comissao: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  total_comissao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_fixo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Se pertencer a uma série gerada (recorrente ou parcelado)
  },
}, {
  tableName: 'commissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['parent_id', 'data'],
      name: 'unique_parent_data'
    }
  ]
});

module.exports = Commission;
