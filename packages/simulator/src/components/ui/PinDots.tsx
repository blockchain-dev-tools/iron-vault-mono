export default function PinDots({ length, error }: { length: number; error?: boolean }) {
  return (
    <div className="flex justify-center gap-5 my-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
            error
              ? 'bg-error border-error'
              : i < length
              ? 'bg-primary border-primary shadow-primary-sm'
              : 'border-outline-variant'
          }`}
        />
      ))}
    </div>
  );
}
