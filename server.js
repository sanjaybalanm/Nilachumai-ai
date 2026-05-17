const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Ask route with multilingual support
app.post("/ask", async (req, res) => {
  try {
    const { query, language } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Convert frontend lang codes like "ta-IN" → "Tamil"
    const langMap = {
      "en-US": "English",
      "ta-IN": "Tamil",
      "hi-IN": "Hindi",
      "te-IN": "Telugu",
      "ml-IN": "Malayalam",
    };
    const targetLanguage = langMap[language] || "English";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Tell Gemini to always respond in the chosen language
    const prompt = `You are NILACHUMAI, an AI legal assistant for rural citizens.
Always answer in **${targetLanguage} language**.
If the question is not about land disputes, politely refuse.
Question: ${query}`;

    const result = await model.generateContent(prompt);

    res.json({
      answer: result.response.text(),
      language: targetLanguage,
    });
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.status(500).json({ error: "AI backend error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});