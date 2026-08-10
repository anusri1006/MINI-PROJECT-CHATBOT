import React from 'react';
import { motion } from 'framer-motion';

export default function Header({ onNewChat }) {
  return (
    <motion.header 
      className="header-glass"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-brand">
        <h1 className="brand-title">
          <span>🇮🇳</span> TNEA AI
        </h1>
        <span className="brand-subtitle">Counselling Assistant</span>
      </div>
      
      <button className="btn-new-chat-top" onClick={onNewChat}>
        <span>+</span> New Chat
      </button>
    </motion.header>
  );
}
