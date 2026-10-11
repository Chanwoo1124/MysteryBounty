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
     * 새 요청에 id 가 없으므로 <b>금액(amount) 기준</b>으로 기존 소진분(drawnCount)을 이어받는다.
     * <ul>
     *   <li>이미 뽑힌 금액대를 빼거나 금액을 바꾸면 400 — 뽑힌 수가 사라져 티켓이 되살아나기 때문이다</li>
     *   <li>같은 금액대의 개수 합계가 소진분보다 작으면 400</li>
     *   <li>같은 금액대가 여러 행이면 소진분을 앞 행부터 나눠 채운다</li>
     * </ul>
     */
    @Transactional
    public List<Response> replace(Long adminId, Long tournamentId, ReplaceRequest request) {
        tournamentService.getOwned(adminId, tournamentId);

        // 기존 티어의 금액별 소진 개수 집계 — 추첨과 겹치지 않도록 쓰기 락으로 읽는다
        List<PrizeTier> existing = prizeTierRepository.findByTournamentIdForUpdate(tournamentId);
        Map<Long, Integer> drawnByAmount = new HashMap<>();
        for (PrizeTier tier : existing) {
            drawnByAmount.merge(tier.getAmount(), tier.drawnCount(), Integer::sum);
        }

        // 새 구성의 금액별 개수 합계
        Map<Long, Integer> countByAmount = new HashMap<>();
        for (TierInput input : request.tiers()) {
            countByAmount.merge(input.amount(), input.count(), Integer::sum);
        }

        // 소진분을 담을 자리가 있는지 먼저 검사한다 (저장 전에 실패시켜 기존 구성을 지키려고)
        for (Map.Entry<Long, Integer> entry : drawnByAmount.entrySet()) {
            long amount = entry.getKey();
            int drawn = entry.getValue();
            if (drawn == 0) continue;
            int count = countByAmount.getOrDefault(amount, 0);
            if (count == 0) {
                throw new BadRequestException(
                        "이미 " + drawn + "개가 뽑힌 금액대(" + amount + "원)는 삭제하거나 금액을 바꿀 수 없습니다. "
                                + "당첨 기록에서 되돌린 뒤 수정해주세요.");
            }
            if (count < drawn) {
                throw new BadRequestException(
                        "이미 " + drawn + "개가 뽑힌 금액대(" + amount
                                + "원)의 개수를 그보다 적게 설정할 수 없습니다.");
            }
        }

        // 새 구성으로 교체
        prizeTierRepository.deleteByTournamentId(tournamentId);
        prizeTierRepository.flush(); // delete 후 insert 순서 보장

        List<PrizeTier> saved = new ArrayList<>();
        for (TierInput input : request.tiers()) {
            // 같은 금액대가 여러 행이면 앞 행부터 소진분을 채우고 남은 만큼 다음 행으로 넘긴다
            int drawnLeft = drawnByAmount.getOrDefault(input.amount(), 0);
            int taken = Math.min(drawnLeft, input.count());
            drawnByAmount.put(input.amount(), drawnLeft - taken);
            saved.add(prizeTierRepository.save(
                    new PrizeTier(tournamentId, input.amount(), input.count(), input.count() - taken)));
        }
        return saved.stream().map(Response::from).toList();
    }
}
