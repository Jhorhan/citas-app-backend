import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

dotenv.config();

const crearSuperAdmin = async () => {
  try {
    // Conexión a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Verificar si ya existe un Super Admin
    const existeSuperAdmin = await Usuario.findOne({ rol: "superadmin" });
    if (existeSuperAdmin) {
      console.log("⚠️ Ya existe un Super Admin en la base de datos.");
      return process.exit(0);
    }

    // Crear el primer Super Admin
    const superAdmin = await Usuario.create({
      nombre: "Jhorhan Acosta",
      email: "acostajhorhan@gmail.com",
      password: "123456", // texto plano (el hash se hace en el pre('save'))
      rol: "superadmin",
    });

    console.log("✅ Super Admin creado correctamente:");
    console.log({
      id: superAdmin._id,
      email: superAdmin.email,
      rol: superAdmin.rol,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear el Super Admin:", error);
    process.exit(1);
  }
};

crearSuperAdmin();