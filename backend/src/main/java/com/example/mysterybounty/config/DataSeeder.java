package com.example.mysterybounty.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.mysterybounty.domain.Admin;
import com.example.mysterybounty.repository.AdminRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** 관리자 계정 시드 — 없을 때만 기본 계정 생성 (이후 비밀번호 변경 권장) */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.default-password}")
    private String adminDefaultPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.existsByUsername(adminUsername)) {
            return;
        }
        adminRepository.save(new Admin(adminUsername, passwordEncoder.encode(adminDefaultPassword)));
        log.info("관리자 계정 시드 생성 완료 - username='{}' (기본 비밀번호는 반드시 변경하세요)", adminUsername);
    }
}
