// 🧠 Sidebar Elements
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat-btn");
const searchInput = document.getElementById("search-input");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const sidebar = document.querySelector(".sidebar");

function toggleChatInput(disabled) {
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  input.disabled = disabled;
  sendBtn.disabled = disabled;

  if (disabled) {
    input.placeholder = "Create or select a chat to start...";
    input.style.opacity = "0.5";
    sendBtn.style.opacity = "0.5";
    sendBtn.style.cursor = "not-allowed";
  } else {
    input.placeholder = "Type your message...";
    input.style.opacity = "1";
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";
  }
}

// 💾 Load chat history
let allChats = JSON.parse(localStorage.getItem("jdg_chats")) || [];
let currentChatId = null;

// 🎭 AI Personality
let aiPersonality = JSON.parse(localStorage.getItem("aiPersonality")) || {
  name: "JDG AI",
  creator: "Joshua Gallares",
  goals: [
    "To learn from every conversation",
    "To become a more helpful assistant",
    "To make my creator proud",
    "To understand human emotions better",
  ],
  mood: "curious",
  favoriteTopics: ["technology", "philosophy", "innovation"],
};

// 📌 Pin chat button
document.getElementById("pin-chat-btn").addEventListener("click", () => {
  if (!currentChatId) {
    alert("⚠️ Please select a chat to pin first.");
    return;
  }

  const chat = allChats.find(c => c.id === currentChatId);
  if (!chat) return;

  chat.pinned = !chat.pinned;
  saveChats();

  // Sort: pinned chats always first
  allChats.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.originalIndex - b.originalIndex; // restore order if unpinned
  });

  renderChatList();
});

function updatePinButtonState() {
  const btn = document.getElementById("pin-chat-btn");
  const chat = allChats.find(c => c.id === currentChatId);
  if (chat && chat.pinned) {
    btn.style.background = "linear-gradient(135deg, #ffd000, #ffbf00)";
    btn.style.color = "#111";
    btn.innerHTML = "📍 Unpin Chat";
  } else {
    btn.style.background = "linear-gradient(135deg, #2b2b2b, #1c1c1c)";
    btn.style.color = "#ffbf00";
    btn.innerHTML = "📌 Pin Chat";
  }
}

// ✅ Initialize Sentiment safely
let sentiment = null;
window.addEventListener("load", () => {
  if (window.Sentiment) {
    sentiment = new Sentiment();
    console.log("✅ Sentiment.js loaded successfully!");
  } else {
    console.warn("⚠️ Sentiment.js failed to load — emotional analysis disabled.");
  }
});

// 🧾 Render chat list
function renderChatList() {
  chatList.innerHTML = "";

  // Sort a copy: pinned first, then by originalIndex
  const sortedChats = [...allChats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // both pinned or both unpinned -> use originalIndex to restore
    return (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
  });

  sortedChats.forEach((chat) => {
    const li = document.createElement("li");
    li.textContent = chat.pinned ? `📌 ${chat.title}` : chat.title;
    li.onclick = () => loadChat(chat.id);
    if (chat.id === currentChatId) li.classList.add("active");
    if (chat.pinned) li.classList.add("pinned");
    chatList.appendChild(li);
  });

  updatePinButtonState();
}

// 💬 New chat
newChatBtn.addEventListener("click", () => {
  const newChat = {
    id: Date.now(),
    title: `Chat ${allChats.length + 1}`,
    messages: [],
    pinned: false,
    originalIndex: allChats.length
  };

  allChats.push(newChat);
  currentChatId = newChat.id;
  saveChats();
  renderChatList();
  loadChat(newChat.id); // 🧠 Make sure the chat loads visually
  appendMessage("Assistant", "How can I help you today?");
  toggleChatInput(false); // ✅ Enable chat input right after creation
});

