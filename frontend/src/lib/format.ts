import type { Intensity } from './types';

/**
 * 원 단위 금액을 한국식 축약 표기로 변환한다.
 * 예: 83_500_000 → '8,350만', 150_000_000 → '1억 5,000만'
 */
export function formatKr(n: number): string {
  if (!n) return '0원';
  const eok = Math.floor(n / 100_000_000);
  const man = Math.round((n % 100_000_000) / 10_000);
  let s = '';
  if (eok) s += `${eok}억`;
  if (man) s += `${s ? ' ' : ''}${man.toLocaleString()}만`;
  return s || '0원';
}

/** 금액 기준 연출 강도 — 잭팟 2,000만 이상 / 중간 100만 이상 / 그 외 소액 */
export function intensityOf(amount: number): Intensity {
  if (amount >= 20_000_000) return 'jackpot';
  if (amount >= 1_000_000) return 'mid';
  return 'low';
}

/** 현재 시각을 'HH:MM' 으로 */
export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 'YYYYMMDD' — 파일명용 */
export function todayYMD(): string {
  const d = new Date();
  return (
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  );
}

/** 만원 단위 입력을 원 단위로 */
export const manToWon = (man: number): number => man * 10_000;
