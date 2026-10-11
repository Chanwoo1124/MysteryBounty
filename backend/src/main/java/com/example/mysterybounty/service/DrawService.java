package com.example.mysterybounty.service;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.domain.Tournament;
import com.example.mysterybounty.domain.TournamentStatus;
import com.example.mysterybounty.dto.DrawDtos.DrawRequest;
import com.example.mysterybounty.dto.DrawDtos.DrawResponse;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.support.ConflictException;

import lombok.RequiredArgsConstructor;

/**
 * 추첨 핵심 로직. 당첨 결과는 <b>서버가 결정</b>(SecureRandom 가중 랜덤)하며,
 * 동시 추첨은 티어 비관적 락으로 직렬화한다.
 *
 * 추첨은 한 번의 요청으로 끝난다(즉시 확정). 예전에는 연출이 끝나면 확정하는 2단계였는데,
 * 연출 도중 새로고침하면 확인 대기 기록이 남아 다음 추첨이 통째로 막히는 사고가 났다.
 * 잘못 뽑은 건은 당첨 기록 화면에서 되돌리기(삭제)하면 티켓이 복구된다.
 */
@Service
@RequiredArgsConstructor
public class DrawService {

    private final PrizeTierRepository prizeTierRepository;
    private final DrawRecordRepository drawRecordRepository;
    private final TournamentService tournamentService;

    private final SecureRandom secureRandom = new SecureRandom();

    /** 뽑기 실행 — 잔여 티켓 가중 랜덤으로 결과 결정 후 당첨자 정보와 함께 즉시 확정 저장 */
    @Transactional
    public DrawResponse draw(Long adminId, Long tournamentId, DrawRequest request) {
        Tournament tournament = tournamentService.getOwned(adminId, tournamentId);
        // 종료 전에 열어둔 현황판에서도 뽑히지 않도록 서버에서 막는다
        if (tournament.getStatus() == TournamentStatus.FINISHED) {
            throw new ConflictException("종료된 대회는 추첨할 수 없습니다.");
        }

        // 1. 티어들을 쓰기 락으로 조회 (동시 추첨 직렬화)
        List<PrizeTier> tiers = prizeTierRepository.findByTournamentIdForUpdate(tournamentId);

        // 2. 잔여 티어로 가중치 배열 구성 → SecureRandom 추첨
        List<PrizeTier> available = tiers.stream()
                .filter(t -> t.getRemainingCount() > 0)
                .toList();
        int totalRemaining = available.stream().mapToInt(PrizeTier::getRemainingCount).sum();
        if (totalRemaining == 0) {
            throw new ConflictException("남은 티켓이 없습니다.");
        }
        PrizeTier chosen = pickWeighted(available, totalRemaining);

        // 3. 잔여 차감
        chosen.decrementRemaining();

        // 4. 기록 저장 (amount 는 스냅샷, 당첨자 정보 포함 → 당첨 기록에 바로 노출)
        //    이름·전화번호는 선택 입력이라 비어 있을 수 있다 — 빈 문자열로 저장하고 나중에 수정한다
        String winnerName = request.winnerName() == null ? "" : request.winnerName().trim();
        String winnerPhone = request.winnerPhone() == null ? "" : request.winnerPhone();
        DrawRecord record = drawRecordRepository.save(DrawRecord.drawn(
                tournamentId, chosen.getId(), chosen.getAmount(), winnerName, winnerPhone));
        return DrawResponse.from(record);
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
}
