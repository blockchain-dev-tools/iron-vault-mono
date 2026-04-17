'use client';
import React from 'react';
import { useApp } from '../lib/app-context';

interface PhoneFrameProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function PhoneFrame({ children, style, className }: PhoneFrameProps) {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';
  return (
    <div
      className={`h-full relative overflow-hidden ${isLight ? 'light-theme' : ''} ${className ?? ''}`}
      style={style}
    >
      {children}
    </div>
  );
}
