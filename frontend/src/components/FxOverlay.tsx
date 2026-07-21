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

const COUNTS: Record<Intensity, { rays: number; sparks: number; coins: number }> = {
  jackpot: { rays: 14, sparks: 70, coins: 40 },
  mid: { rays: 8, sparks: 30, coins: 14 },
  low: { rays: 4, sparks: 12, coins: 0 },
};

export function FxOverlay({ level, fxKey }: FxOverlayProps) {
  const particles = useMemo(() => {
    const { rays, sparks, coins } = COUNTS[level];
    const nodes: { key: string; style: CSSProperties }[] = [];

    // 중앙에서 뻗는 골드 광선
    for (let i = 0; i < rays; i += 1) {
      nodes.push({
        key: `r${i}`,
        style: {
          position: 'absolute',
          left: '50%',
          top: '52%',
          width: `${3 + Math.random() * 6}px`,
          height: level === 'jackpot' ? '90vh' : '55vh',
          background: 'linear-gradient(180deg, rgba(255,233,168,0.9), rgba(255,233,168,0))',
          transformOrigin: 'center top',
          ['--rot' as string]: `${i * (360 / rays)}deg`,
          animation: `hgpRay ${0.9 + Math.random() * 0.6}s ease-out ${Math.random() * 0.3}s both`,
        },
      });
    }

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
              ? 'radial-gradient(circle at 50% 55%, rgba(255,233,168,0.75), rgba(200,30,46,0.35) 55%, transparent 80%)'
              : 'radial-gradient(circle at 50% 55%, rgba(255,233,168,0.4), transparent 60%)',
          animation: `hgpFlash ${level === 'jackpot' ? 1.3 : 0.7}s ease-out both`,
        },
      });
    }

    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, fxKey]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => (
        <div key={p.key} style={p.style} />
      ))}
    </div>
  );
}
