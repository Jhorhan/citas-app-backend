import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
} from "../controllers/usuarioController.js";
import { protegerRuta } from "../middleware/authMiddleware.js"; // ✅ corregido

const router = express.Router();

// Registro y login
router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);

// Perfil protegido
router.get("/perfil", protegerRuta, obtenerPerfil);

export default router;
