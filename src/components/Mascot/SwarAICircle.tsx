import { useEffect, useMemo, useRef, useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | number;

interface Props {
  size?: Size;
  className?: string;
  /** Optional label for screen readers; visual remains decorative by default */
  label?: string;
}

const SIZE_MAP: Record<Exclude<Size, number>, number> = {
  sm: 96,
  md: 180,
  lg: 280,
};

export default function SwarAICircle({ size = 'lg', className = '', label }: Props) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size];
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    let mounted = true;
    let blinkTimer: number | undefined;
    const blinkLoop = () => {
      blinkTimer = window.setTimeout(() => {
        if (!mounted) return;
        setBlink(true);
        window.setTimeout(() => mounted && setBlink(false), 150);
        blinkLoop();
      }, 2800 + Math.random() * 2400);
    };
    blinkLoop();
    const lookInterval = window.setInterval(() => {
      const dirs = [
        { x: 0, y: 0 },
        { x: 1.4, y: 0 },
        { x: -1.2, y: 0.4 },
        { x: 0, y: -0.8 },
        { x: 0.8, y: 0.6 },
      ];
      setLook(dirs[Math.floor(Math.random() * dirs.length)]);
    }, 2600);
    return () => {
      mounted = false;
      if (blinkTimer) window.clearTimeout(blinkTimer);
      window.clearInterval(lookInterval);
    };
  }, [reduced, visible]);

  const animate = !reduced && visible;
  const uid = useMemo(() => `swar-ai-circle-${Math.random().toString(36).slice(2, 9)}`, []);
  const eyeRy = blink ? 0.8 : 5.2;

  return (
    <div
      ref={rootRef}
      className={`swar-ai-circle ${animate ? 'animate' : ''} ${className}`.trim()}
      style={{ width: px, height: px }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="sac-glow" />
      <svg viewBox="0 0 200 200" className="sac-svg" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${uid}-inner`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFB067">
              <animate attributeName="stop-color" values="#FFB067;#FF9A5A;#FF7A3D;#FFB067" dur="8s" repeatCount={animate ? 'indefinite' : '0'} />
            </stop>
            <stop offset="55%" stopColor="#FF7A3D">
              <animate attributeName="stop-color" values="#FF7A3D;#FF6B35;#FF9A5A;#FF7A3D" dur="8s" repeatCount={animate ? 'indefinite' : '0'} />
            </stop>
            <stop offset="100%" stopColor="#C94B20">
              <animate attributeName="stop-color" values="#C94B20;#FF6B35;#C94B20" dur="8s" repeatCount={animate ? 'indefinite' : '0'} />
            </stop>
          </radialGradient>
          <linearGradient id={`${uid}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9A5A" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
          <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Soft outer glow */}
        <circle cx="100" cy="100" r="88" fill="rgba(255,107,53,0.18)" filter={`url(#${uid}-blur)`} className="sac-glow-circle" />

        {/* Outer ring */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,154,90,0.95)" strokeWidth="2.4" className="sac-ring sac-ring-outer" />
        {/* Secondary ring */}
        <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,107,53,0.35)" strokeWidth="2" className="sac-ring sac-ring-inner" />

        {/* Main circular body */}
        <circle cx="100" cy="100" r="76" fill={`url(#${uid}-inner)`} className="sac-body" />
        <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Inner highlight movement */}
        <ellipse cx="72" cy="68" rx="28" ry="20" fill="rgba(255,255,255,0.12)" className="sac-highlight">
          {animate && <animate attributeName="cx" values="72;78;70;72" dur="10s" repeatCount="indefinite" />}
          {animate && <animate attributeName="cy" values="68;72;66;68" dur="10s" repeatCount="indefinite" />}
        </ellipse>

        {/* Eyes */}
        <g className="sac-eyes" style={{ transform: `translate(${look.x}px, ${look.y}px)`, transition: reduced ? 'none' : 'transform 450ms ease' }}>
          <ellipse cx="80" cy="96" rx="5.2" ry={eyeRy} fill="#FFFFFF" style={{ transition: reduced ? 'none' : 'ry 120ms ease' }} />
          <ellipse cx="120" cy="96" rx="5.2" ry={eyeRy} fill="#FFFFFF" style={{ transition: reduced ? 'none' : 'ry 120ms ease' }} />
        </g>

        {/* Subtle smile */}
        <path d="M 86 116 Q 100 124 114 116" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.6" strokeLinecap="round" className="sac-smile" />
      </svg>

      <style>{`
        .swar-ai-circle { position: relative; display: inline-grid; place-items: center; flex-shrink: 0; }
        .sac-glow { position: absolute; inset: -14%; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,53,0.30), rgba(255,107,53,0.08) 45%, transparent 72%); filter: blur(10px); pointer-events: none; }
        .sac-svg { width: 100%; height: 100%; display: block; overflow: visible; }
        .swar-ai-circle.animate { animation: sacFloat 6.5s ease-in-out infinite; }
        .swar-ai-circle.animate .sac-body { transform-origin: 100px 100px; animation: sacBreathe 4.8s ease-in-out infinite; }
        .swar-ai-circle.animate .sac-ring-outer { transform-origin: 100px 100px; animation: sacPulseOuter 5.5s ease-in-out infinite; }
        .swar-ai-circle.animate .sac-ring-inner { transform-origin: 100px 100px; animation: sacPulseInner 5.5s ease-in-out infinite reverse; }
        .swar-ai-circle.animate .sac-glow-circle { transform-origin: 100px 100px; animation: sacGlow 4s ease-in-out infinite; }
        @keyframes sacFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes sacBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        @keyframes sacPulseOuter { 0%,100% { opacity: .95; transform: scale(1); } 50% { opacity: 1; transform: scale(1.012); } }
        @keyframes sacPulseInner { 0%,100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.01); } }
        @keyframes sacGlow { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
        @media (prefers-reduced-motion: reduce) {
          .swar-ai-circle.animate, .swar-ai-circle.animate .sac-body, .swar-ai-circle.animate .sac-ring-outer, .swar-ai-circle.animate .sac-ring-inner, .swar-ai-circle.animate .sac-glow-circle { animation: none !important; }
          .sac-eyes, .sac-eyes ellipse { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
