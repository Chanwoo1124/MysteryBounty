package com.example.mysterybounty.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 관리자 계정 (회원가입 없음, 시드로 생성) */
@Entity
@Table(name = "admin")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    /** BCrypt 해시 */
    @Column(nullable = false)
    private String password;

    public Admin(String username, String encodedPassword) {
        this.username = username;
        this.password = encodedPassword;
    }

    /** 비밀번호 변경 (BCrypt 해시 전달) */
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }
}
