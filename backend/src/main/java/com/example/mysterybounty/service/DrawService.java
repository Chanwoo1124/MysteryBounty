package com.example.mysterybounty.service;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;
import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.dto.DrawDtos.DrawResponse;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.support.ConflictException;
import com.example.mysterybounty.support.NotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * 추첨 핵심 로직. 당첨 결과는 <b>서버가 결정</b>(SecureRandom 가중 랜덤)하며,
 * "한 번에 한 건" 규칙과 동시성은 티어 비관적 락 + PENDING 존재 검사로 보장한다.
 */
@Service
@RequiredArgsConstructor
public class DrawService {

    private final PrizeTierRepository prizeTierRepository;
    private final DrawRecordRepository drawRecordRepository;
    private final TournamentService tournamentService;
    private final RecordMapper recordMapper;

    private final SecureRandom secureRandom = new SecureRandom();

    /** 뽑기 실행 — 잔여 티켓 가중 랜덤으로 결과 결정 후 PENDING 저장 */
    @Transactional
    public DrawResponse draw(Long adminId, Long tournamentId) {
        tournamentService.getOwned(adminId, tournamentId);

        // 1. 티어들을 쓰기 락으로 조회 (동시 추첨 직렬화)
        List<PrizeTier> tiers = prizeTierRepository.findByTournamentIdForUpdate(tournamentId);

        // 2. 한 번에 한 건 — PENDING 이 있으면 신규 추첨 불가
        if (drawRecordRepository.existsByTournamentIdAndStatus(tournamentId, DrawStatus.PENDING)) {
            throw new ConflictException("확인 대기 중인 추첨이 있습니다.");
        }

        // 3. 잔여 티어로 가중치 배열 구성 → SecureRandom 추첨
        List<PrizeTier> available = tiers.stream()
                .filter(t -> t.getRemainingCount() > 0)
                .toList();
        int totalRemaining = available.stream().mapToInt(PrizeTier::getRemainingCount).sum();
        if (totalRemaining == 0) {
            throw new ConflictException("남은 티켓이 없습니다.");
        }
        PrizeTier chosen = pickWeighted(available, totalRemaining);

        // 4. 잔여 차감
        chosen.decrementRemaining();

        // 5. PENDING 기록 저장 (amount 는 스냅샷)
        DrawRecord record = drawRecordRepository.save(
                DrawRecord.pending(tournamentId, chosen.getId(), chosen.getAmount()));
        return DrawResponse.from(record);
    }

    /** 연출 종료 후 확정: PENDING → CONFIRMED */
    @Transactional
    public Response confirm(Long adminId, Long drawId) {
        DrawRecord record = getOwnedRecord(adminId, drawId);
        record.confirm();
        return recordMapper.toResponse(record);
    }

    /** PENDING 추첨 취소 (오조작 복구): 티어 잔여 복구 + 기록 삭제 */
    @Transactional
    public void cancel(Long adminId, Long drawId) {
        DrawRecord record = getOwnedRecord(adminId, drawId);
        if (!record.isPending()) {
            throw new ConflictException("확정된 추첨은 취소할 수 없습니다.");
        }
        if (record.getTierId() != null) {
            prizeTierRepository.findById(record.getTierId())
                    .ifPresent(PrizeTier::restoreRemaining);
        }
        drawRecordRepository.delete(record);
    }

    private PrizeTier pickWeighted(List<PrizeTier> available, int totalRemaining) {
        int pick = secureRandom.nextInt(totalRemaining);
        int cursor = 0;
        for (PrizeTier tier : available) {
            cursor += tier.getRemainingCount();
            if (pick < cursor) {
                return tier;
            }
        }
        // 논리상 도달 불가
        return available.get(available.size() - 1);
    }

    private DrawRecord getOwnedRecord(Long adminId, Long drawId) {
        DrawRecord record = drawRecordRepository.findById(drawId)
                .orElseThrow(() -> new NotFoundException("추첨 기록을 찾을 수 없습니다."));
        tournamentService.getOwned(adminId, record.getTournamentId()); // 소유권 확인
        return record;
    }
}
