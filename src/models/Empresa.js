import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    nit: {
      type: String,
      required: true,
      unique: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    logo: {
      type: String, // URL de la imagen
      trim: true,
    },
    usuario_admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true
}


  },
  {
    timestamps: true,
  }
);

const Empresa = mongoose.model("Empresa", empresaSchema);
export default Empresa;
