import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatBot.css";
import { apiService } from "../../services/api";
import { firstValueFrom } from "rxjs";
import { userManager } from "../../auth/oidc";
import LoadingSpinner from "../loading-spinner/LoadingSpinner";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  conversationId: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const user = await userManager.getUser();
      const response = await firstValueFrom(
        apiService.post$<ChatResponse>("/Agent/chat", {
          message: trimmed,
          conversationId: conversationId,
          userId: user?.profile?.email || "",
        })
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span className="chatbot-title">💬 Assistant</span>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message ${msg.sender === "user" ? "user" : "bot"}`}
              >
                <div className="chatbot-bubble">
                  {msg.sender === "bot" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="chatbot-time">{formatTime(msg.timestamp)}</span>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message bot">
                <div className="chatbot-bubble typing">
                  <LoadingSpinner size={24} color="#4f46e5" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="chatbot-send" onClick={handleSend} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
      <button
        className={`chatbot-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
};

export default ChatBot;
