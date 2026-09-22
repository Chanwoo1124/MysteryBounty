package com.example.mysterybounty.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.mysterybounty.dto.DrawDtos.DrawRequest;
import com.example.mysterybounty.dto.DrawDtos.DrawResponse;
import com.example.mysterybounty.service.AuthService;
import com.example.mysterybounty.service.DrawService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class DrawController {

    private final DrawService drawService;
    private final AuthService authService;

    /**
     * 뽑기 실행 (서버가 결과 결정, 당첨자 정보는 기록에 함께 저장).
     * 이 한 번의 요청으로 차감·기록까지 끝난다 — 되돌리려면 당첨 기록 삭제를 쓴다.
     */
    @PostMapping("/api/tournaments/{tournamentId}/draws")
    @ResponseStatus(HttpStatus.CREATED)
    public DrawResponse draw(@PathVariable Long tournamentId,
                             @Valid @RequestBody DrawRequest request) {
        return drawService.draw(authService.currentAdminId(), tournamentId, request);
    }
}
