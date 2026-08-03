package com.example.mysterybounty.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;
import com.example.mysterybounty.domain.PrizeTier;
import com.example.mysterybounty.dto.RecordDtos.CreateRequest;
import com.example.mysterybounty.dto.RecordDtos.ListResponse;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.dto.RecordDtos.Stats;
import com.example.mysterybounty.dto.RecordDtos.UpdateRequest;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.repository.PrizeTierRepository;
import com.example.mysterybounty.support.NotFoundException;
import com.example.mysterybounty.support.SsnCipher;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final DrawRecordRepository drawRecordRepository;
    private final PrizeTierRepository prizeTierRepository;
    private final TournamentService tournamentService;
    private final RecordMapper recordMapper;
    private final SsnCipher ssnCipher;

    /**
     * 당첨 기록 목록 + 통계.
     * 추첨으로 확정된 기록과 수동 입력 기록을 모두 노출한다(확정 대기 PENDING 제외).
     * 각 기록은 화면에서 당첨자 정보 입력·수정·삭제(되돌리기)가 가능하다.
     */
    @Transactional(readOnly = true)
    public ListResponse list(Long adminId, Long tournamentId) {
        tournamentService.getOwned(adminId, tournamentId);
        List<DrawRecord> confirmed = drawRecordRepository
                .findByTournamentIdAndStatusOrderByDrawnAtDesc(tournamentId, DrawStatus.CONFIRMED);

        long totalPaid = confirmed.stream().mapToLong(DrawRecord::getAmount).sum();
        long maxWin = confirmed.stream().mapToLong(DrawRecord::getAmount).max().orElse(0);
        Stats stats = new Stats(totalPaid, confirmed.size(), maxWin);

        List<Response> responses = confirmed.stream().map(recordMapper::toResponse).toList();
        return new ListResponse(stats, responses);
    }

    /** 수동 기록 추가 (추첨 없이 직접 입력) — 즉시 CONFIRMED */
    @Transactional
    public Response create(Long adminId, Long tournamentId, CreateRequest request) {
        tournamentService.getOwned(adminId, tournamentId);
        DrawRecord record = DrawRecord.manual(tournamentId, request.amount());
        record.updateWinnerInfo(
                request.winnerName(),
                request.winnerPhone(),
                ssnCipher.encrypt(request.winnerSsn()),
                request.winnerBank(),
                request.winnerAccountNumber());
        return recordMapper.toResponse(drawRecordRepository.save(record));
    }

    /** 당첨자 정보 입력/수정 (부분 업데이트) */
    @Transactional
    public Response update(Long adminId, Long recordId, UpdateRequest request) {
        DrawRecord record = drawRecordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("기록을 찾을 수 없습니다."));
        tournamentService.getOwned(adminId, record.getTournamentId());

        // 상금은 값이 있을 때만 변경 (null 이면 미변경)
        if (request.amount() != null) {
            record.changeAmount(request.amount());
        }
        // 주민번호는 값이 있을 때만 암호화 (null 이면 미변경)
        String encryptedSsn = (request.winnerSsn() != null && !request.winnerSsn().isBlank())
                ? ssnCipher.encrypt(request.winnerSsn())
                : null;
        record.updateWinnerInfo(
                request.winnerName(),
                request.winnerPhone(),
                encryptedSsn,
                request.winnerBank(),
                request.winnerAccountNumber());
        return recordMapper.toResponse(record);
    }

    /**
     * 기록 삭제 (오조작 되돌리기).
     * 추첨으로 뽑힌 기록(tierId 있음)이면 해당 티어에 티켓 1건을 복구한다.
     */
    @Transactional
    public void delete(Long adminId, Long recordId) {
        DrawRecord record = drawRecordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("기록을 찾을 수 없습니다."));
        tournamentService.getOwned(adminId, record.getTournamentId());

        if (record.getTierId() != null) {
            prizeTierRepository.findById(record.getTierId())
                    .ifPresent(PrizeTier::restoreRemaining);
        }
        drawRecordRepository.delete(record);
    }
}
