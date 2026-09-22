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
  /** 전화번호 뒷자리 4자리 */
  phone: string;
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

/** 서버가 내려주는 추첨 결과 */
export interface DrawResult {
  /** 당첨 금액 (원 단위) */
  amount: number;
  /** 확정(confirm) 시 사용할 서버 추첨 ID */
  drawId: number;
}

/**
 * 당첨자 정보 입력 — 기록에서 고칠 수 있는 건 이름과 전화번호 뒷자리뿐이다.
 * 상금은 추첨이 정하고 금액대 잔여와 묶여 있어 수정 대상이 아니다.
 */
export interface RecordInput {
  name: string;
  /** 전화번호 뒷자리 4자리 */
  phone: string;
}
