import { useState, useRef, useEffect } from "react";
import { getGeminiResponse } from "./GeminiClient";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  ChevronLeft,
  Moon,
  Sun,
  Send,
  Plus,
  ChevronRight,
} from "lucide-react";
import "./Chatbot.css";

const Chatbot = () => {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("chatConversations");
    return saved
      ? JSON.parse(saved)
      : [{ messages: [], title: "New Chat", projectId: "" }];
  });
  const [currentConversation, setCurrentConversation] = useState(0);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");
  const [showProjectIdModal, setShowProjectIdModal] = useState(false);
  const [currentProjectIdInput, setCurrentProjectIdInput] = useState("");
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const themes = {
    light: {
      "--bg-primary": "#f8f9fa",
      "--bg-secondary": "#ffffff",
      "--text-primary": "#2b2d42",
      "--accent": "#4361ee",
      "--border": "#e0e0e0",
      "--icon-bg": "#f0f0f0",
    },
    dark: {
      "--bg-primary": "#1a1a1a",
      "--bg-secondary": "#2d2d2d",
      "--text-primary": "#e0e0e0",
      "--accent": "#6d597a",
      "--border": "#404040",
      "--icon-bg": "#333333",
    },
  };

  useEffect(() => {
    Object.entries(themes[theme]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatConversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (!conversations[currentConversation]?.projectId) {
      setShowProjectIdModal(true);
    }
  }, [currentConversation]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentConversation]);

  const handleProjectIdSubmit = () => {
    if (!currentProjectIdInput.trim()) return;

    setConversations((prev) => {
      const updated = [...prev];
      updated[currentConversation] = {
        ...updated[currentConversation],
        projectId: currentProjectIdInput.trim(),
      };
      if (updated[currentConversation].messages.length === 0) {
        updated[currentConversation].title = currentProjectIdInput
          .trim()
          .substring(0, 30);
      }
      return updated;
    });
    setCurrentProjectIdInput("");
    setShowProjectIdModal(false);
  };

  const handleSendMessage = async () => {
    if (
      !input.trim() ||
      isLoading ||
      !conversations[currentConversation]?.projectId
    )
      return;

    const userMessage = { text: input, sender: "user" };
    setConversations((prev) => {
      const updated = [...prev];
      updated[currentConversation] = {
        ...updated[currentConversation],
        messages: [...updated[currentConversation].messages, userMessage],
      };
      return updated;
    });
    setInput("");
    setIsLoading(true);

    try {
      let fullResponse = "";
      await getGeminiResponse(
        input,
        conversations[currentConversation].projectId,
        (chunk) => {
          fullResponse += chunk;
          setConversations((prev) => {
            const updated = [...prev];
            updated[currentConversation] = {
              ...updated[currentConversation],
              messages: [
                ...updated[currentConversation].messages.filter(
                  (m) => m.sender !== "bot"
                ),
                { text: fullResponse, sender: "bot" },
              ],
            };
            return updated;
          });
        }
      );
    } catch (error) {
      setConversations((prev) => {
        const updated = [...prev];
        updated[currentConversation] = {
          ...updated[currentConversation],
          messages: [
            ...updated[currentConversation].messages,
            { text: `Error: ${error.message}`, sender: "bot", isError: true },
          ],
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    const newConv = { messages: [], title: "New Chat", projectId: "" };
    setConversations((prev) => [...prev, newConv]);
    setCurrentConversation(conversations.length);
    setShowProjectIdModal(true);
  };

  return (
    <div className="chat-container">
      {showProjectIdModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter Project ID</h3>
            <input
              type="text"
              value={currentProjectIdInput}
              onChange={(e) => setCurrentProjectIdInput(e.target.value)}
              placeholder="e.g. PRJ-2025-002"
            />
            <button onClick={handleProjectIdSubmit}>Submit</button>
          </div>
        </div>
      )}

      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="brand">
              <Brain size={24} />
              <h2>NeuroNAuts</h2>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewConversation}>
          {sidebarCollapsed ? <Plus size={20} /> : "New Chat"}
        </button>

        <div className="history-section">
          {!sidebarCollapsed && <h3>Conversations</h3>}
          <div className="history-list">
            {conversations.map((conv, i) => (
              <div
                key={i}
                className={`history-item ${
                  i === currentConversation ? "active" : ""
                }`}
                onClick={() => setCurrentConversation(i)}
              >
                {sidebarCollapsed ? `#${i + 1}` : conv.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <button
            className="theme-toggle"
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            style={{ backgroundColor: `var(--icon-bg)` }}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="messages-container">
          {conversations[currentConversation]?.messages.map((message, i) => (
            <div key={i} className={`message ${message.sender}`}>
              <div className="markdown-content">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="typing-indicator">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Analyze project risks..."
            rows={1}
          />
          <button onClick={handleSendMessage} disabled={isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
