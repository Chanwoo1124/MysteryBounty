import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { AdminNav } from '@/components/AdminNav';
import { LoginScreen } from '@/screens/LoginScreen';
import { TournamentDashboard } from '@/screens/TournamentDashboard';
import { TicketSetup } from '@/screens/TicketSetup';
import { LiveBoard } from '@/screens/LiveBoard';
import { DrawCeremony } from '@/screens/DrawCeremony';
import { ResultsLog } from '@/screens/ResultsLog';

export default function App() {
  const location = useLocation();
  const [params] = useSearchParams();

  // 대형 스크린 송출 시에는 `?kiosk=1` 로 상단 관리자 바를 숨긴다
  const kiosk = params.get('kiosk') === '1';
  const showNav = !kiosk && location.pathname !== '/login';

  return (
    <div className="app-shell">
      {showNav && <AdminNav />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/dashboard" element={<TournamentDashboard />} />
        <Route path="/setup" element={<TicketSetup />} />
        <Route path="/board" element={<LiveBoard />} />
        <Route path="/draw" element={<DrawCeremony />} />
        <Route path="/results" element={<ResultsLog />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
