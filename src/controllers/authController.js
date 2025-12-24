import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

// =======================================
//      LOGIN CON GOOGLE
// =======================================

export const loginConGoogle = async (req, res) => {
  try {
    const { credential, slug } = req.body;

    if (!credential) {
      return res.status(400).json({ msg: "No se envió token de Google" });
    }

    // Verificar Token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const nombre = payload.name;
    const foto = payload.picture;
    const googleId = payload.sub;

    // Buscar usuario existente
    let usuario = await Usuario.findOne({ email });

    // =====================================================
    //  SI EL USUARIO YA EXISTE → NO exigir slug
    // =====================================================
    if (usuario) {
      // Pero si el usuario SÍ tiene empresa, validar que coincida
      if (usuario.empresa && slug) {
        const empresa = await Empresa.findOne({ slug });
        if (!empresa) {
          return res.status(404).json({ msg: "La empresa no existe" });
        }
        if (usuario.empresa.toString() !== empresa._id.toString()) {
          return res.status(401).json({
            msg: "Este usuario no pertenece a esta empresa",
          });
        }
      }

      const token = jwt.sign(
        { id: usuario._id, role: usuario.rol, empresa: usuario.empresa },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        msg: "Login con Google exitoso",
        usuario: { ...usuario.toObject(), token },
      });
    }

    // =====================================================
    // SI EL USUARIO **NO EXISTE** → AQUI SÍ ES OBLIGATORIO `slug`
    // =====================================================
    if (!slug) {
      return res.status(400).json({
        msg: "No se envió slug de empresa para crear la cuenta",
      });
    }

    const empresa = await Empresa.findOne({ slug });
    if (!empresa) {
      return res.status(404).json({ msg: "La empresa no existe" });
    }

    // Crear usuario nuevo
    usuario = await Usuario.create({
      nombre,
      email,
      imagen: foto,
      googleId,
      authProvider: "google",
      empresa: empresa._id,
      password: null,
    });

    // Token
    const token = jwt.sign(
      { id: usuario._id, role: usuario.rol, empresa: usuario.empresa },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "Login con Google exitoso",
      usuario: { ...usuario.toObject(), token },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el login con Google" });
  }
};
