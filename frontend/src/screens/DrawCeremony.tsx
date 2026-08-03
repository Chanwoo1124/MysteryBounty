import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { FxOverlay } from '@/components/FxOverlay';
import { useCountUp } from '@/lib/useCountUp';
import { formatKr, intensityOf } from '@/lib/format';
import { ApiError } from '@/api/client';
import type { DrawPhase, DrawResult } from '@/lib/types';

const HANDOFF_MS = 1800;
const SHAKE_MS = 1700;

const REVEAL_LABEL = {
  jackpot: { text: '★ JACKPOT TREASURE ★', color: '#F5C64A' },
  mid: { text: '— BOUNTY WON —', color: '#FFE9A8' },
  low: { text: 'BOUNTY', color: 'rgba(247,241,227,0.7)' },
} as const;

/**
 * 직원↔플레이어가 한 태블릿을 돌려쓰는 추첨 연출.
 *
 * 상태 머신: staff → handoff(자동 1.8s) → armed → shaking(1.7s) → reveal → confirm → 현황판 복귀
 * 현황판에서 진입할 때는 staff 단계를 건너뛰고 바로 armed 로 시작한다.
 * (staff/handoff 단계는 운영 방식이 바뀔 때 재활성화할 수 있도록 머신에 남겨둔다)
 */
export function DrawCeremony() {
  const navigate = useNavigate();
  const { currentTournamentId, draw, confirmDraw } = useBounty();

  const [phase, setPhase] = useState<DrawPhase>('armed');
  const [result, setResult] = useState<DrawResult | null>(null);
  const [fxKey, setFxKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const amount = result?.amount ?? 0;
  const level = intensityOf(amount);
  const [count, countDone] = useCountUp(amount, 1600, phase === 'reveal');

  // 선택된 대회가 없으면 목록으로
  useEffect(() => {
    if (!currentTournamentId) navigate('/dashboard');
  }, [currentTournamentId, navigate]);

  // 화면을 벗어나면 예약된 전이를 취소한다
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const staffReady = () => {
    setPhase('handoff');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPhase('armed'), HANDOFF_MS);
  };

  /** 상자 클릭 — armed 상태에서만 동작하며, 즉시 shaking 으로 전이돼 재클릭이 막힌다 */
  const pull = useCallback(async () => {
    if (phase !== 'armed') return;
    setPhase('shaking');

    try {
      // 당첨 결과는 서버가 결정한다(가중 랜덤 + 차감 + PENDING). 프론트는 받아온 값으로 연출만.
      const drawn = await draw();
      setResult(drawn);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFxKey((k) => k + 1);
        setPhase('reveal');
      }, SHAKE_MS);
    } catch (err) {
      // 잔여 티켓 없음 / 확인 대기 중 등 추첨 실패 — 다시 뽑을 수 있도록 되돌린다
      window.alert(err instanceof ApiError ? err.message : '추첨에 실패했습니다.');
      setPhase('armed');
    }
  }, [phase, draw]);

  /** 확인 — 서버에 확정(PENDING→CONFIRMED) 후 현황판 복귀 */
  const handleConfirm = async () => {
    if (!result) return;
    try {
      await confirmDraw(result.drawId);
      navigate('/board');
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '확정에 실패했습니다.');
    }
  };

  const showCase = phase === 'armed' || phase === 'shaking';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 640,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(245,198,74,0.1), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {phase === 'staff' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 30,
            position: 'relative',
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.4em',
              color: 'var(--text-dim)',
            }}
          >
            STAFF ONLY // 직원 단계
          </div>
          <button
            onClick={staffReady}
            style={{
              padding: '34px 90px',
              background: 'linear-gradient(180deg, #8A1620, #5C0D14)',
              border: '2px solid var(--gold)',
              color: 'var(--gold-light)',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 34,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(200,30,46,0.4)',
              transition: 'all 0.15s',
            }}
          >
            추첨 준비
          </button>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-kr)',
            }}
          >
            칩 수령 확인 후 버튼을 눌러주세요
          </div>
        </div>
      )}

      {phase === 'handoff' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            animation: 'hgpPop 0.4s ease-out',
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              border: '3px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              color: 'var(--gold)',
              animation: 'hgpPulse 1.2s infinite',
            }}
          >
            ✓
          </div>
          <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 34, color: 'var(--gold-light)' }}>
            준비 완료
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: 'var(--gold)',
              fontFamily: 'var(--font-kr)',
            }}
          >
            플레이어에게 화면을 넘겨주세요
          </div>
        </div>
      )}

      {showCase && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 44,
            position: 'relative',
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.4em',
              color: 'var(--gold)',
            }}
          >
            ★ MYSTERY TREASURE ★
          </div>

          {/* 상자 자체가 뽑기 버튼 */}
          <div
            onClick={pull}
            role="button"
            tabIndex={phase === 'armed' ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                void pull();
              }
            }}
            onMouseEnter={(e) => {
              if (phase === 'armed') e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
            style={{
              position: 'relative',
              width: 340,
              height: 268,
              cursor: phase === 'armed' ? 'pointer' : 'default',
              animation: phase === 'shaking' ? 'hgpShake 0.16s linear infinite' : 'none',
              filter:
                'drop-shadow(0 24px 50px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(245,198,74,0.3))',
              transition: 'transform 0.15s',
            }}
          >
            <img
              src="/assets/chest-3d.png"
              alt="미스터리 보물상자"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--gold)',
                color: 'var(--gold-ink)',
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: '0.24em',
                padding: '6px 20px',
                zIndex: 3,
              }}
            >
              SEALED
            </div>
          </div>

          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: '0.14em',
              color: 'var(--gold-light)',
              animation: 'hgpPulse 1.6s infinite',
            }}
          >
            {phase === 'shaking' ? 'OPENING...' : '상자를 눌러 뽑기 ↑'}
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            position: 'relative',
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: '0.5em',
              color: REVEAL_LABEL[level].color,
              animation: 'hgpPop 0.5s ease-out',
            }}
          >
            {REVEAL_LABEL[level].text}
          </div>
          <div
            className="gold-text"
            style={{
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 'clamp(90px, 14vw, 190px)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              filter: 'drop-shadow(0 0 40px rgba(245,198,74,0.6))',
              animation: 'hgpPop 0.6s ease-out',
            }}
          >
            {formatKr(count)}
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.1em',
              color: 'rgba(247,241,227,0.55)',
            }}
          >
            ₩ {count.toLocaleString()}
          </div>

          {/* 카운트업이 끝나야 확인 버튼이 열린다 (잘못 뽑았으면 확정 후 당첨 기록에서 되돌리기) */}
          {countDone && (
            <button
              className="btn-gold"
              onClick={handleConfirm}
              style={{
                marginTop: 18,
                padding: '18px 80px',
                fontSize: 20,
                letterSpacing: '0.14em',
                animation: 'hgpPop 0.4s ease-out',
              }}
            >
              확인 // CONFIRM
            </button>
          )}
        </div>
      )}

      {phase === 'reveal' && <FxOverlay level={level} fxKey={fxKey} />}
    </div>
  );
}
