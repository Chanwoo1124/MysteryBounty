package com.example.mysterybounty.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 당첨 기록 DTO */
public final class RecordDtos {

    private RecordDtos() {
    }

    /** 수동 기록 추가 (추첨 없이 직접 입력) — 금액은 원 단위 */
    public record CreateRequest(
            @NotNull(message = "상금을 입력해주세요.")
            @Positive(message = "상금은 0보다 커야 합니다.") Long amount,
            String winnerName,
            String winnerPhone,
            String winnerSsn,
            String winnerBank,
            String winnerAccountNumber) {
    }

    /** 당첨자 정보 입력/수정 (부분 업데이트) — amount 는 원 단위, null 이면 미변경 */
    public record UpdateRequest(
            Long amount,
            String winnerName,
            String winnerPhone,
            String winnerSsn,
            String winnerBank,
            String winnerAccountNumber) {
    }

    /** 단건 응답 — 주민번호는 마스킹만 노출 */
    public record Response(
            Long id,
            LocalDateTime drawnAt,
            long amount,
            DrawStatus status,
            String winnerName,
            String winnerPhone,
            String winnerSsnMasked,
            String winnerBank,
            String winnerAccountNumber) {
    }

    public record Stats(long totalPaid, int drawCount, long maxWin) {
    }

    public record ListResponse(Stats stats, List<Response> records) {
    }
}
