import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";

// 🏢 Crear una nueva empresa (solo SuperAdmin)
export const crearEmpresa = async (req, res) => {
  try {
    // Solo el SuperAdmin puede crear empresas
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permisos para crear empresas" });
    }

    const { nombre, nit, sector, logo, usuario_admin } = req.body;

    const existe = await Empresa.findOne({ nit });
    if (existe) {
      return res.status(400).json({ msg: "Ya existe una empresa con este NIT" });
    }

    // Verificar que el usuario admin exista y tenga rol "admin"
    const admin = await Usuario.findById(usuario_admin);
    if (!admin) return res.status(404).json({ msg: "Usuario administrador no encontrado" });
    if (admin.rol !== "admin") return res.status(400).json({ msg: "El usuario indicado no tiene rol de administrador" });

    const empresa = await Empresa.create({
      nombre,
      nit,
      sector,
      logo,
      usuario_admin,
    });

    res.status(201).json({
      msg: "Empresa creada correctamente",
      empresa,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear la empresa" });
  }
};

// 📋 Listar empresas (solo SuperAdmin)
export const listarEmpresas = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permisos para ver todas las empresas" });
    }

    const empresas = await Empresa.find().populate("usuario_admin", "nombre email");
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar empresas" });
  }
};

// 🔍 Obtener empresa (Admin o SuperAdmin)
export const obtenerEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id).populate("usuario_admin", "nombre email");
    if (!empresa) return res.status(404).json({ msg: "Empresa no encontrada" });

    // Si no es superadmin, solo puede ver su empresa
    if (req.usuario.rol !== "superadmin" && empresa.usuario_admin.toString() !== req.usuario.id) {
      return res.status(403).json({ msg: "No tienes permisos para acceder a esta empresa" });
    }

    res.json(empresa);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener empresa" });
  }
};

// ✏️ Actualizar empresa (solo SuperAdmin)
export const actualizarEmpresa = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permisos para actualizar empresas" });
    }

    const empresa = await Empresa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!empresa) return res.status(404).json({ msg: "Empresa no encontrada" });

    res.json({ msg: "Empresa actualizada", empresa });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar empresa" });
  }
};

// 🗑️ Eliminar empresa (solo SuperAdmin)
export const eliminarEmpresa = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permisos para eliminar empresas" });
    }

    const empresa = await Empresa.findById(req.params.id);
    if (!empresa) return res.status(404).json({ msg: "Empresa no encontrada" });

    await empresa.deleteOne();
    res.json({ msg: "Empresa eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar empresa" });
  }
};
