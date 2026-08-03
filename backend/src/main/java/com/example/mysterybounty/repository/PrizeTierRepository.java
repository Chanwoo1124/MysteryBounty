package com.example.mysterybounty.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.mysterybounty.domain.PrizeTier;

import jakarta.persistence.LockModeType;

public interface PrizeTierRepository extends JpaRepository<PrizeTier, Long> {

    List<PrizeTier> findByTournamentIdOrderByAmountDesc(Long tournamentId);

    List<PrizeTier> findByTournamentId(Long tournamentId);

    /** 추첨 시 동시성 제어용 — 대회 티어들을 쓰기 락으로 조회 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from PrizeTier t where t.tournamentId = :tournamentId")
    List<PrizeTier> findByTournamentIdForUpdate(@Param("tournamentId") Long tournamentId);

    void deleteByTournamentId(Long tournamentId);
}
