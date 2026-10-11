package com.example.mysterybounty.domain;

/**
 * 당첨 기록 상태.
 *
 * 추첨은 한 번의 요청으로 끝나므로 새로 쌓이는 기록은 모두 CONFIRMED 다.
 * PENDING 은 연출이 끝나야 확정하던 시절의 값으로, 그때 만들어진 옛 데이터를 읽기 위해 남겨 둔다.
 * (옛 PENDING 도 티켓은 차감돼 있으므로 기록 화면에 함께 보여 되돌릴 수 있게 한다)
 */
public enum DrawStatus {
    PENDING, CONFIRMED
}
