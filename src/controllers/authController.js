const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Função auxiliar para gerar token JWT
const generateToken = (params = {}) => {
  return jwt.sign(params, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};


exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca o usuário pelo email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    // Verifica se a senha está correta
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    user.senha = undefined;

    return res.json({
      user,
      token: generateToken({ id: user.id, role: user.role }),
    });
  } catch (err) {
    return res.status(400).json({ error: 'Falha no login', details: err.message });
  }
};
