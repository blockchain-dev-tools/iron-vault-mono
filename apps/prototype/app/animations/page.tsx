'use client';
import { useState, useEffect, useRef, ReactNode } from 'react';

/* ── animation wrapper ── */
function AnimCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
      <div className="w-20 h-20 flex items-center justify-center">{children}</div>
      <div className="text-center">
        <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">{title}</p>
        <p className="font-body text-[11px] text-on-surface-variant mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── lottie card ── */
function LottieCard({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // @ts-ignore - lottie-player is a web component
    ref.current.innerHTML = `<lottie-player src="${src}" background="transparent" speed="1" style="width:80px;height:80px" loop autoplay></lottie-player>`;
  }, [src]);

  return (
    <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
      <div ref={ref} className="w-20 h-20 flex items-center justify-center" />
      <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface text-center">{title}</p>
      <p className="font-mono text-[9px] text-on-surface-variant break-all max-w-full leading-relaxed">{src.length > 60 ? src.slice(0, 60) + '...' : src}</p>
    </div>
  );
}

/* ── keyframes ── */
const KEYFRAMES = `
  @keyframes anim-spin { to { transform: rotate(360deg); } }
  @keyframes anim-spin-ccw { to { transform: rotate(-360deg); } }
  @keyframes anim-pulse-ring {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  @keyframes anim-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-12px); }
  }
  @keyframes anim-wave {
    0%, 40%, 100% { transform: scaleY(0.4); }
    20% { transform: scaleY(1); }
  }
  @keyframes anim-draw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes anim-chase {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes anim-chase-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.6); }
  }
  @keyframes anim-flip {
    0% { transform: perspective(120px) rotateX(0deg) rotateY(0deg); }
    50% { transform: perspective(120px) rotateX(-180deg) rotateY(0deg); }
    100% { transform: perspective(120px) rotateX(-180deg) rotateY(-180deg); }
  }
  @keyframes anim-breathe {
    0%, 100% { transform: scale(0.6); opacity: 0.4; }
    50% { transform: scale(1); opacity: 1; }
  }
  @keyframes anim-cube-pulse {
    0%, 70%, 100% { transform: scale3D(1, 1, 1); }
    35% { transform: scale3D(0, 0, 1); }
  }
  @keyframes anim-rotate-plane {
    0% { transform: perspective(120px) rotateX(0deg) rotateY(0deg); }
    50% { transform: perspective(120px) rotateX(-180deg) rotateY(0deg); }
    100% { transform: perspective(120px) rotateX(-180deg) rotateY(-180deg); }
  }
  @keyframes anim-dot-elastic {
    0% { transform: scale(1); }
    50% { transform: scale(1, 1.5); }
    100% { transform: scale(1); }
  }
  @keyframes anim-ring-expand {
    0% { transform: rotate(0deg); stroke-dashoffset: 187; }
    50% { stroke-dashoffset: 46.75; }
    100% { transform: rotate(360deg); stroke-dashoffset: 187; }
  }
  @keyframes anim-orbit-dot {
    0% { transform: rotate(0deg) translateX(16px) scale(1); opacity: 1; }
    50% { transform: rotate(180deg) translateX(16px) scale(0.5); opacity: 0.4; }
    100% { transform: rotate(360deg) translateX(16px) scale(1); opacity: 1; }
  }
  @keyframes anim-helix {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
  }

  /* ── vault door opening sequence ── */
  @keyframes vault-door-dial {
    0%        { transform: rotate(0deg); }
    10%       { transform: rotate(90deg); }
    16%       { transform: rotate(90deg); }
    26%       { transform: rotate(180deg); }
    34%, 100% { transform: rotate(180deg); }
  }
  @keyframes vault-bolt-tb {
    0%, 25%  { transform: scaleY(1); }
    35%, 82% { transform: scaleY(0); }
    92%, 100%{ transform: scaleY(1); }
  }
  @keyframes vault-bolt-lr {
    0%, 25%  { transform: scaleX(1); }
    35%, 82% { transform: scaleX(0); }
    92%, 100%{ transform: scaleX(1); }
  }
  @keyframes vault-door-swing {
    0%, 35% { transform: rotateY(0deg); }
    37%     { transform: rotateY(-4deg); }
    42%     { transform: rotateY(-22deg); }
    49%, 68%{ transform: rotateY(-74deg); }
    72%     { transform: rotateY(-60deg); }
    77%     { transform: rotateY(-24deg); }
    81%     { transform: rotateY(-3deg); }
    83%, 100%{ transform: rotateY(0deg); }
  }
  @keyframes vault-interior-reveal {
    0%, 46% { opacity: 0; transform: scale(0.7); }
    56%, 64%{ opacity: 1; transform: scale(1); }
    72%, 100%{ opacity: 0; transform: scale(0.8); }
  }
  @keyframes vault-iris-open {
    0%, 32%  { opacity: 0; transform: scale(0.3); }
    44%, 66% { opacity: 1; transform: scale(1);   }
    76%, 100%{ opacity: 0; transform: scale(0.3); }
  }
  @keyframes vault-glow-ring {
    0%, 38%  { opacity: 0;   transform: scale(0.1); }
    42%      { opacity: 0.9; transform: scale(0.1); }
    68%      { opacity: 0;   transform: scale(1.5); }
    100%     { opacity: 0;   transform: scale(0.1); }
  }
  @keyframes vault-door-open {
    0%, 32%  { opacity: 1; transform: scale(1); }
    42%, 68% { opacity: 0; transform: scale(0.82); }
    78%, 100%{ opacity: 1; transform: scale(1); }
  }
  @keyframes vault-glow-halo {
    0%, 46% { opacity: 0; r: 40; }
    55%, 62%{ opacity: 0.6; r: 80; }
    72%, 100%{ opacity: 0; r: 40; }
  }

  /* ── brand vault animations ── */
  @keyframes vault-combo {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(110deg); }
    26% { transform: rotate(110deg); }
    46% { transform: rotate(-55deg); }
    52% { transform: rotate(-55deg); }
    72% { transform: rotate(170deg); }
    78% { transform: rotate(170deg); }
    96% { transform: rotate(360deg); }
  }
  @keyframes vault-center-glow {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px currentColor); }
    50% { transform: scale(1.12); filter: drop-shadow(0 0 12px currentColor) drop-shadow(0 0 24px currentColor); }
  }
  @keyframes vault-sq-build {
    0% { stroke-dashoffset: 1120; opacity: 0; }
    2% { opacity: 1; }
    22% { stroke-dashoffset: 0; }
    78% { stroke-dashoffset: 0; opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes vault-circ-build {
    0%, 14% { stroke-dashoffset: 628; opacity: 0; }
    16% { opacity: 1; }
    38% { stroke-dashoffset: 0; }
    78% { stroke-dashoffset: 0; opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes vault-line-build {
    0%, 28% { opacity: 0; }
    48% { opacity: 1; }
    78% { opacity: 1; }
    94%, 100% { opacity: 0; }
  }
  @keyframes vault-core-build {
    0%, 42% { transform: scale(0); opacity: 0; }
    58% { transform: scale(1.15); opacity: 1; }
    64% { transform: scale(1); }
    78% { opacity: 1; }
    94%, 100% { opacity: 0; transform: scale(1); }
  }
  @keyframes vault-core-glow-build {
    0%, 56% { opacity: 0; transform: scale(0.5); }
    68% { opacity: 0.8; transform: scale(1); }
    74% { opacity: 0.4; transform: scale(1.3); }
    78% { opacity: 0.7; transform: scale(1); }
    86% { opacity: 0.7; }
    94%, 100% { opacity: 0; }
  }
  @keyframes vault-ring-arc {
    0% { stroke-dashoffset: 628; transform: rotate(0deg); }
    50% { stroke-dashoffset: 157; }
    100% { stroke-dashoffset: 628; transform: rotate(360deg); }
  }
  @keyframes vault-line-scan {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.6; }
  }
  @keyframes vault-core-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.92); }
    50%       { opacity: 1;   transform: scale(1.08); }
  }
  @keyframes vault-ring-pulse {
    0%, 100% { opacity: 0; transform: scale(1); }
    30% { opacity: 0.5; }
    100% { opacity: 0; transform: scale(2.2); }
  }

  /* ── extended animations ── */
  @keyframes anim-pendulum {
    0%, 100% { transform: rotate(-26deg); }
    50% { transform: rotate(26deg); }
  }
  @keyframes anim-hourglass-spin {
    0%, 38% { transform: rotate(0deg); }
    48%, 88% { transform: rotate(180deg); }
    98%, 100% { transform: rotate(360deg); }
  }
  @keyframes anim-morph-shape {
    0%, 100% { border-radius: 4px; transform: rotate(0deg); }
    50% { border-radius: 50%; transform: rotate(45deg); }
  }
  @keyframes anim-h-bar {
    0%, 100% { transform: scaleX(0); }
    50% { transform: scaleX(1); }
  }
  @keyframes anim-ekg {
    0% { stroke-dashoffset: 130; opacity: 1; }
    80% { stroke-dashoffset: 0; opacity: 1; }
    95%, 100% { stroke-dashoffset: 0; opacity: 0; }
  }
  @keyframes anim-water-wave {
    from { transform: translateX(0); }
    to { transform: translateX(28px); }
  }
  @keyframes anim-signal {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 1; }
  }
  @keyframes anim-jaw-upper {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-18deg); }
  }
  @keyframes anim-jaw-lower {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(18deg); }
  }
  @keyframes anim-dot-wave {
    0%, 100% { transform: scale(0.35); opacity: 0.25; }
    50% { transform: scale(1); opacity: 1; }
  }
  @keyframes anim-tri-fade {
    0%, 100% { opacity: 1; }
    33% { opacity: 0.2; }
  }
`;

