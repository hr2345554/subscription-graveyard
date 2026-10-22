import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card p-6 
        ${hover ? 'glass-card-hover cursor-pointer' : ''} 
        ${glow ? 'glow-border' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}