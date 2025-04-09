import { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from './GeminiClient';
import ReactMarkdown from 'react-markdown';
import { Brain, ChevronLeft, Moon, Sun, Send } from 'lucide-react';
import './Chatbot.css';

const Chatbot = ({ projects }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const themes = {
    light: {
      '--bg-primary': '#f8f9fa',
      '--bg-secondary': '#ffffff',
      '--text-primary': '#2b2d42',
      '--accent': '#4361ee',
      '--border': '#e0e0e0',
      '--icon-bg': '#f0f0f0',
    },
    dark: {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--text-primary': '#e0e0e0',
      '--accent': '#6d597a',
      '--border': '#404040',
      '--icon-bg': '#333333',
    },
  };

  useEffect(() => {
    Object.entries(themes[theme]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await getGeminiResponse(input, projects);
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        text: `Error: ${error.message}`,
        sender: 'bot',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <Brain size={24} />
            {!sidebarCollapsed && <h2>NeuroNauts</h2>}
          </div>
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="history-section">
            <h3>Recent Chats</h3>
            <div className="history-list">
              {messages.filter(m => m.sender === 'user').map((msg, i) => (
                <div key={i} className="history-item">
                  {msg.text.substring(0, 40)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="header">
          <button
            className="theme-toggle"
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            style={{ backgroundColor: `var(--icon-bg)` }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="messages-container">
          {messages.map((message, i) => (
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
          <button 
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;