/** 바운티 금액대 — 서버 소유 상태 */
export interface Tier {
  /** 금액 (원 단위) */
  amount: number;
  /** 전체 티켓 수 */
  total: number;
  /** 잔여 티켓 수 */
  left: number;
}

/** 당첨 기록 1건 */
export interface HistoryEntry {
  /** 'HH:MM' */
  time: string;
  /** 당첨 금액 (원 단위) */
  amount: number;
  name: string;
  phone: string;
  ssn: string;
  account: string;
}

/** 티켓 구성 화면의 입력 행 (금액은 만원 단위) */
export interface SetupRow {
  amount: number;
  count: number;
}

export type TournamentStatus = '진행중' | '준비중' | '종료';

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  /** 총 상금 (원 단위) */
  totalPrize: number;
  /** 잔여 티켓 */
  ticketsLeft: number;
  /** 전체 티켓 */
  ticketsTotal: number;
}

/** 추첨 연출 강도 */
export type Intensity = 'jackpot' | 'mid' | 'low';

/** 추첨 상태 머신 */
export type DrawPhase = 'staff' | 'handoff' | 'armed' | 'shaking' | 'reveal';

/** 서버가 내려주는 추첨 결과 */
export interface DrawResult {
  /** 당첨 금액 (원 단위) */
  amount: number;
  /** 차감할 티어 인덱스 */
  tierIndex: number;
}
