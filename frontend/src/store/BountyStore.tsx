import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { HistoryEntry, SetupRow, Tier, Tournament } from '@/lib/types';
import { manToWon, nowHHMM } from '@/lib/format';

/**
 * 서버 소유 상태(tiers / history)의 프론트 캐시.
 * 백엔드가 붙으면 이 컨텍스트의 초기값과 갱신 함수를 API 호출로 교체한다.
 */

interface BountyState {
  tiers: Tier[];
  history: HistoryEntry[];
  rows: SetupRow[];
  tournaments: Tournament[];
  /** 파생값: 남은 총 상금 (원) */
  remainingPrize: number;
  /** 파생값: 남은 티켓 수 */
  remainingTickets: number;
  /** 파생값: 전체 티켓 수 */
  totalTickets: number;
  setRows: (rows: SetupRow[]) => void;
  /** 티켓 구성을 확정해 티어로 반영 (대회 시작) */
  commitRows: () => void;
  /** 추첨 확정 — 티켓 차감 + 기록 추가 */
  commitDraw: (tierIndex: number, amount: number) => void;
  /** 당첨자 정보 수동 입력 */
  addRecord: (entry: Omit<HistoryEntry, 'time'>) => void;
}

const BountyContext = createContext<BountyState | null>(null);

/** 대회 목록 — 백엔드 연동 전까지 빈 목록 (안정적인 참조 유지용 모듈 상수) */
const EMPTY_TOURNAMENTS: Tournament[] = [];

/**
 * 초기 상태는 모두 비어 있으며, 백엔드 연동 시 API 응답으로 채운다.
 * (tiers / history 는 서버 소유 상태, rows 는 셋업 화면 입력값)
 */
export function BountyProvider({ children }: { children: ReactNode }) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [rows, setRows] = useState<SetupRow[]>([]);

  const remainingPrize = useMemo(
    () => tiers.reduce((a, t) => a + t.left * t.amount, 0),
    [tiers],
  );
  const remainingTickets = useMemo(() => tiers.reduce((a, t) => a + t.left, 0), [tiers]);
  const totalTickets = useMemo(() => tiers.reduce((a, t) => a + t.total, 0), [tiers]);

  const commitRows = useCallback(() => {
    setTiers(
      rows
        .filter((r) => r.amount > 0 && r.count > 0)
        .map((r) => ({ amount: manToWon(r.amount), total: r.count, left: r.count }))
        .sort((a, b) => b.amount - a.amount),
    );
  }, [rows]);

  const commitDraw = useCallback((tierIndex: number, amount: number) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === tierIndex ? { ...t, left: Math.max(0, t.left - 1) } : t)),
    );
    // 당첨자 정보는 아직 미입력 상태로 기록만 남긴다 (ResultsLog에서 채움)
    setHistory((prev) => [
      ...prev,
      { time: nowHHMM(), amount, name: '', phone: '', ssn: '', account: '' },
    ]);
  }, []);

  const addRecord = useCallback((entry: Omit<HistoryEntry, 'time'>) => {
    setHistory((prev) => [...prev, { time: nowHHMM(), ...entry }]);
  }, []);

  // 대회 목록 — 백엔드에서 받아온다
  const tournaments = EMPTY_TOURNAMENTS;

  const value = useMemo<BountyState>(
    () => ({
      tiers,
      history,
      rows,
      tournaments,
      remainingPrize,
      remainingTickets,
      totalTickets,
      setRows,
      commitRows,
      commitDraw,
      addRecord,
    }),
    [
      tiers,
      history,
      rows,
      tournaments,
      remainingPrize,
      remainingTickets,
      totalTickets,
      commitRows,
      commitDraw,
      addRecord,
    ],
  );

  return <BountyContext.Provider value={value}>{children}</BountyContext.Provider>;
}

export function useBounty(): BountyState {
  const ctx = useContext(BountyContext);
  if (!ctx) throw new Error('useBounty 는 BountyProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
