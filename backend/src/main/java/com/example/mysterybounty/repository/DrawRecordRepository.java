package com.example.mysterybounty.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.mysterybounty.domain.DrawRecord;

public interface DrawRecordRepository extends JpaRepository<DrawRecord, Long> {

    List<DrawRecord> findByTournamentIdOrderByDrawnAtDesc(Long tournamentId);

    void deleteByTournamentId(Long tournamentId);
}
