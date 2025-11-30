/**
 * Glitch Text Component - Matching Chat Screen
 */
import React from 'react';
import './GlitchText.css';

const GlitchText = ({ children, className = '', style = {} }) => {
  return (
    <span className={`glitch-text ${className}`} style={style}>
      {children}
    </span>
  );
};

export default GlitchText;

