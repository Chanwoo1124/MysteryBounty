package com.example.mysterybounty.dto;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;

import jakarta.validation.constraints.Pattern;

/** 추첨 DTO */
public final class DrawDtos {

    private DrawDtos() {
    }

    /**
     * 뽑기 요청 — 추첨 전에 당첨자 이름과 전화번호 뒷자리 4자리를 받는다.
     *
     * 둘 다 선택 입력이다. 현장이 급할 때는 비우거나 적다 만 채로 먼저 뽑고,
     * 당첨 기록 화면에서 채워 넣는다. 전화번호는 숫자만, 최대 4자리까지 받는다.
     */
    public record DrawRequest(
            String winnerName,
            @Pattern(regexp = "\\d{0,4}",
                    message = "전화번호 뒷자리는 숫자 4자리까지 입력할 수 있습니다.") String winnerPhone) {
    }

    /** 뽑기 결과 (프론트는 amount 로 연출) */
    public record DrawResponse(Long drawId, long amount, Long tierId, DrawStatus status) {
        public static DrawResponse from(DrawRecord r) {
            return new DrawResponse(r.getId(), r.getAmount(), r.getTierId(), r.getStatus());
        }
    }
}
