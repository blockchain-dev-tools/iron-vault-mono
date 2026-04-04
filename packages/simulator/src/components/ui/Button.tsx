'use client';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  fullWidth?: boolean;
}

const STYLES: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary font-black shadow-primary hover:brightness-110 active:scale-[0.98]',
  secondary:
    'bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high active:scale-[0.98]',
  danger:
    'bg-error-container text-on-surface active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant border border-outline hover:border-primary/50 hover:text-primary active:scale-[0.98]',
  'outline-danger':
    'bg-transparent text-error border border-error hover:bg-error/10 active:scale-[0.98]',
};

export default function Button({
  variant = 'primary',
  icon,
  fullWidth = true,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        flex items-center justify-center gap-3 py-4 px-6
        font-headline font-bold uppercase tracking-widest text-sm
        rounded-xl transition-all duration-100
        disabled:opacity-40 disabled:cursor-default disabled:transform-none
        ${fullWidth ? 'w-full' : ''}
        ${STYLES[variant]}
        ${className}
      `}
    >
      {icon && <span className="material-symbols-outlined text-xl">{icon}</span>}
      {children}
    </button>
  );
}
