const { AppSetting } = require('../models');

// Obtém as configurações formatadas
exports.index = async (req, res) => {
  try {
    const settings = await AppSetting.findAll();
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    // Defaults if missing
    if (!result.commission_percentage) result.commission_percentage = 10;
    if (!result.payment_fees) result.payment_fees = [];

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
};

// Atualiza configurações globais
exports.update = async (req, res) => {
  try {
    const { commission_percentage, payment_fees } = req.body;
    
    if (commission_percentage !== undefined) {
      const [cp] = await AppSetting.findOrCreate({ where: { key: 'commission_percentage' }, defaults: { value: 10 } });
      await cp.update({ value: parseFloat(commission_percentage) });
    }

    if (payment_fees !== undefined) {
      const [pf] = await AppSetting.findOrCreate({ where: { key: 'payment_fees' }, defaults: { value: [] } });
      await pf.update({ value: payment_fees });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
};
