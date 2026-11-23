import { useEffect, useRef } from 'react';
import SwarMascot, { type MascotState } from '@/components/Auth/SwarMascot';
import { AssistantStatus } from '@/types';

interface Props {
  status: AssistantStatus;
  analyser?: AnalyserNode | null;
}

const statusToMascot: Record<AssistantStatus, MascotState> = {
  idle: 'idle',
  listening: 'listening',
  processing: 'processing',
  speaking: 'speaking',
  error: 'error',
};

export default function AssistantOrb({ status, analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 320;
    canvas.width = size;
    canvas.height = size;

    const drawIdle = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      for (let i = 0; i < 3; i++) {
        const r = 70 + i * 28 + Math.sin(t / 900 + i) * 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,107,53,${0.18 - i * 0.04})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    const drawBars = (data: Uint8Array, color: string) => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      const bars = 48;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length)] / 255;
        const angle = (i / bars) * Math.PI * 2;
        const inner = 72;
        const len = 10 + v * 55;
        const x1 = cx + Math.cos(angle) * inner;
        const y1 = cy + Math.sin(angle) * inner;
        const x2 = cx + Math.cos(angle) * (inner + len);
        const y2 = cy + Math.sin(angle) * (inner + len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    const drawProcessing = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      for (let i = 0; i < 3; i++) {
        const a = t / (700 - i * 120) + i * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 85 + i * 18, a, a + Math.PI * 1.2);
        ctx.strokeStyle = `rgba(255,${140 - i * 20},${80 - i * 20},${0.7 - i * 0.15})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const loop = (t: number) => {
      if (analyser && data && (status === 'listening' || status === 'speaking')) {
        analyser.getByteFrequencyData(data);
        drawBars(data, status === 'listening' ? 'rgba(255,107,53,0.9)' : 'rgba(255,154,90,0.9)');
      } else if (status === 'processing') {
        drawProcessing(t);
      } else {
        drawIdle(t);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status, analyser]);

  return (
    <div className="orb-wrap" aria-hidden>
      <canvas ref={canvasRef} className="orb-canvas" />
      <div className="mascot-layer">
        <SwarMascot state={statusToMascot[status]} speaking={status === 'speaking'} size="100%" />
      </div>
      <style>{`
        .orb-wrap { position: relative; width: min(340px, 74vw); aspect-ratio: 1; display: grid; place-items: center; margin: 0 auto; }
        .orb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .mascot-layer { width: 78%; z-index: 1; filter: drop-shadow(0 20px 50px rgba(255,107,53,0.25)); }
        @media (prefers-reduced-motion: reduce) { .orb-canvas { display: none; } }
      `}</style>
    </div>
  );
}
