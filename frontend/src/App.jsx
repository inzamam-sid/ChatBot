// import { useState } from "react";

// function App() {
//   const [message, setMessage] = useState("");
//   const [chat, setChat] = useState([]);

//   const sendMessage = async () => {
//     if (!message) return;

//     // add user message
//     const newChat = [...chat, { sender: "user", text: message }];
//     setChat(newChat);

//     const res = await fetch("http://localhost:5000/chat", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ message }),
//     });

//     const data = await res.json();

//     // add bot reply
//     setChat([...newChat, { sender: "bot", text: data.reply }]);
//     setMessage("");
//   };

//   return (
//   <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
//     <h2 style={{ textAlign: "center" }}>🤖 AI Chatbot</h2>

//     <div
//       style={{
//         border: "1px solid #ccc",
//         borderRadius: "10px",
//         padding: "10px",
//         height: "400px",
//         overflowY: "auto",
//         background: "#f9f9f9",
//       }}
//     >
//       {chat.map((msg, index) => (
//         <div
//           key={index}
//           style={{
//             textAlign: msg.sender === "user" ? "right" : "left",
//             margin: "10px 0",
//           }}
//         >
//           <span
//             style={{
//               display: "inline-block",
//               padding: "10px",
//               borderRadius: "10px",
//               background:
//                 msg.sender === "user" ? "#007bff" : "#e5e5ea",
//               color: msg.sender === "user" ? "white" : "black",
//             }}
//           >
//             {msg.text}
//           </span>
//         </div>
//       ))}
//     </div>

//     <div style={{ display: "flex", marginTop: "10px" }}>
//       <input
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//         placeholder="Type message..."
//         style={{
//           flex: 1,
//           padding: "10px",
//           borderRadius: "5px",
//           border: "1px solid #ccc",
//         }}
//       />
//       <button
//         onClick={sendMessage}
//         style={{
//           marginLeft: "10px",
//           padding: "10px 20px",
//           borderRadius: "5px",
//           background: "#007bff",
//           color: "white",
//           border: "none",
//         }}
//       >
//         Send
//       </button>
//     </div>
//   </div>
// );
// }

// export default App;











import { useState, useRef, useEffect } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
// Scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const sendMessage = async () => {
    if (!message) return;

    const newChat = [...chat, { sender: "user", text: message }];
    setChat(newChat);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      setChat([
        ...newChat,
        { sender: "bot", text: data.reply }
      ]);
    } catch (error) {
      console.error(error);
      setChat([
        ...newChat,
        { sender: "bot", text: "Error: Failed to get response" }
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>🤖 AI Chatbot</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "10px",
          height: "400px",
          overflowY: "auto",
          background: "#f9f9f9",
        }}
      >
        {chat.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "10px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "10px",
                borderRadius: "10px",
                background:
                  msg.sender === "user" ? "#007bff" : "#e5e5ea",
                color: msg.sender === "user" ? "white" : "black",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <p>🤖 Typing...</p>}

        <div ref={chatEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: "10px" }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}t
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            borderRadius: "5px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;