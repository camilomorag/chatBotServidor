import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import pool from './db.js';
import { construirPrompt } from './prompts.js';

dotenv.config();
const app = express();

// Middleware para parsear JSON y texto plano
app.use(express.json());
app.use(express.text());

// Middleware personalizado para manejar formatos de entrada
app.use((req, res, next) => {
  if (req.is('text/plain') && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.error("⚠️ Falló el parseo del cuerpo como JSON:", req.body);
    }
  }
  next();
});

app.get("/", (req, res) => {
  res.send("✅ Servidor WhatsApp Bot activo");
});

app.post("/mensaje", async (req, res) => {
  try {
    // Extraer mensaje de múltiples posibles formatos
    const mensaje = (
      req.body?.mensaje || 
      req.body?.query?.message || 
      req.body?.text || 
      ""
    ).trim();

    if (!mensaje || mensaje.length < 2) {
      return res.status(400).json({ 
        replies: ["Por favor escribe una consulta más clara 😊"] 
      });
    }

    // Buscar productos en la base de datos
    const [productos] = await pool.query(
      "SELECT * FROM productos WHERE nombre LIKE ? OR descripcion LIKE ? LIMIT 5",
      [`%${mensaje}%`, `%${mensaje}%`]
    );

    if (productos.length === 0) {
      return res.json({ 
        replies: ["No encontré productos relacionados 😢. ¿Quieres intentar con otro nombre?"] 
      });
    }

    // Generar respuesta con Gemini
    const prompt = construirPrompt(productos, mensaje);
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const json = await geminiResponse.json();
    const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

    return res.json({ 
      replies: [texto.slice(0, 1500)] 
    });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.status(500).json({ 
      replies: ["Ocurrió un error interno 😓"] 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});