const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Função auxiliar para gerar token JWT
const generateToken = (params = {}) => {
  return jwt.sign(params, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verifica se o usuário já existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Aplica hash na senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(senha, salt);

    // Cria o usuário no banco
    const user = await User.create({
      nome,
      email,
      senha: hashSenha,
    });

    // Remove a senha do retorno por segurança
    user.senha = undefined;

    return res.status(201).json({
      user,
      token: generateToken({ id: user.id }),
    });
  } catch (err) {
    return res.status(400).json({ error: 'Falha no registro', details: err.message });
  }
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
      token: generateToken({ id: user.id }),
    });
  } catch (err) {
    return res.status(400).json({ error: 'Falha no login', details: err.message });
  }
};
