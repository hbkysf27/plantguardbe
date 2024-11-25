import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

dotenv.config(); // Load .env variables

const app = express();
const PORT = 5000;
app.use(cors());

// Initialize the Google Generative AI client with the API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(bodyParser.json({ limit: "3mb" }));
app.use(bodyParser.urlencoded({ limit: "3mb", extended: true }));

app.post("/api/identify", async (req, res) => {
  try {
    const imageFile = req.body.image;

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = {
      text: `Please analyze this plant image and provide the following information in JSON format:
      {
        "name": "common name of the plant",
        "scientificName": "scientific name",
        "family": "plant family",
        "care": ["3-4 key care instructions"]
      }`,
    };

    const imagePart = {
      inlineData: {
        data: imageFile,
        mimeType: req.body.mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = await result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const plantData = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : JSON.parse(responseText);

    return res.json(plantData);
  } catch (error) {
    console.error("Error identifying plant:", error);
    return res.status(500).json({
      error: "Failed to identify plant",
      details: error.message || "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
