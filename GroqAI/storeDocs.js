import { db } from "./db.js";
import { getEmbedding } from "./embedding.js";

const collection = db.collection("documents");

const rawDocs = [
  "React is a JavaScript library used for building UI",
  "Node.js is a backend runtime environment",
  "MongoDB is a NoSQL database",
  "The college fee is 50000 rupees per year",
  "A fee is an amount paid for a service",
];

async function storeDocs() {
  console.log("Storing documents...");

  for (let text of rawDocs) {
    const embedding = await getEmbedding(text);

    await collection.insertOne({
      text,
      embedding,
    });
  }

  console.log("Documents stored ✅");
}

storeDocs();