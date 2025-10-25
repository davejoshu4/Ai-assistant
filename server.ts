import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; //  Added for memory + file reading

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const historyFile = "./memory.json";

// Custom knowledge base — your personal facts
const customKnowledge: Record<string, string> = {
  "joshua gallares": "Joshua Gallares is my creator — a passionate developer who built and trained me to help others learn programming and technology",
  "joshua dave gallares": "Joshua Dave Gallares is my creator — a tech enthusiast, developer, and a student from USTP",
  "dave buna": "Dave Buna is a skilled programmer and a close friend of my creator.",
  "jayson kilem": "Jayson Kilem is an aspiring developer who is also a close friend of my creator.",
};

//  Setup path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧱 Serve static files (index.html, style.css, script.js)
app.use(express.static(__dirname));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//  Serve the frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//  Chat endpoint
// 🟩 Store conversation history (temporary, resets when server restarts)
let conversationHistory: { role: "user" | "assistant" | "system"; content: string }[] = [
  {
    role: "system",
    content:
      "You are JDG AI Assistant — a friendly IT tutor created by Joshua Gallares. Always be helpful, polite, and remember previous context.",
  },
];

// 🧠 Load saved memory from file if it exists
if (fs.existsSync(historyFile)) {
  conversationHistory = JSON.parse(fs.readFileSync(historyFile, "utf8"));
  console.log("🧠 Memory loaded from file.");
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    // 🟩 1. Check your custom knowledge first
    for (const name in customKnowledge) {
      if (lowerMsg.includes(name)) {
        // 🟩 Save user + assistant response to memory
        conversationHistory.push({ role: "user", content: message });
        conversationHistory.push({ role: "assistant", content: customKnowledge[name] });
        return res.json({ reply: customKnowledge[name] });
      }
    }

    // 🟩 2. Check for "who created you" questions
    const creatorPattern =
      /(who\s+(made|created|built|programmed|developed)\s+(you|this|the\s+ai|the\s+bot))|(your\s+(creator|developer|maker|owner))/i;
    if (creatorPattern.test(lowerMsg)) {
      const reply = "I was created by Joshua Gallares — my amazing developer and teacher ";
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: reply });
fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2));

      return res.json({ reply });
    }

    // 🟩 3. Add user's message to conversation history
    conversationHistory.push({ role: "user", content: message });

    // 🟩 4. Send the entire chat history to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
    });

    const reply = response.choices[0].message.content;
conversationHistory.push({ role: "assistant", content: String(reply) });

// 🧠 Ask OpenAI for a short title based on the chat
// 🧠 Ask OpenAI for a short title based on the chat
// 🧠 Ask OpenAI for a short title based on the chat
// 🧠 Ask OpenAI for a short title based on the chat
// 🧠 Ask OpenAI for a short title based on the chat
let topicTitle = "";
try {
  const titleResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate a short, descriptive title (max 6 words) summarizing the conversation. No punctuation or quotes.",
      },
      {
        role: "user",
        content: `User: ${message}\nAssistant: ${reply}`,
      },
    ],
  });

  // ✅ Clean extraction (new SDK format)
  const choice = titleResponse.choices?.[0];
  topicTitle = choice?.message?.content?.trim() || "New Conversation";
} catch (err) {
  console.error("⚠️ Title generation failed:", err);
  topicTitle = "New Conversation";
}

// 💾 Save memory + return both message and title
fs.writeFileSync(historyFile, JSON.stringify(conversationHistory, null, 2));
console.log("💾 Memory saved to", historyFile);
res.json({ reply, topicTitle });


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});


// Start server
app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
