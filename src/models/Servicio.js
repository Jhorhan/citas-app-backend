import mongoose from "mongoose";

const servicioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    duracion: {
      type: Number, // minutos
      required: true,
    },
    precio: {
      type: Number,
      required: true,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Servicio = mongoose.model("Servicio", servicioSchema);
export default Servicio;
