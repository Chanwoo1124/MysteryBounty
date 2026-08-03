package com.example.mysterybounty.service;

import org.springframework.stereotype.Component;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.support.SsnCipher;

import lombok.RequiredArgsConstructor;

/** DrawRecord → 응답 DTO 매핑 (주민번호는 마스킹) */
@Component
@RequiredArgsConstructor
public class RecordMapper {

    private final SsnCipher ssnCipher;

    public Response toResponse(DrawRecord r) {
        return new Response(
                r.getId(),
                r.getDrawnAt(),
                r.getAmount(),
                r.getStatus(),
                r.getWinnerName(),
                r.getWinnerPhone(),
                ssnCipher.maskFromEncrypted(r.getWinnerSsn()),
                r.getWinnerBank(),
                r.getWinnerAccountNumber());
    }
}
