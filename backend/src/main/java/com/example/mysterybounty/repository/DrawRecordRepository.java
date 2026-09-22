package com.example.mysterybounty.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.mysterybounty.domain.DrawRecord;
import com.example.mysterybounty.domain.DrawStatus;

public interface DrawRecordRepository extends JpaRepository<DrawRecord, Long> {

    List<DrawRecord> findByTournamentIdAndStatusOrderByDrawnAtDesc(Long tournamentId, DrawStatus status);

    void deleteByTournamentId(Long tournamentId);
}
