import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl p-5 relative overflow-hidden
        ${onClick ? 'cursor-pointer hover:bg-surface-container-high transition-colors active:scale-[0.99]' : ''}
        ${className}
      `}
      style={{ background: 'var(--c-surface-container)' }}
    >
      {children}
    </div>
  );
}
