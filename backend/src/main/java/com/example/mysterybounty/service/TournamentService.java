package com.example.mysterybounty.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.domain.Tournament;
import com.example.mysterybounty.dto.TournamentDtos.CreateRequest;
import com.example.mysterybounty.dto.TournamentDtos.SummaryResponse;
import com.example.mysterybounty.dto.TournamentDtos.UpdateRequest;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.repository.TournamentRepository;
import com.example.mysterybounty.support.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final PrizeTierRepository prizeTierRepository;
    private final DrawRecordRepository drawRecordRepository;

    /** 내 대회 목록 (카드 요약 포함) */
    @Transactional(readOnly = true)
    public List<SummaryResponse> list(Long adminId) {
        return tournamentRepository.findByAdminIdOrderByCreatedAtDesc(adminId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public Tournament create(Long adminId, CreateRequest request) {
        return tournamentRepository.save(new Tournament(adminId, request.name()));
    }

    @Transactional
    public Tournament update(Long adminId, Long id, UpdateRequest request) {
        Tournament tournament = getOwned(adminId, id);
        tournament.rename(request.name());
        tournament.changeStatus(request.status());
        return tournament;
    }

    @Transactional
    public void delete(Long adminId, Long id) {
        Tournament tournament = getOwned(adminId, id);
        drawRecordRepository.deleteByTournamentId(tournament.getId());
        prizeTierRepository.deleteByTournamentId(tournament.getId());
        tournamentRepository.delete(tournament);
    }

    /** 소유권 확인 후 대회 반환 (다른 서비스에서도 재사용) */
    @Transactional(readOnly = true)
    public Tournament getOwned(Long adminId, Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("대회를 찾을 수 없습니다."));
        if (!tournament.isOwnedBy(adminId)) {
            throw new NotFoundException("대회를 찾을 수 없습니다.");
        }
        return tournament;
    }

    private SummaryResponse toSummary(Tournament t) {
        List<PrizeTier> tiers = prizeTierRepository.findByTournamentId(t.getId());
        long totalPrize = tiers.stream()
                .mapToLong(tier -> tier.getAmount() * tier.getTotalCount())
                .sum();
        int remainingTickets = tiers.stream().mapToInt(PrizeTier::getRemainingCount).sum();
        int totalTickets = tiers.stream().mapToInt(PrizeTier::getTotalCount).sum();
        return new SummaryResponse(t.getId(), t.getName(), t.getStatus(),
                totalPrize, remainingTickets, totalTickets);
    }
}
