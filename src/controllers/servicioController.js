import Servicio from "../models/Servicio.js";
import Usuario from "../models/Usuario.js";

// ✅ Crear un nuevo servicio (solo empresa/admin)
export const crearServicio = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario || (usuario.rol !== "empresa" && usuario.rol !== "admin")) {
      return res.status(403).json({ msg: "No autorizado para crear servicios" });
    }

    const { nombre, duracion, precio } = req.body;

    if (!nombre || !duracion || !precio) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const nuevoServicio = new Servicio({
      nombre,
      duracion,
      precio,
      empresa: usuario._id, // 🔗 se asocia el servicio a la empresa que lo crea
    });

    const servicioGuardado = await nuevoServicio.save();
    res.status(201).json(servicioGuardado);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ msg: "Error al crear servicio" });
  }
};

// ✅ Obtener todos los servicios (empresa ve los suyos, admin ve todos)
export const obtenerServicios = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);

    let servicios;
    if (usuario.rol === "admin") {
      servicios = await Servicio.find().populate("empresa", "nombre email");
    } else if (usuario.rol === "empresa") {
      servicios = await Servicio.find({ empresa: usuario._id });
    } else {
      // un cliente solo ve los servicios disponibles
      servicios = await Servicio.find().populate("empresa", "nombre");
    }

    res.json(servicios);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ msg: "Error al obtener servicios" });
  }
};

// ✅ Obtener un servicio por ID
export const obtenerServicioPorId = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).populate("empresa", "nombre email");

    if (!servicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    res.json(servicio);
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    res.status(500).json({ msg: "Error al obtener servicio" });
  }
};

// ✅ Actualizar un servicio (solo empresa propietaria o admin)
export const actualizarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (
      usuario.rol !== "admin" &&
      servicio.empresa.toString() !== usuario._id.toString()
    ) {
      return res.status(403).json({ msg: "No autorizado para actualizar este servicio" });
    }

    servicio.nombre = req.body.nombre || servicio.nombre;
    servicio.duracion = req.body.duracion || servicio.duracion;
    servicio.precio = req.body.precio || servicio.precio;

    const servicioActualizado = await servicio.save();
    res.json(servicioActualizado);
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({ msg: "Error al actualizar servicio" });
  }
};

// ✅ Eliminar un servicio (solo empresa propietaria o admin)
export const eliminarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ msg: "Servicio no encontrado" });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (
      usuario.rol !== "admin" &&
      servicio.empresa.toString() !== usuario._id.toString()
    ) {
      return res.status(403).json({ msg: "No autorizado para eliminar este servicio" });
    }

    await servicio.deleteOne();
    res.json({ msg: "Servicio eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({ msg: "Error al eliminar servicio" });
  }
};
