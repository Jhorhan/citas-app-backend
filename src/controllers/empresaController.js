import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";
import slugify from "slugify";


// 🏢 Crear una nueva empresa (solo SuperAdmin)
export const crearEmpresa = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permisos para crear empresas" });
    }

    const { nombre, nit, sector, logo, usuario_admin } = req.body;

    const existe = await Empresa.findOne({ nit });
    if (existe) {
      return res.status(400).json({ msg: "Ya existe una empresa con este NIT" });
    }

    // Verificar admin
    const admin = await Usuario.findById(usuario_admin);
    if (!admin) return res.status(404).json({ msg: "Usuario administrador no encontrado" });
    if (admin.rol !== "admin") return res.status(400).json({ msg: "El usuario indicado no tiene rol de administrador" });

    // ⭐ GENERAR SLUG AUTOMÁTICAMENTE
    const slug = slugify(nombre, {
      lower: true,
      strict: true
    });

    // Verificar que el slug no exista
    const slugExiste = await Empresa.findOne({ slug });
    if (slugExiste) {
      return res.status(400).json({ msg: "Ya existe una empresa con un nombre similar (slug duplicado)" });
    }

    const empresa = await Empresa.create({
      nombre,
      nit,
      sector,
      logo,
      usuario_admin,
      slug,
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


// 🔍 Obtener empresa por ID (Admin o SuperAdmin)
export const obtenerEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id).populate("usuario_admin", "nombre email");
    if (!empresa) return res.status(404).json({ msg: "Empresa no encontrada" });

    if (req.usuario.rol !== "superadmin" && empresa.usuario_admin.toString() !== req.usuario.id) {
      return res.status(403).json({ msg: "No tienes permisos para acceder a esta empresa" });
    }

    res.json(empresa);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener empresa" });
  }
};


// 📌 🔥 NUEVO — Obtener empresa por SLUG (público)
export const obtenerEmpresaPorSlug = async (req, res) => {
  try {
    const empresa = await Empresa.findOne({ slug: req.params.slug });

    if (!empresa) {
      return res.status(404).json({ msg: "Empresa no encontrada" });
    }

    res.json(empresa);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener empresa por slug" });
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
