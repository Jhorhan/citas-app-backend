import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import Servicio from "../models/Servicio.js";
import Sede from "../models/Sede.js";
import Disponibilidad from "../models/Disponibilidad.js";

// ==========================================================
// 🧩 CALCULAR FECHA FIN
// ==========================================================
const calcularFechaFin = (inicio, duracionMin) => {
  return new Date(inicio.getTime() + duracionMin * 60000);
};

// ==========================================================
// 📌 CONVERTIR HH:MM A DATE
// ==========================================================
const combinarFechaHora = (fecha, hora) => {
  const [h, m] = hora.split(":");
  const nueva = new Date(fecha);
  nueva.setHours(h);
  nueva.setMinutes(m);
  nueva.setSeconds(0);
  nueva.setMilliseconds(0);
  return nueva;
};

// ==========================================================
// 🔍 OBTENER HUECOS DISPONIBLES
// ==========================================================
export const obtenerHuecosDisponibles = async (req, res) => {
  try {
    const { servicio, sede, colaborador, fecha } = req.query;

    if (!servicio || !sede || !colaborador || !fecha) {
      return res.status(400).json({ msg: "Faltan parámetros" });
    }

    const infoServicio = await Servicio.findById(servicio);
    if (!infoServicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const duracion = infoServicio.duracion;

    const dia = new Date(fecha).getDay();

    const disponibilidad = await Disponibilidad.findOne({
      sede,
      colaborador,
      diaSemana: dia,
    });

    if (!disponibilidad)
      return res.status(404).json({ msg: "No hay disponibilidad ese día" });

    const horaInicio = combinarFechaHora(fecha, disponibilidad.horaInicio);
    const horaFin = combinarFechaHora(fecha, disponibilidad.horaFin);

    // Traer citas existentes del colaborador ese día
    const citas = await Cita.find({
      colaborador,
      fechaHora: { $gte: horaInicio, $lt: horaFin },
    });

    // Generar slots
    const huecos = [];
    let cursor = new Date(horaInicio);

    while (cursor < horaFin) {
      const inicioSlot = new Date(cursor);
      const finSlot = calcularFechaFin(inicioSlot, duracion);

      if (finSlot > horaFin) break;

      const traslape = citas.some(
        (c) => inicioSlot < c.fechaFin && finSlot > c.fechaHora
      );

      if (!traslape) {
        huecos.push({
          inicio: inicioSlot,
          fin: finSlot,
        });
      }

      cursor = new Date(cursor.getTime() + duracion * 60000);
    }

    res.json(huecos);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error al obtener huecos disponibles" });
  }
};

// ==========================================================
// 📅 CREAR CITA
// ==========================================================
export const crearCita = async (req, res) => {
  try {
    const { servicio, sede, colaborador, fechaHora } = req.body;

    if (!servicio || !sede || !colaborador || !fechaHora) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const infoServicio = await Servicio.findById(servicio);
    if (!infoServicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const duracion = infoServicio.duracion;
    const inicio = new Date(fechaHora);
    const fin = calcularFechaFin(inicio, duracion);

    // Validar traslapes
    const citaTraslapada = await Cita.findOne({
      colaborador,
      $and: [{ fechaHora: { $lt: fin } }, { fechaFin: { $gt: inicio } }],
    });

    if (citaTraslapada) {
      return res.status(400).json({
        msg: "El colaborador no tiene disponible este horario",
      });
    }

    const nuevaCita = await Cita.create({
      usuario: req.usuario._id,
      colaborador,
      servicio,
      sede,
      fechaHora: inicio,
      fechaFin: fin,
      estado: "pendiente",
    });

    res.status(201).json({
      msg: "Cita creada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear cita" });
  }
};

// ==========================================================
// 📋 LISTAR CITAS
// ==========================================================
export const listarCitas = async (req, res) => {
  try {
    let filtro = {};

    switch (req.usuario.rol) {
      case "superadmin":
        filtro = {};
        break;
      case "admin":
        filtro = {};
        break;
      case "colaborador":
        filtro = { colaborador: req.usuario._id };
        break;
      case "cliente":
        filtro = { usuario: req.usuario._id };
        break;
    }

    const citas = await Cita.find(filtro)
      .populate("usuario", "nombre email")
      .populate("colaborador", "nombre email")
      .populate("servicio", "nombre duracion precio")
      .populate("sede", "nombre direccion");

    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: "Error al listar citas" });
  }
};

// ==========================================================
// 🔍 OBTENER CITA
// ==========================================================
export const obtenerCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate("usuario", "nombre email")
      .populate("colaborador", "nombre email")
      .populate("servicio", "nombre duracion precio")
      .populate("sede", "nombre direccion");

    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    if (
      req.usuario.rol === "cliente" &&
      cita.usuario._id.toString() !== req.usuario._id.toString()
    )
      return res.status(403).json({ msg: "No puedes ver esta cita" });

    if (
      req.usuario.rol === "colaborador" &&
      cita.colaborador._id.toString() !== req.usuario._id.toString()
    )
      return res.status(403).json({ msg: "No puedes ver esta cita" });

    res.json(cita);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cita" });
  }
};

// ==========================================================
// ✏️ ACTUALIZAR CITA
// ==========================================================
export const actualizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicio, sede, fechaHora, colaborador, estado } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    if (!["admin", "superadmin"].includes(req.usuario.rol))
      return res.status(403).json({ msg: "No tienes permisos" });

    if (servicio) {
      const infoServicio = await Servicio.findById(servicio);
      const duracion = infoServicio.duracion;

      const nuevoInicio = fechaHora ? new Date(fechaHora) : cita.fechaHora;
      const nuevoFin = calcularFechaFin(nuevoInicio, duracion);

      cita.servicio = servicio;
      cita.fechaHora = nuevoInicio;
      cita.fechaFin = nuevoFin;
    }

    if (sede) cita.sede = sede;
    if (colaborador) cita.colaborador = colaborador;
    if (estado) cita.estado = estado;

    const citaActualizada = await cita.save();
    res.json({ msg: "Cita actualizada", cita: citaActualizada });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar cita" });
  }
};

// ==========================================================
// 🗑️ ELIMINAR CITA
// ==========================================================
export const eliminarCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    if (!["admin", "superadmin"].includes(req.usuario.rol))
      return res.status(403).json({ msg: "No tienes permiso" });

    await cita.deleteOne();
    res.json({ msg: "Cita eliminada" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar cita" });
  }
};
