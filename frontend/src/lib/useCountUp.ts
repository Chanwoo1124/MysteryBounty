import { useEffect, useRef, useState } from 'react';

/** easeOutCubic — 빠르게 시작해 부드럽게 멈춘다 */
const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);

/**
 * 0에서 target 까지 duration 동안 카운트업한다.
 *
 * 탭이 백그라운드로 가면 rAF/타이머가 지연돼 최종값에 도달하지 못할 수 있으므로,
 * duration + 여유시간 뒤 최종값을 강제로 확정하는 안전 타임아웃을 함께 건다.
 *
 * @returns [현재 표시값, 완료 여부]
 */
export function useCountUp(target: number, duration = 1600, enabled = true): [number, boolean] {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      setDone(false);
      return;
    }

    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / duration);
      setValue(Math.round(target * easeOutCubic(p)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    timeoutRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setValue(target);
      setDone(true);
    }, duration + 150);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [target, duration, enabled]);

  return [value, done];
}
