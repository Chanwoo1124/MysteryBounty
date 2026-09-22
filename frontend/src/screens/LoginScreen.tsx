import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { ApiError } from '@/api/client';

/**
 * 관리자 전용 로그인 (회원가입 없음).
 * 현황판과 같은 잉크·크림·골드 팔레트(board-skin)를 쓴다.
 */
export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useBounty();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(id, pw);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 17px',
    background: 'var(--surface-input)',
    border: '1px solid var(--gold-border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-kr)',
    fontSize: 16,
    fontWeight: 600,
  } as const;

  // 라벨은 한 단계 물러선 크림 — 골드는 상단 획·포커스·LOGIN 버튼에만 쓴다
  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    fontFamily: 'var(--font-kr)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--text-dim)',
  } as const;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 640,
        padding: 24,
      }}
    >
      {/* 배경 장식: 바닥에 깔린 거대한 로고 워터마크 (현황판 배경과 같은 수법) */}
      <img
        src="/assets/hgp-logo.png"
        alt=""
        style={{
          position: 'absolute',
          left: '-4%',
          bottom: '6%',
          width: 420,
          opacity: 0.04,
          filter: 'grayscale(1) brightness(2.4)',
          pointerEvents: 'none',
        }}
      />
      {/* 우상단 스피드 라인 — 브랜드 모티프는 남기고 색만 골드 계열로 */}
      <div
        style={{
          position: 'absolute',
          top: '13%',
          right: '9%',
          display: 'flex',
          gap: 14,
          pointerEvents: 'none',
        }}
      >
        {[0.5, 0.28, 0.12].map((o, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 118,
              background: 'var(--gold)',
              opacity: o,
              transform: 'skewX(-24deg)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          width: 'min(404px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <img
          src="/assets/hgp-logo.png"
          alt="HOLD'EM GRAND PRIX"
          style={{ width: 252, marginBottom: 12, mixBlendMode: 'screen' }}
        />
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.34em',
            textIndent: '0.34em',
            color: 'var(--gold-dark)',
            marginBottom: 34,
          }}
        >
          MYSTERY BOUNTY SYSTEM
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            position: 'relative',
            width: '100%',
            background: 'var(--surface-card)',
            border: '1px solid var(--gold-border)',
            padding: '30px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxShadow: '0 24px 70px rgba(0,0,0,0.65)',
          }}
        >
          {/* 상단 골드 획 — 당첨자 정보 창과 같은 모티프 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                'linear-gradient(90deg, var(--gold), rgba(233,200,126,0.2) 62%, transparent)',
            }}
          />

          <label style={labelStyle}>
            관리자 아이디
            <input
              className="field-input"
              type="text"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={busy}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            비밀번호
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              disabled={busy}
              style={inputStyle}
            />
          </label>

          {/* 오류는 팔레트와 별개인 경고 신호라 빨강을 그대로 쓴다 */}
          {error && (
            <div
              role="alert"
              style={{
                fontFamily: 'var(--font-kr)',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.5,
                color: 'var(--red-bright)',
                background: 'rgba(200,30,46,0.08)',
                borderLeft: '2px solid var(--red)',
                padding: '10px 12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-gold skew"
            disabled={busy}
            style={{
              marginTop: 6,
              padding: 16,
              fontSize: 16,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            <span className="unskew">{busy ? 'SIGNING IN…' : 'LOGIN //'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-faint)',
            fontFamily: 'var(--font-kr)',
          }}
        >
          관리자 전용 시스템 · 계정 문의는 본부에
        </div>
      </div>
    </div>
  );
}
