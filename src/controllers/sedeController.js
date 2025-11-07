import Sede from "../models/Sede.js";
import Empresa from "../models/Empresa.js";

// 🏢 Crear una nueva sede
export const crearSede = async (req, res) => {
  try {
    const { nombre, direccion, empresa } = req.body;

    if (!nombre || !direccion || !empresa) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios." });
    }

    // Verificar que la empresa exista
    const empresaExiste = await Empresa.findById(empresa);
    if (!empresaExiste) {
      return res.status(404).json({ msg: "La empresa no existe." });
    }

    // Solo el admin de la empresa o un superadmin puede crear sedes
    if (
      req.usuario.rol !== "superadmin" &&
      empresaExiste.usuario_admin.toString() !== req.usuario.id
    ) {
      return res.status(403).json({ msg: "No tienes permisos para crear sedes en esta empresa." });
    }

    // Verificar que no haya una sede duplicada (por nombre y empresa)
    const sedeExistente = await Sede.findOne({ nombre, empresa });
    if (sedeExistente) {
      return res.status(400).json({ msg: "Ya existe una sede con este nombre en la empresa." });
    }

    const nuevaSede = await Sede.create({ nombre, direccion, empresa });
    res.status(201).json({
      msg: "✅ Sede creada correctamente.",
      sede: nuevaSede,
    });
  } catch (error) {
    console.error("❌ Error al crear sede:", error);
    res.status(500).json({ msg: "Error interno al crear la sede." });
  }
};

// 📋 Listar todas las sedes (filtradas por empresa si no es superadmin)
export const listarSedes = async (req, res) => {
  try {
    let sedes;

    if (req.usuario.rol === "superadmin") {
      sedes = await Sede.find().populate("empresa", "nombre nit");
    } else {
      // Buscar las empresas del usuario admin
      const empresas = await Empresa.find({ usuario_admin: req.usuario.id });
      const idsEmpresas = empresas.map((e) => e._id);
      sedes = await Sede.find({ empresa: { $in: idsEmpresas } }).populate("empresa", "nombre nit");
    }

    res.json(sedes);
  } catch (error) {
    console.error("❌ Error al listar sedes:", error);
    res.status(500).json({ msg: "Error al obtener las sedes." });
  }
};

// 🔍 Obtener una sede por ID
export const obtenerSede = async (req, res) => {
  try {
    const sede = await Sede.findById(req.params.id).populate("empresa", "nombre nit usuario_admin");

    if (!sede) {
      return res.status(404).json({ msg: "Sede no encontrada." });
    }

    // Verificar permisos
    if (
      req.usuario.rol !== "superadmin" &&
      sede.empresa.usuario_admin.toString() !== req.usuario.id
    ) {
      return res.status(403).json({ msg: "No tienes permisos para ver esta sede." });
    }

    res.json(sede);
  } catch (error) {
    console.error("❌ Error al obtener sede:", error);
    res.status(500).json({ msg: "Error al obtener la sede." });
  }
};

// ✏️ Actualizar sede
export const actualizarSede = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    const sede = await Sede.findById(req.params.id).populate("empresa", "usuario_admin");

    if (!sede) {
      return res.status(404).json({ msg: "Sede no encontrada." });
    }

    // Verificar permisos
    if (
      req.usuario.rol !== "superadmin" &&
      sede.empresa.usuario_admin.toString() !== req.usuario.id
    ) {
      return res.status(403).json({ msg: "No tienes permisos para actualizar esta sede." });
    }

    sede.nombre = nombre || sede.nombre;
    sede.direccion = direccion || sede.direccion;
    const sedeActualizada = await sede.save();

    res.json({
      msg: "✅ Sede actualizada correctamente.",
      sede: sedeActualizada,
    });
  } catch (error) {
    console.error("❌ Error al actualizar sede:", error);
    res.status(500).json({ msg: "Error al actualizar la sede." });
  }
};

// 🗑️ Eliminar sede
export const eliminarSede = async (req, res) => {
  try {
    const sede = await Sede.findById(req.params.id).populate("empresa", "usuario_admin");

    if (!sede) {
      return res.status(404).json({ msg: "Sede no encontrada." });
    }

    // Verificar permisos
    if (
      req.usuario.rol !== "superadmin" &&
      sede.empresa.usuario_admin.toString() !== req.usuario.id
    ) {
      return res.status(403).json({ msg: "No tienes permisos para eliminar esta sede." });
    }

    await sede.deleteOne();
    res.json({ msg: "🗑️ Sede eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar sede:", error);
    res.status(500).json({ msg: "Error al eliminar la sede." });
  }
};
