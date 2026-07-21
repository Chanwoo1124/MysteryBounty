# HGP 미스터리 바운티 — 프론트엔드

HOLD'EM GRAND PRIX 오프라인 라이브 포커 대회용 미스터리 바운티 추첨 시스템.
현장에서 태블릿(가로)과 대형 스크린으로 사용한다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드
```

## 화면 구성

| 경로 | 컴포넌트 | 용도 |
|---|---|---|
| `/login` | `LoginScreen` | 관리자 로그인 (레드·블루·블랙 브랜드 무드) |
| `/dashboard` | `TournamentDashboard` | 내 대회 목록 |
| `/setup` | `TicketSetup` | 바운티 풀 구성 (금액×개수) |
| `/board` | `LiveBoard` | 대회 현황판 — 대형 스크린 |
| `/draw` | `DrawCeremony` | 추첨 연출 — 태블릿 |
| `/results` | `ResultsLog` | 당첨 기록 · 엑셀 내보내기 |

대형 스크린 송출 시 `?kiosk=1` 을 붙이면 상단 관리자 바가 숨겨진다. 예: `/board?kiosk=1`

## 아키텍처

**당첨 결과는 서버가 결정한다.** 프론트는 결과값을 받아 연출만 담당한다.
백엔드 연동 지점은 `src/api/client.ts` 한 곳에 모여 있고, 현재는 mock 구현이다.
실제 API가 붙으면 이 파일의 함수 본문만 fetch 호출로 교체하면 되며 화면 코드는 손댈 필요 없다.

- `drawBounty(tiers)` → 서버가 당첨 금액과 차감 대상 티어를 결정해 내려준다
- `confirmDraw(result)` → 티켓 차감·기록 생성 커밋

추첨은 **한 번에 한 건만** 처리한다. 상자 클릭 즉시 `shaking` 으로 전이돼 재클릭이 막히고,
`confirm` 을 눌러야 다음 추첨이 가능하다.

### 추첨 상태 머신 (`DrawCeremony`)

```
staff → handoff(자동 1.8s) → armed → shaking(1.7s) → reveal → confirm → /board
```

현황판에서 진입하면 `staff` 를 건너뛰고 바로 `armed` 로 시작한다.
`staff`/`handoff` 단계는 운영 방식이 바뀔 때 재활성화할 수 있도록 머신에 남겨두었다.

### 연출 강도 (금액 기준)

| 강도 | 조건 | 광선 / 스파크 / 금화 / 플래시 |
|---|---|---|
| jackpot | ≥ 2,000만원 | 14 / 70 / 40(무한) / 1.3s |
| mid | ≥ 100만원 | 8 / 30 / 14(1회) / 0.7s |
| low | < 100만원 | 4 / 12 / — / 없음 |

FX 파티클은 좌표·딜레이가 난수라서, 리렌더마다 재생성되면 애니메이션이 처음부터 다시 시작한다.
카운트업이 매 프레임 상태를 갱신하므로 `FxOverlay` 는 `fxKey` 가 바뀔 때만 `useMemo` 로 1회 생성한다.

## 디렉토리

```
src/
  api/client.ts          백엔드 연동 지점 (현재 mock)
  components/            ChestImage · TierCard · StatCard · FxOverlay · AdminNav
  lib/                   타입 · 포맷 · 동일인 합산 · CSV · useCountUp
  screens/               6개 화면
  store/BountyStore.tsx  서버 소유 상태(tiers/history)의 프론트 캐시
  styles/                tokens.css · animations.css · global.css
```

## 디자인 토큰

`src/styles/tokens.css` 에 컬러·그라데이션·폰트가 CSS 변수로 정리되어 있다.
브랜드 특성상 **border-radius 는 전부 0**이며, 버튼·뱃지는 `skewX(-12deg)` +
내부 콘텐츠 `skewX(12deg)` 복원 패턴을 쓴다 (`.skew` / `.unskew` 유틸).

## 알려진 이슈 / TODO

- `public/assets/chest-3d.png` 은 캔버스로 제작한 임시 일러스트다. **실서비스 전 고품질 3D 렌더로 교체 권장.**
- 로그인이 인증 없이 `/dashboard` 로 이동한다. 실제 인증 API 연동 필요.
- 현황판에서 최고 금액대 티어가 소진되면 잭팟 배너가 사라지면서 화면에서 완전히 없어진다
  (디자인 프로토타입과 동일한 동작). 소진된 잭팟도 표시할지 확인 필요.
- 엑셀 내보내기는 CSV(BOM 포함)다. `.xlsx` 가 필요하면 SheetJS 도입 검토.
