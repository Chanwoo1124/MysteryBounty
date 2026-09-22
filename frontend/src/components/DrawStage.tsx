import { useCallback, useEffect, useRef, useState } from 'react';
import { ChestImage } from './ChestImage';
import { FxOverlay } from './FxOverlay';
import { Amount } from './Amount';
import { intensityOf } from '@/lib/format';

/**
 * 추첨 연출 오버레이.
 *
 * 결과는 이미 끝났고 영상은 그걸 극적으로 보여주는 껍데기다. 영상이 뽑는 게 아니다.
 * 버튼을 누른 순간 서버가 금액을 확정하고 티켓까지 차감한 뒤, 그 확정된 숫자를 들고 이 무대가 열린다.
 * 영상은 금액대에 따라 둘 중 하나가 재생된다 (아래 VIDEOS 참고).
 *
 * 무대는 현황판 위를 덮는 레이어라 페이지 이동이 없다. 연출이 도는 동안 뒤쪽 현황판은
 * 이미 갱신이 끝나 있어, 닫는 순간 차감된 수량과 새 잭팟 정보가 반영된 화면이 그대로 드러난다.
 */

/**
 * 금액대별 영상.
 *
 * 100만원 미만은 담백한 상자 열림, 100만원 이상은 금화가 쏟아지는 연출을 쓴다.
 * 기준은 intensityOf 의 'low' 경계와 같은 값이라, 파티클 강도와 영상이 항상 같이 움직인다.
 *
 * aspect 는 원본 비율 — 무대 상자를 이 비율로 잡아야 objectFit:cover 가 아무것도 잘라내지 않는다.
 */
const VIDEOS = {
  plain: { src: '/assets/treasure-open.mp4', aspect: '1280 / 720' },
  rich: { src: '/assets/treasure-burst.mp4', aspect: '1234 / 746' },
} as const;

type VideoKind = keyof typeof VIDEOS;

/**
 * 금액이 튀어나오는 시점(초) — 영상에서 뚜껑이 열리고 금화가 터져 나오는 순간에 맞춘 값.
 * 두 영상(약 5초) 모두 뚜껑이 다 열린 뒤에 숫자가 오르도록 늦춰 두었다.
 * 영상을 교체해도 깨지지 않도록 '끝나기 1초 전보다는 앞서되, 최대 4초, 최소 0.5초'로 보정한다.
 * (3초짜리 영상으로 바꾸면 2초로 자동으로 당겨져, 금액이 뜨자마자 끝나버리는 사고를 막는다)
 */
const REVEAL_AT_SEC = 4;
/** 영상이 끝나기 전에 금액이 뜨도록 남겨두는 꼬리 여유(초) */
const REVEAL_TAIL_SEC = 1;
const revealAtOf = (duration: number) =>
  Number.isFinite(duration)
    ? Math.min(REVEAL_AT_SEC, Math.max(0.5, duration - REVEAL_TAIL_SEC))
    : REVEAL_AT_SEC;

/**
 * 백업 타이머.
 *
 * 진행은 timeupdate(영상의 실제 재생 위치)로 몬다 — setTimeout 은 버퍼링이 걸려도 혼자 흘러가서
 * 상자가 아직 안 열렸는데 금액이 먼저 뜨는 사고를 낸다. timeupdate 는 영상이 멈추면 같이 멈춘다.
 * 대신 영상이 아예 죽으면 연출이 영영 안 끝나므로, 늦게 한 번 더 부르는 안전장치를 건다.
 * (showPrize/showActions 는 중복 호출을 스스로 막으므로 정상 재생이면 아무 일도 일어나지 않는다)
 */
const REVEAL_BACKUP_GAP_MS = 150;
const ACTIONS_BACKUP_GAP_MS = 500;

/** 영상 없이 CSS 로만 도는 폴백 연출의 시각 */
const FALLBACK_SHAKE_MS = 1600;
const FALLBACK_REVEAL_MS = 4000;
const FALLBACK_ACTIONS_MS = 5600;

