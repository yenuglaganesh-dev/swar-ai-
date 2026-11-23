import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AssistantPage from './pages/AssistantPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from '@/context/AuthContext';
import PageShell from '@/components/Layout/PageShell';
import SwarMascot from '@/components/Auth/SwarMascot';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <PageShell>
      <div className="container" style={{ paddingTop: 140, display: 'grid', placeItems: 'center', gap: 16, color: 'var(--text-muted)' }}>
        <div style={{ width: 180 }}><SwarMascot state="processing" size="100%" /></div>
        <div>Loading...</div>
      </div>
    </PageShell>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<HomePage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
