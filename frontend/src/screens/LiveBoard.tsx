import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { ChestImage } from '@/components/ChestImage';
import { TierCard } from '@/components/TierCard';
import { formatKr } from '@/lib/format';
import { ApiError } from '@/api/client';

/**
 * 대형 디스플레이용 메인 현황판.
 * 남은 총 상금과 금액대별 잔여를 한눈에 보여준다. 대형 숫자는 clamp() 로 스케일한다.
 */
export function LiveBoard() {
  const navigate = useNavigate();
  const { tiers, remainingPrize, remainingTickets, currentTournamentId, pendingDrawId, loadBoard, cancelDraw } =
    useBounty();

  // 진입 시 현황을 불러온다. (같은 기기에서 추첨하므로 별도 폴링 없이 액션 직후 재조회로 충분)
  useEffect(() => {
    if (!currentTournamentId) {
      navigate('/dashboard');
      return;
    }
    loadBoard().catch((err) => {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    });
  }, [currentTournamentId, loadBoard, navigate]);

  // 확인하지 않고 이탈한 추첨(PENDING)이 남아 다음 추첨을 막을 때, 여기서 취소해 티켓을 되돌린다.
  const cancelPending = () => {
    if (pendingDrawId == null) return;
    if (!window.confirm('확인되지 않은 대기 추첨을 취소하고 티켓을 되돌릴까요?')) return;
    cancelDraw(pendingDrawId).catch((err) => {
      window.alert(err instanceof ApiError ? err.message : '취소에 실패했습니다.');
    });
  };

  // 최고 금액대는 잭팟 배너로 따로 강조하고, 나머지는 그리드로
  const [jackpot, ...restTiers] = tiers;
  const showJackpotBanner = jackpot && jackpot.left > 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 44px 34px',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(245,198,74,0.1), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <img src="/assets/hgp-logo.png" alt="HGP" style={{ height: 40 }} />
        <div
          style={{
            width: 2,
            height: 32,
            background: 'rgba(212,168,84,0.4)',
            transform: 'skewX(-18deg)',
          }}
        />
        <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 22 }}>
          MYSTERY BOUNTY <span style={{ color: 'var(--gold)' }}>TREASURE</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-gold-outline"
          style={{
            marginLeft: 'auto',
            padding: '10px 18px',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.08em',
          }}
        >
          ← 내 대회 목록
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: '0.2em',
            color: 'var(--red-bright)',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: 'var(--red-bright)',
              borderRadius: '50%',
              animation: 'hgpPulse 1.4s infinite',
            }}
          />
          LIVE
        </div>
      </div>

      {/* 확인 대기 중인 추첨(PENDING) 경고 — 취소해 티켓 복구 */}
      {pendingDrawId != null && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 18px',
            background: 'rgba(200,30,46,0.14)',
            border: '1px solid rgba(200,30,46,0.55)',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-kr)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--gold-light)',
            }}
          >
            ⚠ 확인되지 않은 대기 추첨이 있어 다음 추첨이 막혀 있습니다.
          </div>
          <button
            onClick={cancelPending}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,30,46,0.3)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(247,241,227,0.9)';
            }}
            style={{
              marginLeft: 'auto',
              padding: '9px 20px',
              background: 'transparent',
              border: '1px solid rgba(200,30,46,0.7)',
              color: 'rgba(247,241,227,0.9)',
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ↺ 대기 추첨 취소
          </button>
        </div>
      )}

      {/* TOTAL REMAINING 배너 */}
      <div
        style={{
          margin: '24px auto 8px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, #8A1620, #5C0D14)',
            border: '2px solid var(--gold)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,233,168,0.4)',
            padding: '8px 46px',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: '0.32em',
            color: 'var(--gold-light)',
          }}
        >
          TOTAL REMAINING
        </div>
        <div
          className="gold-text"
          style={{
            marginTop: 6,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 'clamp(70px, 10.5vw, 145px)',
            lineHeight: 1.04,
            letterSpacing: '-0.01em',
            filter: 'drop-shadow(0 4px 24px rgba(245,198,74,0.35))',
            animation: 'hgpGoldGlow 3s ease-in-out infinite',
          }}
        >
          {formatKr(remainingPrize)}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '0.14em',
            color: 'var(--text-dim)',
          }}
        >
          ₩ {remainingPrize.toLocaleString()} · 남은 티켓 {remainingTickets}장
        </div>
      </div>

      {/* 잭팟 배너 — 잔여가 있을 때만 */}
      {showJackpotBanner && (
        <div
          style={{
            position: 'relative',
            margin: '16px 0 24px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 'min(820px, 100%)',
              background: 'linear-gradient(115deg, #2A1608 0%, #1A0F05 55%, #241205 100%)',
              border: '2px solid rgba(245,198,74,0.8)',
              padding: '24px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              animation: 'hgpGoldGlow 2.6s ease-in-out infinite',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                height: 6,
                background: 'linear-gradient(90deg, #FFE9A8, #F5C64A 40%, #B8860B)',
              }}
            />
            <ChestImage width={150} height={118} left={jackpot.left} badgeSize={44} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontStyle: 'italic',
                  fontWeight: 900,
                  fontSize: 16,
                  letterSpacing: '0.32em',
                  color: 'var(--gold)',
                }}
              >
                ★ JACKPOT TREASURE ★
              </div>
              <div
                className="gold-text-sm"
                style={{
                  fontStyle: 'italic',
                  fontWeight: 900,
                  fontSize: 'clamp(46px, 6vw, 74px)',
                  lineHeight: 1,
                }}
              >
                {formatKr(jackpot.amount)}
              </div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  color: 'var(--text-dim)',
                }}
              >
                REMAINING
              </div>
              <div
                style={{
                  fontStyle: 'italic',
                  fontWeight: 900,
                  fontSize: 40,
                  color: 'var(--gold-light)',
                }}
              >
                {jackpot.left}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 금액대별 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 18,
          position: 'relative',
        }}
      >
        {restTiers.map((tier, i) => (
          <TierCard key={`${tier.amount}-${i}`} tier={tier} />
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 26, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/draw')}
          disabled={remainingTickets === 0}
          onMouseEnter={(e) => {
            if (remainingTickets > 0) e.currentTarget.style.background = 'rgba(245,198,74,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          style={{
            padding: '16px 60px',
            background: 'transparent',
            border: '2px solid var(--gold)',
            color: 'var(--gold-light)',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: '0.16em',
            cursor: remainingTickets === 0 ? 'not-allowed' : 'pointer',
            opacity: remainingTickets === 0 ? 0.4 : 1,
            transition: 'all 0.15s',
          }}
        >
          추첨 진행 → DRAW
        </button>
      </div>
    </div>
  );
}