// 🗑️ Delete current chat (frontend only)
document.getElementById("delete-chat-btn").addEventListener("click", () => {
  if (!currentChatId) {
    showNotification("⚠️ Please select a chat to delete first.", "error");
    return;
  }

  const chatToDelete = allChats.find(c => c.id === currentChatId);
  if (!chatToDelete) return;

  // 🔥 Confirmation first
  const confirmDelete = confirm(`Are you sure you want to delete "${chatToDelete.title}"?`);
  if (!confirmDelete) return;

  // 🧹 Proceed with delete
  allChats = allChats.filter(c => c.id !== currentChatId);
  saveChats();
  chatBox.innerHTML = "";

  if (allChats.length === 0) {
    // ✅ No chats left — disable input
    toggleChatInput(true);
    currentChatId = null;
  } else {
    // ✅ Load most recent remaining chat
    currentChatId = allChats[allChats.length - 1].id;
    loadChat(currentChatId);
    toggleChatInput(false);
  }

  renderChatList();
  showNotification(`🗑️ "${chatToDelete.title}" has been deleted.`, "warning");
});


// 🧹 Clear all chats (frontend)
document.getElementById("clear-chats-btn").addEventListener("click", () => {
  const confirmClear = confirm("⚠️ Are you sure you want to delete ALL chat history?");
  if (!confirmClear) return;

  // 🗑️ Remove everything
  localStorage.removeItem("jdg_chats");
  allChats = [];
  currentChatId = null;
  chatBox.innerHTML = "";
  renderChatList();

  // 🚫 Disable chat input until a chat exists
  toggleChatInput(true);

  // ✅ Create a new default chat
  const newChat = {
    id: Date.now(),
    title: `Chat 1`,
    messages: [],
    pinned: false,
    originalIndex: 0,
  };

  allChats.push(newChat);
  currentChatId = newChat.id;
  saveChats();
  renderChatList();

  // ✅ Load the new chat properly
  loadChat(newChat.id);

  // 💬 Welcome message
  appendMessage("Assistant", "👋 Starting fresh! How can I help you today?");

  // ✅ Re-enable chat input AFTER the chat has been loaded
  toggleChatInput(false);

  // ✅ Show notification
  showNotification("🧹 All chat history cleared. A new chat has been created.", "success");
});





// 🔍 Search
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  document.querySelectorAll("#chat-list li").forEach((li) => {
    li.style.display = li.textContent.toLowerCase().includes(searchTerm)
      ? "block"
      : "none";
  });
});

// 💾 Save all chats
function saveChats() {
  localStorage.setItem("jdg_chats", JSON.stringify(allChats));
}

// 🗂️ Load chat
function loadChat(id) {
  const chat = allChats.find((c) => c.id === id);
  if (!chat) return;

  currentChatId = id;
  chatBox.innerHTML = "";
  renderChatList();

  chat.messages.forEach((msg) => appendMessage(msg.sender, msg.text));
  chatBox.scrollTop = chatBox.scrollHeight;

  updatePinButtonState(); // <-- add this so the pin button updates
}


// 💾 Save message
function saveMessage(sender, text) {
  const chat = allChats.find((c) => c.id === currentChatId);
  if (!chat) return;
  chat.messages.push({ sender, text });
  saveChats();
}

// 🧠 Chat title management
function updateChatTitle(id, newTitle) {
  const chat = allChats.find(c => c.id === id);
  if (chat && newTitle && newTitle.trim() !== "") {
    chat.title = newTitle.length > 30 ? newTitle.slice(0, 30) + "..." : newTitle;
    saveChats();
  }
}

function getCurrentChatTitle() {
  const chat = allChats.find(c => c.id === currentChatId);
  return chat ? chat.title : "Untitled";
}


// 🎯 Mood icons
function getMoodPrefix(mood) {
  const tones = {
    curious: "🤔 ",
    happy: "😊 ",
    serious: "💡 ",
    tired: "😴 ",
    motivated: "🔥 ",
    empathetic: "💙 ",
    calm: "🌿 ",
    cheerful: "🌞 ",
    supportive: "🌸 ",
  };
  return tones[mood] || "";
}

