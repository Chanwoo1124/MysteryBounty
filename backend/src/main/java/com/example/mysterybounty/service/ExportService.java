package com.example.mysterybounty.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;
import com.example.mysterybounty.domain.Tournament;
import com.example.mysterybounty.repository.DrawRecordRepository;
import com.example.mysterybounty.support.SsnCipher;

import lombok.RequiredArgsConstructor;

/**
 * 당첨 기록 엑셀(.xlsx) 내보내기. 단일 시트, 동일인(이름+전화번호)은 한 행으로 합산.
 * 주민번호는 원천징수 목적의 인가된 용도이므로 <b>복호화한 원본값</b>을 출력한다.
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private static final String[] HEADERS =
            {"이름", "영어(성)", "영어(이름)", "주민번호", "은행", "계좌번호", "상금"};

    private final DrawRecordRepository drawRecordRepository;
    private final TournamentService tournamentService;
    private final SsnCipher ssnCipher;

    public record ExportResult(byte[] content, String filename) {
    }

    @Transactional(readOnly = true)
    public ExportResult export(Long adminId, Long tournamentId) {
        tournamentService.getOwned(adminId, tournamentId);

        // 확정된 당첨 기록 전체 (추첨·수동 모두)
        List<DrawRecord> confirmed = drawRecordRepository
                .findByTournamentIdAndStatusOrderByDrawnAtDesc(tournamentId, DrawStatus.CONFIRMED);

        // 이름 + 전화번호 기준 동일인 그룹핑 (금액 합산).
        // 이름 미입력 건은 서로 다른 사람일 수 있으므로 record id 로 각각 분리한다.
        Map<String, Aggregate> grouped = new LinkedHashMap<>();
        for (DrawRecord r : confirmed) {
            String name = safe(r.getWinnerName());
            String key = name.isBlank() ? "id:" + r.getId() : name + "|" + safe(r.getWinnerPhone());
            grouped.computeIfAbsent(key, k -> new Aggregate(r)).add(r);
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("당첨 기록");
            writeHeader(workbook, sheet);

            int rowIdx = 1;
            for (Aggregate agg : grouped.values()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(safe(agg.name));
                row.createCell(1).setCellValue("");                 // 영어(성) — 미수집
                row.createCell(2).setCellValue("");                 // 영어(이름) — 미수집
                row.createCell(3).setCellValue(safe(agg.ssnPlain)); // 주민번호 원본
                row.createCell(4).setCellValue(safe(agg.bank));
                row.createCell(5).setCellValue(safe(agg.accountNumber));
                row.createCell(6).setCellValue(agg.totalAmount);
            }
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            return new ExportResult(out.toByteArray(), "HGP_당첨기록_" + date + ".xlsx");
        } catch (IOException e) {
            throw new IllegalStateException("엑셀 생성 실패", e);
        }
    }

    private void writeHeader(Workbook workbook, Sheet sheet) {
        CellStyle headerStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        headerStyle.setFont(font);

        Row header = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    /** 동일인 합산 누적기 */
    private final class Aggregate {
        private final String name;
        private String ssnPlain;
        private String bank;
        private String accountNumber;
        private long totalAmount;

        private Aggregate(DrawRecord first) {
            this.name = first.getWinnerName();
        }

        private void add(DrawRecord r) {
            totalAmount += r.getAmount();
            if (ssnPlain == null && r.getWinnerSsn() != null) {
                ssnPlain = ssnCipher.decrypt(r.getWinnerSsn());
            }
            if (bank == null && r.getWinnerBank() != null) {
                bank = r.getWinnerBank();
            }
            if (accountNumber == null && r.getWinnerAccountNumber() != null) {
                accountNumber = r.getWinnerAccountNumber();
            }
        }
    }
}
