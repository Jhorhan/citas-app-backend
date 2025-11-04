import express from "express";
import {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  eliminarServicio,
} from "../controllers/servicioController.js";
import { protegerRuta } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protegerRuta, obtenerServicios)
  .post(protegerRuta, crearServicio);

router.route("/:id")
  .get(protegerRuta, obtenerServicioPorId)
  .put(protegerRuta, actualizarServicio)
  .delete(protegerRuta, eliminarServicio);

export default router;
