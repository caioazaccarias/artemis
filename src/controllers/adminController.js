const { Transaction, Category, User, Role, Commission, AppSetting, sequelize } = require('../models');

// Exporta todos os dados do sistema para JSON
exports.exportData = async (req, res) => {
  try {
    const [roles, users, categories, transactions, commissions, settings] = await Promise.all([
      Role.findAll(),
      User.findAll(),
      Category.findAll(),
      Transaction.findAll(),
      Commission.findAll(),
      AppSetting.findAll()
    ]);

    const backup = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      exportedBy: req.userId,
      roles,
      users,
      categories,
      transactions,
      commissions,
      settings
    };

    res.json(backup);
  } catch (err) {
    console.error('ERRO NO EXPORT:', err);
    res.status(500).json({ error: 'Erro ao exportar dados', details: err.message });
  }
};

// Restaura dados a partir de um JSON (DESTRUTIVO)
exports.importData = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { roles, users, categories, transactions, commissions, settings } = req.body;

    // 1. Limpar dados atuais (Ordem reversa de Foreign Keys)
    // Desativar FK checks temporariamente pode ser mais seguro para restauração total
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

    await Commission.destroy({ where: {}, transaction: t });
    await Transaction.destroy({ where: {}, transaction: t });
    await Category.destroy({ where: {}, transaction: t });
    await User.destroy({ where: {}, transaction: t });
    await Role.destroy({ where: {}, transaction: t });
    await AppSetting.destroy({ where: {}, transaction: t });

    // 2. Inserir dados (Ordem de dependência)
    if (roles && roles.length > 0) await Role.bulkCreate(roles, { transaction: t });
    if (users && users.length > 0) await User.bulkCreate(users, { transaction: t });
    if (categories && categories.length > 0) await Category.bulkCreate(categories, { transaction: t });
    if (transactions && transactions.length > 0) await Transaction.bulkCreate(transactions, { transaction: t });
    if (commissions && commissions.length > 0) await Commission.bulkCreate(commissions, { transaction: t });
    if (settings && settings.length > 0) await AppSetting.bulkCreate(settings, { transaction: t });

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });

    await t.commit();
    res.json({ 
      message: 'Dados restaurados com sucesso!', 
      summary: { 
        roles: roles?.length || 0,
        users: users?.length || 0,
        categories: categories?.length || 0, 
        transactions: transactions?.length || 0,
        commissions: commissions?.length || 0,
        settings: settings?.length || 0
      } 
    });
  } catch (err) {
    try {
       await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
       await t.rollback();
    } catch (e) {}
    console.error('ERRO NO IMPORT:', err);
    res.status(400).json({ error: 'Erro ao restaurar dados', details: err.message });
  }
};
