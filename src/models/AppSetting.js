const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppSetting = sequelize.define('AppSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'idx_app_settings_key'
  },
  value: {
    type: DataTypes.JSON, // Arrays or JSON objects
    allowNull: false
  }
}, {
  tableName: 'app_settings',
  timestamps: true
});

module.exports = AppSetting;
