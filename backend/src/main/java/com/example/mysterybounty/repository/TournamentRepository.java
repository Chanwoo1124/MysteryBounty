package com.example.mysterybounty.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.mysterybounty.domain.Tournament;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}
