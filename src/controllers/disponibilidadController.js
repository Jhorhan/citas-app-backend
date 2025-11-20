import Disponibilidad from "../models/Disponibilidad.js";

// Crear bloque de disponibilidad
export const crearDisponibilidad = async (req, res) => {
  try {
    const { colaborador, sede, empresa, diaSemana, horaInicio, horaFin } = req.body;

    if (!colaborador || !sede || !empresa || diaSemana === undefined || !horaInicio || !horaFin) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios." });
    }

    const disponibilidad = await Disponibilidad.create({
      colaborador,
      sede,
      empresa,
      diaSemana,
      horaInicio,
      horaFin,
    });

    res.status(201).json({
      msg: "Disponibilidad creada correctamente",
      disponibilidad,
    });
  } catch (error) {
    console.error("Error al crear disponibilidad:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// Listar disponibilidad por colaborador
export const listarDisponibilidad = async (req, res) => {
  try {
    const { colaborador } = req.params;

    const disponibilidad = await Disponibilidad.find({ colaborador, activo: true })
      .populate("sede", "nombre direccion")
      .populate("empresa", "nombre");

    res.json(disponibilidad);
  } catch (error) {
    console.error("Error al listar disponibilidad:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
};

// Eliminar un bloque (soft delete)
export const desactivarDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;

    await Disponibilidad.findByIdAndUpdate(id, { activo: false });

    res.json({ msg: "Bloque de disponibilidad desactivado" });
  } catch (error) {
    console.error("Error al eliminar disponibilidad:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
};
