const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // O token é geralmente enviado no header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro de token' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  // Verifica o token usando a chave secreta
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log("DECODED JWT:", decoded);

    // Pendura o id e o role do usuário no request para os próximos middlewares/controllers usarem
    req.user = { id: decoded.id };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userPermissions = decoded.permissions || [];
    return next();
  });
};
