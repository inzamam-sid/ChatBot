
// import { useState, useRef, useEffect } from "react";

// function App() {
//   const [message, setMessage] = useState("");
//   const [chat, setChat] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // ✅ NEW: file upload state
//   const [file, setFile] = useState(null);

//   const chatEndRef = useRef(null);

//   // ✅ Auto scroll
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [chat, loading]);

//   // =============================
//   // 📂 Upload PDF
//   // =============================
//   const uploadPDF = async () => {
//     if (!file) {
//       alert("Please select a file first");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("pdf", file);

//     try {
//       const res = await fetch("http://localhost:5000/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();

//       alert(data.message || "Uploaded ✅");
//     } catch (error) {
//       console.error(error);
//       alert("Upload failed ❌");
//     }
//   };

//   // =============================
//   // 💬 Send Message
//   // =============================
//   const sendMessage = async () => {
//     if (!message) return;

//     const newChat = [...chat, { sender: "user", text: message }];
//     setChat(newChat);
//     setMessage("");
//     setLoading(true);

//     try {
//       const res = await fetch("http://localhost:5000/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ message }),
//       });

//       const data = await res.json();

//       setChat([
//         ...newChat,
//         { sender: "bot", text: data.reply }
//       ]);
//     } catch (error) {
//       console.error(error);
//       setChat([
//         ...newChat,
//         { sender: "bot", text: "Error: Failed to get response" }
//       ]);
//     }

//     setLoading(false);
//   };

//   return (
//     <div style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      
//       <h2 style={{ textAlign: "center" }}>🤖 AI PDF Chatbot</h2>

//       {/* =============================
//           📂 Upload Section
//       ============================= */}
//       <div style={{ marginBottom: "15px" }}>
//         <input
//           type="file"
//           accept="application/pdf"
//           onChange={(e) => setFile(e.target.files[0])}
//         />
//         <button
//           onClick={uploadPDF}
//           style={{
//             marginLeft: "10px",
//             padding: "8px 15px",
//             background: "green",
//             color: "white",
//             border: "none",
//             borderRadius: "5px",
//           }}
//         >
//           Upload PDF
//         </button>
//       </div>

//       {/* =============================
//           💬 Chat Box
//       ============================= */}
//       <div
//         style={{
//           border: "1px solid #ccc",
//           borderRadius: "10px",
//           padding: "10px",
//           height: "400px",
//           overflowY: "auto",
//           background: "#f9f9f9",
//         }}
//       >
//         {chat.map((msg, index) => (
//           <div
//             key={index}
//             style={{
//               textAlign: msg.sender === "user" ? "right" : "left",
//               margin: "10px 0",
//             }}
//           >
//             <span
//               style={{
//                 display: "inline-block",
//                 padding: "10px",
//                 borderRadius: "10px",
//                 background:
//                   msg.sender === "user" ? "#007bff" : "#e5e5ea",
//                 color: msg.sender === "user" ? "white" : "black",
//                 maxWidth: "80%",
//               }}
//             >
//               {msg.text}
//             </span>
//           </div>
//         ))}

//         {loading && <p>🤖 Typing...</p>}

//         <div ref={chatEndRef} />
//       </div>

//       {/* =============================
//           ✏️ Input Box
//       ============================= */}
//       <div style={{ display: "flex", marginTop: "10px" }}>
//         <input
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Ask from PDF..."
//           style={{
//             flex: 1,
//             padding: "10px",
//             borderRadius: "5px",
//             border: "1px solid #ccc",
//           }}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />

//         <button
//           onClick={sendMessage}
//           style={{
//             marginLeft: "10px",
//             padding: "10px 20px",
//             borderRadius: "5px",
//             background: "#007bff",
//             color: "white",
//             border: "none",
//           }}
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }

// export default App;










import React, { useState, useRef, useEffect } from "react";
import "./App.css"; // We'll create this CSS file

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // =============================
  // 📂 Upload PDF to your backend
  // =============================
  const uploadPDF = async () => {
    if (!file) {
      alert("Please select a PDF file first");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      // 🔁 REPLACE WITH YOUR ACTUAL BACKEND URL
      // const res = await fetch("http://localhost:5000/upload", {
      const res = await fetch("https://chatbot-95vz.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ PDF uploaded successfully! You can now ask questions.");
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("file-input");
        if (fileInput) fileInput.value = "";
      } else {
        alert(data.error || "Upload failed ❌");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF. Make sure your backend is running.");
    } finally {
      setUploading(false);
    }
  };

  // =============================
  // 💬 Send Message to your backend
  // =============================
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    const newChat = [...chat, { sender: "user", text: userMessage }];
    setChat(newChat);
    setMessage("");
    setLoading(true);

    try {
      // 🔁 REPLACE WITH YOUR ACTUAL CHAT BACKEND URL
      // const res = await fetch("http://localhost:5000/chat", {
      const res = await fetch("https://chatbot-95vz.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        setChat([
          ...newChat,
          { sender: "bot", text: data.reply || data.response || "No response from backend" },
        ]);
      } else {
        setChat([
          ...newChat,
          { sender: "bot", text: `Error: ${data.error || "Something went wrong"}` },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChat([
        ...newChat,
        { sender: "bot", text: "❌ Failed to connect to backend. Make sure your server is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearChat = () => {
    setChat([]);
  };

  // Sample suggested questions
  const suggestedQuestions = [
    "Explain quantum computing in simple terms",
    "What are the key findings from the PDF?",
    "Summarize the main points",
    "Create a detailed plan based on this",
  ];

  return (
    <div className="app-container">
      {/* Sidebar Toggle Button (Mobile) */}
      <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">🤖 PDF Chat</h2>
        </div>

        {/* File Upload Section */}
        <div className="upload-section">
          <label className="upload-label">
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
            <span className="upload-icon">📄</span>
            <span>{file ? file.name : "Choose PDF file"}</span>
          </label>
          <button
            onClick={uploadPDF}
            disabled={uploading || !file}
            className={`upload-button ${(uploading || !file) ? "disabled" : ""}`}
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>

        <div className="divider" />

        {/* Suggested Questions */}
        <div className="suggestions-section">
          <h4 className="suggestions-title">💡 Suggested Questions</h4>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              className="suggestion-button"
              onClick={() => {
                setMessage(q);
                sendMessage();
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* Clear Chat Button */}
        <button className="clear-button" onClick={clearChat}>
          🗑️ Clear Conversation
        </button>

        <div className="footer">
          <p className="footer-text">Powered by your AI Backend</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="chat-header">
          <h2 className="chat-title">AI PDF Assistant</h2>
          <div className="status">
            <span className="status-dot"></span>
            <span>Ready</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="messages-container">
          {chat.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>Upload a PDF and start asking questions!</p>
              <p className="empty-subtext">Ask about summaries, key points, or specific details</p>
            </div>
          )}
          
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
            >
              <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}>
                {msg.sender === "bot" && <span className="bot-icon">🤖</span>}
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message-row bot-row">
              <div className="message-bubble typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your PDF..."
              className="input"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className={`send-button ${(loading || !message.trim()) ? "disabled" : ""}`}
            >
              <span>➤</span>
            </button>
          </div>
          <div className="input-hint">Press Enter to send</div>
        </div>
      </div>
    </div>
  );
}

export default App;