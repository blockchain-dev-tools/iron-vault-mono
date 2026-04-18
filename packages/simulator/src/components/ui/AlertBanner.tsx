'use client';

export default function AlertBanner({ icon, children }: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-xl items-start border" style={{ background: 'var(--c-error-container)', borderColor: 'var(--c-error)' }}>
      {icon}
      {children}
    </div>
  );
}
