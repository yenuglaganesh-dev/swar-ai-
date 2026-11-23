export type MascotState = 'idle' | 'listening' | 'processing' | 'speaking' | 'happy' | 'error' | 'welcome' | 'email' | 'password' | 'thinking' | 'success';

interface Props {
  state?: MascotState;
  mood?: MascotState; // backward compat
  className?: string;
  size?: number | string;
  speaking?: boolean;
}

/**
 * Renders the approved SWAR mascot video when available at /mascot/swar-mascot.mp4.
 * If the asset is missing, renders nothing (no fallback face icon).
 */
export default function SwarMascot({ state, mood, className = '', size = 'min(340px, 80vw)' }: Props) {
  void state;
  void mood;
  return (
    <div className={className} aria-hidden="true" style={{ width: size, maxWidth: '100%', aspectRatio: '1 / 1' }}>
      <video
        src="/mascot/swar-mascot.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onError={(e) => {
          // Hide missing-asset video element to avoid broken/empty UI.
          (e.currentTarget as HTMLVideoElement).style.display = 'none';
        }}
      />
    </div>
  );
}