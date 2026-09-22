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

/** 서버가 끊겨 요청 자체가 닿지 못했을 때 쓰는 상태값 (HTTP 응답이 없으므로 0) */
const OFFLINE = 0;
const OFFLINE_MESSAGE = '백엔드 서버에 연결하지 못했습니다. 서버가 켜져 있는지 확인해주세요.';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    // 서버가 꺼져 있거나 네트워크가 끊긴 경우 — fetch 는 여기서 바로 실패한다
    throw new ApiError(OFFLINE, OFFLINE_MESSAGE);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();

  /*
   * 본문은 JSON 이 아닐 수 있다. 백엔드가 죽으면 vite 프록시가 HTML/평문 오류를 대신 내려주는데,
   * 그걸 그대로 JSON.parse 하면 SyntaxError 가 나서 ApiError 가 아닌 엉뚱한 에러로 번진다.
   * (화면마다 '로그인에 실패했습니다' 같은 기본 문구만 뜨고 진짜 원인이 가려진다)
   */
  let data: { error?: string } | undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(
      res.ok ? OFFLINE : res.status,
      res.ok ? OFFLINE_MESSAGE : `서버 응답을 읽지 못했습니다. (HTTP ${res.status})`,
    );
  }

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
  /** 전화번호 뒷자리 4자리 */
  winnerPhone: string | null;
}

export interface RecordsRes {
  stats: { totalPaid: number; drawCount: number; maxWin: number };
  records: RecordRes[];
}

/** 기록 수정 페이로드 — 당첨자 정보만 고친다 (상금은 추첨이 정한 값이라 대상이 아니다) */
export interface RecordInputBody {
  winnerName?: string;
  winnerPhone?: string;
}

/** 추첨 요청 — 당첨자 정보는 서버가 추첨 기록에 함께 저장한다 */
export interface DrawBody {
  winnerName: string;
  /** 전화번호 뒷자리 4자리 */
  winnerPhone: string;
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
    /** 뽑기 — 이 한 번의 요청으로 결과 확정·티켓 차감·기록 저장까지 끝난다 */
    draw: (tournamentId: number, body: DrawBody) =>
      http<DrawRes>(`/api/tournaments/${tournamentId}/draws`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  record: {
    list: (tournamentId: number) => http<RecordsRes>(`/api/tournaments/${tournamentId}/records`),
    update: (recordId: number, body: RecordInputBody) =>
      http<RecordRes>(`/api/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (recordId: number) => http<void>(`/api/records/${recordId}`, { method: 'DELETE' }),
    /** 엑셀(.xlsx) 다운로드 — blob 을 받아 파일로 저장 */
    async download(tournamentId: number): Promise<void> {
      let res: Response;
      try {
        res = await fetch(BASE + `/api/tournaments/${tournamentId}/records/export`, {
          credentials: 'include',
        });
      } catch {
        throw new ApiError(OFFLINE, OFFLINE_MESSAGE);
      }
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
