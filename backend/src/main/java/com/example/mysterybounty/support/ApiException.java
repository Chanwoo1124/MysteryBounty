package com.example.mysterybounty.support;

import org.springframework.http.HttpStatus;

/** API 예외 공통 부모 — HTTP 상태를 함께 들고 다닌다. */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
