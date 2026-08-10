import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ChatInput({ input, setInput, onSend, disabled }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  // Adjust textarea height on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  return (
    <div className="input-glass-panel">
      <motion.form 
        className="chat-input-wrapper"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <textarea
          ref={textareaRef}
          className="textarea-field"
          placeholder="Ask about TNEA cutoff chances, colleges, comparison..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          style={{ height: '24px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="btn-send-round"
        >
          ➤
        </button>
      </motion.form>
    </div>
  );
}
