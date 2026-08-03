package com.example.mysterybounty.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.TournamentDtos.CreateRequest;
import com.example.mysterybounty.dto.TournamentDtos.Response;
import com.example.mysterybounty.dto.TournamentDtos.SummaryResponse;
import com.example.mysterybounty.dto.TournamentDtos.UpdateRequest;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.TournamentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;
    private final AuthService authService;

    @GetMapping
    public List<SummaryResponse> list() {
        return tournamentService.list(authService.currentAdminId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response create(@Valid @RequestBody CreateRequest request) {
        return Response.from(tournamentService.create(authService.currentAdminId(), request));
    }

    @PatchMapping("/{id}")
    public Response update(@PathVariable Long id, @RequestBody UpdateRequest request) {
        return Response.from(tournamentService.update(authService.currentAdminId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tournamentService.delete(authService.currentAdminId(), id);
    }
}
