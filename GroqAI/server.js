
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { getEmbedding } from "./embedding.js";
import { cosineSimilarity } from "./similarity.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// 🧠 Raw Documents
const rawDocs = [
  "React is a JavaScript library used for building user interfaces",
  "Node.js is used for backend development and server-side programming",
  "MongoDB is a NoSQL database used to store data",
  "The college fee is 50000 rupees per year for students",
  "A fee is an amount of money paid for a service or institution",
];

// 🧱 Store embeddings
let documents = [];

async function prepareDocs() {
  console.log("Preparing embeddings... ⏳");

  for (let text of rawDocs) {
    const embedding = await getEmbedding(text);
    documents.push({ text, embedding });
  }

  console.log("Embeddings ready ✅");
}

// 🔍 Smart Search
async function getRelevantData(query) {
  const queryEmbedding = await getEmbedding(query);

  let bestMatch = null;
  let highestScore = -1;

  for (let doc of documents) {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = doc.text;
    }
  }

  // ✅ Debug log
  console.log("Best score:", highestScore);

  if (highestScore < 0.2) {
    return null;
  }

  return bestMatch;
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
Answer the question using ONLY the context below.

Be clear and complete.
Do NOT add extra information.

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
prepareDocs().then(() => {
  app.listen(5000, () => {
    console.log("Server running on port 5000 🚀");
  });
});