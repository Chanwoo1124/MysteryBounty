import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  DrawResult,
  RecordInput,
  SetupRow,
  Tier,
  Tournament,
  TournamentStatus,
  WinRecord,
} from '@/lib/types';
import { manToWon } from '@/lib/format';
import {
  api,
  type RecordRes,
  type TournamentStatusCode,
  type TournamentSummaryRes,
} from '@/api/client';

/**
 * 서버 소유 상태(대회/티어/기록)의 프론트 캐시 + API 연동 지점.
 *
 * 프로토타입은 "현재 선택된 대회 1개"를 기준으로 동작하므로, 대회 선택/생성 시
 * currentTournamentId 를 잡아두고(세션 스토리지에 보존) 각 화면이 이를 기준으로 조회한다.
 */

/* ── 백엔드 enum ↔ 화면 라벨 매핑 ── */
const STATUS_LABEL: Record<TournamentStatusCode, TournamentStatus> = {
  READY: '준비중',
  RUNNING: '진행중',
  FINISHED: '종료',
};

function toTournament(s: TournamentSummaryRes): Tournament {
  return {
    id: String(s.id),
    name: s.name,
    status: STATUS_LABEL[s.status],
    totalPrize: s.totalPrize,
    ticketsLeft: s.remainingTickets,
    ticketsTotal: s.totalTickets,
  };
}

function toWinRecord(r: RecordRes): WinRecord {
  return {
    id: r.id,
    time: r.drawnAt ? r.drawnAt.slice(11, 16) : '',
    amount: r.amount,
    name: r.winnerName ?? '',
    phone: r.winnerPhone ?? '',
  };
}

/* ── 현재 대회 ID 보존 (새로고침·키오스크 탭 대비) ── */
const CURRENT_KEY = 'hgp.currentTournamentId';
const readCurrentId = (): number | null => {
  const v = sessionStorage.getItem(CURRENT_KEY);
  return v ? Number(v) : null;
};

interface BountyState {
  /* 인증 */
  /** 세션 확인이 끝났는지 (앱 부팅 게이팅용) */
  authReady: boolean;
  /** 로그인 상태 */
  authed: boolean;
  /** 앱 시작 시 /me 로 세션 유지 여부 확인 */
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  /* 대회 */
  tournaments: Tournament[];
  currentTournamentId: number | null;
  loadTournaments: () => Promise<void>;
  createTournament: (name: string) => Promise<void>;
  deleteTournament: (id: number) => Promise<void>;
  /** 대회 이름 변경 */
  renameTournament: (id: number, name: string) => Promise<void>;
  /** 대회 종료 (status → FINISHED) */
  endTournament: (id: number) => Promise<void>;
  selectTournament: (id: number) => void;

  /* 티켓 구성 */
  rows: SetupRow[];
  setRows: (rows: SetupRow[]) => void;
  loadTiersIntoRows: () => Promise<void>;
  /** 티어 저장 + 대회 시작(RUNNING) */
  saveAndStart: () => Promise<void>;

  /* 현황판 (서버 소유 상태) */
  tiers: Tier[];
  /** 대회 전체 상금 — 추첨이 진행돼도 변하지 않는다 */
  totalPrize: number;
  remainingTickets: number;
  loadBoard: () => Promise<void>;

  /* 추첨 */
  /** 당첨자 이름·전화번호 뒷자리를 받아 추첨 (서버가 확정·차감·기록까지 끝낸다) */
  draw: (name: string, phoneLast4: string) => Promise<DrawResult>;

  /* 당첨 기록 (행별 편집/삭제) */
  winRecords: WinRecord[];
  stats: { totalPaid: number; drawCount: number; maxWin: number };
  loadRecords: () => Promise<void>;
  /** 기록 1건의 당첨자 정보·상금 수정 */
  updateRecord: (recordId: number, input: RecordInput) => Promise<void>;
  /** 기록 1건 삭제 (추첨 기록이면 티켓 복구) */
  deleteRecord: (recordId: number) => Promise<void>;
  exportRecords: () => Promise<void>;
}

const BountyContext = createContext<BountyState | null>(null);

