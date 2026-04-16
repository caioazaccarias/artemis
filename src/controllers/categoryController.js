const { Category, Transaction } = require('../models');

exports.create = async (req, res) => {
  try {
    const { nome, tipo } = req.body;
    
    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
    }

    const category = await Category.create({
      user_id: req.userId,
      nome,
      tipo
    });

    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao criar categoria', details: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { }, // Removido filtro de user_id por regra de dados compartilhados
      order: [['nome', 'ASC']]
    });

    return res.json(categories);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao buscar categorias', details: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo } = req.body;

    const category = await Category.findOne({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada ou você não tem permissão.' });
    }

    await category.update({
      nome: nome !== undefined ? nome : category.nome,
      tipo: tipo !== undefined ? tipo : category.tipo
    });

    return res.json(category);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao atualizar categoria', details: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    // Verificar se a categoria está sendo usada
    const hasTransactions = await Transaction.count({ where: { categoria_id: id } });
    
    if (hasTransactions > 0) {
      return res.status(400).json({ error: 'Não é possível excluir uma categoria que possui transações. Realoque as transações primeiro.' });
    }

    await category.destroy();

    return res.json({ message: 'Categoria removida com sucesso' });
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao remover categoria', details: err.message });
  }
};
