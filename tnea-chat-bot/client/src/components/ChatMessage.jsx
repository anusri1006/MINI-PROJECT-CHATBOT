import React from 'react';
import { motion } from 'framer-motion';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const isError = message.isError;

  // Simple Markdown parser for Bold, Lists, and Tables
  const renderParsedMessage = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    let listItems = [];
    
    let inTable = false;
    let tableRows = [];

    // Helper to render bold text inside a line
    const parseInline = (lineText) => {
      const parts = lineText.split(/\*\*([\s\S]*?)\*\*/g);
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index}>{part}</strong>;
        }
        return part;
      });
    };

    // Helper to flush current lists or tables to elements
    const flushAll = (key) => {
      if (inUnorderedList && listItems.length > 0) {
        elements.push(<ul key={`ul-${key}`}>{listItems}</ul>);
        listItems = [];
        inUnorderedList = false;
      }
      if (inOrderedList && listItems.length > 0) {
        elements.push(<ol key={`ol-${key}`}>{listItems}</ol>);
        listItems = [];
        inOrderedList = false;
      }
      if (inTable && tableRows.length > 0) {
        // Parse table rows, skipping separator lines
        const cleanRows = tableRows.filter(r => !r.match(/^[\s|:-]+$/));
        if (cleanRows.length > 0) {
          const parsedRows = cleanRows.map(row => {
            let cols = row.split('|').map(c => c.trim());
            if (cols[0] === '') cols.shift();
            if (cols[cols.length - 1] === '') cols.pop();
            return cols;
          });

          if (parsedRows.length > 0) {
            const headers = parsedRows[0];
            const bodyRows = parsedRows.slice(1);
            elements.push(
              <div key={`table-container-${key}`} className="table-responsive-container">
                <table className="prediction-table">
                  <thead>
                    <tr>
                      {headers.map((h, idx) => (
                        <th key={`th-${idx}`}>{parseInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rowIdx) => (
                      <tr key={`tr-${rowIdx}`}>
                        {row.map((cell, cellIdx) => {
                          const cellStr = String(cell);
                          const isPredictionVal = cellStr === 'Strong Chance' || cellStr === 'Possible' || cellStr === 'Reach' || cellStr === 'Unlikely';
                          return (
                            <td key={`td-${cellIdx}`}>
                              {isPredictionVal ? (
                                <span className={`prediction-badge ${cellStr.toLowerCase().replace(' ', '-')}`}>
                                  {cell}
                                </span>
                              ) : (
                                parseInline(cell)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = line.includes('|');
      const bulletMatch = line.match(/^[\s]*[-*][\s]+(.*)/);
      const numberMatch = line.match(/^[\s]*[\d]+\.[\s]+(.*)/);

      if (isTableLine) {
        if (inUnorderedList || inOrderedList) flushAll(i);
        inTable = true;
        tableRows.push(line);
      } else if (bulletMatch) {
        if (inOrderedList || inTable) flushAll(i);
        inUnorderedList = true;
        listItems.push(<li key={`li-${i}`}>{parseInline(bulletMatch[1])}</li>);
      } else if (numberMatch) {
        if (inUnorderedList || inTable) flushAll(i);
        inOrderedList = true;
        listItems.push(<li key={`li-${i}`}>{parseInline(numberMatch[1])}</li>);
      } else {
        flushAll(i);
        if (line.trim() === '') {
          elements.push(<div key={`br-${i}`} style={{ height: '0.6em' }} />);
        } else {
          elements.push(<p key={`p-${i}`}>{parseInline(line)}</p>);
        }
      }
    }
    
    flushAll(lines.length);
    return elements;
  };

  return (
    <motion.div
      className={`message-bubble-wrapper ${isUser ? 'user' : 'bot'} ${isError ? 'error' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {!isUser && (
        <div className="avatar-badge">
          🤖
        </div>
      )}
      
      <div className="message-box">
        {renderParsedMessage(message.text)}
      </div>

      {isUser && (
        <div className="avatar-badge">
          👤
        </div>
      )}
    </motion.div>
  );
}
