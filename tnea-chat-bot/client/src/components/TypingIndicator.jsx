import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="message-bubble-wrapper bot">
      <div className="avatar-badge">🤖</div>
      <div className="typing-box">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    </div>
  );
}
