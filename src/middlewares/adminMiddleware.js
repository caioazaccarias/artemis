module.exports = (req, res, next) => {
  // Verifica se o usuário autenticado (através do authMiddleware) tem o role 'admin'
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }

  return next();
};
