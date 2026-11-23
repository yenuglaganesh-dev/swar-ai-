import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SWAR AI UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ maxWidth: 560, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: 20, padding: 28 }}>
            <h1 style={{ margin: '0 0 12px', fontSize: '1.6rem' }}>Something went wrong</h1>
            <p style={{ color: '#b0b0b0', lineHeight: 1.7, margin: '0 0 16px' }}>SWAR AI hit an unexpected UI error. You can reload the page. If the problem continues, check the browser console.</p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#ffb3b3', background: 'rgba(255,77,77,0.08)', padding: 12, borderRadius: 12, fontSize: 12 }}>{this.state.message}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '12px 20px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#ff6b35,#ff9a5a)', color: '#111', fontWeight: 700, cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
