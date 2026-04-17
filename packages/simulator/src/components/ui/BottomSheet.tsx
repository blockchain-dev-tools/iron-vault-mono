'use client';
import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 250);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 flex items-end z-50 ${closing ? 'overlay-exit' : 'overlay-enter'}`}
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`w-full rounded-t-2xl p-6 max-h-[80%] overflow-y-auto ${closing ? 'sheet-exit' : 'sheet-enter'}`}
        style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-outline-variant)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
