import mongoose from "mongoose";

const disponibilidadSchema = new mongoose.Schema(
  {
    colaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    diaSemana: {
      type: Number, // 0=Domingo, 1=Lunes... 6=Sábado
      required: true,
    },
    horaInicio: {
      type: String, // formato "HH:mm"
      required: true,
    },
    horaFin: {
      type: String, // formato "HH:mm"
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Disponibilidad = mongoose.model("Disponibilidad", disponibilidadSchema);
export default Disponibilidad;
