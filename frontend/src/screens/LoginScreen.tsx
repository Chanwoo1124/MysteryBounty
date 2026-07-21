import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 관리자 전용 로그인 (회원가입 없음).
 * 이 화면만 HGP 레드·블루·블랙 브랜드 무드를 쓰고, 나머지 화면은 골드/보물상자 무드다.
 */
export function LoginScreen() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: 실제 인증 API 연동
    navigate('/dashboard');
  };

  const inputStyle = (accent: string) => ({
    width: '100%',
    padding: '16px 18px',
    background: 'var(--surface-input-login)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderLeft: `3px solid ${accent}`,
    color: 'var(--text-login)',
    fontFamily: 'var(--font)',
    fontSize: 15,
    fontWeight: 600,
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 640,
        background: 'var(--bg-login)',
      }}
    >
      {/* 배경 장식: 좌상단 레드 / 우하단 블루 그라데이션 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-10%',
          width: '55%',
          height: '100%',
          background: 'linear-gradient(115deg, rgba(217,30,42,0.14) 0%, rgba(217,30,42,0) 55%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: '-10%',
          width: '55%',
          height: '100%',
          background: 'linear-gradient(295deg, rgba(27,79,156,0.16) 0%, rgba(27,79,156,0) 55%)',
          pointerEvents: 'none',
        }}
      />
      {/* 우상단 스피드 라인 */}
      <div style={{ position: 'absolute', top: '12%', right: '8%', display: 'flex', gap: 14 }}>
        {['#D91E2A', '#D91E2A', '#1B4F9C'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 120, background: c, transform: 'skewX(-24deg)' }} />
        ))}
      </div>

      <div
        style={{
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <img
          src="/assets/hgp-logo.png"
          alt="HOLD'EM GRAND PRIX"
          style={{ width: 280, marginBottom: 14 }}
        />
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.34em',
            color: 'rgba(245,245,247,0.55)',
            marginBottom: 42,
          }}
        >
          MYSTERY BOUNTY SYSTEM
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <input
            type="text"
            placeholder="관리자 아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            style={inputStyle('var(--red-login)')}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={inputStyle('var(--blue)')}
          />
          <button
            type="submit"
            className="skew"
            style={{
              marginTop: 14,
              padding: 17,
              background: 'var(--red-login)',
              border: 'none',
              color: '#FFFFFF',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: '0.14em',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(217,30,42,0.35)',
              transition: 'all 0.15s',
            }}
          >
            <span className="unskew">LOGIN //</span>
          </button>
        </form>

        <div
          style={{
            marginTop: 26,
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(245,245,247,0.35)',
            fontFamily: 'var(--font-kr)',
          }}
        >
          관리자 전용 시스템 · 계정 문의는 본부에
        </div>
      </div>
    </div>
  );
}
