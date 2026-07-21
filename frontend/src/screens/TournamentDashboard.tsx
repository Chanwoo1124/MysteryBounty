import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { formatKr } from '@/lib/format';
import type { Tournament, TournamentStatus } from '@/lib/types';

/** 상태별 컬러/라벨 매핑 */
const STATUS_STYLE: Record<
  TournamentStatus,
  { badgeColor: string; badgeBg: string; accent: string; openLabel: string; openTo: string }
> = {
  진행중: {
    badgeColor: '#F5C64A',
    badgeBg: 'rgba(245,198,74,0.12)',
    accent: '#F5C64A',
    openLabel: '현황판 열기',
    openTo: '/board',
  },
  준비중: {
    badgeColor: '#EF9A4A',
    badgeBg: 'rgba(239,154,74,0.12)',
    accent: '#C9962B',
    openLabel: '세팅 열기',
    openTo: '/setup',
  },
  종료: {
    badgeColor: 'rgba(247,241,227,0.4)',
    badgeBg: 'transparent',
    accent: 'rgba(212,168,84,0.25)',
    openLabel: '기록 보기',
    openTo: '/results',
  },
};

export function TournamentDashboard() {
  const { tournaments } = useBounty();

  return (
    <div style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
      <div className="screen-title-row" style={{ marginBottom: 6 }}>
        <div className="screen-title" style={{ fontSize: 34, letterSpacing: '-0.01em' }}>
          내 대회
        </div>
        <div className="screen-title-en">MY TOURNAMENTS</div>
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
          <TournamentCard key={t.id} tournament={t} />
        ))}
        <NewTournamentCard />
      </div>
    </div>
  );
}

function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const navigate = useNavigate();
  const s = STATUS_STYLE[t.status];

  return (
    <div
      onClick={() => navigate(s.openTo)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#F5C64A';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,168,84,0.3)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid rgba(212,168,84,0.3)',
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
        <div style={{ fontWeight: 900, fontStyle: 'italic', fontSize: 19 }}>{t.name}</div>
        <div
          className="skew"
          style={{
            flexShrink: 0,
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
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        <Stat label="총 상금">
          <div className="gold-text-sm" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 24 }}>
            {formatKr(t.totalPrize)}
          </div>
        </Stat>
        <Stat label="남은 티켓">
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 24,
              color: t.status === '진행중' ? 'var(--gold-light)' : 'rgba(247,241,227,0.6)',
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

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-gold-outline"
          style={{ flex: 1, padding: 11, fontSize: 13 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/setup');
          }}
        >
          대회 수정
        </button>
        <button
          className="btn-red-tint"
          style={{ flex: 1, padding: 11, fontSize: 13 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(s.openTo);
          }}
        >
          {s.openLabel}
        </button>
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

function NewTournamentCard() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/setup')}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(200,30,46,0.15)';
        e.currentTarget.style.borderColor = '#C81E2E';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(200,30,46,0.07)';
        e.currentTarget.style.borderColor = 'rgba(200,30,46,0.6)';
      }}
      style={{
        minHeight: 180,
        background: 'rgba(200,30,46,0.07)',
        border: '2px dashed rgba(200,30,46,0.6)',
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
      <div
        style={{
          width: 52,
          height: 52,
          background: 'var(--red)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 800,
          color: '#FFFFFF',
          boxShadow: '0 4px 18px rgba(200,30,46,0.45)',
        }}
      >
        +
      </div>
      <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 18 }}>새 대회 만들기</div>
    </button>
  );
}
