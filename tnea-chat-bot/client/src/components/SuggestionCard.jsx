import React from 'react';
import { motion } from 'framer-motion';

export default function SuggestionCard({ icon, title, desc, onClick }) {
  return (
    <motion.button
      className="suggestion-card-item"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{desc}</div>
    </motion.button>
  );
}
