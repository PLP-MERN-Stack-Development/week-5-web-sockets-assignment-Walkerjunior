import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [privateMessages, setPrivateMessages] = useState([]);

  useEffect(() => {
    const name = prompt("Enter your username:");
    setUsername(name);
    socket.emit("set_username", name);

    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("typing", (data) => {
      setTypingStatus(`${data} is typing...`);
      setTimeout(() => setTypingStatus(""), 1500);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users.filter((user) => user !== name));
    });

    socket.on("private_message", ({ from, message }) => {
      setPrivateMessages((prev) => [...prev, { from, message }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "") {
      const msgData = {
        sender: username,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit("send_message", msgData);
      setMessage("");
    }
  };

  const sendPrivateMessage = () => {
    if (message.trim() !== "" && selectedUser) {
      socket.emit("private_message", {
        to: selectedUser,
        from: username,
        message,
      });
      setPrivateMessages((prev) => [
        ...prev,
        { from: "You", message },
      ]);
      setMessage("");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h2>💬 Real-Time Chat</h2>

      {/* Online Users */}
      <div>
        <h4>Online Users</h4>
        {onlineUsers.map((user, i) => (
          <button
            key={i}
            onClick={() => setSelectedUser(user)}
            style={{
              marginRight: 8,
              backgroundColor:
                selectedUser === user ? "#007bff" : "#eee",
              color: selectedUser === user ? "white" : "black",
              borderRadius: 4,
              padding: "4px 8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {user}
          </button>
        ))}
      </div>

      {/* Typing Indicator */}
      <p style={{ fontStyle: "italic", color: "gray", minHeight: 24 }}>
        {typingStatus}
      </p>

      {/* Public Messages */}
      <div
        style={{
          height: 200,
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <h4>🌐 Public Chat</h4>
        {chat.map((msg, index) => (
          <p key={index} style={{ margin: "8px 0" }}>
            <strong>{msg.sender}</strong>: {msg.message}{" "}
            <em style={{ fontSize: 12, color: "#999" }}>({msg.timestamp})</em>
          </p>
        ))}
      </div>

      {/* Private Messages */}
      <div style={{ marginBottom: 20 }}>
        <h4>🔒 Private Chat with {selectedUser || "..."}</h4>
        <div style={{ minHeight: 100, border: "1px solid #ddd", padding: 8 }}>
          {privateMessages
            .filter(
              (msg) =>
                msg.from === selectedUser || msg.from === "You"
            )
            .map((msg, i) => (
              <p key={i}>
                <strong>{msg.from}:</strong> {msg.message}
              </p>
            ))}
        </div>
      </div>

      {/* Input + Send */}
      <div>
        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit("typing", username);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              selectedUser ? sendPrivateMessage() : sendMessage();
            }
          }}
          style={{
            padding: 10,
            width: "70%",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={selectedUser ? sendPrivateMessage : sendMessage}
          style={{
            padding: 10,
            marginLeft: 10,
            borderRadius: 6,
            border: "none",
            background: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
