import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ messages, loading }) {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="messages-window">
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} />
      ))}
      
      {loading && <TypingIndicator />}
      
      <div ref={scrollRef} />
    </div>
  );
}
