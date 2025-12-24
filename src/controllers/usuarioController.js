import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";
import Sede from "../models/Sede.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// 🔑 Generar token
const generarToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};


// Registro nuevo usuario 

export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, googleId, empresaSlug } = req.body;

    // 🔴 Validaciones básicas
    if (!empresaSlug) {
      return res.status(400).json({ msg: "Empresa no especificada" });
    }

    const empresa = await Empresa.findOne({ slug: empresaSlug });
    if (!empresa) {
      return res.status(404).json({ msg: "La empresa no existe" });
    }

    const existeUsuario = await Usuario.findOne({ email });

    // ❌ Ya existe con Google
    if (existeUsuario && existeUsuario.googleId) {
      return res.status(400).json({
        msg: "Este correo ya está registrado mediante Google",
      });
    }

    // ❌ Ya existe normal
    if (existeUsuario) {
      return res.status(400).json({
        msg: "El correo ya está registrado",
      });
    }

    // ❌ Registro normal sin contraseña
    if (!googleId && !password) {
      return res.status(400).json({
        msg: "La contraseña es obligatoria",
      });
    }

    // ✅ Crear usuario CLIENTE asociado a empresa
    const usuario = await Usuario.create({
      nombre,
      email,
      password: googleId ? null : password,
      googleId: googleId || null,
      authProvider: googleId ? "google" : "local",
      rol: "cliente",
      empresa: empresa._id, 
    });

    res.status(201).json({
      msg: "Usuario registrado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: usuario.empresa,
        token: generarToken(usuario._id),
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar usuario" });
  }
};

// =======================
// 🔐 Login de usuario
// =======================
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email }).populate("empresa");
    if (!usuario)
      return res.status(400).json({ msg: "Usuario no encontrado" });

    if (usuario.googleId) {
      return res.status(400).json({
        msg: "Este usuario se registró con Google",
      });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido)
      return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = generarToken(usuario._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      msg: "Inicio de sesión exitoso",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,

        //respuesta con slug
        empresa: {
          id: usuario.empresa?._id,
          nombre: usuario.empresa?.nombre,
          slug: usuario.empresa?.slug,
        },

        sede: usuario.sede,
        token,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al iniciar sesión" });
  }
};


// =======================
// 👤 Obtener perfil
// =======================
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select("-password")
      .populate("empresa")
      .populate("sede");

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
};

// =======================
// ⚙️ Actualizar usuario
// =======================
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, empresa, sede } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario)
      return res.status(404).json({ msg: "Usuario no encontrado" });

    if (rol && req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "No tienes permiso para cambiar el rol" });

    if (empresa && req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "No tienes permiso para cambiar la empresa" });

    if (sede && req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "No tienes permiso para cambiar la sede" });

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;

    if (password) {
      if (usuario.googleId) {
        return res.status(400).json({
          msg: "Usuario Google no puede cambiar contraseña",
        });
      }
      usuario.password = password;
    }

    if (rol) usuario.rol = rol;
    if (empresa) usuario.empresa = empresa;
    if (sede) usuario.sede = sede;

    await usuario.save();

    res.json({
      msg: "Usuario actualizado correctamente",
      usuario,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

// =======================
// ❌ Eliminar usuario
// =======================
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "No tienes permiso" });

    await Usuario.findByIdAndDelete(id);
    res.json({ msg: "Usuario eliminado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};

// =======================
// 👑 Crear SuperAdmin
// =======================
export const crearSuperAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "Acceso denegado" });

    const { nombre, email, password } = req.body;

    const existe = await Usuario.findOne({ email });
    if (existe)
      return res.status(400).json({ msg: "El correo ya existe" });

    const nuevo = await Usuario.create({
      nombre,
      email,
      password,
      rol: "superadmin",
    });

    res.status(201).json({ msg: "SuperAdmin creado", usuario: nuevo });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear superadmin" });
  }
};

// =======================
// 👑 Crear Admin
// =======================
export const crearAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superadmin")
      return res.status(403).json({ msg: "Acceso denegado" });

    const { nombre, email, password, empresa, sede } = req.body;

    const nuevoAdmin = await Usuario.create({
      nombre,
      email,
      password,
      rol: "admin",
      empresa,
      sede,
    });

    res.status(201).json({ msg: "Admin creado", usuario: nuevoAdmin });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear admin" });
  }
};

// =======================
// 👷 Crear Colaborador
// =======================
export const crearColaborador = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.usuario.rol))
      return res.status(403).json({ msg: "No tienes permisos" });

    const { nombre, email, password, sede } = req.body;

    const sedeBD = await Sede.findById(sede);
    if (!sedeBD)
      return res.status(400).json({ msg: "La sede no existe" });

    if (String(sedeBD.empresa) !== String(req.usuario.empresa))
      return res.status(400).json({ msg: "La sede no pertenece a tu empresa" });

    const nuevo = await Usuario.create({
      nombre,
      email,
      password,
      rol: "colaborador",
      empresa: req.usuario.empresa,
      sede,
    });

    res.status(201).json({ msg: "Colaborador creado", usuario: nuevo });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear colaborador" });
  }
};
