
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
        numCandidates: 20,
        limit: 5,
        index: "vector_index",
      },
    },
    {
      $project: {
        text: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]).toArray();

  // 🔥 Filter weak matches
  //const filtered = results.filter(r => r.score > 0.75);
  const filtered = results.filter(r => r.score > 0.65 && r.text.length > 50);

  if (!filtered.length) return null;

  // 🔥 Remove duplicates + limit
  const uniqueTexts = [...new Set(filtered.map(r => r.text))];

  //const context = uniqueTexts.slice(0, 5).join("\n");

  console.log("Top Scores:", filtered.map(r => r.score));
  console.log("Final Context:", context);

  //return context;
  return uniqueTexts.slice(0, 5); // ✅ return array instead of string
}

function splitText(text, chunkSize = 800, overlap = 150) {
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
        length: chunk.length
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
    const contexts = await getRelevantData(message);
    if (!contexts) {
      return res.json({
        reply: "I couldn't find this in the uploaded PDF.",
        sources: []
      });
    }

    const combinedContext = contexts.join("\n"); // ✅ FIX

    const finalPrompt = `
      You are an AI tutor.

      Answer using ONLY the context below.

      Rules:
      - Do NOT repeat sentences
      - Combine similar points
      - Use proper bullet points (•)
      - Group information logically
      - Keep answer clean and readable

      Context:
      ${combinedContext}

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

    //reply = reply.replace(/\*\*/g, "").replace(/\*/g, "");
    reply = reply
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n\s*\n/g, "\n")   // 🔥 fix spacing
    .replace(/\s{2,}/g, " ")
    .trim();

    // res.json({ reply });
    // res.json({
    //   reply: response.choices[0].message.content,
    //   sources: contexts, // 🔥 send sources
    // });
    res.json({
      reply: reply,   // ✅ use cleaned version
      sources: contexts.map(text => ({ text }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error" });
  }
});


// 🚀 Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});