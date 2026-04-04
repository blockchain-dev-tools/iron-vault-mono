import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', accent, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface-container rounded-xl p-5 relative overflow-hidden
        ${accent ? 'accent-bar' : ''}
        ${onClick ? 'cursor-pointer hover:bg-surface-container-high transition-colors active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
