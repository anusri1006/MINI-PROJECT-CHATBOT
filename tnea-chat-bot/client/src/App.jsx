import React, { useState } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Send message callback
  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Add user message to state
    const userMessage = {
      sender: 'user',
      text: text.trim()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Prepare request body matching Step 2 specification
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          conversation: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Server connection error');
      }

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || 'Placeholder reply from server.'
        }
      ]);
    } catch (err) {
      console.error('API Error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I couldn't connect to the TNEA AI service right now. Please try again.",
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleStartPrediction = () => {
    handleSendMessage('Help me predict my engineering colleges based on TNEA 2025 cutoff data.');
  };

  // Generate background particles dynamically
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const left = `${Math.floor(Math.random() * 90) + 5}%`;
    const size = `${Math.floor(Math.random() * 6) + 4}px`;
    const delay = `${Math.random() * 10}s`;
    const duration = `${Math.floor(Math.random() * 10) + 12}s`;
    return (
      <div 
        key={i} 
        className="particle" 
        style={{ left, width: size, height: size, animationDelay: delay, animationDuration: duration }} 
      />
    );
  });

  return (
    <div className="app-container">
      {/* Background visual components */}
      <div className="background-chakra" />
      <div className="particles-container">
        {particles}
      </div>

      {/* Main Header */}
      <Header onNewChat={handleNewChat} />

      {/* Chat Area */}
      <div className="chat-container">
        {messages.length > 0 ? (
          <ChatWindow messages={messages} loading={loading} />
        ) : (
          <EmptyState 
            onSelectSuggestion={handleSendMessage} 
            onStartPrediction={handleStartPrediction}
          />
        )}

        {/* Floating Bottom Input Area */}
        <ChatInput 
          input={input} 
          setInput={setInput} 
          onSend={handleSendMessage} 
          disabled={loading} 
        />
      </div>
    </div>
  );
}
