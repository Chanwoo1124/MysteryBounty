package com.example.mysterybounty.dto;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;

/** 추첨 DTO */
public final class DrawDtos {

    private DrawDtos() {
    }

    /** 뽑기 결과 (프론트는 amount 로 연출) */
    public record DrawResponse(Long drawId, long amount, Long tierId, DrawStatus status) {
        public static DrawResponse from(DrawRecord r) {
            return new DrawResponse(r.getId(), r.getAmount(), r.getTierId(), r.getStatus());
        }
    }
}
