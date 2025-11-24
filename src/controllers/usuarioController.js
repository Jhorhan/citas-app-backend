import Usuario from "../models/Usuario.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// 🔑 Función para generar token JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 🧍 Registrar nuevo usuario (cliente por defecto)
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const usuario = await Usuario.create({ nombre, email, password });

    res.status(201).json({
      msg: "Usuario registrado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: generarToken(usuario._id),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar usuario" });
  }
};

// 🔐 Login de usuario
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    res.json({
      msg: "Inicio de sesión exitoso",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: usuario.empresa,
        sede: usuario.sede,
        token: generarToken(usuario._id),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al iniciar sesión" });
  }
};

// 👤 Obtener perfil del usuario autenticado
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .select("-password")
      .populate("empresa")
      .populate("sede");

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// ⚙️ Actualizar usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, empresa, sede } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Solo SuperAdmin puede cambiar roles
    if (rol && req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "No tienes permiso para cambiar el rol de usuario",
      });
    }
    // Solo SuperAdmin puede cambiar sedes

    if (sede && req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "No tienes permiso para cambiar la sede",
      });
    }


    // Solo el superadmin puede cambiar empresa
    if (empresa && req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "No tienes permiso para cambiar la empresa",
      });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    if (password) usuario.password = password;

    if (rol) usuario.rol = rol;
    if (empresa) usuario.empresa = empresa;
    if (sede) usuario.sede = sede;


    await usuario.save();

    res.json({
      msg: "Usuario actualizado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: usuario.empresa,
        sede: usuario.sede,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

// ❌ Eliminar un usuario
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permiso para eliminar usuarios" });
    }

    await usuario.deleteOne();
    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};

// 👑 Crear SuperAdmin
export const crearSuperAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "Acceso denegado: solo SuperAdmins.",
      });
    }

    const { nombre, email, password } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ msg: "El correo ya existe" });

    const nuevo = await Usuario.create({
      nombre,
      email,
      password,
      rol: "superadmin",
    });

    res.status(201).json({
      msg: "SuperAdmin creado correctamente",
      usuario: nuevo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear superadmin" });
  }
};

// 👑 Crear usuario ADMIN (solo SuperAdmins)
export const crearAdmin = async (req, res) => {
  try {
    // Solo superadmin puede crear otros admins
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "Acceso denegado: solo los SuperAdmins pueden crear Admins",
      });
    }

    const { nombre, email, password, empresa, sede } = req.body;

    if (!nombre || !email || !password || !empresa|| !sede) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios (nombre, email, password, empresa, sede)" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    const nuevoAdmin = await Usuario.create({
      nombre,
      email,
      password,
      rol: "admin",
      empresa,
      sede,
    });

    res.status(201).json({
      msg: "Admin creado correctamente",
      usuario: {
        id: nuevoAdmin._id,
        nombre: nuevoAdmin.nombre,
        email: nuevoAdmin.email,
        rol: nuevoAdmin.rol,
        empresa: nuevoAdmin.empresa,
        sede: nuevoAdmin.sede,
      },
    });

  } catch (error) {
    console.error("❌ Error al crear admin:", error);
    res.status(500).json({ msg: "Error interno al crear admin" });
  }
};

// 👷 Crear colaborador (admin o superadmin)
export const crearColaborador = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permisos para crear colaboradores" });
    }

    const { nombre, email, password, sede } = req.body;

    
    // Validar que la sede exista
    const sedeBD = await Sede.findById(sede);
    if (!sedeBD) {
      return res.status(400).json({ msg: "La sede no existe" });
    }

    // Validar que la sede pertenezca a la empresa del admin
    if (String(sedeBD.empresa) !== String(req.usuario.empresa)) {
      return res.status(400).json({ msg: "La sede no pertenece a tu empresa" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    const nuevo = await Usuario.create({
      nombre,
      email,
      password,
      rol: "colaborador",
      empresa: req.usuario.empresa, // 🔥 Asignar empresa automáticamente
      sede, 
    });

    res.status(201).json({
      msg: "Colaborador creado correctamente",
      usuario: nuevo,
    });
  } catch (error) {
    console.error("Error al crear colaborador:", error);
    res.status(500).json({ msg: "Error interno al crear colaborador" });
  }
};
