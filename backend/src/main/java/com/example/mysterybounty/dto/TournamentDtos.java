package com.example.mysterybounty.dto;

import com.example.mysterybounty.domain.Tournament;
import com.example.mysterybounty.domain.TournamentStatus;

import jakarta.validation.constraints.NotBlank;

/** 대회 관련 DTO */
public final class TournamentDtos {

    private TournamentDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "대회명을 입력해주세요.") String name) {
    }

    /** 부분 업데이트 — 두 필드 모두 nullable */
    public record UpdateRequest(String name, TournamentStatus status) {
    }

    /** 생성/단건 응답 */
    public record Response(Long id, String name, TournamentStatus status) {
        public static Response from(Tournament t) {
            return new Response(t.getId(), t.getName(), t.getStatus());
        }
    }

    /** 목록 카드용 요약 응답 */
    public record SummaryResponse(
            Long id,
            String name,
            TournamentStatus status,
            long totalPrize,
            int remainingTickets,
            int totalTickets) {
    }
}
