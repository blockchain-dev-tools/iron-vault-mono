'use client';
import { useState } from 'react';
import type { Bip39Language } from '@iron-vault/wallet';

const LANGS: { id: Bip39Language; label: string; full: string }[] = [
  { id: 'en',      label: 'EN', full: 'English' },
  { id: 'zh-Hans', label: '中', full: '中文' },
  { id: 'ja',      label: '日', full: '日本語' },
  { id: 'ko',      label: '한', full: '한국어' },
];

interface Props {
  value: Bip39Language;
  onChange: (lang: Bip39Language) => void;
}

export default function LangPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.id === value) ?? LANGS[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
        style={{
          borderColor: 'var(--c-primary)',
          color: 'var(--c-primary)',
          background: 'var(--c-primary-container)',
        }}
      >
        <span className="material-symbols-outlined text-sm">translate</span>
        {current.full}
        <span className="material-symbols-outlined text-sm">expand_more</span>
      </button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl p-6"
            style={{ background: 'var(--c-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-headline font-bold text-base mb-4" style={{ color: 'var(--c-on-surface)' }}>
              Word List Language
            </h3>
            {LANGS.map(l => (
              <button
                key={l.id}
                onClick={() => { onChange(l.id); setOpen(false); }}
                className="w-full flex items-center justify-between py-3 border-b text-sm font-body"
                style={{
                  borderColor: 'var(--c-border-variant)',
                  color: l.id === value ? 'var(--c-primary)' : 'var(--c-on-surface)',
                }}
              >
                <span>{l.full}</span>
                {l.id === value && <span className="material-symbols-outlined text-sm">check</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
