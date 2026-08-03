package com.example.mysterybounty.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.TierDtos.ReplaceRequest;
import com.example.mysterybounty.dto.TierDtos.Response;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.TierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/tiers")
@RequiredArgsConstructor
public class TierController {

    private final TierService tierService;
    private final AuthService authService;

    @GetMapping
    public List<Response> list(@PathVariable Long tournamentId) {
        return tierService.list(authService.currentAdminId(), tournamentId);
    }

    @PutMapping
    public List<Response> replace(@PathVariable Long tournamentId,
                                  @Valid @RequestBody ReplaceRequest request) {
        return tierService.replace(authService.currentAdminId(), tournamentId, request);
    }
}
