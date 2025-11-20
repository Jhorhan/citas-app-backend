import express from "express";
import {
  crearDisponibilidad,
  listarDisponibilidad,
  desactivarDisponibilidad
} from "../controllers/disponibilidadController.js";

import { protegerRuta } from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Crear horario (solo admin o superadmin)
router.post("/", protegerRuta, verificarRol("admin", "superadmin"), crearDisponibilidad);

// Listar horarios de un colaborador
router.get("/:colaborador", protegerRuta, listarDisponibilidad);

// Desactivar horario
router.delete("/:id", protegerRuta, verificarRol("admin", "superadmin"), desactivarDisponibilidad);

export default router;
