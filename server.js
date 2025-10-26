import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Paths for local files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("🔑 ENV key:", process.env.OPENAI_API_KEY);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log("🔑 Loaded key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");

// ✅ File where chat memory is saved
const historyFile = path.join(__dirname, "memory.json");

// ✅ Serve static files (index.html, script.js, style.css, etc.)
app.use(express.static(__dirname));

// ✅ Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Custom memory data
const customKnowledge = {
  "joshua gallares": "Joshua Gallares is my creator — a passionate developer who built and trained me to help others learn programming and technology.",
  "joshua dave gallares": "Joshua Dave Gallares is my creator — a tech enthusiast, developer, and a student from USTP.",
  "dave buna": "Dave Buna is a skilled programmer and a close friend of my creator.",
  "jayson kilem": "Jayson Kilem is an aspiring developer who is also a close friend of my creator.",
};

// ✅ Load existing memory if available
let conversationHistory = [
  {
    role: "system",
    content: "You are JDG AI Assistant — a friendly IT tutor created by Joshua Gallares.",
  },
];

if (fs.existsSync(historyFile)) {
  try {
    conversationHistory = JSON.parse(fs.readFileSync(historyFile, "utf8"));
    console.log("🧠 Loaded previous chat memory.");
  } catch (error) {
    console.warn("⚠️ Could not read memory file:", error);
  }
}

// ✅ Main chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided." });

    const lowerMsg = message.toLowerCase();

    // 1️⃣ Check for known people or custom data
    for (const name in customKnowledge) {
      if (lowerMsg.includes(name)) {
        const reply = customKnowledge[name];
        conversationHistory.push({ role: "user", content: message });
        conversationHistory.push({ role: "assistant", content: reply });
        fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2));
        return res.json({ reply });
      }
    }

    // 2️⃣ Handle creator questions
    const creatorPattern = /(who\s+(made|created|built|programmed|developed)\s+(you|this|the\s*ai|the\s*bot))|(your\s*(creator|developer|maker|owner))/i;
    if (creatorPattern.test(lowerMsg)) {
      const reply = "I was created by Joshua Gallares — my amazing developer and teacher.";
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: reply });
      fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2));
      return res.json({ reply });
    }

    // 3️⃣ Add user message to memory
    conversationHistory.push({ role: "user", content: message });

    // 4️⃣ Send chat history to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
    });

    const reply = response.choices?.[0]?.message?.content || "⚠️ No response from AI.";
    conversationHistory.push({ role: "assistant", content: reply });

    // 5️⃣ Save memory to file
    fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2));

    res.json({ reply });
  } catch (error) {
    console.error("❌ Chat error:", error);
    res.status(500).json({ error: "Server error processing message." });
  }
});

// ✅ Reset memory route
app.post("/reset-memory", (req, res) => {
  try {
    if (fs.existsSync(historyFile)) fs.unlinkSync(historyFile);
    conversationHistory = [
      {
        role: "system",
        content: "You are JDG AI Assistant — a friendly IT tutor created by Joshua Gallares.",
      },
    ];
    res.json({ message: "✅ Memory reset successfully." });
  } catch (err) {
    console.error("❌ Failed to reset memory:", err);
    res.status(500).json({ error: "Failed to reset memory." });
  }
});

// ✅ Start server (for Render, Vercel, or local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 JDG AI Server running on port ${PORT}`));
