import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function run() {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "user", content: "What is Node.js" }
    ],
  model: "llama-3.1-8b-instant"
  });

  console.log(chatCompletion.choices[0].message.content);
}

run();