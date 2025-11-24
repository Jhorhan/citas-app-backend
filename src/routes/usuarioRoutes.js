import express from "express";
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarUsuario,
  eliminarUsuario,
  crearSuperAdmin, // ✅ añadimos esta importación
} from "../controllers/usuarioController.js";
import { protegerRuta } from "../middleware/authMiddleware.js";
import { crearColaborador } from "../controllers/usuarioController.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { crearAdmin } from "../controllers/usuarioController.js";


const router = express.Router();

// 🧾 Registro y login (públicos)
router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);

// 👤 Perfil (protegido)
router.get("/perfil", protegerRuta, obtenerPerfil);

// ✏️ Actualizar usuario (protegido)
router.put("/:id", protegerRuta, actualizarUsuario);

// 🗑️ Eliminar usuario (protegido)
router.delete("/:id", protegerRuta, eliminarUsuario);

// 👑 Crear SuperAdmin (solo SuperAdmins)
router.post("/crear-superadmin", protegerRuta, crearSuperAdmin);


router.post(
  "/crear-colaborador",
  protegerRuta,
  verificarRol("admin", "superadmin"),
  crearColaborador
);

router.post(
  "/crear-admin",
  protegerRuta,
  verificarRol("superadmin"), 
  crearAdmin
);


export default router;