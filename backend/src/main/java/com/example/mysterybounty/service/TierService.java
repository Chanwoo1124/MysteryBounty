package com.example.mysterybounty.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.dto.TierDtos.ReplaceRequest;
import com.example.mysterybounty.dto.TierDtos.Response;
import com.example.mysterybounty.dto.TierDtos.TierInput;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.support.BadRequestException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TierService {

    private final PrizeTierRepository prizeTierRepository;
    private final TournamentService tournamentService;

    @Transactional(readOnly = true)
    public List<Response> list(Long adminId, Long tournamentId) {
        tournamentService.getOwned(adminId, tournamentId);
        return prizeTierRepository.findByTournamentIdOrderByAmountDesc(tournamentId).stream()
                .map(Response::from)
                .toList();
    }

    /**
     * 티어 전체 교체. 대회 시작 후에도 수정 가능.
     * 이미 소진분(drawnCount)이 있는 금액대는 새 개수가 소진분보다 작으면 400.
     * 새 요청에 id 가 없으므로 <b>금액(amount) 기준</b>으로 기존 소진분을 매칭한다.
     */
    @Transactional
    public List<Response> replace(Long adminId, Long tournamentId, ReplaceRequest request) {
        tournamentService.getOwned(adminId, tournamentId);

        // 기존 티어의 금액별 소진 개수 집계
        List<PrizeTier> existing = prizeTierRepository.findByTournamentId(tournamentId);
        Map<Long, Integer> drawnByAmount = new HashMap<>();
        for (PrizeTier tier : existing) {
            drawnByAmount.merge(tier.getAmount(), tier.drawnCount(), Integer::sum);
        }

        // 새 구성으로 교체
        prizeTierRepository.deleteByTournamentId(tournamentId);
        prizeTierRepository.flush(); // delete 후 insert 순서 보장

        List<PrizeTier> saved = new ArrayList<>();
        for (TierInput input : request.tiers()) {
            int drawn = drawnByAmount.getOrDefault(input.amount(), 0);
            int remaining = input.count() - drawn;
            if (remaining < 0) {
                throw new BadRequestException(
                        "이미 " + drawn + "개가 뽑힌 금액대(" + input.amount()
                                + "원)의 개수를 그보다 적게 설정할 수 없습니다.");
            }
            // 같은 금액대가 여러 행이면 소진분은 첫 행에만 반영
            drawnByAmount.put(input.amount(), 0);
            saved.add(prizeTierRepository.save(
                    new PrizeTier(tournamentId, input.amount(), input.count(), remaining)));
        }
        return saved.stream().map(Response::from).toList();
    }
}
