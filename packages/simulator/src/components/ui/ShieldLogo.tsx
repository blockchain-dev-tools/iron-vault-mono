'use client';

export default function ShieldLogo() {
  return (
    <svg width="88" height="100" viewBox="0 0 80 92" fill="none">
      <path
        fillRule="evenodd"
        d="M40 0L80 18V52C80 72 60 88 40 92C20 88 0 72 0 52V18L40 0Z M32 32H48Q52 32 52 36V52Q52 56 48 56H32Q28 56 28 52V36Q28 32 32 32Z M33 32Q33 24 40 24Q47 24 47 32Z M36 32Q36 27 40 27Q44 27 44 32Z"
        fill="var(--c-primary)"
      />
      <circle cx="40" cy="42" r="3" fill="var(--c-primary)" />
      <rect x="39" y="44" width="2" height="6" rx="1" fill="var(--c-primary)" />
    </svg>
  );
}
