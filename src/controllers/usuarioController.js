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

// 🧍 Registrar nuevo usuario
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
    const usuario = await Usuario.findById(req.usuario.id).select("-password");
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// ⚙️ Actualizar datos de un usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Solo SuperAdmins pueden cambiar roles
    if (rol && req.usuario.rol !== "superadmin") {
      return res.status(403).json({ msg: "No tienes permiso para cambiar el rol de usuario" });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    if (password) usuario.password = password;
    if (rol && req.usuario.rol === "superadmin") usuario.rol = rol;

    await usuario.save();

    res.json({
      msg: "Usuario actualizado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
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

    // Solo los SuperAdmins pueden eliminar usuarios
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

// 👑 Crear un SuperAdmin (solo para SuperAdmins)
export const crearSuperAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin") {
      return res.status(403).json({
        msg: "Acceso denegado: solo los SuperAdmins pueden crear otros SuperAdmins.",
      });
    }

    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios." });
    }

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ msg: "Ya existe un usuario con este correo." });
    }

    const nuevoSuperAdmin = await Usuario.create({
      nombre,
      email,
      password,
      rol: "superadmin",
    });

    res.status(201).json({
      msg: "✅ SuperAdmin creado correctamente.",
      usuario: {
        id: nuevoSuperAdmin._id,
        nombre: nuevoSuperAdmin.nombre,
        email: nuevoSuperAdmin.email,
        rol: nuevoSuperAdmin.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear SuperAdmin:", error);
    res.status(500).json({ msg: "Error interno al crear el SuperAdmin." });
  }
};

// 👷 Crear usuario colaborador (solo admin o superadmin)
export const crearColaborador = async (req, res) => {
  try {
    // Solo admin o superadmin pueden crear colaboradores
    if (!["admin", "superadmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ msg: "No tienes permisos para crear colaboradores" });
    }

    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    const nuevo = await Usuario.create({
      nombre,
      email,
      password,
      rol: "colaborador", // 🔥 IMPORTANTE: el admin NO puede crear otro admin
    });

    res.status(201).json({
      msg: "Colaborador creado correctamente",
      usuario: {
        id: nuevo._id,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear colaborador:", error);
    res.status(500).json({ msg: "Error interno al crear colaborador" });
  }
};