package com.example.mysterybounty.support;

import org.springframework.http.HttpStatus;

/** 404 — 리소스 없음 */
public class NotFoundException extends ApiException {
    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
