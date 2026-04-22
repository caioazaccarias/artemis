const { Commission, AppSetting } = require('../models');
const { Op } = require('sequelize');

// Helper to add months purely without timezone issues
function addMonthsStr(dateStr, monthsToAdd) {
  let dateObj;
  try {
    if (dateStr && typeof dateStr === 'string' && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      dateObj = new Date(year, parseInt(month) - 1, day);
    } else {
      dateObj = new Date(dateStr);
    }
    if (isNaN(dateObj.getTime())) dateObj = new Date();
  } catch (e) {
    dateObj = new Date();
  }
  dateObj.setMonth(dateObj.getMonth() + monthsToAdd);
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

exports.index = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano, search } = req.query;
    
    // Configura filtro WHERE básico
    const whereClause = { user_id: userId };
    
    if (search) {
      whereClause[Op.or] = [
        { num_os: { [Op.like]: `%${search}%` } },
        { cliente: { [Op.like]: `%${search}%` } },
        { observacoes: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (mes && ano) {
      // Regra de Provisionamento Dinâmico para MESTRES FIXOS
      const targetDateStr = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const targetYearMonth = targetDateStr.substring(0, 7);

      const fixedMasters = await Commission.findAll({
        where: {
          user_id: userId,
          is_fixo: true,
          parent_id: null
        }
      });

      if (fixedMasters.length > 0) {
        // Busca todos os filhos já existentes para esses mestres no mês alvo em UMA ÚNICA QUERY
        const existingChildren = await Commission.findAll({
          where: {
            user_id: userId,
            parent_id: { [Op.in]: fixedMasters.map(m => m.id) },
            data: { [Op.like]: `${targetYearMonth}%` }
          },
          attributes: ['parent_id']
        });

        const existingParentIds = new Set(existingChildren.map(c => c.parent_id));
        const toCreate = [];

        for (let master of fixedMasters) {
          let masterDateStr = master.data;
          let masterYearMonth = masterDateStr.substring(0, 7);
          
          if (targetYearMonth >= masterYearMonth && targetYearMonth !== masterYearMonth) {
            if (!existingParentIds.has(master.id)) {
              const diaOriginal = parseInt(masterDateStr.split('-')[2]);
              const lastDayOfTarget = new Date(ano, mes, 0).getDate();
              const diaFinal = Math.min(diaOriginal, lastDayOfTarget);
              
              toCreate.push({
                user_id: master.user_id,
                data_os: master.data_os,
                data: `${targetYearMonth}-${String(diaFinal).padStart(2, '0')}`,
                num_os: master.num_os,
                cliente: master.cliente,
                total: master.total,
                tem_taxas: master.tem_taxas,
                nome_taxa_aplicada: master.nome_taxa_aplicada,
                valor_taxas: master.valor_taxas,
                pecas: master.pecas,
                despesas: master.despesas,
                lucro: master.lucro,
                porcentagem_comissao: master.porcentagem_comissao,
                total_comissao: master.total_comissao,
                observacoes: master.observacoes,
                is_fixo: true,
                parent_id: master.id
              });
            }
          }
        }

        if (toCreate.length > 0) {
          try {
            await Commission.bulkCreate(toCreate, { ignoreDuplicates: true });
          } catch (bulkErr) {
            console.error('Erro ao realizar provisionamento em massa:', bulkErr);
          }
        }
      }

      const lastDay = new Date(ano, mes, 0).getDate();

      // Após o run de provisionamento, coletamos a vista oficial.
      whereClause.data = {
        [Op.and]: [
          { [Op.gte]: `${ano}-${String(mes).padStart(2, '0')}-01` },
          { [Op.lte]: `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` }
        ]
      };
    }

    const records = await Commission.findAll({
      where: whereClause,
      order: [['data', 'DESC']]
    });

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar comissões.' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    let { data_os, data, num_os, cliente, total, tem_taxas, taxa_id, nome_taxa_aplicada, valor_taxas, pecas, despesas, observacoes, repeticao_tipo, repetir_vezes } = req.body;

    total = parseFloat(total) || 0;
    pecas = parseFloat(pecas) || 0;
    despesas = parseFloat(despesas) || 0;
    valor_taxas = parseFloat(valor_taxas) || 0;

    // Se a taxa for passada do front com um valor explícito baseado num dropdown. Se não, pegamos de fato o nome repassado.
    // Lógica 1: Obter configuração de % de comissão (pegar global, conforme requisito "A porcentagem é fixa mas pode ser alterada").
    const configPct = await AppSetting.findOne({ where: { key: 'commission_percentage' } });
    const configFees = await AppSetting.findOne({ where: { key: 'payment_fees' } });
    
    let porcentagem_comissao = configPct ? parseFloat(configPct.value) : 10;
    
    if (tem_taxas && taxa_id && configFees) {
       const feeDef = configFees.value.find(f => f.id.toString() === taxa_id.toString());
       if (feeDef) {
         nome_taxa_aplicada = feeDef.name;
         valor_taxas = total * (parseFloat(feeDef.percentage) / 100);
       }
    }

    // Regra: Lucro = Total - Taxas - Peças - Despesas
    const lucro = total - valor_taxas - pecas - despesas;
    const total_comissao = lucro * (porcentagem_comissao / 100);

    const is_fixo = (repeticao_tipo === 'fixo');

    // Mestre original
    const newCommission = await Commission.create({
      user_id: userId,
      data_os, data, num_os, cliente, total, tem_taxas, nome_taxa_aplicada, valor_taxas, pecas, despesas,
      lucro, porcentagem_comissao, total_comissao, observacoes,
      is_fixo, parent_id: null
    });

    // Desdobramento caso repetição n meses (avulsa customizada, sem loop infinito)
    if (repeticao_tipo === 'custom' && repetir_vezes > 1) {
      let loopCount = parseInt(repetir_vezes);
      
      const bulkData = [];
      for (let i = 1; i < loopCount; i++) {
        let futureData = addMonthsStr(data, i);
        bulkData.push({
          user_id: userId,
          data_os,
          data: futureData,
          num_os, cliente, total, tem_taxas, nome_taxa_aplicada, valor_taxas, pecas, despesas,
          lucro, porcentagem_comissao, total_comissao, observacoes,
          is_fixo: false,
          parent_id: newCommission.id
        });
      }
      if (bulkData.length > 0) {
        await Commission.bulkCreate(bulkData);
      }
    }

    res.status(201).json(newCommission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar comissão.' });
  }
};

exports.update = async (req, res) => {
  try {
     const userId = req.user.id;
     const id = req.params.id;
     let { data_os, data, num_os, cliente, total, tem_taxas, taxa_id, nome_taxa_aplicada, valor_taxas, pecas, despesas, observacoes, update_future } = req.body;
     
     const commission = await Commission.findOne({ where: { id, user_id: userId } });
     if (!commission) return res.status(404).json({ error: 'Não encontrado' });

     total = parseFloat(total) || 0;
     pecas = parseFloat(pecas) || 0;
     despesas = parseFloat(despesas) || 0;
     valor_taxas = parseFloat(valor_taxas) || 0;

     const configFees = await AppSetting.findOne({ where: { key: 'payment_fees' } });
     if (tem_taxas && taxa_id && configFees) {
       const feeDef = configFees.value.find(f => f.id.toString() === taxa_id.toString());
       if (feeDef) {
         nome_taxa_aplicada = feeDef.name;
         valor_taxas = total * (parseFloat(feeDef.percentage) / 100);
       }
     } else if (!tem_taxas) {
       nome_taxa_aplicada = null;
       valor_taxas = 0;
     }

     const lucro = total - valor_taxas - pecas - despesas;
     // Para a edição, matemos o percentual do momento em que foi criado ou atualizamos pra nova? "Ao ser alterado só será alterado pra futuras." 
     // Se estamos editando um registro existente, usamos a base q está cravada nele.
     const total_comissao = lucro * (commission.porcentagem_comissao / 100);

     const updatePayload = {
        data_os, data, num_os, cliente, total, tem_taxas, nome_taxa_aplicada, valor_taxas, pecas, despesas,
        lucro, total_comissao, observacoes
     };

     await commission.update(updatePayload);

     if (update_future === true && (commission.is_fixo || commission.parent_id)) {
        const parentIdTarget = commission.parent_id || commission.id;
        const cutoffDate = commission.data;

        const futurePayload = { ...updatePayload };
        delete futurePayload.data;
        await Commission.update(futurePayload, {
           where: {
             user_id: userId,
             data: { [Op.gt]: cutoffDate }, // Modifica apenas quem está cravado estritamente à frente na fita de tempo
             [Op.or]: [
               { id: parentIdTarget },
               { parent_id: parentIdTarget }
             ]
           }
        });
     }

     res.json(commission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar.' });
  }
};

exports.destroy = async (req, res) => {
  try {
     const userId = req.user.id;
     const id = req.params.id;
     const deleteFuture = req.query.delete_future === 'true';

     const item = await Commission.findOne({ where: { id, user_id: userId } });
     if (!item) return res.status(404).json({ error: 'Não encontrado' });

     if (deleteFuture && (item.is_fixo || item.parent_id)) {
         const parentIdTarget = item.parent_id || item.id;
         const cutoffDate = item.data;

         await Commission.destroy({
           where: {
              user_id: userId,
              data: { [Op.gte]: cutoffDate },
              [Op.or]: [
                 { id: parentIdTarget },
                 { parent_id: parentIdTarget }
              ]
           }
         });
     } else {
         await item.destroy();
     }

     res.json({ success: true });
  } catch(error) {
     res.status(500).json({ error: 'Erro ao excluir.'});
  }
};

exports.purge = async (req, res) => {
  try {
    const userId = req.user.id;
    await Commission.destroy({ where: { user_id: userId } });
    res.json({ success: true, message: 'Todos os registros foram removidos.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao limpar registros.' });
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }

    const configPct = await AppSetting.findOne({ where: { key: 'commission_percentage' } });
    const porcentagem_comissao = configPct ? parseFloat(configPct.value) : 10;

    let totalCreated = 0;

    for (const item of items) {
      const total = parseFloat(item.total) || 0;
      const pecas = parseFloat(item.pecas) || 0;
      const despesas = parseFloat(item.despesas) || 0;
      const valor_taxas = parseFloat(item.valor_taxas) || 0;
      const lucro = total - valor_taxas - pecas - despesas;
      const total_comissao = lucro * (porcentagem_comissao / 100);

      // Interpreta campos do Excel
      const is_fixo = (item.is_fixo === 1 || item.is_fixo === '1' || item.is_fixo === true);
      const parcelas = parseInt(item.parcelas) || 1;

      const master = await Commission.create({
        user_id: userId,
        data_os: item.data_os,
        data: item.data,
        num_os: item.num_os,
        cliente: item.cliente,
        total,
        tem_taxas: valor_taxas > 0,
        nome_taxa_aplicada: item.nome_taxa_aplicada || null,
        valor_taxas,
        pecas,
        despesas,
        lucro,
        porcentagem_comissao,
        total_comissao,
        observacoes: item.observacoes || '',
        is_fixo,
        parent_id: null
      });

      totalCreated++;

      // Se for parcelado e não for fixo (fixo é recorrente infinito via provisionamento)
      if (parcelas > 1 && !is_fixo) {
        const bulkChildren = [];
        for (let i = 1; i < parcelas; i++) {
          let futureData = addMonthsStr(item.data, i);
          bulkChildren.push({
            user_id: userId,
            data_os: item.data_os,
            data: futureData,
            num_os: item.num_os,
            cliente: item.cliente,
            total,
            tem_taxas: valor_taxas > 0,
            nome_taxa_aplicada: item.nome_taxa_aplicada || null,
            valor_taxas,
            pecas,
            despesas,
            lucro,
            porcentagem_comissao,
            total_comissao,
            observacoes: item.observacoes || '',
            is_fixo: false,
            parent_id: master.id
          });
        }
        if (bulkChildren.length > 0) {
          await Commission.bulkCreate(bulkChildren);
          totalCreated += bulkChildren.length;
        }
      }
    }

    res.status(201).json({ success: true, count: totalCreated });
  } catch (error) {
    console.error('ERRO NO BULK CREATE:', error);
    res.status(500).json({ 
      error: 'Erro ao importar comissões.', 
      message: error.message,
      detail: error.errors ? error.errors.map(e => e.message).join(', ') : null
    });
  }
};

