package com.example.mysterybounty.domain;

import java.time.LocalDateTime;

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

    /** 전화번호 뒷자리 4자리 */
    private String winnerPhone;

    @Column(nullable = false)
    private LocalDateTime drawnAt;

    private DrawRecord(Long tournamentId, Long tierId, Long amount, DrawStatus status) {
        this.tournamentId = tournamentId;
        this.tierId = tierId;
        this.amount = amount;
        this.status = status;
        this.drawnAt = LocalDateTime.now();
    }

    /**
     * 추첨으로 뽑힌 기록 — 추첨 전에 입력받은 당첨자 정보와 함께 즉시 확정 저장한다.
     * (연출은 이미 끝난 결과를 보여주는 껍데기라, 연출을 기다렸다 확정하지 않는다)
     */
    public static DrawRecord drawn(Long tournamentId, Long tierId, Long amount,
                                   String winnerName, String winnerPhone) {
        DrawRecord record = new DrawRecord(tournamentId, tierId, amount, DrawStatus.CONFIRMED);
        record.updateWinnerInfo(winnerName, winnerPhone);
        return record;
    }

    /** 당첨자 정보 갱신 (부분 업데이트, null 이면 해당 필드 미변경) */
    public void updateWinnerInfo(String name, String phone) {
        if (name != null) this.winnerName = name;
        if (phone != null) this.winnerPhone = phone;
    }
}
