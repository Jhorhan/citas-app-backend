import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import Servicio from "../models/Servicio.js";
import Sede from "../models/Sede.js";
import Disponibilidad from "../models/Disponibilidad.js";
import { DateTime } from "luxon";

// ==========================================================
// 📌 FORZAR FECHA AL HUSO HORARIO COLOMBIA (UTC-5)
// ==========================================================
const fechaColombia = (fechaISO) => {
  return DateTime.fromISO(fechaISO, { zone: "America/Bogota" }).toJSDate();
};

// ==========================================================
// 🧩 CALCULAR FECHA FIN
// ==========================================================
const calcularFechaFin = (inicio, duracionMin) => {
  return new Date(inicio.getTime() + duracionMin * 60000);
};

// ==========================================================
// 📌 COMBINAR FECHA + HH:MM EN COLOMBIA
// ==========================================================
const combinarFechaHora = (fechaBase, hora) => {
  const fecha = DateTime.fromJSDate(fechaBase, { zone: "America/Bogota" });
  const [h, m] = hora.split(":");

  return fecha
    .set({ hour: parseInt(h), minute: parseInt(m), second: 0, millisecond: 0 })
    .toJSDate();
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

    // Convertir fecha a Colombia
    const fechaCol = fechaColombia(fecha);
    const dia = fechaCol.getDay();

    const disponibilidad = await Disponibilidad.findOne({
      sede,
      colaborador,
      diaSemana: dia,
    });

    if (!disponibilidad)
      return res.status(404).json({ msg: "No hay disponibilidad ese día" });

    const horaInicio = combinarFechaHora(fechaCol, disponibilidad.horaInicio);
    const horaFin = combinarFechaHora(fechaCol, disponibilidad.horaFin);

    const citas = await Cita.find({
      colaborador,
      fechaHora: { $gte: horaInicio, $lt: horaFin },
    });

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
        huecos.push({ inicio: inicioSlot, fin: finSlot });
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

    // Convertimos fecha a zona horaria Colombia
    const inicio = fechaColombia(fechaHora);

    const infoServicio = await Servicio.findById(servicio);
    if (!infoServicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const duracion = infoServicio.duracion;
    const fin = calcularFechaFin(inicio, duracion);

    // ==========================================
    // ⭐ VALIDAR HORARIO DEL COLABORADOR
    // ==========================================
    const dia = inicio.getDay();

    const disponibilidad = await Disponibilidad.findOne({
      sede,
      colaborador,
      diaSemana: dia,
    });

    if (!disponibilidad) {
      return res.status(400).json({
        msg: "El colaborador no trabaja este día",
      });
    }

    const horaInicio = combinarFechaHora(inicio, disponibilidad.horaInicio);
    const horaFin = combinarFechaHora(inicio, disponibilidad.horaFin);

    if (inicio < horaInicio || fin > horaFin) {
      return res.status(400).json({
        msg: "Horario fuera de la disponibilidad del colaborador",
      });
    }

    // ==========================================
    // ⛔ VALIDAR TRASLAPES
    // ==========================================
    const citaTraslapada = await Cita.findOne({
      colaborador,
      $and: [{ fechaHora: { $lt: fin } }, { fechaFin: { $gt: inicio } }],
    });

    if (citaTraslapada) {
      return res.status(400).json({
        msg: "El colaborador no tiene disponible este horario",
      });
    }

    // Crear cita
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
// ✏️ ACTUALIZAR CITA (Con validación de horarios y traslapes)
// ==========================================================
export const actualizarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicio, sede, fechaHora, colaborador, estado } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    if (!["admin", "superadmin"].includes(req.usuario.rol))
      return res.status(403).json({ msg: "No tienes permisos" });

    // ---------------------------------------------
    // OBTENER NUEVOS VALORES (si vienen)
    // ---------------------------------------------
    const nuevoServicio = servicio || cita.servicio;
    const nuevaSede = sede || cita.sede;
    const nuevoColaborador = colaborador || cita.colaborador;

    // Si se envía fecha, convertirla a Colombia, si no dejar la misma
    const nuevoInicio = fechaHora ? fechaColombia(fechaHora) : cita.fechaHora;

    // OBTENER DURACIÓN DEL SERVICIO
    const infoServicio = await Servicio.findById(nuevoServicio);
    if (!infoServicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const duracion = infoServicio.duracion;
    const nuevoFin = calcularFechaFin(nuevoInicio, duracion);

    // ---------------------------------------------
    // VALIDAR HORARIO DISPONIBLE
    // ---------------------------------------------
    const dia = nuevoInicio.getDay();

    const disponibilidad = await Disponibilidad.findOne({
      sede: nuevaSede,
      colaborador: nuevoColaborador,
      diaSemana: dia,
    });

    if (!disponibilidad) {
      return res.status(400).json({
        msg: "El colaborador no trabaja este día",
      });
    }

    const horaInicio = combinarFechaHora(nuevoInicio, disponibilidad.horaInicio);
    const horaFin = combinarFechaHora(nuevoInicio, disponibilidad.horaFin);

    if (nuevoInicio < horaInicio || nuevoFin > horaFin) {
      return res.status(400).json({
        msg: "Horario fuera de la disponibilidad del colaborador",
      });
    }

    // ---------------------------------------------
    // VALIDAR TRASLAPES (¡EXCLUYENDO ESTA MISMA CITA!)
    // ---------------------------------------------
    const traslape = await Cita.findOne({
      _id: { $ne: cita._id }, // EXCLUIR ESTA CITA
      colaborador: nuevoColaborador,
      $and: [
        { fechaHora: { $lt: nuevoFin } },
        { fechaFin: { $gt: nuevoInicio } }
      ],
    });

    if (traslape) {
      return res.status(400).json({
        msg: "Este horario ya está ocupado por otra cita",
      });
    }

    // ---------------------------------------------
    // GUARDAR CAMBIOS
    // ---------------------------------------------
    cita.servicio = nuevoServicio;
    cita.sede = nuevaSede;
    cita.colaborador = nuevoColaborador;
    cita.fechaHora = nuevoInicio;
    cita.fechaFin = nuevoFin;
    if (estado) cita.estado = estado;

    const citaActualizada = await cita.save();

    res.json({
      msg: "Cita actualizada correctamente",
      cita: citaActualizada,
    });

  } catch (error) {
    console.error(error);
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
