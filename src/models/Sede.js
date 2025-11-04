import mongoose from "mongoose";

const sedeSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: true,
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

const Sede = mongoose.model("Sede", sedeSchema);
export default Sede;
