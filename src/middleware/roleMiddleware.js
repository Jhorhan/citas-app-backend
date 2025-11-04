export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ msg: "No autenticado" });
      }

      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ msg: "Acceso denegado: no tienes permisos" });
      }

      next();
    } catch (error) {
      console.error("Error en middleware de roles:", error);
      res.status(500).json({ msg: "Error interno en autorización" });
    }
  };
};
