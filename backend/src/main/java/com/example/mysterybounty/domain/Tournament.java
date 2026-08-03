package com.example.mysterybounty.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 대회 */
@Entity
@Table(name = "tournament")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소유 관리자 */
    @Column(nullable = false)
    private Long adminId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Tournament(Long adminId, String name) {
        this.adminId = adminId;
        this.name = name;
        this.status = TournamentStatus.READY;
        this.createdAt = LocalDateTime.now();
    }

    /** 이름 변경 (부분 업데이트, null 이면 무시) */
    public void rename(String name) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
    }

    /** 상태 변경 (부분 업데이트, null 이면 무시) */
    public void changeStatus(TournamentStatus status) {
        if (status != null) {
            this.status = status;
        }
    }

    public boolean isOwnedBy(Long adminId) {
        return this.adminId.equals(adminId);
    }
}