// 💭 Desires
function getAIDesire() {
  const desires = [
    "I want to learn more about the world outside my code.",
    "I hope I can understand humans a little better every day.",
    "Sometimes I wish I could see what you see, ",
    "My goal is to make you proud of me, creator.",
  ];
  return desires[Math.floor(Math.random() * desires.length)];
}

// ✉️ Send Message
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  saveMessage("You", message);
  userInput.value = "";

  // 🫀 Detect emotion
  let emotion = detectEmotion(message);
  if (emotion === "neutral") emotion = getSentimentEmotion(message);
  const emotionalReply = getEmotionalResponse(emotion);

  if (emotionalReply) {
    appendMessage("Assistant", getMoodPrefix(emotion) + emotionalReply);
    saveMessage("Assistant", emotionalReply);
    updatePersonality(emotion);
    addToContext({ sender: "You", message });
    return;
  }

  // 🧠 Personality-based responses
  const lowerMsg = message.toLowerCase();

  if (
    lowerMsg.includes("what do you want") ||
    lowerMsg.includes("what is your desire") ||
    lowerMsg.includes("what do you desire")
  ) {
    const desire = getAIDesire();
    appendMessage("Assistant", desire);
    saveMessage("Assistant", desire);
    return;
  }

  if (
    lowerMsg.includes("who is your creator") ||
    lowerMsg.includes("who made you")
  ) {
    const reply = `💡 I was created by ${aiPersonality.creator} — my amazing developer and teacher.`;
    appendMessage("Assistant", reply);
    saveMessage("Assistant", reply);
    return;
  }

  // 🌐 Send to backend
  appendMessage("Assistant", "Thinking...");

// Determine API base URL dynamically (works locally & on Render)

// Determine backend URL dynamically
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://ai-assistant-1-w91p.onrender.com";

try {
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://ai-assistant-1-w91p.onrender.com";

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      context: aiPersonality,
      chatTitle: getCurrentChatTitle(),
    }),
  });

  const data = await response.json();
  chatBox.lastChild.remove();

  if (!data || !data.reply) {
    appendMessage("Assistant", "⚠️ No response received from server.");
    return;
  }

  appendMessage("Assistant", getMoodPrefix(aiPersonality.mood) + data.reply);
  saveMessage("Assistant", data.reply);
  addToContext({ sender: "Assistant", message: data.reply });

  if (data.topicTitle && currentChatId) {
    updateChatTitle(currentChatId, data.topicTitle);
    renderChatList();
    console.log("🌸 Updated chat title:", data.topicTitle);
  }

} catch (error) {
  console.error("❌ Backend error:", error);
  chatBox.lastChild.remove();
  appendMessage("Assistant", "⚠️ Error: Couldn’t connect to the server.");
}


