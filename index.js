// index.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import pool from './db.js';
import { construirPrompt } from './prompts.js';

dotenv.config();
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Servidor WhatsApp Bot activo");
});

app.post("/mensaje", async (req, res) => {
  const mensaje = req.body?.mensaje || req.body?.query?.message || "";

  if (!mensaje || mensaje.length < 2) {
    return res.json({ replies: ["Por favor escribe una consulta más clara 😊"] });
  }

  try {
    const [result] = await pool.query(
      "SELECT * FROM productos WHERE nombre LIKE ? OR descripcion LIKE ? LIMIT 5",
      [`%${mensaje}%`, `%${mensaje}%`]
    );

    if (result.length === 0) {
      return res.json({ replies: ["No encontré productos relacionados 😢. ¿Quieres intentar con otro nombre?"] });
    }

    const prompt = construirPrompt(result, mensaje);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const json = await geminiResponse.json();
    const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

    return res.json({ replies: [texto.slice(0, 1500)] });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return res.json({ replies: ["Ocurrió un error interno 😓"] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
