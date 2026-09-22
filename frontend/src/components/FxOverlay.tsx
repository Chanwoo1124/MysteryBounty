import { useMemo, type CSSProperties } from 'react';
import type { Intensity } from '@/lib/types';

/**
 * 당첨 연출 파티클 오버레이.
 *
 * 파티클 좌표/딜레이는 난수라, 리렌더마다 재생성되면 애니메이션이 처음부터 다시 시작한다.
 * 카운트업이 33ms마다 상태를 갱신하므로 이 재생성이 곧 연출 붕괴로 이어진다.
 * → fxKey 가 바뀔 때만 useMemo 로 1회 생성한다.
 */
interface FxOverlayProps {
  level: Intensity;
  /** 추첨 1회당 1 증가 — 파티클 재생성 트리거 */
  fxKey: number;
}

/**
 * 광선(ray)은 뺐다. 상자 영상이 이미 빛줄기를 내주는데 그 위에 또 겹치면
 * 화면을 가로지르는 밝은 막대로 남아 지저분해진다.
 */
const COUNTS: Record<Intensity, { sparks: number; coins: number }> = {
  jackpot: { sparks: 70, coins: 40 },
  // 100만원 이상은 '돈이 쏟아진다'가 보여야 한다 — 금화를 두 배로 늘렸다
  mid: { sparks: 36, coins: 28 },
  low: { sparks: 12, coins: 0 },
};

export function FxOverlay({ level, fxKey }: FxOverlayProps) {
  const particles = useMemo(() => {
    const { sparks, coins } = COUNTS[level];
    const nodes: { key: string; style: CSSProperties }[] = [];

    // 방사형 스파크 (일부는 레드)
    for (let i = 0; i < sparks; i += 1) {
      const warm = Math.random() > 0.3;
      const ang = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * (level === 'jackpot' ? 540 : 300);
      const size = 4 + Math.random() * 8;
      nodes.push({
        key: `s${i}`,
        style: {
          position: 'absolute',
          left: '50%',
          top: '52%',
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: warm
            ? 'radial-gradient(circle at 35% 35%, #FFF3CC, #F5C64A 60%, #B8860B)'
            : '#EF3340',
          ['--dx' as string]: `${Math.cos(ang) * dist}px`,
          ['--dy' as string]: `${Math.sin(ang) * dist}px`,
          animation: `hgpSpark ${0.6 + Math.random() * 0.9}s ease-out ${Math.random() * 0.35}s both`,
        },
      });
    }

    // 금화 낙하 — 잭팟은 무한 반복
    for (let i = 0; i < coins; i += 1) {
      const size = 14 + Math.random() * 18;
      nodes.push({
        key: `c${i}`,
        style: {
          position: 'absolute',
          top: 0,
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFF3CC, #F5C64A 55%, #9A6E10)',
          border: '1.5px solid #B8860B',
          boxShadow: '0 0 10px rgba(245,198,74,0.6)',
          animation: `hgpCoinFall ${1.4 + Math.random() * 1.6}s linear ${Math.random() * 1.2}s both${
            level === 'jackpot' ? ' infinite' : ''
          }`,
        },
      });
    }

    // 풀스크린 플래시 — 소액에는 없음
    if (level !== 'low') {
      nodes.push({
        key: 'flash',
        style: {
          position: 'absolute',
          inset: 0,
          background:
            level === 'jackpot'
              ? 'radial-gradient(circle at 50% 55%, rgba(255,233,168,0.32), rgba(200,30,46,0.18) 55%, transparent 80%)'
              : 'radial-gradient(circle at 50% 55%, rgba(255,233,168,0.18), transparent 60%)',
          animation: `hgpFlash ${level === 'jackpot' ? 1.3 : 0.7}s ease-out both`,
        },
      });
    }

    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, fxKey]);

  return (
    /* zIndex 로 상자 영상보다 확실히 위에 둔다. 아래에 깔리면 영상의 screen 합성에 섞여 상자가 허옇게 뜬다. */
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 4 }}>
      {particles.map((p) => (
        <div key={p.key} style={p.style} />
      ))}
    </div>
  );
}
