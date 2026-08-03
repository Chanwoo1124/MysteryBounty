package com.example.mysterybounty.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;
import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.domain.Tournament;
import com.example.mysterybounty.dto.BoardDtos.BoardResponse;
import com.example.mysterybounty.dto.BoardDtos.BoardTier;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final PrizeTierRepository prizeTierRepository;
    private final DrawRecordRepository drawRecordRepository;
    private final TournamentService tournamentService;

    /** 현황판 + 추첨 화면 공유 조회 */
    @Transactional(readOnly = true)
    public BoardResponse board(Long adminId, Long tournamentId) {
        Tournament tournament = tournamentService.getOwned(adminId, tournamentId);
        List<PrizeTier> tiers = prizeTierRepository.findByTournamentIdOrderByAmountDesc(tournamentId);

        long remainingPrize = tiers.stream()
                .mapToLong(t -> t.getAmount() * t.getRemainingCount())
                .sum();
        int remainingTickets = tiers.stream().mapToInt(PrizeTier::getRemainingCount).sum();
        // 확인 대기 중인 추첨 id (현황판에서 취소할 때 사용)
        Long pendingDrawId = drawRecordRepository
                .findByTournamentIdAndStatusOrderByDrawnAtDesc(tournamentId, DrawStatus.PENDING)
                .stream().findFirst().map(DrawRecord::getId).orElse(null);

        return new BoardResponse(
                tournament.getName(),
                remainingPrize,
                remainingTickets,
                pendingDrawId != null,
                pendingDrawId,
                tiers.stream().map(BoardTier::from).toList());
    }
}
