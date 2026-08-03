package com.example.mysterybounty.support;

import org.springframework.http.HttpStatus;

/** 409 — 상태 충돌 (한 번에 한 건 규칙, 이미 확정 등) */
public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
