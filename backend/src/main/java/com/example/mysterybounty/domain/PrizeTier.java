package com.example.mysterybounty.domain;

import com.example.mysterybounty.support.BadRequestException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 상금 티어 (금액 × 개수 구성 행) */
@Entity
@Table(name = "prize_tier")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrizeTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tournamentId;

    /** 상금 (원 단위) */
    @Column(nullable = false)
    private Long amount;

    /** 총 개수 */
    @Column(nullable = false)
    private int totalCount;

    /** 잔여 개수 */
    @Column(nullable = false)
    private int remainingCount;

    public PrizeTier(Long tournamentId, Long amount, int totalCount, int remainingCount) {
        this.tournamentId = tournamentId;
        this.amount = amount;
        this.totalCount = totalCount;
        this.remainingCount = remainingCount;
    }

    /** 신규 티어 (잔여 = 총 개수) */
    public static PrizeTier create(Long tournamentId, Long amount, int totalCount) {
        return new PrizeTier(tournamentId, amount, totalCount, totalCount);
    }

    /** 소진 개수 (이미 뽑힌 수) */
    public int drawnCount() {
        return totalCount - remainingCount;
    }

    public boolean isDepleted() {
        return remainingCount <= 0;
    }

    /** 추첨 1건 차감 */
    public void decrementRemaining() {
        if (remainingCount <= 0) {
            throw new BadRequestException("잔여 티켓이 없습니다.");
        }
        remainingCount--;
    }

    /** 추첨 취소 시 1건 복구 */
    public void restoreRemaining() {
        if (remainingCount < totalCount) {
            remainingCount++;
        }
    }
}
