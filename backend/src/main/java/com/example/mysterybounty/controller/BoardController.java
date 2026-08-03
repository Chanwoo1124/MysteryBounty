package com.example.mysterybounty.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.BoardDtos.BoardResponse;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.BoardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final AuthService authService;

    @GetMapping
    public BoardResponse board(@PathVariable Long tournamentId) {
        return boardService.board(authService.currentAdminId(), tournamentId);
    }
}
