
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
  console.log("CHAT API HIT");
  console.log("User question:", query);

  const queryEmbedding = await getEmbedding(query);

  console.log("Query embedding dimensions:", queryEmbedding.length);

  const results = await collection.aggregate([
    {
      $vectorSearch: {
        queryVector: queryEmbedding,
        path: "embedding",
        numCandidates: 50,
        limit: 5,
        index: "vector_index",
      },
    },
    {
      $project: {
        text: 1,
        pdfId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();

  console.log("Vector search result count:", results.length);

  console.log(
    "Vector search results:",
    results.map((r) => ({
      score: r.score,
      pdfId: r.pdfId,
      preview: r.text?.slice(0, 120),
    }))
  );

  // TEMPORARILY remove the similarity threshold
  // so we can diagnose retrieval.
  const usableResults = results.filter(
    (r) => typeof r.text === "string" && r.text.trim().length > 0
  );

  console.log("Usable results:", usableResults.length);

  return usableResults.map((r) => r.text);
}


function splitText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

function cleanText(text) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
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

    // const pdfData = await pdfParse(dataBuffer);

    // console.log("PDF parsed successfully");

    // //const text = pdfData.text;
    // const text = cleanText(pdfData.text);

    // const chunks = splitText(text);

    // console.log("Total chunks:", chunks.length);

    const pdfData = await pdfParse(dataBuffer);

    console.log("PDF parsed successfully");

    console.log(
      "Raw extracted text length:",
      pdfData.text?.length ?? 0
    );

    console.log(
      "Raw extracted text preview:",
      (pdfData.text || "").slice(0, 500)
    );

    const text = cleanText(pdfData.text || "");

    console.log("Cleaned text length:", text.length);
    console.log("Cleaned text preview:", text.slice(0, 500));

    if (!text.trim()) {
      return res.status(400).json({
        error:
          "No readable text found in this PDF. If it is scanned, OCR is required.",
      });
    }

    const chunks = splitText(text).filter((chunk) => chunk.trim());

    console.log("Total chunks:", chunks.length);

    if (chunks.length === 0) {
      return res.status(400).json({
        error: "No text chunks could be generated from this PDF.",
      });
    }

    await collection.deleteMany({});

    const pdfId = Date.now().toString();

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);

      const result = await collection.insertOne({
        pdfId,
        text: chunk,
        embedding,
      });

      console.log("Chunk stored:", result.insertedId);
      console.log("Embedding dimensions:", embedding.length);
    }

    console.log("PDF upload complete:", {
      pdfId,
      totalChunks: chunks.length,
      storedDocuments: await collection.countDocuments({ pdfId }),
    });

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
    if (!contexts || contexts.length === 0) {
      return res.json({
        reply: "I couldn't find relevant information in the uploaded PDF.",
        sources: [],
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
      model: "openai/gpt-oss-20b",
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