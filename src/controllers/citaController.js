import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import Servicio from "../models/Servicio.js";
import Sede from "../models/Sede.js";

// 📅 Crear una nueva cita
export const crearCita = async (req, res) => {
  try {
    const { servicio, sede, fecha, hora } = req.body;

    // Validar campos
    if (!servicio || !sede || !fecha || !hora) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Crear la cita
    const nuevaCita = new Cita({
      usuario: req.usuario._id, // cliente logueado
      servicio,
      sede,
      fecha,
      hora,
      estado: "pendiente",
    });

    await nuevaCita.save();

    res.status(201).json({ msg: "Cita creada correctamente", cita: nuevaCita });
  } catch (error) {
    console.error("Error al crear cita:", error);
    res.status(500).json({ msg: "Error al crear cita" });
  }
};

// 📋 Listar citas (según rol)
export const listarCitas = async (req, res) => {
  try {
    let filtro = {};

    if (req.usuario.rol === "admin") {
      filtro = { empresa: req.usuario.empresa };
    } else if (req.usuario.rol === "colaborador") {
      filtro = { colaborador: req.usuario._id };
    } else if (req.usuario.rol === "cliente") {
      filtro = { usuario: req.usuario._id };
    }

    const citas = await Cita.find(filtro)
      .populate("usuario", "nombre email")
      .populate("servicio", "nombre descripcion")
      .populate("sede", "nombre direccion");

    res.json(citas);
  } catch (error) {
    console.error("Error al listar citas:", error);
    res.status(500).json({ msg: "Error al listar citas" });
  }
};

// 🔍 Obtener una cita por ID
export const obtenerCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate("usuario", "nombre email")
      .populate("servicio", "nombre descripcion")
      .populate("sede", "nombre direccion");

    if (!cita) {
      return res.status(404).json({ msg: "Cita no encontrada" });
    }

    // Validar acceso
    if (
      req.usuario.rol === "cliente" &&
      cita.usuario._id.toString() !== req.usuario._id.toString()
    ) {
      return res.status(403).json({ msg: "No tienes permiso para ver esta cita" });
    }

    res.json(cita);
  } catch (error) {
    console.error("Error al obtener cita:", error);
    res.status(500).json({ msg: "Error al obtener cita" });
  }
};

// ✏️ Actualizar cita
export const actualizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicio, sede, fecha, hora, estado } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    // Actualizar solo los campos enviados
    cita.servicio = servicio || cita.servicio;
    cita.sede = sede || cita.sede;
    cita.fecha = fecha || cita.fecha;
    cita.hora = hora || cita.hora;
    cita.estado = estado || cita.estado;

    const citaActualizada = await cita.save();
    res.json({ msg: "Cita actualizada", cita: citaActualizada });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ msg: "Error al actualizar cita" });
  }
};

// 🗑️ Eliminar cita
export const eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);

    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    await cita.deleteOne();
    res.json({ msg: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    res.status(500).json({ msg: "Error al eliminar cita" });
  }
};
