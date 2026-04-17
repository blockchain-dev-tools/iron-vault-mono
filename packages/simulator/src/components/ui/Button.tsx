'use client';
import React, { useCallback, useRef, useState } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: string;
  fullWidth?: boolean;
}

const STYLES: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary font-black hover:brightness-110',
  secondary:
    'bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high',
  danger:
    'bg-error-container text-on-surface',
  ghost:
    'bg-transparent text-on-surface-variant border border-outline hover:border-primary/50 hover:text-primary',
  'outline-danger':
    'bg-transparent text-error border border-error hover:bg-error/10',
};

export default function Button({
  variant = 'primary',
  icon,
  fullWidth = true,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const [springing, setSpringing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpringing(false);
    requestAnimationFrame(() => {
      setSpringing(true);
      timerRef.current = setTimeout(() => setSpringing(false), 350);
    });
    onClick?.(e);
  }, [disabled, onClick]);

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`
        flex items-center justify-center gap-3 py-4 px-6
        font-headline font-bold uppercase tracking-widest text-sm
        rounded-xl transition-colors duration-100
        disabled:opacity-40 disabled:cursor-default
        ${springing ? 'btn-spring' : ''}
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
