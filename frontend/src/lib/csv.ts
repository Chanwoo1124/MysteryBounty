import type { HistoryEntry } from './types';
import { todayYMD } from './format';
import { groupByPerson } from './grouping';

/** 엑셀이 UTF-8로 인식하게 하는 BOM. 없으면 한글이 깨진다. */
const BOM = '﻿';

const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * 당첨 기록을 CSV로 내보낸다.
 * 전체 기록 + 동일인 합산 두 섹션으로 구성된다.
 * (실서비스에서 .xlsx가 필요하면 SheetJS 등으로 교체)
 */
export function exportHistoryCsv(history: HistoryEntry[]): void {
  const rows: unknown[][] = [['시간', '이름', '전화번호', '주민번호', '계좌', '당첨 금액(원)']];
  history.forEach((h) => {
    rows.push([h.time, h.name || '미입력', h.phone, h.ssn, h.account, h.amount]);
  });

  rows.push([]);
  rows.push(['[동일인 합산]']);
  rows.push(['이름', '전화번호', '주민번호', '계좌', '당첨 횟수', '합계 금액(원)']);
  groupByPerson(history).forEach((g) => {
    rows.push([g.name || '미입력', g.phone, g.ssn, g.account, g.count, g.total]);
  });

  const csv = BOM + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HGP_당첨기록_${todayYMD()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
