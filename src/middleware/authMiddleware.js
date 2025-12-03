import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const protegerRuta = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Buscar token en header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Si no está en header, buscar token en cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 3️⃣ Si no hay token, denegar acceso
    if (!token) {
      return res.status(401).json({ msg: "No se proporcionó token" });
    }

    // 4️⃣ Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: "Token no válido o expirado" });
    }

    // 5️⃣ Buscar usuario en DB
    const usuario = await Usuario.findById(decoded.id).select("-password");
    if (!usuario) {
      return res.status(401).json({ msg: "Usuario no encontrado" });
    }

    // 6️⃣ Guardar usuario y token en req para próximos middlewares / controllers
    req.usuario = usuario;
    req.token = token;

    next();
  } catch (err) {
    console.error("Error en protegerRuta:", err);
    res.status(500).json({ msg: "Error interno de autenticación" });
  }
};
