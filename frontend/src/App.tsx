import { useEffect, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { LoginScreen } from '@/screens/LoginScreen';
import { TournamentDashboard } from '@/screens/TournamentDashboard';
import { TicketSetup } from '@/screens/TicketSetup';
import { LiveBoard } from '@/screens/LiveBoard';
import { ResultsLog } from '@/screens/ResultsLog';

export default function App() {
  const { authReady, authed, checkAuth } = useBounty();

  // 앱 시작 시 /me 로 세션 유지 여부를 확인한다 (새로고침해도 로그인 유지)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 세션 확인이 끝날 때까지는 화면 깜빡임을 막기 위해 스플래시를 보여준다
  if (!authReady) {
    return (
      <div className="app-shell board-skin" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <img src="/assets/hgp-logo.png" alt="HGP" style={{ width: 200, opacity: 0.5 }} />
      </div>
    );
  }

  // 미인증이면 보호 화면을 아예 렌더하지 않고 로그인으로 보낸다 (불필요한 401 방지)
  const protect = (el: ReactElement) => (authed ? el : <Navigate to="/login" replace />);

  // board-skin: 현황판의 잉크·크림·골드 팔레트를 앱 전체에 건다
  return (
    <div className="app-shell board-skin">
      <Routes>
        <Route path="/" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/login"
          element={authed ? <Navigate to="/dashboard" replace /> : <LoginScreen />}
        />
        <Route path="/dashboard" element={protect(<TournamentDashboard />)} />
        <Route path="/setup" element={protect(<TicketSetup />)} />
        {/* 추첨은 화면을 옮기지 않고 현황판 위 오버레이(DrawStage)에서 진행한다 — 전용 화면이 없다 */}
        <Route path="/board" element={protect(<LiveBoard />)} />
        <Route path="/results" element={protect(<ResultsLog />)} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
