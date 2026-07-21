import type { DrawResult, Tier } from '@/lib/types';

/**
 * 백엔드 연동 지점.
 *
 * 핵심 원칙: **당첨 결과는 서버가 결정한다.** 프론트는 결과값을 받아 연출만 담당하며,
 * 아래 mock 구현은 백엔드가 준비되기 전까지의 임시 대역이다.
 * 실제 API가 붙으면 이 파일의 구현만 fetch 호출로 교체하면 되고, 화면 코드는 손댈 필요 없다.
 */

/** 네트워크 지연 흉내 */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 추첨 실행 — 서버가 당첨 금액과 차감 대상 티어를 결정해 내려준다.
 * 소진된 티어(left === 0)는 추첨 대상에서 제외된다.
 */
export async function drawBounty(tiers: Tier[]): Promise<DrawResult> {
  await delay(120);

  // --- mock: 잔여 티켓 수에 비례한 가중 추첨 ---
  const bag: number[] = [];
  tiers.forEach((t, i) => {
    for (let k = 0; k < t.left; k += 1) bag.push(i);
  });
  if (bag.length === 0) {
    throw new Error('잔여 티켓이 없습니다.');
  }
  const tierIndex = bag[Math.floor(Math.random() * bag.length)];
  return { amount: tiers[tierIndex].amount, tierIndex };
}

/**
 * 추첨 확정 — 티켓 차감과 기록 생성을 서버에 커밋한다.
 * confirm 이 끝나야 다음 추첨이 가능하다.
 */
export async function confirmDraw(result: DrawResult): Promise<void> {
  await delay(80);
  // mock: 로컬 상태만 갱신하므로 별도 처리 없음
  void result;
}
