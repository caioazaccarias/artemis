module.exports = (requiredPermission) => {
  return (req, res, next) => {
    // Caso de uso: Se for "admin" legado ou tiver a permissão específica
    if (req.userRole === 'admin' || req.userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ error: `Acesso negado. Requer permissão: ${requiredPermission}` });
  };
};