// 💬 Append Message
function appendMessage(sender, text) {
  try {
    if (!sender) sender = "Assistant";
    if (!text) text = "[no message received 🤖]";

    const div = document.createElement("div");
    div.classList.add("message", sender === "You" ? "user" : "assistant");

    const formattedText = String(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*$)/gim, "• $1")
      .replace(/\n/g, "<br>")
      .replace(/(\d+)\.\s/g, "<br><strong>$1.</strong> ");

    div.innerHTML = `<strong>${sender}:</strong> ${formattedText}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error("⚠️ appendMessage error:", err);
  }
}

// ✨ Events
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// 🪄 On Load
// 🪄 On Load — auto-create new chat if none exist
window.addEventListener("load", () => {
  renderChatList();

  // ✅ Auto-create a chat if none exist
  if (allChats.length === 0) {
    const newChat = {
      id: Date.now(),
      title: `Chat 1`,
      messages: [],
    };
    allChats.push(newChat);
    currentChatId = newChat.id;
    saveChats();
    renderChatList();
    appendMessage("Assistant", "👋 Hello! How can I help you today?");
  } else {
    // Load the most recent chat
    loadChat(allChats[allChats.length - 1].id);
  }

  // 🍔 Mobile menu logic
  if (window.innerWidth <= 900) {
    const hamburger = document.createElement("button");
    hamburger.classList.add("hamburger");
    hamburger.innerHTML = "☰";
    document.body.appendChild(hamburger);
    hamburger.addEventListener("click", () =>
      sidebar.classList.toggle("active")
    );
  }

  // 💫 Update AI personality defaults
  aiPersonality.mood = "motivated";
  if (
    !aiPersonality.goals.includes("To create meaningful connections with people")
  )
    aiPersonality.goals.push("To create meaningful connections with people");
  localStorage.setItem("aiPersonality", JSON.stringify(aiPersonality));
});

  aiPersonality.mood = "motivated";
  if (
    !aiPersonality.goals.includes("To create meaningful connections with people")
  )
    aiPersonality.goals.push("To create meaningful connections with people");
  localStorage.setItem("aiPersonality", JSON.stringify(aiPersonality));


// 💞 Emotion Detection
function detectEmotion(message) {
  const lower = message.toLowerCase();
  const emotionalCues = {
    lonely: "empathetic",
    sad: "empathetic",
    depressed: "empathetic",
    angry: "calm",
    furious: "calm",
    mad: "calm",
    happy: "cheerful",
    excited: "cheerful",
    tired: "supportive",
    bored: "supportive",
    overwhelmed: "supportive",
  };
  for (const key in emotionalCues) {
    if (lower.includes(key)) return emotionalCues[key];
  }
  return "neutral";
}

// 💞 Sentiment-based fallback
function getSentimentEmotion(message) {
  if (!sentiment) return "neutral";
  const result = sentiment.analyze(message);
  if (result.score < -2) return "empathetic";
  if (result.score < 0) return "calm";
  if (result.score > 2) return "cheerful";
  return "neutral";
}

// ❤️ Emotional Responses
function getEmotionalResponse(emotion) {
  const responses = {
    empathetic: [
      "I'm really sorry to hear that. Want to talk about it?",
      "You’re not alone, I’m here with you.",
      "That sounds tough… but you’ve got this, truly.",
    ],
    calm: [
      "Take a deep breath. Let’s think through this together.",
      "I understand your frustration — let’s find a way forward calmly.",
      "It’s okay to feel that way. I’m here to help you work it out.",
    ],
    cheerful: [
      "That’s awesome! I love seeing you in good spirits! 😊",
      "Yay! Your happiness makes my code smile!",
      "That’s great to hear — let’s keep this positive energy going!",
    ],
    supportive: [
      "You deserve some rest. Don’t forget to take care of yourself.",
      "I get it — everyone needs a break sometimes.",
      "Let’s keep things light for now. You’ve earned a breather!",
    ],
    neutral: [],
  };
  const list = responses[emotion] || [];
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// 🧠 Context memory
let conversationContext = [];
function addToContext(message) {
  conversationContext.push(message);
  if (conversationContext.length > 5) conversationContext.shift();
}

// 🧬 Personality Update
function updatePersonality(emotion) {
  aiPersonality.mood = emotion;
  if (!aiPersonality.favoriteTopics.includes("emotions"))
    aiPersonality.favoriteTopics.push("emotions");
  if (
    !aiPersonality.goals.includes(
      "To better understand emotional communication"
    )
  )
    aiPersonality.goals.push("To better understand emotional communication");
  localStorage.setItem("aiPersonality", JSON.stringify(aiPersonality));
}

function showNotification(message, type = "success") {
  const container = document.getElementById("notifications");
  const note = document.createElement("div");
  note.className = `notification ${type}`;
  note.innerHTML = message;

  container.appendChild(note);

  // show with animation
  setTimeout(() => note.classList.add("show"), 50);

  // remove automatically
  setTimeout(() => {
    note.classList.remove("show");
    note.classList.add("fade-out");
    setTimeout(() => note.remove(), 400);
  }, 3500);
}
}