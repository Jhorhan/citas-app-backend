import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// 🔹 Importar rutas
import usuarioRoutes from "./routes/usuarioRoutes.js";
import servicioRoutes from "./routes/servicioRoutes.js"; // 👈 Nueva ruta

// 🔹 Configuración inicial
dotenv.config();
const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 Conexión a la base de datos
connectDB();

// 🔹 Rutas principales
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/servicios", servicioRoutes); // 👈 Aquí registramos el módulo de servicios

// 🔹 Ruta base (opcional)
app.get("/", (req, res) => {
  res.send("🚀 API Beauty App funcionando correctamente");
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
