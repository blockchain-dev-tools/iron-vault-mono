'use client';
import { useRef, useState, useEffect } from 'react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

export default function Dropdown<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-4 py-3.5 bg-surface-container rounded-xl border-[1.5px] border-outline-variant hover:border-primary/40 transition-colors"
      >
        <span className="font-body text-on-surface text-sm">{selected?.label ?? ''}</span>
        <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${open ? 'rotate-90' : ''}`}>chevron_right</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface rounded-xl border border-outline-variant shadow-lg overflow-hidden">
          {options.map((opt, i) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex justify-between items-center px-5 py-4 text-left transition-colors
                  ${i < options.length - 1 ? 'border-b border-outline-variant/60' : ''}
                  ${active ? 'text-primary bg-primary/5' : 'text-on-surface hover:bg-surface-container'}
                `}
              >
                <span className={`font-body text-base ${active ? 'font-bold' : ''}`}>{opt.label}</span>
                {active && <span className="material-symbols-outlined text-primary text-lg">check</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
