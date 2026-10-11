package com.example.mysterybounty.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.domain.Admin;
import com.example.mysterybounty.dto.AuthDtos.AdminResponse;
import com.example.mysterybounty.dto.AuthDtos.LoginRequest;
import com.example.mysterybounty.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final AuthService authService;

    @PostMapping("/login")
    public AdminResponse login(@Valid @RequestBody LoginRequest request,
                               HttpServletRequest httpRequest,
                               HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        // 로그인 전에 쓰던 세션이 있으면 ID 를 바꾼다 (세션 고정 공격 방지)
        // 직접 인증하는 구조라 Spring Security 의 자동 세션 교체가 적용되지 않는다
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        // 인증 성공 → SecurityContext 를 세션에 저장 (세션 쿠키 발급)
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        Admin admin = authService.currentAdmin();
        return new AdminResponse(admin.getId(), admin.getUsername());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/me")
    public AdminResponse me() {
        Admin admin = authService.currentAdmin();
        return new AdminResponse(admin.getId(), admin.getUsername());
    }
}
