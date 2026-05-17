const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Ask route using Gemini REST API directly (most reliable)
app.post("/ask", async (req, res) => {
  try {
    const { query, language } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const langMap = {
      "en-US": "English",
      "ta-IN": "Tamil",
      "hi-IN": "Hindi",
      "te-IN": "Telugu",
      "ml-IN": "Malayalam",
    };
    const targetLanguage = langMap[language] || "English";

    const prompt = `You are NILACHUMAI, an AI legal assistant for rural citizens.
Always answer in **${targetLanguage} language**.
If the question is not about land disputes, politely refuse.
Question: ${query}`;

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key (first 10 chars):", apiKey ? apiKey.substring(0, 10) : "NOT SET");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const answer = response.data.candidates[0].content.parts[0].text;

    res.json({
      answer: answer,
      language: targetLanguage,
    });
  } catch (err) {
    const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error("Gemini API Error:", errMsg);
    res.status(500).json({ error: "AI backend error", details: errMsg });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});