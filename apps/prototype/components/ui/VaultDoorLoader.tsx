'use client';

/**
 * VaultDoorLoader
 *
 * Animated Iron Vault door loading indicator — pure SVG + CSS keyframes.
 * Sequence: dial rotates 90° × 2 → bolts retract → door face fades → glow rings expand → repeats.
 *
 * Props:
 *   color  — stroke color (default: #8FC322 lime green)
 *   size   — width in px; height is auto-scaled to maintain 200:260 aspect ratio (default: 120)
 */

const KEYFRAMES = `
@keyframes vdl-dial {
  0%        { transform: rotate(0deg); }
  10%       { transform: rotate(90deg); }
  16%       { transform: rotate(90deg); }
  26%       { transform: rotate(180deg); }
  34%, 100% { transform: rotate(180deg); }
}
@keyframes vdl-bolt-lr {
  0%, 25%   { transform: scaleX(1); }
  35%, 82%  { transform: scaleX(0); }
  92%, 100% { transform: scaleX(1); }
}
@keyframes vdl-door-open {
  0%, 32%  { opacity: 1; transform: scale(1);    }
  42%, 68% { opacity: 0; transform: scale(0.82); }
  78%, 100%{ opacity: 1; transform: scale(1);    }
}
@keyframes vdl-glow-ring {
  0%, 38%  { opacity: 0;   transform: scale(0.1); }
  42%      { opacity: 0.9; transform: scale(0.1); }
  68%      { opacity: 0;   transform: scale(1.5); }
  100%     { opacity: 0;   transform: scale(0.1); }
}
@keyframes vdl-hub-pulse {
  0%, 100% { opacity: 0.45; transform: scale(0.92); }
  50%      { opacity: 1;    transform: scale(1.08); }
}
`;

interface VaultDoorLoaderProps {
  color?: string;
  size?: number;
}

export function VaultDoorLoader({
  color = '#8FC322',
  size = 120,
}: VaultDoorLoaderProps) {
  const W = size;
  const H = Math.round(size * 1.3); // 200:260 = 1:1.3

  // SVG coordinate system is always 200×260
  const cx = 100;
  const cy = 120;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <svg
        width={W}
        height={H}
        viewBox="0 0 200 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="vdl-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Layer 1: Static door frame (never moves) ── */}
        <rect x="8" y="8" width="184" height="244" rx="10"
          stroke={color} strokeWidth="2" opacity="0.9" />
        <rect x="16" y="16" width="168" height="228" rx="7"
          stroke={color} strokeWidth="0.8" opacity="0.3" />
        {/* Hinge */}
        <line x1="10" y1="62"  x2="10" y2="90"  stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
        <line x1="10" y1="170" x2="10" y2="198" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.45" />

        {/* ── Layer 2: Glow rings (appear when door opens) ── */}
        {([0, 0.55, 1.1] as number[]).map((delay, i) => (
          <circle key={i} cx={cx} cy={cy} r="40"
            stroke={color} strokeWidth={i === 0 ? 2.5 : 1.5}
            filter="url(#vdl-glow)"
            style={{
              animation: 'vdl-glow-ring 7s ease-out infinite',
              animationDelay: `${delay}s`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        ))}

        {/* ── Layer 3: Door face (fades + shrinks on unlock) ── */}
        <g style={{ animation: 'vdl-door-open 7s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` }}>
          {/* Left bolt */}
          <rect x="0" y="118" width="20" height="24" rx="3"
            stroke={color} strokeWidth="1.5"
            style={{ transformBox: 'fill-box', transformOrigin: 'right center', animation: 'vdl-bolt-lr 7s ease-in-out infinite' }} />
          {/* Right bolt */}
          <rect x="180" y="118" width="20" height="24" rx="3"
            stroke={color} strokeWidth="1.5"
            style={{ transformBox: 'fill-box', transformOrigin: 'left center', animation: 'vdl-bolt-lr 7s ease-in-out infinite' }} />

          {/* Dial track ring */}
          <circle cx={cx} cy={cy} r="62" stroke={color} strokeWidth="2" opacity="0.55" />

          {/* Rotating dial face */}
          <g style={{ animation: 'vdl-dial 7s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` }}>
            <line x1="100" y1="80"  x2="100" y2="60"  stroke={color} strokeWidth="3"   strokeLinecap="round" />
            <line x1="100" y1="162" x2="100" y2="178" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="162" y1="120" x2="178" y2="120" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="38"  y1="120" x2="22"  y2="120" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </g>

          {/* Center hub */}
          <circle cx={cx} cy={cy} r="14" stroke={color} strokeWidth="2"
            style={{ animation: 'vdl-hub-pulse 2s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` }} />
          <circle cx={cx} cy={cy} r="7"  stroke="#D8FF55" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="2"  fill={color} />
        </g>
      </svg>
    </>
  );
}

export default VaultDoorLoader;
