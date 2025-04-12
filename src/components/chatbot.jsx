import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  ChevronLeft,
  Moon,
  Sun,
  Send,
  Plus,
  ChevronRight,
  X,
  Trash2,
  Download,
} from "lucide-react";
import "./Chatbot.css";

const Chatbot = () => {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("chatConversations");
    return saved
      ? JSON.parse(saved)
      : [{ messages: [], title: "New Chat", projectId: "", reportUrl: "" }];
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
  const sendingRef = useRef(false);

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
    const currentConv = conversations[currentConversation];
    if (!currentConv?.projectId) {
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

  const fetchReportAndStore = async (projectId) => {
    try {
      const response = await fetch("/api/v1/get_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await response.json();
      setConversations((prev) => {
        const updated = [...prev];
        updated[currentConversation] = {
          ...updated[currentConversation],
          projectId,
          title: projectId.substring(0, 30),
          reportUrl: data.file_url || "",
        };
        return updated;
      });
    } catch (err) {
      alert("Failed to fetch report: " + err.message);
    }
  };

  const handleProjectIdSubmit = async () => {
    const trimmedId = currentProjectIdInput.trim();
    if (!trimmedId) return;
    await fetchReportAndStore(trimmedId);
    setCurrentProjectIdInput("");
    setShowProjectIdModal(false);
  };

  const handleSendMessage = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    const conv = conversations[currentConversation];
    if (!input.trim() || isLoading || !conv?.projectId) {
      sendingRef.current = false;
      return;
    }

    const userMessage = { text: input, sender: "user" };
    setConversations((prev) => {
      const updated = [...prev];
      updated[currentConversation].messages.push(userMessage);
      return updated;
    });

    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/get_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: conv.projectId,
          question: currentInput,
        }),
      });

      const data = await response.json();

      setConversations((prev) => {
        const updated = [...prev];
        updated[currentConversation].messages.push({
          text: data.answer || "No response received.",
          sender: "bot",
        });
        return updated;
      });
    } catch (error) {
      setConversations((prev) => {
        const updated = [...prev];
        updated[currentConversation].messages.push({
          text: `Error: ${error.message}`,
          sender: "bot",
          isError: true,
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    const newConv = {
      messages: [],
      title: "New Chat",
      projectId: "",
      reportUrl: "",
    };
    setConversations((prev) => [...prev, newConv]);
    setCurrentConversation(conversations.length);
    setShowProjectIdModal(true);
  };

  const deleteConversation = (indexToDelete) => {
    setConversations((prev) => {
      const updated = prev.filter((_, i) => i !== indexToDelete);

      if (indexToDelete === currentConversation) {
        setCurrentConversation(0);
      } else if (indexToDelete < currentConversation) {
        setCurrentConversation((prev) => prev - 1);
      }

      return updated.length > 0
        ? updated
        : [{ messages: [], title: "New Chat", projectId: "", reportUrl: "" }];
    });
  };

  const clearAllChats = () => {
    if (window.confirm("Are you sure you want to clear all chats?")) {
      setConversations([{ messages: [], title: "New Chat", projectId: "", reportUrl: "" }]);
      setCurrentConversation(0);
      localStorage.removeItem("chatConversations");
      setShowProjectIdModal(true);
    }
  };

  const exportChats = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project_chats.json";
    link.click();
    URL.revokeObjectURL(url);
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
              <h2>NeuroNauts</h2>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewConversation}>
          {sidebarCollapsed ? <Plus size={20} /> : "New Chat"}
        </button>

        {!sidebarCollapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "1rem" }}>
            <button onClick={clearAllChats} className="new-chat-btn" style={{ background: "#dc3545" }}>
              <Trash2 size={16} /> Clear All
            </button>
            <button onClick={exportChats} className="new-chat-btn" style={{ background: "#198754" }}>
              <Download size={16} /> Download Chats
            </button>
          </div>
        )}

        <div className="history-section">
          {!sidebarCollapsed && <h3>Conversations</h3>}
          <div className="history-list">
            {conversations.map((conv, i) => (
              <div
                key={i}
                className={`history-item ${i === currentConversation ? "active" : ""}`}
              >
                <div
                  className="chat-title"
                  onClick={() => setCurrentConversation(i)}
                  title={conv.title}
                >
                  {sidebarCollapsed ? `#${i + 1}` : conv.title}
                </div>
                {!sidebarCollapsed && (
                  <button
                    className="delete-chat"
                    onClick={() => deleteConversation(i)}
                  >
                    <X size={14} />
                  </button>
                )}
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

        {conversations[currentConversation]?.reportUrl && (
          <div style={{ padding: "1rem" }}>
            <a
              href={conversations[currentConversation].reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="download-report-btn"
            >
              📄 Download Report for this Project
            </a>
          </div>
        )}

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
