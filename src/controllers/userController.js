const { User, Transaction } = require('../models');
const bcrypt = require('bcryptjs');

exports.index = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['senha'] },
      order: [['createdAt', 'DESC']]
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar usuários', details: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Usuário (email) já cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(senha, salt);

    const user = await User.create({
      nome,
      email,
      senha: hashSenha,
      role: role || 'user'
    });

    user.senha = undefined;

    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ error: 'Falha ao criar usuário', details: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email já em uso por outro usuário' });
      }
    }

    // Se admin tentar editar a si mesmo e mudar para 'user', podemos proibir caso seja o unico admin, mas simplificaremos por agora
    
    let updateData = { nome, email, role };

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      updateData.senha = await bcrypt.hash(senha, salt);
    }

    await user.update(updateData);

    const userReturn = await User.findByPk(id, { attributes: { exclude: ['senha'] } });
    return res.json(userReturn);
  } catch (err) {
    return res.status(400).json({ error: 'Falha ao atualizar usuário', details: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificações de segurança
    if (Number(id) === req.userId) {
      return res.status(403).json({ error: 'Não é possível deletar o próprio usuário enquanto estiver logado.' });
    }

    // Evita deleter o user com a função admin root, ou todos admins
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    if (user.role === 'admin' && totalAdmins <= 1) {
      return res.status(403).json({ error: 'Não é possível deletar o último administrador do sistema.' });
    }

    // Remove as transações do usuário (ou se preferir, usar on cascade db)
    await Transaction.destroy({ where: { user_id: id } });
    await user.destroy();

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao deletar usuário', details: err.message });
  }
};
