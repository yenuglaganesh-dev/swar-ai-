import { useEffect, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { AssistantStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  status: AssistantStatus;
  onClick: () => void;
  disabled?: boolean;
  analyser?: AnalyserNode | null;
}

export default function MicrophoneButton({ status, onClick, disabled, analyser }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';
  const isProcessing = status === 'processing';
  const isWaveActive = isListening || isSpeaking;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isWaveActive || reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 116;
    canvas.width = size;
    canvas.height = size;
    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const timeData = analyser ? new Uint8Array(analyser.fftSize) : null;
    let rafId = 0;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);
      let level = 0.15;

      if (isListening && analyser && freqData && timeData) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        level = Math.min(1, Math.max(0.12, rms * 3.8));
      } else if (isSpeaking) {
        level = 0.35 + Math.abs(Math.sin(time / 180)) * 0.45;
      }

      const cx = size / 2;
      const cy = size / 2;

      // Audio-reactive concentric pulse rings
      for (let rIdx = 0; rIdx < 2; rIdx++) {
        const radius = 34 + rIdx * 10 + level * (10 + rIdx * 6);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 53, ${0.28 - rIdx * 0.1 + level * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Multiple smooth audio-reactive voice bars / waves in the center
      const barCount = 7;
      const spacing = 8;
      const startX = cx - ((barCount - 1) * spacing) / 2;
      for (let i = 0; i < barCount; i++) {
        let barEnergy = level;
        if (isListening && analyser && freqData) {
          const bin = Math.min(freqData.length - 1, Math.floor(((i + 1) / (barCount + 2)) * (freqData.length * 0.45)));
          barEnergy = Math.max(0.14, (freqData[bin] / 255) * 0.95 + level * 0.35);
        } else {
          barEnergy = Math.max(0.18, level * (0.65 + 0.35 * Math.sin(time / 140 + i * 0.85)));
        }
        const centerBias = 1 - Math.abs(i - (barCount - 1) / 2) * 0.14;
        const barH = Math.min(54, Math.max(10, barEnergy * 52 * centerBias));
        const x = startX + i * spacing;
        const y = cy - barH / 2;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, '#ff9a5a');
        grad.addColorStop(1, '#ff6b35');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x - 2.2, y, 4.4, barH, 3);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isWaveActive, isListening, isSpeaking, analyser, reduce]);

  return (
    <div className="mic-wrap">
      <motion.button
        type="button"
        className={`mic-btn ${isWaveActive ? 'wave-active' : ''} ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onClick}
        disabled={disabled || isProcessing}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        aria-label={isListening ? t('tapToStop') : isSpeaking ? t('stopSpeaking') : t('tapToSpeak')}
        aria-pressed={isListening}
      >
        {isWaveActive ? (
          <canvas ref={canvasRef} className="mic-wave-canvas" aria-hidden />
        ) : (
          <span className="mic-icon">
            {isProcessing ? <Loader2 size={36} className="spin" /> : <Mic size={36} />}
          </span>
        )}
      </motion.button>
      <div className="mic-label">
        {isListening ? (
          <span className="live-indicator"><span className="live-dot" /> {t('listening')} • {t('tapToStop')}</span>
        ) : isSpeaking ? (
          <span className="live-indicator"><span className="live-dot speaking" /> {t('speaking')} • {t('tapToStop')}</span>
        ) : isProcessing ? (
          t('processing')
        ) : (
          t('tapToSpeak')
        )}
      </div>
      <style>{`
        .mic-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .mic-btn { position: relative; width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; color: #111; background: linear-gradient(135deg, var(--accent), var(--accent-2)); box-shadow: 0 12px 40px rgba(255,107,53,0.45); transition: box-shadow .2s, transform .2s, width .2s, height .2s, background .2s; border: none; cursor: pointer; }
        .mic-btn:hover:not(:disabled) { box-shadow: 0 16px 50px rgba(255,107,53,0.6); }
        .mic-btn:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
        .mic-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .mic-btn.wave-active { width: 116px; height: 116px; background: radial-gradient(circle at center, #1b1c22 0%, #111216 100%); border: 2px solid rgba(255,107,53,0.75); box-shadow: 0 0 36px rgba(255,107,53,0.45), inset 0 0 24px rgba(255,107,53,0.16); color: #fff; }
        .mic-wave-canvas { width: 116px; height: 116px; pointer-events: none; }
        .mic-icon { position: relative; z-index: 2; display: grid; place-items: center; }
        .mic-label { font-size: 0.92rem; color: var(--text-muted); font-weight: 500; text-align: center; }
        .live-indicator { display: inline-flex; align-items: center; gap: 8px; color: #ffd2c2; font-weight: 600; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff4d4d; box-shadow: 0 0 10px #ff4d4d; animation: blink 1.1s ease-in-out infinite; }
        .live-dot.speaking { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.8); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .live-dot, .spin { animation: none; } }
      `}</style>
    </div>
  );
}
