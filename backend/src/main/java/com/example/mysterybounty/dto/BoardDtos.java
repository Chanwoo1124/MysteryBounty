package com.example.mysterybounty.dto;

import java.util.List;

import com.example.mysterybounty.domain.PrizeTier;

/** 현황판 DTO */
public final class BoardDtos {

    private BoardDtos() {
    }

    public record BoardResponse(
            String tournamentName,
            long remainingPrize,
            int remainingTickets,
            List<BoardTier> tiers) {
    }

    public record BoardTier(
            Long id,
            long amount,
            int totalCount,
            int remainingCount,
            boolean depleted) {
        public static BoardTier from(PrizeTier t) {
            return new BoardTier(t.getId(), t.getAmount(), t.getTotalCount(),
                    t.getRemainingCount(), t.isDepleted());
        }
    }
}
