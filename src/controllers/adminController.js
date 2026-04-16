const { Transaction, Category, sequelize } = require('../models');

// Exporta todos os dados financeiros para JSON
exports.exportData = async (req, res) => {
  try {
    const [categories, transactions] = await Promise.all([
      Category.findAll(),
      Transaction.findAll()
    ]);

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      exportedBy: req.userId,
      categories,
      transactions
    };

    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar dados', details: err.message });
  }
};

// Restaura dados a partir de um JSON (DESTRUTIVO)
exports.importData = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { categories, transactions } = req.body;

    if (!Array.isArray(categories) || !Array.isArray(transactions)) {
      throw new Error('Arquivo de backup inválido ou corrompido.');
    }

    // 1. Limpar dados atuais (Ordem reversa de FK)
    await Transaction.destroy({ where: {}, transaction: t });
    await Category.destroy({ where: {}, transaction: t });

    // 2. Inserir Categorias
    if (categories.length > 0) {
      await Category.bulkCreate(categories, { transaction: t });
    }
    
    // 3. Inserir Transações
    if (transactions.length > 0) {
      await Transaction.bulkCreate(transactions, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Dados restaurados com sucesso!', summary: { categories: categories.length, transactions: transactions.length } });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: 'Erro ao restaurar dados', details: err.message });
  }
};