/* ── default lottie URLs (free public animations) ── */
const DEFAULT_LOTTIE_URLS = [
  { title: 'Material Loader', src: 'https://assets2.lottiefiles.com/packages/lf20_p8bfn5to.json' },
  { title: 'Gear Loading', src: 'https://assets5.lottiefiles.com/packages/lf20_xyadoh9h.json' },
  { title: 'Circle Pulse', src: 'https://assets9.lottiefiles.com/packages/lf20_a2chheio.json' },
  { title: 'Dot Loading', src: 'https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json' },
];

export default function AnimationsPage() {
  const [light, setLight] = useState(false);
  const [lottieUrl, setLottieUrl] = useState('');
  const [customLotties, setCustomLotties] = useState<{ title: string; src: string }[]>([]);
  const [scriptReady, setScriptReady] = useState(false);

  /* Load lottie-player web component */
  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('lottie-player')) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@lottiefiles/lottie-player@2.0.8/dist/lottie-player.js';
      s.onload = () => setScriptReady(true);
      document.head.appendChild(s);
    } else {
      setScriptReady(true);
    }
  }, []);

  const addLottie = () => {
    if (!lottieUrl.trim()) return;
    setCustomLotties(prev => [...prev, { title: `Custom #${prev.length + 1}`, src: lottieUrl.trim() }]);
    setLottieUrl('');
  };

  const primary = light ? '#5f8a0e' : '#8FC322';
  const muted = light ? '#99aa77' : '#5a7a14';
  const onSurface = light ? '#0A0A0A' : '#FFFFFF';

  return (
    <div className={`min-h-screen bg-background text-on-surface font-body pb-24 ${light ? 'light-theme' : ''}`}>
      <style>{KEYFRAMES}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-outline/30 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>animation</span>
          <h1 className="font-headline font-bold text-lg uppercase tracking-tight">Loading Animations</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLight(l => !l)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-label uppercase tracking-wider"
            style={light
              ? { borderColor: 'rgba(95,138,14,0.4)', background: 'rgba(95,138,14,0.08)', color: '#5f8a0e' }
              : { borderColor: 'rgba(143,195,34,0.3)', background: 'rgba(143,195,34,0.06)', color: '#8FC322' }}
          >
            <span className="material-symbols-outlined text-sm">{light ? 'light_mode' : 'dark_mode'}</span>
            {light ? 'Light' : 'Dark'}
          </button>
          <a href="/showcase" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Design →</a>
          <a href="/" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">← App</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-16">

        {/* ─── Brand Loading — Iron Vault ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">Brand Loading</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            Iron Vault dial logo — 4 animation variants. All derived from the same SVG structure.
          </p>

          {/* ── Vault Door Opening — full-width hero ── */}
          <div className="bg-surface-container rounded-xl border border-primary/30 p-8 flex flex-col items-center gap-6 mb-5">
            <div style={{ position: 'relative', width: 200, height: 260 }}>

              {/* ─ Single SVG — frame static, door face fades, interior revealed ─ */}
              <svg width="200" height="260" viewBox="0 0 200 260" style={{ display: 'block' }}>

                {/* ══ Layer 1: Static outer frame (always visible) ══ */}
                <rect x="8" y="8" width="184" height="244" rx="10"
                  fill="none" stroke={primary} strokeWidth="2" opacity="0.9" />
                <rect x="16" y="16" width="168" height="228" rx="7"
                  fill="none" stroke={primary} strokeWidth="0.8" opacity="0.3" />
                {/* Hinge lines */}
                <line x1="10" y1="62"  x2="10" y2="90"  stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
                <line x1="10" y1="170" x2="10" y2="198" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.45" />

                {/* ══ Layer 2: Glow rings (expand outward when door fades) ══ */}
                <defs>
                  <filter id="ring-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {[0, 0.55, 1.1].map((delay, i) => (
                  <circle key={i} cx="100" cy="120" r="40" fill="none"
                    stroke={primary} strokeWidth={i === 0 ? 2.5 : 1.5}
                    filter="url(#ring-glow)"
                    style={{
                      animation: 'vault-glow-ring 7s ease-out infinite',
                      animationDelay: `${delay}s`,
                      transformOrigin: '100px 120px',
                    }} />
                ))}

                {/* ══ Layer 3: Door face (fades out + shrinks to "open") ══ */}
                <g style={{ animation: 'vault-door-open 7s ease-in-out infinite', transformOrigin: '100px 120px' }}>
                  {/* Bolts */}
                  <rect x="0" y="118" width="20" height="24" rx="3"
                    fill="none" stroke={primary} strokeWidth="1.5"
                    style={{ transformBox: 'fill-box', transformOrigin: 'right center', animation: 'vault-bolt-lr 7s ease-in-out infinite' }} />
                  <rect x="180" y="118" width="20" height="24" rx="3"
                    fill="none" stroke={primary} strokeWidth="1.5"
                    style={{ transformBox: 'fill-box', transformOrigin: 'left center', animation: 'vault-bolt-lr 7s ease-in-out infinite' }} />

                  {/* Dial ring */}
                  <circle cx="100" cy="120" r="62" fill="none" stroke={primary} strokeWidth="2" opacity="0.55" />

                  {/* Rotating dial */}
                  <g style={{ animation: 'vault-door-dial 7s ease-in-out infinite', transformOrigin: '100px 120px' }}>
                    <line x1="100" y1="80"  x2="100" y2="60"  stroke={primary} strokeWidth="3"   strokeLinecap="round" />
                    <line x1="100" y1="162" x2="100" y2="178" stroke={primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <line x1="162" y1="120" x2="178" y2="120" stroke={primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <line x1="38"  y1="120" x2="22"  y2="120" stroke={primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </g>

                  {/* Center hub */}
                  <circle cx="100" cy="120" r="14" fill="none" stroke={primary} strokeWidth="2"
                    style={{ animation: 'vault-core-pulse 2s ease-in-out infinite', transformOrigin: '100px 120px' }} />
                  <circle cx="100" cy="120" r="7"  fill="none" stroke="#D8FF55" strokeWidth="1.5" />
                  <circle cx="100" cy="120" r="2"  fill={primary} />
                </g>

              </svg>
            </div>

            <div className="text-center">
              <p className="font-label text-sm font-bold uppercase tracking-wider text-on-surface mb-1">Vault Door Opening</p>
              <p className="font-body text-sm text-on-surface-variant">
                拨盘输入密码 → 闩锁收回 → 门从铰链缓缓打开 → 亮出内部光芯
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">

            {/* ① Vault Spin — ring + lines rotate, center breathes */}
            <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
              <svg width="120" height="120" viewBox="0 0 400 400">
                {/* static square frame */}
                <rect x="60" y="60" width="280" height="280" fill="none" stroke={primary} strokeWidth="8" opacity="0.2" />
                {/* rotating dial group */}
                <g style={{ animation: 'anim-spin 3s linear infinite', transformOrigin: '200px 200px' }}>
                  <circle cx="200" cy="200" r="100" fill="none" stroke={primary} strokeWidth="8" />
                  <line x1="200" y1="178" x2="200" y2="102" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="200" y1="222" x2="200" y2="298" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="178" y1="200" x2="102" y2="200" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="222" y1="200" x2="298" y2="200" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="215.6" y1="184.4" x2="258" y2="142" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="184.4" y1="184.4" x2="142" y2="142" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="184.4" y1="215.6" x2="142" y2="258" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="215.6" y1="215.6" x2="258" y2="258" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                </g>
                {/* pulsing center hub */}
                <circle cx="200" cy="200" r="22" fill={primary}
                  style={{ color: primary, animation: 'vault-center-glow 2s ease-in-out infinite', transformOrigin: '200px 200px' }} />
              </svg>
              <div className="text-center">
                <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">Vault Spin</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-1">Ring + lines rotate • center glows • square stays static</p>
              </div>
            </div>

            {/* ② Combination Lock — CW → CCW → CW oscillation */}
            <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
              <svg width="120" height="120" viewBox="0 0 400 400">
                <rect x="60" y="60" width="280" height="280" fill="none" stroke={primary} strokeWidth="8" opacity="0.2" />
                {/* 12-o'clock indicator tick (stays static) */}
                <rect x="196" y="62" width="8" height="30" fill={primary} opacity="0.5" rx="2" />
                {/* combination dial */}
                <g style={{ animation: 'vault-combo 4.5s cubic-bezier(0.4,0,0.6,1) infinite', transformOrigin: '200px 200px' }}>
                  <circle cx="200" cy="200" r="100" fill="none" stroke={primary} strokeWidth="8" />
                  <line x1="200" y1="178" x2="200" y2="102" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="200" y1="222" x2="200" y2="298" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="178" y1="200" x2="102" y2="200" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="222" y1="200" x2="298" y2="200" stroke={primary} strokeWidth="8" strokeLinecap="round" />
                  <line x1="215.6" y1="184.4" x2="258" y2="142" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="184.4" y1="184.4" x2="142" y2="142" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="184.4" y1="215.6" x2="142" y2="258" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                  <line x1="215.6" y1="215.6" x2="258" y2="258" stroke={primary} strokeWidth="5" strokeLinecap="round" />
                </g>
                <circle cx="200" cy="200" r="22" fill={primary}
                  style={{ color: primary, animation: 'vault-center-glow 4.5s ease-in-out infinite', transformOrigin: '200px 200px' }} />
              </svg>
              <div className="text-center">
                <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">Combination Lock</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-1">CW → pause → CCW → pause — mimics real safe dial</p>
              </div>
            </div>

            {/* ③ Stroke Reveal — elements draw themselves in sequence */}
            <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
              <svg width="120" height="120" viewBox="0 0 400 400">
                {/* square: perimeter = 4×280 = 1120 */}
                <rect x="60" y="60" width="280" height="280" fill="none" stroke={primary} strokeWidth="8"
                  strokeDasharray="1120" style={{ animation: 'vault-sq-build 5s ease-in-out infinite' }} />
                {/* circle: circumference ≈ 628 */}
                <circle cx="200" cy="200" r="100" fill="none" stroke={primary} strokeWidth="8"
                  strokeDasharray="628" style={{ animation: 'vault-circ-build 5s ease-in-out infinite' }}
                  transform="rotate(-90 200 200)" />
                {/* main lines */}
                {[
                  [200,178,200,102], [200,222,200,298],
                  [178,200,102,200], [222,200,298,200],
                ].map(([x1,y1,x2,y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={primary} strokeWidth="8" strokeLinecap="round"
                    style={{ animation: 'vault-line-build 5s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
                ))}
                {/* diagonal lines */}
                {[
                  [215.6,184.4,258,142], [184.4,184.4,142,142],
                  [184.4,215.6,142,258], [215.6,215.6,258,258],
                ].map(([x1,y1,x2,y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={primary} strokeWidth="5" strokeLinecap="round"
                    style={{ animation: 'vault-line-build 5s ease-in-out infinite', animationDelay: `${0.48 + i * 0.1}s` }} />
                ))}
                {/* center hub */}
                <circle cx="200" cy="200" r="22" fill={primary}
                  style={{ animation: 'vault-core-build 5s ease-in-out infinite', transformOrigin: '200px 200px' }} />
                {/* glow ring after center appears */}
                <circle cx="200" cy="200" r="22" fill={primary} opacity="0.4"
                  style={{ animation: 'vault-core-glow-build 5s ease-in-out infinite', transformOrigin: '200px 200px' }} />
              </svg>
              <div className="text-center">
                <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">Stroke Reveal</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-1">Square → circle → lines → center — sequential draw, then fade</p>
              </div>
            </div>

            {/* ④ Energy Core — static frame, spinning arc, pulsing glow */}
            <div className="bg-surface-container rounded-xl border border-outline/20 p-6 flex flex-col items-center gap-4">
              <svg width="120" height="120" viewBox="0 0 400 400">
                {/* static frame */}
                <rect x="60" y="60" width="280" height="280" fill="none" stroke={primary} strokeWidth="6" opacity="0.18" />
                {/* static dim lines */}
                {[
                  [200,178,200,102], [200,222,200,298],
                  [178,200,102,200], [222,200,298,200],
                  [215.6,184.4,258,142], [184.4,184.4,142,142],
                  [184.4,215.6,142,258], [215.6,215.6,258,258],
                ].map(([x1,y1,x2,y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={primary} strokeWidth={i < 4 ? 7 : 5} strokeLinecap="round"
                    style={{ animation: `vault-line-scan 2.4s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
                {/* dim ring track */}
                <circle cx="200" cy="200" r="100" fill="none" stroke={primary} strokeWidth="8" opacity="0.12" />
                {/* spinning arc (Material spinner style) */}
                <circle cx="200" cy="200" r="100" fill="none" stroke={primary} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray="628"
                  style={{ animation: 'vault-ring-arc 2s ease-in-out infinite', transformOrigin: '200px 200px' }} />
                {/* expanding glow ring 1 */}
                <circle cx="200" cy="200" r="36" fill={primary}
                  style={{ animation: 'vault-ring-pulse 2s ease-out 0s infinite', transformOrigin: '200px 200px' }} />
                {/* expanding glow ring 2 */}
                <circle cx="200" cy="200" r="36" fill={primary}
                  style={{ animation: 'vault-ring-pulse 2s ease-out 0.7s infinite', transformOrigin: '200px 200px' }} />
                {/* core */}
                <circle cx="200" cy="200" r="22" fill={primary}
                  style={{ color: primary, animation: 'vault-core-pulse 2s ease-in-out infinite', transformOrigin: '200px 200px' }} />
              </svg>
              <div className="text-center">
                <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface">Energy Core</p>
                <p className="font-body text-[11px] text-on-surface-variant mt-1">Spinning arc + line scan + pulsing glow rings from center</p>
              </div>
            </div>

          </div>
        </section>

        {/* ─── SVG Loading Animations ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">SVG Loading Animations</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            Pure SVG + CSS keyframes. Zero dependencies, GPU-accelerated, resolution-independent.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* 1. Arc Spinner */}
            <AnimCard title="Arc Spinner" description="Rotating arc with stroke-dasharray">
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'anim-spin 0.9s linear infinite' }}>
                <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="3"
                  strokeDasharray="90 150" strokeLinecap="round" />
              </svg>
            </AnimCard>

            {/* 2. Dual Ring */}
            <AnimCard title="Dual Ring" description="Counter-rotating double rings">
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', animation: 'anim-spin 1.2s linear infinite' }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="2.5"
                    strokeDasharray="60 120" strokeLinecap="round" />
                </svg>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', animation: 'anim-spin-ccw 1.8s linear infinite' }}>
                  <circle cx="24" cy="24" r="13" fill="none" stroke={muted} strokeWidth="2"
                    strokeDasharray="40 80" strokeLinecap="round" />
                </svg>
              </div>
            </AnimCard>

            {/* 3. Pulse Rings */}
            <AnimCard title="Pulse Rings" description="Expanding concentric rings fading out">
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                {[0, 0.6, 1.2].map((delay, i) => (
                  <svg key={i} width="48" height="48" viewBox="0 0 48 48"
                    style={{ position: 'absolute', animation: `anim-pulse-ring 1.8s ease-out ${delay}s infinite` }}>
                    <circle cx="24" cy="24" r="16" fill="none" stroke={primary} strokeWidth="2" />
                  </svg>
                ))}
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute' }}>
                  <circle cx="24" cy="24" r="5" fill={primary} />
                </svg>
              </div>
            </AnimCard>

            {/* 4. Bouncing Dots */}
            <AnimCard title="Bouncing Dots" description="Three dots with staggered bounce">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 48 }}>
                {[0, 0.16, 0.32].map((delay, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%', background: primary,
                    animation: `anim-bounce 1.2s ease-in-out ${delay}s infinite`,
                  }} />
                ))}
              </div>
            </AnimCard>

            {/* 5. Wave Bars */}
            <AnimCard title="Wave Bars" description="Equalizer-style staggered bars">
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 48 }}>
                {[0, 0.12, 0.24, 0.36, 0.48].map((delay, i) => (
                  <div key={i} style={{
                    width: 5, height: 32, borderRadius: 3, background: primary,
                    animation: `anim-wave 1.2s ease-in-out ${delay}s infinite`,
                    transformOrigin: 'bottom',
                  }} />
                ))}
              </div>
            </AnimCard>

            {/* 6. Stroke Draw */}
            <AnimCard title="Stroke Draw" description="Circle progressively drawn via dashoffset">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${primary}30`} strokeWidth="2.5" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="125.66"
                  strokeDashoffset="125.66"
                  style={{ animation: 'anim-draw 1.5s ease-in-out infinite alternate' }}
                  transform="rotate(-90 24 24)" />
              </svg>
            </AnimCard>

            {/* 7. Material Spinner */}
            <AnimCard title="Material Spinner" description="Google-style expanding/contracting arc">
              <svg width="48" height="48" viewBox="0 0 66 66" style={{ animation: 'anim-spin 1.4s linear infinite' }}>
                <circle cx="33" cy="33" r="30" fill="none" stroke={primary} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="187"
                  strokeDashoffset="46.75"
                  style={{ animation: 'anim-ring-expand 1.4s ease-in-out infinite' }} />
              </svg>
            </AnimCard>

            {/* 8. Chase Dots */}
            <AnimCard title="Chase Dots" description="Dots orbiting with staggered timing">
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    position: 'absolute', width: 7, height: 7, borderRadius: '50%',
                    background: primary, left: '50%', top: '50%', marginLeft: -3.5, marginTop: -3.5,
                    animation: `anim-orbit-dot 1.5s ${i * 0.15}s cubic-bezier(0.5,0,0.5,1) infinite`,
                  }} />
                ))}
              </div>
            </AnimCard>

            {/* 9. Flip Square */}
            <AnimCard title="Flip Square" description="3D flipping square (perspective)">
              <div style={{
                width: 28, height: 28, background: primary, borderRadius: 4,
                animation: 'anim-flip 1.2s ease-in-out infinite',
              }} />
            </AnimCard>

            {/* 10. Breathing Circle */}
            <AnimCard title="Breathing Circle" description="Smooth scale + opacity oscillation">
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: primary,
                animation: 'anim-breathe 2s ease-in-out infinite',
                boxShadow: `0 0 20px ${primary}60`,
              }} />
            </AnimCard>

            {/* 11. Cube Grid */}
            <AnimCard title="Cube Grid" description="9-square grid with staggered pulse">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, width: 42, height: 42 }}>
                {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.2, 0.3, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    background: primary, borderRadius: 2,
                    animation: `anim-cube-pulse 1.3s ${delay}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </AnimCard>

            {/* 12. Elastic Dots */}
            <AnimCard title="Elastic Dots" description="Vertical stretch with stagger">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 48 }}>
                {[0, 0.1, 0.2].map((delay, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%', background: primary,
                    animation: `anim-dot-elastic 0.6s ${delay}s ease-in-out infinite alternate`,
                  }} />
                ))}
              </div>
            </AnimCard>

            {/* 13. Gradient Ring */}
            <AnimCard title="Gradient Ring" description="SVG ring with linearGradient stroke">
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'anim-spin 1s linear infinite' }}>
                <defs>
                  <linearGradient id="grad-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={primary} stopOpacity="1" />
                    <stop offset="100%" stopColor={primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="20" fill="none" stroke="url(#grad-ring)" strokeWidth="3"
                  strokeLinecap="round" />
                <circle cx="24" cy="4" r="2.5" fill={primary} />
              </svg>
            </AnimCard>

            {/* 14. DNA Helix */}
            <AnimCard title="DNA Helix" description="3D rotating dot pairs">
              <div style={{ perspective: 120, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 6, animation: 'anim-helix 1.5s linear infinite', transformStyle: 'preserve-3d' }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
                      transform: `rotateY(${i * 36}deg)`,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: primary }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: muted }} />
                    </div>
                  ))}
                </div>
              </div>
            </AnimCard>

            {/* 15. Clock */}
            <AnimCard title="Clock Hand" description="Rotating line with dot tip">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${primary}20`} strokeWidth="1.5" />
                <g style={{ animation: 'anim-spin 1.2s steps(12) infinite', transformOrigin: '24px 24px' }}>
                  <line x1="24" y1="24" x2="24" y2="8" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="24" cy="8" r="2" fill={primary} />
                </g>
                <circle cx="24" cy="24" r="3" fill={primary} />
              </svg>
            </AnimCard>

            {/* 16. Progress Ring */}
            <AnimCard title="Progress Ring" description="Determinate circular progress (75%)">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${primary}20`} strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="125.66"
                  strokeDashoffset="31.4"
                  transform="rotate(-90 24 24)"
                  style={{ transition: 'stroke-dashoffset 0.5s' }} />
                <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
                  fill={onSurface} style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                  75%
                </text>
              </svg>
            </AnimCard>

          </div>
        </section>

        {/* ─── More SVG Animations ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">More SVG Animations</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            Advanced techniques — pendulums, morphing, path drawing, filters, SMIL motion paths.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* 17. Radar Sweep */}
            <AnimCard title="Radar Sweep" description="Rotating sector + grid rings">
              <svg width="48" height="48" viewBox="0 0 48 48">
                {[8, 14, 20].map(r => (
                  <circle key={r} cx="24" cy="24" r={r} fill="none" stroke={primary} strokeWidth="0.5" opacity="0.2" />
                ))}
                <line x1="4" y1="24" x2="44" y2="24" stroke={primary} strokeWidth="0.5" opacity="0.15" />
                <line x1="24" y1="4" x2="24" y2="44" stroke={primary} strokeWidth="0.5" opacity="0.15" />
                <g style={{ animation: 'anim-spin 2.4s linear infinite', transformOrigin: '24px 24px' }}>
                  <path d={`M24,24 L24,4 A20,20 0 0,1 44,24 Z`} fill={primary} opacity="0.35" />
                  <line x1="24" y1="24" x2="24" y2="4" stroke={primary} strokeWidth="1.5" />
                </g>
                <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="1" opacity="0.3" />
                <circle cx="24" cy="24" r="2.5" fill={primary} />
              </svg>
            </AnimCard>

            {/* 18. Atom Orbit */}
            <AnimCard title="Atom Orbit" description="3 elliptical orbits at 60° offsets">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="3.5" fill={primary} />
                {[0, 60, 120].map(angle => (
                  <ellipse key={angle} cx="24" cy="24" rx="19" ry="7"
                    fill="none" stroke={primary} strokeWidth="1" opacity="0.3"
                    transform={`rotate(${angle} 24 24)`} />
                ))}
                <g style={{ animation: 'anim-spin 1.8s linear infinite', transformOrigin: '24px 24px' }}>
                  <circle cx="43" cy="24" r="3" fill={primary} />
                </g>
                <g style={{ animation: 'anim-spin-ccw 2.5s linear infinite', transformOrigin: '24px 24px' }}>
                  <circle cx="24" cy="5" r="2.5" fill={primary} opacity="0.75" />
                </g>
                <g style={{ animation: 'anim-spin 1.2s linear infinite', transformOrigin: '24px 24px' }}>
                  <circle cx="5" cy="24" r="2" fill={primary} opacity="0.55" />
                </g>
              </svg>
            </AnimCard>

            {/* 19. Infinity Motion (SMIL) */}
            <AnimCard title="Infinity Loop" description="animateMotion along ∞ path (SMIL)">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path id="inf-path"
                  d="M24,24 C24,16 36,10 40,16 C44,22 44,26 40,32 C36,38 24,32 24,24 C24,16 12,10 8,16 C4,22 4,26 8,32 C12,38 24,32 24,24 Z"
                  fill="none" stroke={`${primary}30`} strokeWidth="1.5" />
                <circle r="4.5" fill={primary}>
                  <animateMotion dur="2s" repeatCount="indefinite">
                    <mpath href="#inf-path" />
                  </animateMotion>
                </circle>
              </svg>
            </AnimCard>

            {/* 20. WiFi Signal */}
            <AnimCard title="WiFi Signal" description="Staggered arc fade-in">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="40" r="3.5" fill={primary} />
                <path d="M17,33 A10,10 0 0,1 31,33" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'anim-signal 1.6s ease-in-out 0s infinite' }} />
                <path d="M12,27 A18,18 0 0,1 36,27" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round"
                  style={{ animation: 'anim-signal 1.6s ease-in-out 0.27s infinite' }} />
                <path d="M6,21 A26,26 0 0,1 42,21" fill="none" stroke={primary} strokeWidth="1.5" strokeLinecap="round"
                  style={{ animation: 'anim-signal 1.6s ease-in-out 0.54s infinite' }} />
              </svg>
            </AnimCard>

            {/* 21. Pendulum */}
            <AnimCard title="Pendulum" description="Physics-like swing with cubic-bezier">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="6" r="2" fill={`${primary}40`} />
                <g style={{ animation: 'anim-pendulum 1.4s cubic-bezier(0.4,0,0.6,1) infinite', transformOrigin: '24px 6px' }}>
                  <line x1="24" y1="6" x2="24" y2="36" stroke={primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <circle cx="24" cy="37" r="7" fill={primary} />
                </g>
              </svg>
            </AnimCard>

            {/* 22. Hexagon Draw */}
            <AnimCard title="Hexagon Draw" description="Stroke-dashoffset traces hexagon">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <polygon points="44,24 34,41.3 14,41.3 4,24 14,6.7 34,6.7"
                  fill="none" stroke={`${primary}18`} strokeWidth="2" />
                <polygon points="44,24 34,41.3 14,41.3 4,24 14,6.7 34,6.7"
                  fill="none" stroke={primary} strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="120" strokeDashoffset="120"
                  style={{ animation: 'anim-draw 2s ease-in-out infinite alternate' }} />
              </svg>
            </AnimCard>

            {/* 23. Morph Shape */}
            <AnimCard title="Morph Shape" description="Square ↔ circle via border-radius">
              <div style={{
                width: 34, height: 34,
                background: `linear-gradient(135deg, ${primary}, ${muted})`,
                animation: 'anim-morph-shape 1.8s ease-in-out infinite',
              }} />
            </AnimCard>

            {/* 24. Hourglass */}
            <AnimCard title="Hourglass Flip" description="Rotates 180° then resets">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <g style={{ animation: 'anim-hourglass-spin 2.6s ease-in-out infinite', transformOrigin: '24px 24px' }}>
                  <path d="M12,4 L36,4 L24,22 L36,44 L12,44 L24,22 Z"
                    fill={`${primary}25`} stroke={primary} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14,6 L34,6 L24,21 Z" fill={primary} opacity="0.7" />
                  <ellipse cx="24" cy="38" rx="7" ry="4" fill={primary} opacity="0.7" />
                  <circle cx="24" cy="24" r="1.5" fill={primary}
                    style={{ animation: 'anim-breathe 0.5s ease-in-out infinite' }} />
                </g>
              </svg>
            </AnimCard>

            {/* 25. Horizontal Bars */}
            <AnimCard title="Stacked Bars" description="Horizontal fill with stagger">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: 44 }}>
                {[0, 0.3, 0.6].map((delay, i) => (
                  <div key={i} style={{ height: 8, borderRadius: 4, background: `${primary}20`, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: primary,
                      animation: `anim-h-bar 1.6s ${delay}s ease-in-out infinite`,
                      transformOrigin: 'left center',
                    }} />
                  </div>
                ))}
              </div>
            </AnimCard>

            {/* 26. Neon Glow */}
            <AnimCard title="Neon Glow" description="SVG feGaussianBlur glow filter">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <defs>
                  <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${primary}25`} strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="3"
                  strokeDasharray="80 46" strokeLinecap="round"
                  filter="url(#neon-glow)"
                  style={{ animation: 'anim-spin 1.5s linear infinite' }} />
              </svg>
            </AnimCard>

            {/* 27. Comet Trail */}
            <AnimCard title="Comet Trail" description="Fading arc tail + bright head dot">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke={`${primary}12`} strokeWidth="1" />
                <g style={{ animation: 'anim-spin 1.2s linear infinite', transformOrigin: '24px 24px' }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={primary} strokeWidth="4"
                    strokeDasharray="52 74" strokeLinecap="round" opacity="0.55"
                    transform="rotate(-90 24 24)" />
                  <circle cx="24" cy="4" r="4" fill={primary}
                    style={{ filter: `drop-shadow(0 0 5px ${primary})` }} />
                </g>
              </svg>
            </AnimCard>

            {/* 28. Pacman */}
            <AnimCard title="Pacman" description="Two half-circles as animated jaws">
              <div style={{ position: 'relative', width: 42, height: 42 }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: 42, height: 21, background: primary,
                  borderTopLeftRadius: 21, borderTopRightRadius: 21,
                  transformOrigin: 'center bottom',
                  animation: 'anim-jaw-upper 0.45s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 42, height: 21, background: primary,
                  borderBottomLeftRadius: 21, borderBottomRightRadius: 21,
                  transformOrigin: 'center top',
                  animation: 'anim-jaw-lower 0.45s ease-in-out infinite',
                }} />
              </div>
            </AnimCard>

            {/* 29. EKG / Heartbeat */}
            <AnimCard title="EKG Heartbeat" description="Polyline drawn via stroke-dashoffset">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <polyline
                  points="2,24 8,24 10,18 14,30 16,18 18,24 24,24 26,10 28,38 30,24 38,24 40,18 44,24 46,24"
                  fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="130"
                  style={{ animation: 'anim-ekg 2s ease-in-out infinite' }} />
              </svg>
            </AnimCard>

            {/* 30. Water Wave Fill */}
            <AnimCard title="Water Fill" description="Wave path + SVG clipPath on circle">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <defs>
                  <clipPath id="water-circle">
                    <circle cx="24" cy="24" r="19" />
                  </clipPath>
                </defs>
                <circle cx="24" cy="24" r="19" fill={`${primary}12`} />
                <g clipPath="url(#water-circle)">
                  <path
                    d="M-28,28 Q-14,22 0,28 Q14,34 28,28 Q42,22 56,28 Q70,34 84,28 L84,48 L-28,48 Z"
                    fill={`${primary}50`}
                    style={{ animation: 'anim-water-wave 1.8s linear infinite' }} />
                  <path
                    d="M-28,31 Q-14,25 0,31 Q14,37 28,31 Q42,25 56,31 Q70,37 84,31 L84,48 L-28,48 Z"
                    fill={`${primary}85`}
                    style={{ animation: 'anim-water-wave 2.4s linear infinite 0.4s' }} />
                </g>
                <circle cx="24" cy="24" r="19" fill="none" stroke={primary} strokeWidth="1.5" />
              </svg>
            </AnimCard>

            {/* 31. Tri Orbit */}
            <AnimCard title="Tri Orbit" description="3 dots at 120° orbiting together">
              <div style={{ position: 'relative', width: 48, height: 48, animation: 'anim-spin 1.8s linear infinite', transformOrigin: '24px 24px' }}>
                {([0, 120, 240] as const).map((angle, i) => {
                  const rad = (angle - 90) * Math.PI / 180;
                  const x = 24 + 17 * Math.cos(rad);
                  const y = 24 + 17 * Math.sin(rad);
                  const sz = 9 - i * 1.5;
                  return (
                    <div key={angle} style={{
                      position: 'absolute',
                      left: x - sz / 2, top: y - sz / 2,
                      width: sz, height: sz,
                      borderRadius: '50%',
                      background: primary,
                      opacity: 1 - i * 0.25,
                    }} />
                  );
                })}
              </div>
            </AnimCard>

            {/* 32. Dot Matrix Wave */}
            <AnimCard title="Dot Matrix" description="5×4 grid — diagonal ripple wave">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, width: 44, height: 36 }}>
                {Array.from({ length: 20 }, (_, idx) => {
                  const row = Math.floor(idx / 5);
                  const col = idx % 5;
                  return (
                    <div key={idx} style={{
                      width: 5, height: 5, borderRadius: '50%', background: primary,
                      animation: `anim-dot-wave 1.3s ${(row + col) * 0.12}s ease-in-out infinite`,
                    }} />
                  );
                })}
              </div>
            </AnimCard>

          </div>
        </section>

        {/* ─── Skeleton Shimmer ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">Skeleton Shimmer</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            Content placeholder with shimmer sweep. Matches real content layout for best perceived performance.
          </p>
          <style>{`
            @keyframes anim-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .skeleton-line {
              background: var(--c-surface-container-high);
              border-radius: 6px;
              overflow: hidden;
              position: relative;
            }
            .skeleton-line::after {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, transparent, var(--c-surface-container) 50%, transparent);
              animation: anim-shimmer 1.5s ease-in-out infinite;
            }
          `}</style>
          <div className="bg-surface-container rounded-xl border border-outline/20 p-6 space-y-5">
            {/* Card skeleton */}
            <div className="flex gap-4 items-start">
              <div className="skeleton-line w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="skeleton-line h-3.5 w-3/5" />
                <div className="skeleton-line h-3 w-4/5" />
                <div className="skeleton-line h-3 w-2/5" />
              </div>
            </div>
            {/* List skeleton */}
            <div className="space-y-3 pt-2">
              {[85, 70, 55].map((w, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton-line w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="skeleton-line h-3" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CSS Spinners (bonus) ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">CSS-Only Spinners</h2>
          <p className="text-on-surface-variant text-sm font-body mb-6">
            No SVG needed — pure div + CSS. Lighter DOM, slightly less precise than SVG.
          </p>
          <style>{`
            .css-spin-ring {
              width: 40px; height: 40px; border-radius: 50%;
              border: 3px solid var(--c-outline);
              border-top-color: var(--c-primary);
              animation: anim-spin 0.8s linear infinite;
            }
            .css-spin-dots {
              width: 40px; height: 40px; position: relative;
              animation: anim-spin 2s linear infinite;
            }
            .css-spin-dots::before, .css-spin-dots::after {
              content: ''; position: absolute;
              width: 10px; height: 10px; border-radius: 50%;
              background: var(--c-primary);
            }
            .css-spin-dots::before { top: 0; left: 15px; }
            .css-spin-dots::after { bottom: 0; left: 15px; opacity: 0.5; }
            .css-spin-gradient {
              width: 40px; height: 40px; border-radius: 50%;
              background: conic-gradient(from 0deg, transparent, var(--c-primary));
              mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
              -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
              animation: anim-spin 0.9s linear infinite;
            }
          `}</style>
          <div className="grid grid-cols-3 gap-4">
            <AnimCard title="Border Ring" description="border-top-color trick">
              <div className="css-spin-ring" />
            </AnimCard>
            <AnimCard title="Dot Pair" description="Rotating pseudo-elements">
              <div className="css-spin-dots" />
            </AnimCard>
            <AnimCard title="Conic Gradient" description="conic-gradient + mask">
              <div className="css-spin-gradient" />
            </AnimCard>
          </div>
        </section>

        {/* ─── Lottie Animations ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-1">Lottie Animations</h2>
          <p className="text-on-surface-variant text-sm font-body mb-4">
            Loaded via <code className="font-mono text-[11px] text-primary">@lottiefiles/lottie-player</code> web component.
            Paste any <code className="font-mono text-[11px] text-primary">.json</code> URL from{' '}
            <a href="https://lottiefiles.com/free-animations/loading" target="_blank" rel="noopener"
              className="text-primary underline underline-offset-2">LottieFiles</a> to preview.
          </p>

          {/* URL input */}
          <div className="flex gap-2 mb-6">
            <input
              type="url"
              value={lottieUrl}
              onChange={e => setLottieUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLottie()}
              placeholder="Paste Lottie JSON URL..."
              className="flex-1 bg-surface-container border border-outline/30 rounded-lg px-3 py-2 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60"
            />
            <button
              onClick={addLottie}
              className="px-4 py-2 bg-primary text-on-primary font-label text-xs uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Add
            </button>
          </div>

          {!scriptReady && (
            <p className="text-on-surface-variant text-sm italic mb-4">Loading lottie-player script...</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...DEFAULT_LOTTIE_URLS, ...customLotties].map((item, i) => (
              <LottieCard key={`${item.src}-${i}`} src={item.src} title={item.title} />
            ))}
          </div>

          <div className="mt-6 bg-surface-container rounded-xl border border-outline/20 p-5">
            <p className="font-label text-xs font-bold uppercase tracking-wider text-primary mb-2">How to use</p>
            <ol className="text-on-surface-variant text-sm font-body space-y-1.5 list-decimal list-inside">
              <li>Go to <a href="https://lottiefiles.com/free-animations/loading" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">lottiefiles.com/free-animations/loading</a></li>
              <li>Pick an animation → click the download icon → select &quot;Lottie JSON&quot;</li>
              <li>Copy the JSON URL (or upload and get a hosted URL)</li>
              <li>Paste the URL above to preview</li>
            </ol>
          </div>
        </section>

        {/* ─── Comparison Notes ─── */}
        <section>
          <h2 className="font-headline font-bold text-2xl tracking-tighter mb-4">SVG vs Lottie</h2>
          <div className="bg-surface-container rounded-xl border border-outline/20 p-6 overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-outline/20">
                  <th className="text-left py-2 pr-4 font-label text-xs uppercase tracking-wider text-primary"></th>
                  <th className="text-left py-2 px-4 font-label text-xs uppercase tracking-wider text-primary">SVG + CSS</th>
                  <th className="text-left py-2 px-4 font-label text-xs uppercase tracking-wider text-primary">Lottie</th>
                </tr>
              </thead>
              <tbody className="text-on-surface-variant">
                <tr className="border-b border-outline/10">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">Size</td>
                  <td className="py-2.5 px-4">~1-5 KB</td>
                  <td className="py-2.5 px-4">~20-100 KB</td>
                </tr>
                <tr className="border-b border-outline/10">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">Complexity</td>
                  <td className="py-2.5 px-4">Simple shapes</td>
                  <td className="py-2.5 px-4">Unlimited (AE export)</td>
                </tr>
                <tr className="border-b border-outline/10">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">Runtime</td>
                  <td className="py-2.5 px-4">None (native)</td>
                  <td className="py-2.5 px-4">lottie-web (~50 KB)</td>
                </tr>
                <tr className="border-b border-outline/10">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">Customization</td>
                  <td className="py-2.5 px-4">Full CSS/JS control</td>
                  <td className="py-2.5 px-4">Limited (color swap)</td>
                </tr>
                <tr className="border-b border-outline/10">
                  <td className="py-2.5 pr-4 font-medium text-on-surface">React Native</td>
                  <td className="py-2.5 px-4">Needs Reanimated</td>
                  <td className="py-2.5 px-4">lottie-react-native</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-on-surface">Best for</td>
                  <td className="py-2.5 px-4">Spinners, progress</td>
                  <td className="py-2.5 px-4">Brand, illustrations</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
