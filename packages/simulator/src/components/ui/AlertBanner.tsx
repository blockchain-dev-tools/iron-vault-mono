'use client';

export default function AlertBanner({ icon, children }: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl items-start">
      {icon}
      {children}
    </div>
  );
}
