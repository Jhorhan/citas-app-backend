import express from "express";
import {
  crearCita,
  listarCitas,
  obtenerCita,
  actualizarCita,
  eliminarCita,
} from "../controllers/citaController.js";

import { protegerRuta } from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
ROLES:

cliente → crea citas
colaborador → ve sus citas
admin → maneja todas las citas de su empresa
superadmin → ve todo el sistema
*/

// Crear cita (solo clientes)
router.post(
  "/",
  protegerRuta,
  verificarRol("cliente"),
  crearCita
);

// Listar citas
router.get(
  "/",
  protegerRuta,
  listarCitas
);

// Obtener cita
router.get(
  "/:id",
  protegerRuta,
  obtenerCita
);

// Actualizar cita → admin y superadmin
router.put(
  "/:id",
  protegerRuta,
  verificarRol("admin", "superadmin"),
  actualizarCita
);

// Eliminar cita → admin y superadmin
router.delete(
  "/:id",
  protegerRuta,
  verificarRol("admin", "superadmin"),
  eliminarCita
);

export default router;