export function BountyProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournamentId, setCurrentId] = useState<number | null>(readCurrentId);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [rows, setRows] = useState<SetupRow[]>([]);

  const [records, setRecords] = useState<RecordRes[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, drawCount: 0, maxWin: 0 });

  /* 파생값 — 티어 잔여에서 계산 */
  // 전체 상금은 total(발행 티켓 수) 기준이라 추첨을 해도 줄지 않는다
  const totalPrize = useMemo(() => tiers.reduce((a, t) => a + t.total * t.amount, 0), [tiers]);
  const remainingTickets = useMemo(() => tiers.reduce((a, t) => a + t.left, 0), [tiers]);

  /* 기록: 서버가 최신순(내림차순)으로 내려주며, 화면도 최신이 위로 */
  const winRecords = useMemo<WinRecord[]>(() => records.map(toWinRecord), [records]);

  /* ── 인증 ── */
  /** 앱 시작 시 /me 로 세션 유지 여부를 확인한다. */
  const checkAuth = useCallback(async () => {
    try {
      await api.auth.me();
      setAuthed(true);
    } catch {
      setAuthed(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    await api.auth.login(username, password);
    setAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    sessionStorage.removeItem(CURRENT_KEY);
    setCurrentId(null);
    setAuthed(false);
  }, []);

  /* ── 대회 ── */
  const loadTournaments = useCallback(async () => {
    setTournaments((await api.tournament.list()).map(toTournament));
  }, []);

  const selectTournament = useCallback((id: number) => {
    sessionStorage.setItem(CURRENT_KEY, String(id));
    setCurrentId(id);
  }, []);

  const createTournament = useCallback(
    async (name: string) => {
      const created = await api.tournament.create(name);
      selectTournament(created.id);
      setRows([]);
      setTiers([]);
    },
    [selectTournament],
  );

  /** 대회 삭제 — 기록·티어까지 서버에서 함께 삭제된다. 현재 선택 대회면 선택 해제. */
  const deleteTournament = useCallback(
    async (id: number) => {
      await api.tournament.remove(id);
      if (currentTournamentId === id) {
        sessionStorage.removeItem(CURRENT_KEY);
        setCurrentId(null);
      }
      await loadTournaments();
    },
    [currentTournamentId, loadTournaments],
  );

  /** 대회 이름 변경 */
  const renameTournament = useCallback(
    async (id: number, name: string) => {
      await api.tournament.update(id, { name });
      await loadTournaments();
    },
    [loadTournaments],
  );

  /** 대회 종료 (status → FINISHED) */
  const endTournament = useCallback(
    async (id: number) => {
      await api.tournament.update(id, { status: 'FINISHED' });
      await loadTournaments();
    },
    [loadTournaments],
  );

  /* ── 티켓 구성 ── */
  const loadTiersIntoRows = useCallback(async () => {
    if (!currentTournamentId) return;
    const list = await api.tier.list(currentTournamentId);
    // 원 → 만원 으로 되돌려 입력 폼에 채운다
    setRows(list.map((t) => ({ amount: t.amount / 10_000, count: t.totalCount })));
  }, [currentTournamentId]);

  const saveAndStart = useCallback(async () => {
    if (!currentTournamentId) throw new Error('선택된 대회가 없습니다.');
    const tierPayload = rows
      .filter((r) => r.amount > 0 && r.count > 0)
      .map((r) => ({ amount: manToWon(r.amount), count: r.count }));
    await api.tier.replace(currentTournamentId, tierPayload);
    await api.tournament.update(currentTournamentId, { status: 'RUNNING' });
  }, [currentTournamentId, rows]);

  /* ── 현황판 ── */
  const loadBoard = useCallback(async () => {
    if (!currentTournamentId) return;
    const board = await api.board.get(currentTournamentId);
    setTiers(board.tiers.map((t) => ({ amount: t.amount, total: t.totalCount, left: t.remainingCount })));
  }, [currentTournamentId]);

  /* ── 추첨 ── */
  /**
   * 뽑기 — 서버가 결과를 확정하고 티켓 차감·기록 저장까지 끝낸다.
   * 연출은 이미 끝난 결과를 보여주는 껍데기라 따로 확정 요청을 보내지 않는다.
   * 잘못 뽑은 건은 당첨 기록 화면에서 되돌리기(삭제)하면 티켓이 복구된다.
   */
  const draw = useCallback(
    async (name: string, phoneLast4: string): Promise<DrawResult> => {
      if (!currentTournamentId) throw new Error('선택된 대회가 없습니다.');
      const res = await api.draw.draw(currentTournamentId, {
        winnerName: name,
        winnerPhone: phoneLast4,
      });
      await loadBoard();
      return { amount: res.amount, drawId: res.drawId };
    },
    [currentTournamentId, loadBoard],
  );

  /* ── 당첨 기록 ── */
  const loadRecords = useCallback(async () => {
    if (!currentTournamentId) return;
    const res = await api.record.list(currentTournamentId);
    setRecords(res.records);
    setStats(res.stats);
  }, [currentTournamentId]);

  /** 기록 1건의 당첨자 정보·상금 수정 (PATCH) */
  const updateRecord = useCallback(
    async (recordId: number, input: RecordInput) => {
      await api.record.update(recordId, {
        winnerName: input.name,
        winnerPhone: input.phone,
      });
      await loadRecords();
    },
    [loadRecords],
  );

  /** 기록 1건 삭제 (추첨 기록이면 서버가 티켓을 복구) */
  const deleteRecord = useCallback(
    async (recordId: number) => {
      await api.record.remove(recordId);
      await loadRecords();
    },
    [loadRecords],
  );

  const exportRecords = useCallback(async () => {
    if (!currentTournamentId) return;
    await api.record.download(currentTournamentId);
  }, [currentTournamentId]);

  const value = useMemo<BountyState>(
    () => ({
      authReady,
      authed,
      checkAuth,
      login,
      logout,
      tournaments,
      currentTournamentId,
      loadTournaments,
      createTournament,
      deleteTournament,
      renameTournament,
      endTournament,
      selectTournament,
      rows,
      setRows,
      loadTiersIntoRows,
      saveAndStart,
      tiers,
      totalPrize,
      remainingTickets,
      loadBoard,
      draw,
      winRecords,
      stats,
      loadRecords,
      updateRecord,
      deleteRecord,
      exportRecords,
    }),
    [
      authReady,
      authed,
      checkAuth,
      login,
      logout,
      tournaments,
      currentTournamentId,
      loadTournaments,
      createTournament,
      deleteTournament,
      renameTournament,
      endTournament,
      selectTournament,
      rows,
      loadTiersIntoRows,
      saveAndStart,
      tiers,
      totalPrize,
      remainingTickets,
      loadBoard,
      draw,
      winRecords,
      stats,
      loadRecords,
      updateRecord,
      deleteRecord,
      exportRecords,
    ],
  );

  return <BountyContext.Provider value={value}>{children}</BountyContext.Provider>;
}

export function useBounty(): BountyState {
  const ctx = useContext(BountyContext);
  if (!ctx) throw new Error('useBounty 는 BountyProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
