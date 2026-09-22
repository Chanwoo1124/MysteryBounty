import type { Intensity } from './types';

/**
 * 원 단위 금액을 세 자리 콤마 표기로 변환한다.
 * 예: 83_500_000 → '83,500,000'
 *
 * '8,350만' 같은 축약은 쓰지 않는다. 한글 단위는 이탤릭이 없어 큰 글씨에서 뭉개지는 데다,
 * 상금 구조를 원 단위 그대로 보는 편이 운영에 맞다.
 */
export function formatWon(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

/** 금액 기준 연출 강도 — 잭팟 2,000만 이상 / 중간 100만 이상 / 그 외 소액 */
export function intensityOf(amount: number): Intensity {
  if (amount >= 20_000_000) return 'jackpot';
  if (amount >= 1_000_000) return 'mid';
  return 'low';
}

/** 만원 단위 입력을 원 단위로 */
export const manToWon = (man: number): number => man * 10_000;
