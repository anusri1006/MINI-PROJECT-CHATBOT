import React from 'react';
import { motion } from 'framer-motion';
import SuggestionCard from './SuggestionCard';

export default function EmptyState({ onSelectSuggestion, onStartPrediction }) {
  const suggestions = [
    {
      icon: '🎯',
      title: 'Predict my colleges',
      desc: 'Enter your cutoff and branch preference to find options',
      query: 'My cutoff is 192, I am BC and I want CSE.'
    },
    {
      icon: '🏫',
      title: 'Find CSE colleges',
      desc: 'See which colleges had what CSE cutoffs last year',
      query: 'Which colleges offer CSE and what are their cutoffs for MBC?'
    },
    {
      icon: '⚖️',
      title: 'Compare two colleges',
      desc: 'Compare placement, cutoffs, and reputation',
      query: 'Compare GCT (Government College of Technology) and CIT (Coimbatore Institute of Technology).'
    },
    {
      icon: '📊',
      title: 'What branches can I get?',
      desc: 'Explore available branches matching your score',
      query: 'My cutoff is 185, I am SC. What engineering branches can I get in Chennai?'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="empty-state-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-state-badge">
        <span>🇮🇳</span> TNEA Counselling Portal AI Assistant
      </div>
      
      <h2 className="empty-state-title">TNEA Counselling AI</h2>
      
      <p className="empty-state-desc">
        Your intelligent assistant for TNEA college predictions. Enter your cutoff, community, and preferred branch, and I'll help you explore suitable colleges using TNEA cutoff data.
      </p>

      <button className="btn-start-prediction" onClick={onStartPrediction}>
        Start Prediction
      </button>

      <div className="suggestions-header">Quick Start Suggestions</div>

      <motion.div 
        className="suggestions-layout"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {suggestions.map((item, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <SuggestionCard
              icon={item.icon}
              title={item.title}
              desc={item.desc}
              onClick={() => onSelectSuggestion(item.query)}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
