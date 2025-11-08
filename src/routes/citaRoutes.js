import express from "express";
import {
  crearCita,
  listarCitas,
  obtenerCita,
  actualizarCita,
  eliminarCita,
} from "../controllers/citaController.js";
import { protegerRuta, verificarRol } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  🧭 ENDPOINTS DISPONIBLES:
  - POST   /api/citas/           → Crear una cita (cliente)
  - GET    /api/citas/           → Listar todas las citas (admin / colaborador)
  - GET    /api/citas/:id        → Obtener una cita por ID
  - PUT    /api/citas/:id        → Actualizar una cita
  - DELETE /api/citas/:id        → Eliminar una cita
*/

// 🗓️ Crear una nueva cita (solo clientes)
router.post("/", protegerRuta, verificarRol("cliente"), crearCita);

// 📋 Listar citas (solo admin o colaborador)
router.get("/", protegerRuta, verificarRol("admin", "colaborador"), listarCitas);

// 🔍 Obtener una cita específica (cliente puede ver la suya, admin o colaborador también)
router.get("/:id", protegerRuta, obtenerCita);

// ✏️ Actualizar cita (solo admin o colaborador)
router.put("/:id", protegerRuta, verificarRol("admin", "colaborador"), actualizarCita);

// 🗑️ Eliminar cita (solo admin)
router.delete("/:id", protegerRuta, verificarRol("admin"), eliminarCita);

export default router;
