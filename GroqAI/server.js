
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { db } from "./db.js";
import { getEmbedding } from "./embedding.js";

dotenv.config();
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
        limit: 1,
        index: "vector_index", // ✅ fixed
      },
    },
  ]).toArray();

  if (!results.length) return null;

  //const context = results.map(r => r.text).join("\n");
  const context = [...new Set(results.map(r => r.text))].join("\n");

  console.log("Context:", context);

  return context;
}

// 🚀 Step 4.3: Updated Chat API
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const context = await getRelevantData(message);
    // ✅ Debug logs
    console.log("User message:", message);
    console.log("Context:", context);

    const finalPrompt = context
  ? `
Answer the question using the context below.

Give a clear and natural sentence.

Context:
${context}

Question:
${message}
`
  : message;

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: finalPrompt }
      ],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      reply: response.choices[0].message.content,
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