/**
 * 백엔드(Spring Boot) 연동 클라이언트.
 *
 * 핵심 원칙: **당첨 결과는 서버가 결정한다.** 프론트는 결과값을 받아 연출만 담당한다.
 * 세션 쿠키 인증이므로 모든 요청에 `credentials: 'include'` 를 사용한다.
 * 개발에서는 vite 프록시(`/api` → 8080)로 같은 오리진이 되고, 운영에서는 `VITE_API_BASE` 로 분리한다.
 */

const BASE = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE ?? '';

/** 서버가 내려준 실패 응답(`{ "error": "..." }`)을 담는 에러 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? '요청을 처리하지 못했습니다.');
  }
  return data as T;
}

/* ── 백엔드 응답 타입 (원 단위 Long, status enum) ── */

export type TournamentStatusCode = 'READY' | 'RUNNING' | 'FINISHED';

export interface AdminRes {
  id: number;
  username: string;
}

export interface TournamentSummaryRes {
  id: number;
  name: string;
  status: TournamentStatusCode;
  totalPrize: number;
  remainingTickets: number;
  totalTickets: number;
}

export interface TournamentRes {
  id: number;
  name: string;
  status: TournamentStatusCode;
}

export interface TierRes {
  id: number;
  amount: number;
  totalCount: number;
  remainingCount: number;
}

export interface BoardTierRes extends TierRes {
  depleted: boolean;
}

export interface BoardRes {
  tournamentName: string;
  remainingPrize: number;
  remainingTickets: number;
  hasPendingDraw: boolean;
  /** 확인 대기 중인 추첨 id (없으면 null) */
  pendingDrawId: number | null;
  tiers: BoardTierRes[];
}

export interface DrawRes {
  drawId: number;
  amount: number;
  tierId: number;
  status: string;
}

export interface RecordRes {
  id: number;
  drawnAt: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED';
  winnerName: string | null;
  winnerPhone: string | null;
  winnerSsnMasked: string | null;
  winnerBank: string | null;
  winnerAccountNumber: string | null;
}

export interface RecordsRes {
  stats: { totalPaid: number; drawCount: number; maxWin: number };
  records: RecordRes[];
}

/** 기록 입력 페이로드 (주민번호는 평문 전송 → 서버가 암호화 저장) */
export interface RecordInputBody {
  amount?: number;
  winnerName?: string;
  winnerPhone?: string;
  winnerSsn?: string;
  winnerBank?: string;
  winnerAccountNumber?: string;
}

/* ── 엔드포인트 ── */

export const api = {
  auth: {
    login: (username: string, password: string) =>
      http<AdminRes>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => http<void>('/api/auth/logout', { method: 'POST' }),
    me: () => http<AdminRes>('/api/auth/me'),
  },

  tournament: {
    list: () => http<TournamentSummaryRes[]>('/api/tournaments'),
    create: (name: string) =>
      http<TournamentRes>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    update: (id: number, body: { name?: string; status?: TournamentStatusCode }) =>
      http<TournamentRes>(`/api/tournaments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: number) => http<void>(`/api/tournaments/${id}`, { method: 'DELETE' }),
  },

  tier: {
    list: (tournamentId: number) => http<TierRes[]>(`/api/tournaments/${tournamentId}/tiers`),
    /** 전체 교체 — 금액은 원 단위 */
    replace: (tournamentId: number, tiers: { amount: number; count: number }[]) =>
      http<TierRes[]>(`/api/tournaments/${tournamentId}/tiers`, {
        method: 'PUT',
        body: JSON.stringify({ tiers }),
      }),
  },

  board: {
    get: (tournamentId: number) => http<BoardRes>(`/api/tournaments/${tournamentId}/board`),
  },

  draw: {
    draw: (tournamentId: number) =>
      http<DrawRes>(`/api/tournaments/${tournamentId}/draws`, { method: 'POST' }),
    confirm: (drawId: number) => http<RecordRes>(`/api/draws/${drawId}/confirm`, { method: 'POST' }),
    cancel: (drawId: number) => http<void>(`/api/draws/${drawId}`, { method: 'DELETE' }),
  },

  record: {
    list: (tournamentId: number) => http<RecordsRes>(`/api/tournaments/${tournamentId}/records`),
    create: (tournamentId: number, body: RecordInputBody) =>
      http<RecordRes>(`/api/tournaments/${tournamentId}/records`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (recordId: number, body: RecordInputBody) =>
      http<RecordRes>(`/api/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (recordId: number) => http<void>(`/api/records/${recordId}`, { method: 'DELETE' }),
    /** 엑셀(.xlsx) 다운로드 — blob 을 받아 파일로 저장 */
    async download(tournamentId: number): Promise<void> {
      const res = await fetch(BASE + `/api/tournaments/${tournamentId}/records/export`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new ApiError(res.status, '엑셀 다운로드에 실패했습니다.');
      }
      const blob = await res.blob();
      const filename = filenameFromDisposition(res.headers.get('Content-Disposition'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};

/** Content-Disposition 헤더에서 파일명 추출 (UTF-8 filename* 우선) */
function filenameFromDisposition(header: string | null): string {
  const fallback = 'HGP_당첨기록.xlsx';
  if (!header) return fallback;
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) return decodeURIComponent(star[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : fallback;
}
