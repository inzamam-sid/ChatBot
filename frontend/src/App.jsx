import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message) return;

    // add user message
    const newChat = [...chat, { sender: "user", text: message }];
    setChat(newChat);

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    // add bot reply
    setChat([...newChat, { sender: "bot", text: data.reply }]);
    setMessage("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI Chatbot</h2>

      <div style={{ border: "1px solid gray", padding: "10px", height: "300px", overflowY: "scroll" }}>
        {chat.map((msg, index) => (
          <p key={index}>
            <b>{msg.sender}:</b> {msg.text}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;