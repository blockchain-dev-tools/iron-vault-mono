'use client';
import { useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function PassphraseBox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs font-label uppercase tracking-widest"
        style={{ color: 'var(--c-on-surface-variant)' }}
      >
        <span className="material-symbols-outlined text-sm">{open ? 'expand_less' : 'expand_more'}</span>
        Optional Passphrase (25th word)
      </button>
      {open && (
        <div className="mt-2 relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter passphrase (optional)"
            className="w-full p-3 pr-10 rounded-xl border text-sm font-mono outline-none transition-colors"
            style={{
              background: 'var(--c-surface-container)',
              borderColor: 'var(--c-outline)',
              color: 'var(--c-on-surface)',
            }}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={{ color: 'var(--c-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-sm">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
