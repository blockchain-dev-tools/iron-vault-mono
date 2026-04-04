import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  error?: boolean;
}

export default function SectionLabel({ children, error }: SectionLabelProps) {
  return (
    <p className={`font-label text-[10px] uppercase tracking-[0.2em] font-bold mb-3 ${error ? 'text-error' : 'text-on-surface-variant'}`}>
      {children}
    </p>
  );
}
