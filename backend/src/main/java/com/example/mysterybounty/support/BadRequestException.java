package com.example.mysterybounty.support;

import org.springframework.http.HttpStatus;

/** 400 — 잘못된 요청 */
public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
