import express from "express";
import { protegerRuta } from "../middleware/authMiddleware.js";
import {
  crearEmpresa,
  listarEmpresas,
  obtenerEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
} from "../controllers/empresaController.js";

const router = express.Router();

router.post("/", protegerRuta, crearEmpresa);
router.get("/", protegerRuta, listarEmpresas);
router.get("/:id", protegerRuta, obtenerEmpresa);
router.put("/:id", protegerRuta, actualizarEmpresa);
router.delete("/:id", protegerRuta, eliminarEmpresa);

export default router;
