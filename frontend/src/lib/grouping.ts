import type { HistoryEntry } from './types';

export interface PersonGroup extends HistoryEntry {
  /** 당첨 횟수 */
  count: number;
  /** 합계 금액 (원) */
  total: number;
  /** 당첨 시각 목록 */
  timeList: string[];
}

/**
 * 동일인 합산 — `이름|전화번호` 를 키로 묶는다.
 * 이름이 없는 건(추첨에서 자동 생성되어 아직 정보 미입력)은 합산하지 않고 개별 행으로 둔다.
 */
export function groupByPerson(history: HistoryEntry[]): PersonGroup[] {
  const groups: PersonGroup[] = [];
  const byKey: Record<string, PersonGroup> = {};

  history.forEach((h, i) => {
    const key = h.name ? `${h.name}|${h.phone}` : `#${i}`;
    let g = byKey[key];
    if (!g) {
      g = { ...h, count: 0, total: 0, timeList: [] };
      byKey[key] = g;
      groups.push(g);
    }
    g.count += 1;
    g.total += h.amount;
    g.timeList.push(h.time);
  });

  return groups;
}
