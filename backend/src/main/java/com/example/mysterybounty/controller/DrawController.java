package com.example.mysterybounty.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.DrawDtos.DrawResponse;
import com.example.mysterybounty.dto.RecordDtos.Response;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.DrawService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class DrawController {

    private final DrawService drawService;
    private final AuthService authService;

    /** 뽑기 실행 (서버가 결과 결정) */
    @PostMapping("/api/tournaments/{tournamentId}/draws")
    @ResponseStatus(HttpStatus.CREATED)
    public DrawResponse draw(@PathVariable Long tournamentId) {
        return drawService.draw(authService.currentAdminId(), tournamentId);
    }

    /** 연출 종료 후 확정 */
    @PostMapping("/api/draws/{drawId}/confirm")
    public Response confirm(@PathVariable Long drawId) {
        return drawService.confirm(authService.currentAdminId(), drawId);
    }

    /** PENDING 추첨 취소 (오조작 복구) */
    @DeleteMapping("/api/draws/{drawId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long drawId) {
        drawService.cancel(authService.currentAdminId(), drawId);
    }
}
