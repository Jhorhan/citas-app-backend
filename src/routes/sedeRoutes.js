import express from "express";
import { protegerRuta } from "../middleware/authMiddleware.js";
import {
  crearSede,
  listarSedes,
  obtenerSede,
  actualizarSede,
  eliminarSede,
} from "../controllers/sedeController.js";

const router = express.Router();

// 🏢 Crear sede
router.post("/", protegerRuta, crearSede);

// 📋 Listar sedes
router.get("/", protegerRuta, listarSedes);

// 🔍 Obtener una sede por ID
router.get("/:id", protegerRuta, obtenerSede);

// ✏️ Actualizar sede
router.put("/:id", protegerRuta, actualizarSede);

// 🗑️ Eliminar sede
router.delete("/:id", protegerRuta, eliminarSede);

export default router;
