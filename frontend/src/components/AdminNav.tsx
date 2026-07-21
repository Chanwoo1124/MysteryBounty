import { NavLink } from 'react-router-dom';

/** 현장 운영용 상단 화면 전환 바. 대형 스크린 송출 시에는 숨긴다. */
const NAV_ITEMS = [
  { to: '/login', label: '01 로그인' },
  { to: '/dashboard', label: '02 대회 목록' },
  { to: '/setup', label: '03 티켓 구성' },
  { to: '/board', label: '04 현황판' },
  { to: '/draw', label: '05 추첨' },
  { to: '/results', label: '06 당첨 기록' },
];

export function AdminNav() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 18px',
        background: 'rgba(14,9,3,0.9)',
        borderBottom: '1px solid rgba(212,168,84,0.25)',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      <img src="/assets/hgp-logo.png" alt="HGP" style={{ height: 26, marginRight: 10 }} />
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            fontFamily: 'var(--font)',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.04em',
            padding: '7px 14px',
            border: `1px solid ${isActive ? 'transparent' : 'rgba(212,168,84,0.3)'}`,
            background: isActive ? 'var(--gold-btn-gradient)' : 'transparent',
            color: isActive ? 'var(--gold-ink)' : 'rgba(247,241,227,0.55)',
            cursor: 'pointer',
            transform: 'skewX(-12deg)',
            transition: 'all 0.15s',
          })}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>{item.label}</span>
        </NavLink>
      ))}
      <div
        style={{
          marginLeft: 'auto',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'rgba(245,198,74,0.5)',
        }}
      >
        ADMIN CONSOLE
      </div>
    </div>
  );
}
