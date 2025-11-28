import express from "express";
import { protegerRuta } from "../middleware/authMiddleware.js";
import {
  crearEmpresa,
  listarEmpresas,
  obtenerEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  obtenerEmpresaPorSlug,   // ✅ IMPORTANTE
} from "../controllers/empresaController.js";

const router = express.Router();

/* ============================
   🔓 Rutas Públicas (NO requieren login)
============================ */
router.get("/slug/:slug", obtenerEmpresaPorSlug);   // ⭐ NUEVA RUTA PÚBLICA

/* ============================
   🔐 Rutas Protegidas
============================ */
router.post("/", protegerRuta, crearEmpresa);
router.get("/", protegerRuta, listarEmpresas);
router.get("/:id", protegerRuta, obtenerEmpresa);
router.put("/:id", protegerRuta, actualizarEmpresa);
router.delete("/:id", protegerRuta, eliminarEmpresa);

export default router;
