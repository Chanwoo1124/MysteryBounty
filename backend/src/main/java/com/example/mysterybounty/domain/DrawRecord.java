package com.example.mysterybounty.domain;

import java.time.LocalDateTime;

import com.example.mysterybounty.support.ConflictException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 당첨 기록 */
@Entity
@Table(name = "draw_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DrawRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tournamentId;

    /** 어떤 티어에서 뽑혔나 (수동 입력이면 null) */
    private Long tierId;

    /** 당첨 금액 (원) — 티어 삭제 대비 스냅샷 */
    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DrawStatus status;

    private String winnerName;

    private String winnerPhone;

    /** 주민번호 — AES 암호화 저장 */
    @Column(length = 512)
    private String winnerSsn;

    /** 은행 */
    private String winnerBank;

    /** 계좌번호 */
    private String winnerAccountNumber;

    @Column(nullable = false)
    private LocalDateTime drawnAt;

    private DrawRecord(Long tournamentId, Long tierId, Long amount, DrawStatus status) {
        this.tournamentId = tournamentId;
        this.tierId = tierId;
        this.amount = amount;
        this.status = status;
        this.drawnAt = LocalDateTime.now();
    }

    /** 추첨으로 뽑힌 대기(PENDING) 기록 */
    public static DrawRecord pending(Long tournamentId, Long tierId, Long amount) {
        return new DrawRecord(tournamentId, tierId, amount, DrawStatus.PENDING);
    }

    /** 수동 입력(추첨 없이) — 즉시 확정 */
    public static DrawRecord manual(Long tournamentId, Long amount) {
        return new DrawRecord(tournamentId, null, amount, DrawStatus.CONFIRMED);
    }

    public boolean isPending() {
        return status == DrawStatus.PENDING;
    }

    /** 상금 금액 수정 (원 단위) */
    public void changeAmount(long amount) {
        this.amount = amount;
    }

    /** PENDING → CONFIRMED */
    public void confirm() {
        if (status == DrawStatus.CONFIRMED) {
            throw new ConflictException("이미 확정된 추첨입니다.");
        }
        this.status = DrawStatus.CONFIRMED;
    }

    /**
     * 당첨자 정보 갱신 (부분 업데이트, null 이면 해당 필드 미변경).
     * 주민번호는 암호화된 값을 전달해야 한다.
     */
    public void updateWinnerInfo(String name, String phone, String encryptedSsn,
                                 String bank, String accountNumber) {
        if (name != null) this.winnerName = name;
        if (phone != null) this.winnerPhone = phone;
        if (encryptedSsn != null) this.winnerSsn = encryptedSsn;
        if (bank != null) this.winnerBank = bank;
        if (accountNumber != null) this.winnerAccountNumber = accountNumber;
    }
}
