
import { GoogleGenAI } from "@google/genai";

import dotenv from "dotenv";

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GROQ_API_KEY,
});

async function run() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain React simply",
  });

  console.log(response.text);
}

run();
