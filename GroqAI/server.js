
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { db } from "./db.js";
import { getEmbedding } from "./embedding.js";

dotenv.config();
const upload = multer({ dest: "uploads/" });
const collection = db.collection("documents");


const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// 🔍 Smart Search
async function getRelevantData(query) {
  const queryEmbedding = await getEmbedding(query);

  const results = await collection.aggregate([
    {
      $vectorSearch: {
        queryVector: queryEmbedding,
        path: "embedding",
        numCandidates: 10,
        limit: 5,
        index: "vector_index", // ✅ fixed
      },
    },
  ]).toArray();

  if (!results.length) return null;

  //const context = results.map(r => r.text).join("\n");
  //const context = [...new Set(results.map(r => r.text))].join("\n");
  const context = [...new Set(results.map(r => r.text))]
  .slice(0, 2)
  .join("\n");

  console.log("Context:", context);

  return context;
}

function splitText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

function cleanText(text) {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/Page \d+/gi, "")
    .replace(/JAVASCRIPT Notes/gi, "")
    .replace(/By –.*?\d+/gi, "") // remove author lines
    .replace(/[^a-zA-Z0-9.,:;()=+\-*/<>!&| ]/g, "") // remove weird chars
    .trim();
}

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    console.log("File received:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    const dataBuffer = fs.readFileSync(filePath);

    console.log("Reading PDF...");

    const pdfParse = require("pdf-parse");

    const pdfData = await pdfParse(dataBuffer);

    console.log("PDF parsed successfully");

    //const text = pdfData.text;
    const text = cleanText(pdfData.text);

    const chunks = splitText(text);

    console.log("Total chunks:", chunks.length);

    for (let chunk of chunks) {
      if (!chunk.trim()) continue;

      const embedding = await getEmbedding(chunk);

      await collection.insertOne({
        text: chunk,
        embedding,
      });
    }

    // ✅ delete file after processing
    fs.unlinkSync(filePath);

    res.json({ message: "PDF uploaded and processed ✅" });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: "Error processing PDF" });
  }
});

// 🚀 Step 4.3: Updated Chat API
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const context = await getRelevantData(message);

    if (!context) {
      return res.json({
        reply: "I don't know. This is not in the uploaded PDF."
      });
    }

    const finalPrompt = `
You are an AI tutor.

Answer ONLY using the context below.

Rules:
- Do NOT summarize too much
- Include ALL important points from context
- Preserve details
- Use bullet points
- Do NOT add outside knowledge
- If not found → say "I don't know"

Context:
${context}

Question:
${message}
`;

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Strict context-based assistant." },
        { role: "user", content: finalPrompt }
      ],
      model: "llama-3.1-8b-instant",
    });

    let reply = response.choices[0].message.content;

    reply = reply.replace(/\*\*/g, "").replace(/\*/g, "");

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error" });
  }
});


// 🚀 Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});