module.exports = (requiredPermission) => {
  return (req, res, next) => {
    // Caso de uso: Se for "admin" legado
    if (req.userRole === 'admin') {
      return next();
    }

    const permissionsToCheck = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    
    const hasPermission = permissionsToCheck.some(p => req.userPermissions && req.userPermissions.includes(p));

    if (hasPermission) {
      return next();
    }

    console.log("BLOCKED 403. req.userPermissions:", req.userPermissions, "permissionsToCheck:", permissionsToCheck);
    return res.status(403).json({ error: `Acesso negado. Requer permissão válida.` });
  };
};