/** 영상 레이어 — 원본이 16:9(1280×720) */
const VIDEO_MAX_W = 860;

/** 금화가 쏟아지는 밝은 장면 위에서도 금색 숫자가 읽히도록, 숫자 뒤에 까는 타원 암막 */
const PRIZE_SCRIM =
  'radial-gradient(ellipse 46% 60% at 50% 50%, rgba(0,0,0,0.86), rgba(0,0,0,0.6) 55%, transparent 78%)';

interface DrawStageProps {
  open: boolean;
  /** 서버가 확정한 당첨 금액 */
  amount: number;
  /** 추첨 1회마다 증가 — 같은 금액이 연달아 나와도 연출을 처음부터 다시 돌린다 */
  runKey: number;
  onClose: () => void;
}

export function DrawStage({ open, amount, runKey, onClose }: DrawStageProps) {
  // 두 영상을 모두 심어두고 금액에 따라 하나만 보여준다.
  // 추첨 순간에 src 를 갈아끼우면 그때부터 내려받기 시작해 연출 앞머리가 끊긴다.
  const plainRef = useRef<HTMLVideoElement>(null);
  const richRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** 중복 실행 방지 — 백업 타이머가 뒤늦게 불러도 애니메이션이 두 번 튀지 않게 한다 */
  const shownRef = useRef({ prize: false, actions: false });

  const [prizeShown, setPrizeShown] = useState(false);
  const [actionsShown, setActionsShown] = useState(false);
  /** 영상이 없거나 재생이 막혀 CSS 연출로 대체된 상태 */
  const [fallback, setFallback] = useState(false);
  const [fxKey, setFxKey] = useState(0);

  /** 연출 강도 — 파티클과 영상을 같은 기준으로 고른다 (100만원 경계) */
  const level = intensityOf(amount);
  const kind: VideoKind = level === 'low' ? 'plain' : 'rich';
  const videoRef = kind === 'rich' ? richRef : plainRef;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const showPrize = useCallback(() => {
    if (shownRef.current.prize) return;
    shownRef.current.prize = true;
    setPrizeShown(true);
    setFxKey((k) => k + 1);
  }, []);

  const showActions = useCallback(() => {
    if (shownRef.current.actions) return;
    shownRef.current.actions = true;
    setActionsShown(true);
  }, []);

  // mp4 가 아예 없거나 깨졌으면 첫 추첨 전에 폴백으로 확정해 둔다 (둘 중 하나만 깨져도 폴백)
  useEffect(() => {
    const videos = [plainRef.current, richRef.current].filter(Boolean) as HTMLVideoElement[];
    const onError = () => setFallback(true);
    videos.forEach((v) => v.addEventListener('error', onError));
    return () => videos.forEach((v) => v.removeEventListener('error', onError));
  }, []);

  /** 영상 없이 도는 대체 연출 — 상자를 흔들다 금액을 띄운다 */
  const runFallback = useCallback(() => {
    after(FALLBACK_REVEAL_MS, showPrize);
    after(FALLBACK_ACTIONS_MS, showActions);
  }, [showPrize, showActions]);

  // 무대가 열릴 때마다 처음부터 다시 돌린다
  useEffect(() => {
    if (!open) return;

    shownRef.current = { prize: false, actions: false };
    setPrizeShown(false);
    setActionsShown(false);
    clearTimers();

    const v = videoRef.current;
    if (!v || fallback) {
      runFallback();
      return clearTimers;
    }

    v.currentTime = 0;

    // 브라우저는 소리 있는 영상의 자동재생을 막는다 — 거부당하면 음소거로 한 번 더, 그래도 막히면 폴백
    const play = async () => {
      try {
        await v.play();
      } catch {
        v.muted = true;
        try {
          await v.play();
        } catch {
          setFallback(true);
          runFallback();
          return;
        }
      }
      const revealAt = revealAtOf(v.duration);
      after(revealAt * 1000 + REVEAL_BACKUP_GAP_MS, showPrize);
      after((v.duration || FALLBACK_ACTIONS_MS / 1000) * 1000 + ACTIONS_BACKUP_GAP_MS, showActions);
    };
    void play();

    return clearTimers;
    // fallback 은 한 번 켜지면 되돌리지 않는다 — 재실행 트리거는 runKey 뿐이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, runKey]);

  // 닫힐 때 영상을 되감아, 다음 추첨이 처음부터 재생되게 한다 (다음 금액대를 모르므로 둘 다)
  useEffect(() => {
    if (open) return;
    clearTimers();
    [plainRef.current, richRef.current].forEach((v) => {
      if (!v) return;
      v.pause();
      v.currentTime = 0;
    });
  }, [open]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.92)',
        /*
         * 숨김은 반드시 인라인 display 로 한다. hidden 속성의 display:none 은 UA 스타일시트라
         * 인라인 display:flex 에 덮여 무시된다. (영상 선로딩을 위해 언마운트는 하지 않는다)
         */
        display: open ? 'flex' : 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        // 열릴 때만 페이드인 — 닫힌 동안에는 애니메이션을 물려두지 않는다
        animation: open ? 'hgpStageIn 0.35s ease-out both' : 'none',
      }}
    >
      {/* 영상 레이어 + 그 위에 겹친 금액 */}
      <div
        style={{
          position: 'relative',
          width: `min(${VIDEO_MAX_W}px, 92vw)`,
          // 무대 비율을 재생할 영상에 맞춘다 — 두 영상의 원본 비율이 다르다
          aspectRatio: VIDEOS[kind].aspect,
          maxHeight: '68vh',
          overflow: 'hidden',
        }}
      >
        {(Object.keys(VIDEOS) as VideoKind[]).map((k) => (
          <video
            key={k}
            ref={k === 'rich' ? richRef : plainRef}
            src={VIDEOS[k].src}
            playsInline
            preload="auto"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: fallback || k !== kind ? 'none' : 'block',
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.currentTime >= revealAtOf(v.duration)) showPrize();
            }}
            onEnded={showActions}
          />
        ))}

        {/* 영상이 막혔을 때의 대체 연출 — 상자를 흔들다 금액을 띄운다 */}
        {fallback && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChestImage
              width={320}
              height={236}
              style={{
                // 0.16초짜리 흔들림을 FALLBACK_SHAKE_MS 만큼 반복한다 (반복 횟수로 길이를 맞춘다)
                animation: prizeShown ? 'none' : `hgpShake 0.16s linear ${FALLBACK_SHAKE_MS / 160}`,
                filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.7))',
              }}
            />
          </div>
        )}

        {/* 금액 공개 — 처음엔 숨어 있다가 뚜껑이 열리는 순간 튀어오른다 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: prizeShown ? 1 : 0,
            pointerEvents: 'none',
            animation: prizeShown ? 'hgpPrizePop 1.4s cubic-bezier(0.2, 1.2, 0.4, 1) both' : 'none',
          }}
        >
          <div style={{ position: 'absolute', inset: '-20%', background: PRIZE_SCRIM }} />
          <div
            style={{
              position: 'relative',
              whiteSpace: 'nowrap',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 'min(11vw, 118px)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              filter: 'drop-shadow(0 0 40px rgba(245,198,74,0.6))',
            }}
          >
            <Amount value={amount} solid />
          </div>
        </div>
      </div>

      {/* 액션 — 영상이 끝난 뒤에 열린다 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          opacity: actionsShown ? 1 : 0,
          pointerEvents: actionsShown ? 'auto' : 'none',
          transition: 'opacity 0.4s ease-out',
        }}
      >
        {/* 다음 추첨은 현황판으로 돌아가 DRAW 버튼으로만 한다 (연속 추첨 없음) */}
        <button
          className="btn-gold"
          onClick={onClose}
          style={{ padding: '16px 52px', fontSize: 18, letterSpacing: '0.08em' }}
        >
          EXIT
        </button>
      </div>

      {prizeShown && <FxOverlay level={level} fxKey={fxKey} />}
    </div>
  );
}
