import express from "express";
import dotenv from "dotenv";
import conectarDB from "./config/db.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";

dotenv.config();
const app = express();

// Middleware para leer JSON
app.use(express.json());

// Conexión a MongoDB
conectarDB();

// Rutas
app.use("/api/usuarios", usuarioRoutes);

// Puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
