import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import dotenv from "dotenv";

dotenv.config();

export const protegerRuta = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);

      req.usuario = await Usuario.findById(decodificado.id).select("-password");
      next();
    } catch (error) {
      return res.status(401).json({ msg: "Token no válido" });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: "No se proporcionó un token" });
  }
};
