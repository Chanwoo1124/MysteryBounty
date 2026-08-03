package com.example.mysterybounty.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.mysterybounty.domain.Admin;
import com.example.mysterybounty.repository.AdminRepository;
import com.example.mysterybounty.support.NotFoundException;

import lombok.RequiredArgsConstructor;

/** 현재 로그인한 관리자 조회 (세션 SecurityContext 기반) */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdminRepository adminRepository;

    public Admin currentAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new NotFoundException("로그인 정보를 확인할 수 없습니다.");
        }
        return adminRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundException("관리자 계정을 찾을 수 없습니다."));
    }

    public Long currentAdminId() {
        return currentAdmin().getId();
    }
}
