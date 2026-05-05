import React, { useState, useRef, useEffect } from "react";
import API from "../api";

const ChatInterface = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSpeech = async () => {
    const recognition =
      new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: transcript },
      ]);

      const { data } = await API.post("/api/analysis/chat", {
        sessionId,
        transcript,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.aiReply },
      ]);
    };
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            {m.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <button
        onClick={handleSpeech}
        className="mt-4 w-full bg-blue-600 text-white p-2 rounded"
      >
        Speak
      </button>
    </div>
  );
};

export default ChatInterface;