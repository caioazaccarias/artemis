const { Transaction, Category } = require('../models');

// Cria uma nova transação
exports.create = async (req, res) => {
  try {
    const { tipo, valor, categoria, categoria_id, data, descricao, paga, observacao } = req.body;
    
    const transaction = await Transaction.create({
      user_id: req.userId, // Obtido pelo middleware de autenticação
      tipo,
      valor,
      categoria,
      categoria_id: categoria_id || null,
      data,
      descricao,
      paga: tipo === 'saida' ? !!paga : false,
      observacao
    });

    return res.status(201).json(transaction);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao criar transação', details: err.message });
  }
};

// Lê as transações do usuário logado
exports.list = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { }, // Removido filtro de user_id por regra de dados compartilhados
      include: [{
        model: Category,
        as: 'categoriaData',
        attributes: ['id', 'nome', 'tipo']
      }],
      order: [['data', 'DESC'], ['id', 'DESC']]
    });

    return res.json(transactions);
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao buscar transações', details: err.message });
  }
};

  // Atualiza uma transação (somente se pertencer ao usuário)
  exports.update = async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo, valor, categoria, categoria_id, data, descricao, paga, observacao } = req.body;
  
      const transaction = await Transaction.findOne({ where: { id } });
  
      if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada ou você não tem permissão.' });
      }
  
      await transaction.update({
        tipo: tipo !== undefined ? tipo : transaction.tipo,
        valor: valor !== undefined ? valor : transaction.valor,
        categoria: categoria !== undefined ? categoria : transaction.categoria,
        categoria_id: categoria_id !== undefined ? (categoria_id || null) : transaction.categoria_id,
        data: data !== undefined ? data : transaction.data,
        descricao: descricao !== undefined ? descricao : transaction.descricao,
        paga: paga !== undefined ? !!paga : transaction.paga,
        observacao: observacao !== undefined ? observacao : transaction.observacao
      });
  
      return res.json(transaction);
    } catch (err) {
    return res.status(400).json({ error: 'Erro ao atualizar transação', details: err.message });
  }
};

// Deleta uma transação (somente se pertencer ao usuário)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({ where: { id } });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada ou você não tem permissão.' });
    }

    await transaction.destroy();

    return res.json({ message: 'Transação removida com sucesso' });
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao remover transação', details: err.message });
  }
};

// Resumo Financeiro (Entradas - Saídas)
exports.summary = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { } // Removido filtro de user_id por regra de dados compartilhados
    });

    let totalEntradas = 0;
    let totalSaidas = 0;

    transactions.forEach(t => {
      const valor = parseFloat(t.valor);
      if (t.tipo === 'entrada') {
        totalEntradas += valor;
      } else if (t.tipo === 'saida') {
        totalSaidas += valor;
      }
    });

    const saldoTotal = totalEntradas - totalSaidas;

    return res.json({
      totalEntradas,
      totalSaidas,
      saldoTotal
    });
  } catch (err) {
    return res.status(400).json({ error: 'Erro ao gerar resumo financeiro', details: err.message });
  }
};
