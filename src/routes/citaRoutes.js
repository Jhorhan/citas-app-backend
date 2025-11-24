import express from "express";
import {
  obtenerHuecosDisponibles,
  crearCita,
  listarCitas,
  obtenerCita,
  actualizarCita,
  eliminarCita
} from "../controllers/citaController.js";

import { protegerRuta } from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================================
// 🔍 OBTENER HUECOS DISPONIBLES (Público autenticado)
// GET /api/citas/huecos
// ==========================================================
router.get("/huecos", protegerRuta, obtenerHuecosDisponibles);

// ==========================================================
// 📅 CREAR CITA (Solo CLIENTE)
// POST /api/citas
// ==========================================================
router.post(
  "/", 
  protegerRuta, 
  verificarRol("cliente"), 
  crearCita
);

// ==========================================================
// 📋 LISTAR CITAS (Cliente: sus citas / Colaborador: sus citas / Admin: todas)
// GET /api/citas
// ==========================================================
router.get("/", protegerRuta, listarCitas);

// ==========================================================
// 🔍 OBTENER UNA CITA
// GET /api/citas/:id
// ==========================================================
router.get("/:id", protegerRuta, obtenerCita);

// ==========================================================
// ✏️ ACTUALIZAR CITA (Admin / Superadmin)
// PUT /api/citas/:id
// ==========================================================
router.put(
  "/:id", 
  protegerRuta, 
  verificarRol("admin", "superadmin"), 
  actualizarCita
);

// ==========================================================
// 🗑️ ELIMINAR CITA (Admin / Superadmin)
// DELETE /api/citas/:id
// ==========================================================
router.delete(
  "/:id", 
  protegerRuta, 
  verificarRol("admin", "superadmin"), 
  eliminarCita
);

export default router;
