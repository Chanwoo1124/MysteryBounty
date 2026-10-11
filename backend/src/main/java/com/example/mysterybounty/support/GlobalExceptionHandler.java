package com.example.mysterybounty.support;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import lombok.extern.slf4j.Slf4j;

/**
 * 전역 예외 처리. 모든 실패 응답은 스펙대로 {@code { "error": "메시지" }} 형태로 통일한다.
 * 주민번호 등 민감 정보가 예외 메시지/로그에 노출되지 않도록 주의한다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 커스텀 API 예외 → 지정된 상태 코드 */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApi(ApiException ex) {
        return error(ex.getStatus(), ex.getMessage());
    }

    /** 인증 실패 → 401 */
    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<Map<String, String>> handleAuth(AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    /** @Valid 검증 실패 → 400 (첫 위반 메시지) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        FieldError first = ex.getBindingResult().getFieldError();
        String message = first != null ? first.getDefaultMessage() : "요청 값이 올바르지 않습니다.";
        return error(HttpStatus.BAD_REQUEST, message);
    }

    /** 본문이 JSON 이 아니거나 숫자 범위를 넘는 등 읽을 수 없는 요청 → 400 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다. 숫자가 너무 크지 않은지 확인해주세요.");
    }

    /** 경로 변수 형식 오류 (예: /api/records/abc) → 400 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return error(HttpStatus.BAD_REQUEST, "요청 경로가 올바르지 않습니다.");
    }

    /** 없는 경로 → 404 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNoResource(NoResourceFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "요청한 주소를 찾을 수 없습니다.");
    }

    /** 지원하지 않는 HTTP 메서드 → 405 */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethod(HttpRequestMethodNotSupportedException ex) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다.");
    }

    /** JSON 이 아닌 본문 형식 → 415 */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMediaType(HttpMediaTypeNotSupportedException ex) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "JSON 형식으로 요청해주세요.");
    }

    /** 그 외 미처리 예외 → 500 (상세는 로그에만, 응답엔 일반 메시지) */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        log.error("처리되지 않은 예외", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
