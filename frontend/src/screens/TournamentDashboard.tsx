import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { Amount } from '@/components/Amount';
import { ApiError } from '@/api/client';
import type { Tournament, TournamentStatus } from '@/lib/types';

/** 상태별 컬러/라벨 매핑 */
const STATUS_STYLE: Record<
  TournamentStatus,
  { badgeColor: string; badgeBg: string; accent: string; openLabel: string; openTo: string }
> = {
  // 현황판 팔레트에는 빨강·주황이 없다 → 상태 구분은 골드의 밝기 단계로만 준다
  진행중: {
    badgeColor: 'var(--gold)',
    badgeBg: 'rgba(233,200,126,0.12)',
    accent: 'var(--gold)',
    openLabel: '현황판 열기',
    openTo: '/board',
  },
  준비중: {
    badgeColor: 'var(--gold-dark)',
    badgeBg: 'rgba(233,200,126,0.06)',
    accent: 'var(--gold-dark)',
    openLabel: '세팅 열기',
    openTo: '/setup',
  },
  종료: {
    badgeColor: 'var(--text-faint)',
    badgeBg: 'transparent',
    accent: 'var(--gold-border)',
    openLabel: '기록 보기',
    openTo: '/results',
  },
};

export function TournamentDashboard() {
  const navigate = useNavigate();
  const { tournaments, loadTournaments, logout } = useBounty();
  // 삭제 확인 모달 대상 (null 이면 닫힘)
  const [pendingDelete, setPendingDelete] = useState<Tournament | null>(null);

  // 진입 시 대회 목록을 불러온다. 미인증(401)이면 로그인으로 되돌린다.
  useEffect(() => {
    loadTournaments().catch((err) => {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    });
  }, [loadTournaments, navigate]);

  // 로그아웃 후 로그인 화면으로. 실패해도 세션은 정리되므로 이동한다.
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
      <div className="screen-title-row" style={{ marginBottom: 6 }}>
        <div className="screen-title" style={{ fontSize: 34, letterSpacing: '-0.01em' }}>
          내 대회
        </div>
        <div className="screen-title-en">MY TOURNAMENTS</div>
        <button
          className="btn-gold-outline"
          onClick={handleLogout}
          style={{
            marginLeft: 'auto',
            padding: '12px 22px',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.08em',
          }}
        >
          로그아웃 ⏻
        </button>
      </div>
      <div className="gold-stripe" style={{ marginBottom: 32 }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} onRequestDelete={setPendingDelete} />
        ))}
        <NewTournamentCard />
      </div>

      {pendingDelete && (
        <DeleteConfirmModal
          tournament={pendingDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function TournamentCard({
  tournament: t,
  onRequestDelete,
}: {
  tournament: Tournament;
  onRequestDelete: (t: Tournament) => void;
}) {
  const navigate = useNavigate();
  const { selectTournament, renameTournament, endTournament } = useBounty();
  const s = STATUS_STYLE[t.status];

  // 대회를 현재 대회로 지정한 뒤 해당 화면으로 이동
  const open = (to: string) => {
    selectTournament(Number(t.id));
    navigate(to);
  };

  // 이름 변경 — prompt 로 새 이름을 받아 반영
  const rename = async () => {
    const name = window.prompt('대회 이름을 수정하세요.', t.name)?.trim();
    if (!name || name === t.name) return;
    try {
      await renameTournament(Number(t.id), name);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '이름 변경에 실패했습니다.');
    }
  };

  // 대회 종료 — 확인 후 FINISHED 로 전환
  const end = async () => {
    if (!window.confirm(`"${t.name}" 대회를 종료할까요? 종료 후에는 추첨을 진행할 수 없습니다.`)) return;
    try {
      await endTournament(Number(t.id));
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '대회 종료에 실패했습니다.');
    }
  };

  return (
    <div
      onClick={() => open(s.openTo)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold-border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--gold-border)',
        borderTop: `3px solid ${s.accent}`,
        padding: '24px 26px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        transition: 'all 0.18s',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 19,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t.name}
          </div>
          {/* 이름 수정 */}
          <button
            aria-label="대회 이름 수정"
            onClick={(e) => {
              e.stopPropagation();
              rename();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--gold-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dimmer)';
            }}
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dimmer)',
              fontSize: 14,
              cursor: 'pointer',
              padding: 2,
              transition: 'color 0.15s',
            }}
          >
            ✎
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            className="skew"
            style={{
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.1em',
              padding: '5px 12px',
              color: s.badgeColor,
              border: `1px solid ${s.badgeColor}`,
              background: s.badgeBg,
            }}
          >
            <span className="unskew">{t.status}</span>
          </div>
          {/* 대회 삭제 — 확인 모달을 띄운다 */}
          <button
            aria-label="대회 삭제"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(t);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C81E2E';
              e.currentTarget.style.color = '#FF6B76';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-border)';
              e.currentTarget.style.color = 'var(--text-faint)';
            }}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--gold-border)',
              color: 'var(--text-faint)',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        <Stat label="총 상금">
          <div className="gold-text-sm" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 24 }}>
            <Amount value={t.totalPrize} />
          </div>
        </Stat>
        <Stat label="남은 티켓">
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 24,
              color: t.status === '진행중' ? 'var(--gold-light)' : 'var(--text-dim)',
            }}
          >
            {t.status === '준비중' ? '—' : t.ticketsLeft} / {t.ticketsTotal}
          </div>
        </Stat>
      </div>

      {/* 하단 체커 스트립 */}
      <div
        style={{
          height: 6,
          background: `repeating-linear-gradient(-55deg, ${s.accent} 0 8px, transparent 8px 20px)`,
          opacity: 0.4,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-gold-outline"
            style={{ flex: 1, padding: 11, fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              open('/setup');
            }}
          >
            대회 수정
          </button>
          {/* 종료 대회는 '기록 보기'가 아래 '당첨 기록·엑셀'과 중복되므로 숨긴다 */}
          {t.status !== '종료' && (
            <button
              // 카드의 주 동작 — 골드 채움으로 나머지 외곽선 버튼과 구분한다
              className="btn-gold-tint"
              style={{ flex: 1, padding: 11, fontSize: 13 }}
              onClick={(e) => {
                e.stopPropagation();
                open(s.openTo);
              }}
            >
              {s.openLabel}
            </button>
          )}
        </div>

        {/* 시작된 대회는 당첨 기록·엑셀 화면으로 바로 이동 */}
        {t.status !== '준비중' && (
          <button
            className="btn-gold-outline"
            style={{ width: '100%', padding: 11, fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              open('/results');
            }}
          >
            당첨 기록 · 엑셀
          </button>
        )}

        {/* 진행중 대회는 종료 처리 가능 */}
        {t.status === '진행중' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              end();
            }}
            // 되돌릴 수 없는 동작이라 평소엔 조용히 두고, 손이 닿을 때만 빨강으로 경고한다
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,30,46,0.18)';
              e.currentTarget.style.borderColor = '#C81E2E';
              e.currentTarget.style.color = '#FF6B76';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--gold-border)';
              e.currentTarget.style.color = 'var(--text-dim)';
            }}
            style={{
              width: '100%',
              padding: 11,
              fontSize: 13,
              background: 'transparent',
              border: '1px solid var(--gold-border)',
              color: 'var(--text-dim)',
              fontStyle: 'italic',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ■ 대회 종료
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--text-dimmer)',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** 대회 삭제 확인 모달 — 삭제는 되돌릴 수 없으므로 한 번 더 확인받는다. */
function DeleteConfirmModal({
  tournament,
  onClose,
}: {
  tournament: Tournament;
  onClose: () => void;
}) {
  const { deleteTournament } = useBounty();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteTournament(Number(tournament.id));
      onClose();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '대회 삭제에 실패했습니다.');
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.68)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
        animation: 'hgpPop 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          background: 'var(--surface-card)',
          border: '1px solid var(--gold-border)',
          borderTop: '3px solid var(--red)',
          padding: '30px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 22,
            color: 'var(--red-bright)',
          }}
        >
          대회 삭제
        </div>
        <div
          style={{
            fontFamily: 'var(--font-kr)',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--text)',
          }}
        >
          <b style={{ color: 'var(--gold-light)' }}>{tournament.name}</b> 대회를 정말
          삭제하시겠습니까?
          <br />
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            티어 구성과 당첨 기록이 모두 삭제되며 되돌릴 수 없습니다.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button
            className="btn-gold-outline"
            onClick={onClose}
            disabled={busy}
            style={{ flex: 1, padding: 13, fontSize: 14 }}
          >
            취소
          </button>
          <button
            className="btn-red-tint"
            onClick={confirm}
            disabled={busy}
            style={{
              flex: 1,
              padding: 13,
              fontSize: 14,
              fontWeight: 900,
              opacity: busy ? 0.7 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewTournamentCard() {
  const navigate = useNavigate();
  const { createTournament } = useBounty();

  const handleCreate = async () => {
    const name = window.prompt('새 대회 이름을 입력하세요.', 'HGP 미스터리 바운티')?.trim();
    if (!name) return;
    try {
      await createTournament(name);
      navigate('/setup');
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '대회 생성에 실패했습니다.');
    }
  };

  return (
    <button
      onClick={handleCreate}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(233,200,126,0.08)';
        e.currentTarget.style.borderColor = 'var(--gold)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--gold-border)';
      }}
      style={{
        minHeight: 180,
        background: 'transparent',
        border: '2px dashed var(--gold-border)',
        color: 'var(--text)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        transition: 'all 0.18s',
      }}
    >
      {/* 각진 모서리가 브랜드 규칙이지만, '더하기'는 원형이 관례라 여기만 예외로 둔다 */}
      <div
        style={{
          width: 52,
          height: 52,
          background: 'transparent',
          border: '1px solid var(--gold-border-strong)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 800,
          color: 'var(--gold)',
        }}
      >
        +
      </div>
      <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 18 }}>새 대회 만들기</div>
    </button>
  );
}
