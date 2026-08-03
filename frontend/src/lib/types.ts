/** 바운티 금액대 — 서버 소유 상태 */
export interface Tier {
  /** 금액 (원 단위) */
  amount: number;
  /** 전체 티켓 수 */
  total: number;
  /** 잔여 티켓 수 */
  left: number;
}

/** 당첨 기록 1건 (행별 편집·삭제용) */
export interface WinRecord {
  /** 서버 기록 ID */
  id: number;
  /** 'HH:MM' */
  time: string;
  /** 당첨 금액 (원 단위) */
  amount: number;
  name: string;
  phone: string;
  /** 마스킹된 주민번호 (표시용) */
  ssnMasked: string;
  bank: string;
  accountNumber: string;
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
  /** 확정(confirm) 시 사용할 서버 추첨 ID */
  drawId: number;
}

/** 당첨 기록 입력 (계좌는 은행/계좌번호 2필드) */
export interface RecordInput {
  /** 당첨 금액 (원 단위) */
  amount: number;
  name: string;
  phone: string;
  ssn: string;
  bank: string;
  accountNumber: string;
}
