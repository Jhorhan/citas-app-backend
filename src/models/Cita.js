import mongoose from "mongoose";

const citaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    colaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
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

    // Fecha y hora exacta de inicio
    fechaHora: {
      type: Date,
      required: true,
    },

    // Fecha y hora exacta de finalización
    fechaFin: {
      type: Date,
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
