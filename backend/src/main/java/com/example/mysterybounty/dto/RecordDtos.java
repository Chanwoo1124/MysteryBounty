package com.example.mysterybounty.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;

import jakarta.validation.constraints.Pattern;

/** 당첨 기록 DTO */
public final class RecordDtos {

    /** 전화번호 뒷자리 — 숫자만, 최대 4자리 (미입력·적다 만 상태 허용 → 나중에 채운다) */
    private static final String PHONE_LAST4 = "\\d{0,4}";
    private static final String PHONE_LAST4_MESSAGE = "전화번호 뒷자리는 숫자 4자리까지 입력할 수 있습니다.";

    private RecordDtos() {
    }

    /**
     * 당첨자 정보 입력/수정 (부분 업데이트, null 이면 해당 항목 미변경).
     * 상금은 추첨이 정하고 금액대 잔여와 묶여 있어 여기서 고칠 수 없다 — 틀렸으면 기록을 지우고 다시 뽑는다.
     */
    public record UpdateRequest(
            String winnerName,
            @Pattern(regexp = PHONE_LAST4, message = PHONE_LAST4_MESSAGE) String winnerPhone) {
    }

    /** 단건 응답 */
    public record Response(
            Long id,
            LocalDateTime drawnAt,
            long amount,
            DrawStatus status,
            String winnerName,
            String winnerPhone) {
    }

    public record Stats(long totalPaid, int drawCount, long maxWin) {
    }

    public record ListResponse(Stats stats, List<Response> records) {
    }
}
