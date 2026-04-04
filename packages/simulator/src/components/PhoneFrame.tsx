'use client';
import React from 'react';
import { useApp } from '../lib/app-context';

interface PhoneFrameProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function PhoneFrame({ children, style, className }: PhoneFrameProps) {
  const { appLight } = useApp();
  return (
    <div
      className={`relative overflow-hidden ${appLight ? 'light-theme' : ''} ${className ?? ''}`}
      style={{ transform: 'translateZ(0)', ...style }}
    >
      {children}
    </div>
  );
}
