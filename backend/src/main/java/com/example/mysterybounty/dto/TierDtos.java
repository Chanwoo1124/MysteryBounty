package com.example.mysterybounty.dto;

import java.util.List;

import com.example.mysterybounty.domain.PrizeTier;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 티켓 구성(티어) 관련 DTO */
public final class TierDtos {

    private TierDtos() {
    }

    /** 티어 전체 교체 요청 (금액은 원 단위) */
    public record ReplaceRequest(
            @NotNull @Valid List<TierInput> tiers) {
    }

    public record TierInput(
            @NotNull(message = "금액을 입력해주세요.")
            @Positive(message = "금액은 0보다 커야 합니다.") Long amount,
            @NotNull(message = "개수를 입력해주세요.")
            @Positive(message = "개수는 0보다 커야 합니다.") Integer count) {
    }

    public record Response(Long id, long amount, int totalCount, int remainingCount) {
        public static Response from(PrizeTier t) {
            return new Response(t.getId(), t.getAmount(), t.getTotalCount(), t.getRemainingCount());
        }
    }
}
