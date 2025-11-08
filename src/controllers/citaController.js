export const obtenerCitas = async (req, res) => {
  try {
    let filtro = {};

    if (req.user.rol === "admin") {
      // Ver solo las citas de su empresa
      filtro = { empresa: req.user.empresa };
    } else if (req.user.rol === "colaborador") {
      // Ver solo las citas asignadas a él
      filtro = { colaborador: req.user._id };
    } else if (req.user.rol === "cliente") {
      // Ver solo las citas del cliente
      filtro = { usuario: req.user._id };
    }

    const citas = await Cita.find(filtro)
      .populate("usuario", "nombre email")
      .populate("colaborador", "nombre email")
      .populate("servicio", "nombre descripcion")
      .populate("sede", "nombre direccion");

    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ mensaje: "Error al obtener citas", error });
  }
};
