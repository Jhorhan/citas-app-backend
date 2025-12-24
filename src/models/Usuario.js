import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
      // 🔐 Password opcional para permitir Google Auth
    password: {
      type: String,
      minlength: 6,
    },

    googleId: {
      type: String,
      default: null,
    },
    
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    rol: {
      type: String,
      enum: ["cliente", "admin", "superadmin", "colaborador"],
      default: "cliente",
    },

    // Empresa requerida si es <> a superadmin
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: function () {
        return this.rol !== "superadmin";
      },
    },



    // Sede requerida solo para admin y colaborador
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: function () {
        return this.rol === "admin" || this.rol === "colaborador";
      },
    },
  },
  
  {
    timestamps: true,
  }
);

// 🔒 Encriptar contraseña antes de guardar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
