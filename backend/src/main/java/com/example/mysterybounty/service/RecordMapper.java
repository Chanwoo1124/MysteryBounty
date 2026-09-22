package com.example.mysterybounty.service;

import org.springframework.stereotype.Component;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.dto.RecordDtos.Response;

/** DrawRecord → 응답 DTO 매핑 */
@Component
public class RecordMapper {

    public Response toResponse(DrawRecord r) {
        return new Response(
                r.getId(),
                r.getDrawnAt(),
                r.getAmount(),
                r.getStatus(),
                r.getWinnerName(),
                r.getWinnerPhone());
    }
}
