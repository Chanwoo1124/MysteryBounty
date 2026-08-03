package com.example.mysterybounty.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.RecordDtos.CreateRequest;
import com.example.mysterybounty.dto.RecordDtos.ListResponse;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.dto.RecordDtos.UpdateRequest;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.ExportService;
import com.example.mysterybounty.service.ExportService.ExportResult;
import com.example.mysterybounty.service.RecordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class RecordController {

    private static final MediaType XLSX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final RecordService recordService;
    private final ExportService exportService;
    private final AuthService authService;

    @GetMapping("/api/tournaments/{tournamentId}/records")
    public ListResponse list(@PathVariable Long tournamentId) {
        return recordService.list(authService.currentAdminId(), tournamentId);
    }

    @PostMapping("/api/tournaments/{tournamentId}/records")
    @ResponseStatus(HttpStatus.CREATED)
    public Response create(@PathVariable Long tournamentId,
                           @Valid @RequestBody CreateRequest request) {
        return recordService.create(authService.currentAdminId(), tournamentId, request);
    }

    @PatchMapping("/api/records/{recordId}")
    public Response update(@PathVariable Long recordId,
                           @RequestBody UpdateRequest request) {
        return recordService.update(authService.currentAdminId(), recordId, request);
    }

    /** 기록 삭제 (오조작 되돌리기 — 추첨 기록이면 티켓 복구) */
    @DeleteMapping("/api/records/{recordId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long recordId) {
        recordService.delete(authService.currentAdminId(), recordId);
    }

    @GetMapping("/api/tournaments/{tournamentId}/records/export")
    public ResponseEntity<Resource> export(@PathVariable Long tournamentId) {
        ExportResult result = exportService.export(authService.currentAdminId(), tournamentId);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(result.filename(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(XLSX_MEDIA_TYPE)
                .body(new ByteArrayResource(result.content()));
    }
}
