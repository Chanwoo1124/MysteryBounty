package com.example.mysterybounty.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.dto.RecordDtos.ListResponse;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.dto.RecordDtos.Stats;
import com.example.mysterybounty.dto.RecordDtos.UpdateRequest;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.support.NotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final DrawRecordRepository drawRecordRepository;
    private final PrizeTierRepository prizeTierRepository;
    private final TournamentService tournamentService;
    private final RecordMapper recordMapper;

    /**
     * 당첨 기록 목록 + 통계.
     * 상태와 무관하게 전부 노출한다. 새 추첨은 전부 확정(CONFIRMED)이지만, 2단계 추첨 시절의
     * 확인 대기(PENDING) 기록도 티켓은 이미 차감돼 있다 — 숨기면 되돌리기(티켓 복구)를 할 길이 없다.
     * 각 기록은 화면에서 당첨자 정보 입력·수정·삭제(되돌리기)가 가능하다.
     */
    @Transactional(readOnly = true)
    public ListResponse list(Long adminId, Long tournamentId) {
        tournamentService.getOwned(adminId, tournamentId);
        List<DrawRecord> records = drawRecordRepository.findByTournamentIdOrderByDrawnAtDesc(tournamentId);

        long totalPaid = records.stream().mapToLong(DrawRecord::getAmount).sum();
        long maxWin = records.stream().mapToLong(DrawRecord::getAmount).max().orElse(0);
        Stats stats = new Stats(totalPaid, records.size(), maxWin);

        List<Response> responses = records.stream().map(recordMapper::toResponse).toList();
        return new ListResponse(stats, responses);
    }

    /** 당첨자 정보 입력/수정 (부분 업데이트) */
    @Transactional
    public Response update(Long adminId, Long recordId, UpdateRequest request) {
        DrawRecord record = drawRecordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("기록을 찾을 수 없습니다."));
        tournamentService.getOwned(adminId, record.getTournamentId());

        record.updateWinnerInfo(request.winnerName(), request.winnerPhone());
        return recordMapper.toResponse(record);
    }

    /**
     * 기록 삭제 (오조작 되돌리기).
     * 추첨으로 뽑힌 기록(tierId 있음)이면 해당 금액대에 티켓 1건을 복구한다.
     */
    @Transactional
    public void delete(Long adminId, Long recordId) {
        DrawRecord record = drawRecordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("기록을 찾을 수 없습니다."));
        tournamentService.getOwned(adminId, record.getTournamentId());

        if (record.getTierId() != null) {
            findTierToRestore(record).ifPresent(PrizeTier::restoreRemaining);
        }
        drawRecordRepository.delete(record);
    }

    /**
     * 티켓을 되돌려 놓을 금액대를 찾는다.
     *
     * 기록이 들고 있는 tierId 가 1순위지만, 티켓 구성을 다시 저장하면 금액대 행이 통째로
     * 지워졌다 새로 생겨(TierService.replace) 옛 id 는 사라진다. 그때는 <b>금액</b>으로 찾는다
     * — 금액은 기록에 스냅샷으로 남아 있고, 구성 교체도 금액 기준으로 소진분을 이어받기 때문이다.
     * 같은 금액대가 여러 행이면 이미 뽑힌 자리가 있는 행부터 채운다.
     */
    private Optional<PrizeTier> findTierToRestore(DrawRecord record) {
        Optional<PrizeTier> byId = prizeTierRepository.findById(record.getTierId());
        if (byId.isPresent()) {
            return byId;
        }
        return prizeTierRepository.findByTournamentId(record.getTournamentId()).stream()
                .filter(t -> t.getAmount().equals(record.getAmount()))
                .filter(t -> t.getRemainingCount() < t.getTotalCount())
                .findFirst();
    }
}
