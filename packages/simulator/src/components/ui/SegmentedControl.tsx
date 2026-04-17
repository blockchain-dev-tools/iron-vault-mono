'use client';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-3.5 rounded-xl border-[1.5px] font-headline font-bold text-sm transition-all active:scale-[0.98]
              ${active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent bg-surface-container text-on-surface hover:border-primary/40'
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
