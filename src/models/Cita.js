import mongoose from "mongoose";

const citaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario", // Cliente que agenda
      required: true,
    },
    colaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario", // Colaborador que atiende
      required: true,
    },
    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servicio",
      required: true,
    },
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    hora: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "cancelada"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

const Cita = mongoose.model("Cita", citaSchema);
export default Cita;
