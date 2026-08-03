package com.example.mysterybounty.dto;

import jakarta.validation.constraints.NotBlank;

/** 인증 관련 DTO */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "아이디를 입력해주세요.") String username,
            @NotBlank(message = "비밀번호를 입력해주세요.") String password) {
    }

    public record AdminResponse(Long id, String username) {
    }
}
