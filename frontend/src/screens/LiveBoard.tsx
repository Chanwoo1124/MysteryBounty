import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { TierTable } from '@/components/TierTable';
import { Amount } from '@/components/Amount';
import { DrawStage } from '@/components/DrawStage';
import { DrawEntryModal } from '@/components/DrawEntryModal';
import { ApiError } from '@/api/client';
import { LoadErrorBanner, loadErrorMessage } from '@/components/LoadErrorBanner';

/**
 * 현황판 무대 크기 — 시안과 같은 비율(16:9)로 고정하고 화면에 맞춰 통째로 배율만 바꾼다.
 * 덕분에 아래 치수는 전부 '시안 위의 px' 그대로 적을 수 있다.
 */
const STAGE_W = 1344;
const STAGE_H = 752;

/** 금액대 표가 차지하는 높이 */
const TABLE_H = 236;

/** DRAW 버튼 — 좌우 끝이 뾰족한 육각형 */
const BUTTON_CLIP =
  'polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)';

/** 시안의 색 */
const C = {
  ink: '#050505',
  panelInk: '#0A0A0A',
  gold: '#E9C87E',
  goldDim: 'rgba(212,168,84,0.75)',
  cream: '#F3EEE2',
  /** 잔여 수량처럼 멀리서 읽어야 하는 숫자 — 일반 글자보다 한 단계 밝게 */
  creamBright: '#FBF8F0',
  creamDim: '#B9B3A6',
};

/**
 * 대형 디스플레이용 메인 현황판.
 * 대회 총 상금(추첨과 무관하게 고정)과 금액대별 잔여를 한눈에 보여준다.
 */
export function LiveBoard() {
  const navigate = useNavigate();
  const { tiers, totalPrize, remainingTickets, currentTournamentId, loadBoard, draw } = useBounty();
  const [fitRef, scale] = useStageFit(STAGE_W, STAGE_H);

  /* 추첨 연출 — 페이지를 옮기지 않고 현황판 위에 무대를 덮는다 */
  const [drawing, setDrawing] = useState(false);
  /** 추첨 전 당첨자 정보 입력 창 */
  const [entryOpen, setEntryOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [stageAmount, setStageAmount] = useState(0);
  /** 추첨 1회마다 증가 — 같은 금액이 연달아 나와도 연출을 다시 돌린다 */
  const [runKey, setRunKey] = useState(0);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    setLoadError('');
    loadBoard().catch((err) => setLoadError(loadErrorMessage(err)));
  }, [loadBoard]);

  // 진입 시 현황을 불러온다. (같은 기기에서 추첨하므로 별도 폴링 없이 액션 직후 재조회로 충분)
  // 401 은 스토어가 로그인 상태를 내려 로그인 화면으로 보낸다
  useEffect(() => {
    if (!currentTournamentId) {
      navigate('/dashboard');
      return;
    }
    load();
  }, [currentTournamentId, load, navigate]);

  /**
   * 추첨 — 입력 창에서 이름·전화번호 뒷자리를 받으면 실행된다.
   * 서버가 금액을 확정하고 티켓 차감·기록 저장까지 한 번에 끝낸 뒤, 그 숫자를 들고 무대를 연다.
   * 영상은 결과를 보여주는 껍데기일 뿐이라 재생 전에 결과가 이미 나와 있어야 한다.
   * 연출 도중 새로고침해도 결과는 이미 서버에 남아 있어 다음 추첨이 막히지 않는다.
   */
  const runDraw = useCallback(async (name: string, phoneLast4: string) => {
    if (drawing) return;
    setDrawing(true);
    try {
      const drawn = await draw(name, phoneLast4);
      setEntryOpen(false);
      setStageAmount(drawn.amount);
      setRunKey((k) => k + 1);
      setStageOpen(true);
    } catch (err) {
      // 잔여 티켓 없음 / 입력값 오류 등 — 입력 창은 열어둬 다시 시도할 수 있게 한다
      window.alert(err instanceof ApiError ? err.message : '추첨에 실패했습니다.');
    } finally {
      setDrawing(false);
    }
  }, [drawing, draw]);

  return (
    <div
      // 현황판은 대형 디스플레이에 띄우는 화면 — 스크롤 없이 한 화면에 담는다
      className="screen-fill"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.ink,
        overflow: 'hidden',
      }}
    >
      {/* 실제로 보이는 영역을 재는 센티넬 — 내용이 든 요소를 재면 배율이 줄지 않는다 */}
      <div ref={fitRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          flexShrink: 0,
          transform: `scale(${scale})`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Backdrop />

        {/* 헤더 */}
        <div
          style={{
            height: 64,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px 0 40px',
            position: 'relative',
          }}
        >
          {/* 로고 그림은 배경이 검정으로 채워져 있다 — screen 합성으로 검은 바탕만 지운다 */}
          <img
            src="/assets/hgp-logo.png"
            alt="HGP"
            style={{ height: 34, mixBlendMode: 'screen' }}
          />
          <div
            style={{
              marginLeft: 30,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: C.cream }}>
              HOLDEM GRAND PRIX
            </span>
            <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.18)' }} />
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.3em', color: C.gold }}>
              MYSTERY BOUNTY
            </span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233,200,126,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            style={{
              marginLeft: 'auto',
              padding: '9px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.goldDim}`,
              color: C.gold,
              fontFamily: 'var(--font-kr)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            ← 내 대회 목록
          </button>
        </div>

        {/* TOTAL BOUNTY */}
        <div
          style={{
            width: 975,
            height: 170,
            margin: '20px auto 0',
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 숫자 뒤로 번지는 금빛 — 테두리 없이 배경에 스며들게 한다 */}
          <div
            style={{
              position: 'absolute',
              left: -80,
              right: -80,
              top: -10,
              bottom: -10,
              background:
                'radial-gradient(ellipse 42% 58% at 50% 54%, rgba(247,206,120,0.18), rgba(247,206,120,0.06) 45%, transparent 72%)',
              pointerEvents: 'none',
            }}
          />
          {/* 숫자를 가로지르는 빛줄기 — 굵고 흐린 띠 위에 가는 선을 겹친다 */}
          <div
            style={{
              position: 'absolute',
              left: -140,
              right: -140,
              top: 80,
              height: 30,
              background:
                'linear-gradient(90deg, transparent, rgba(247,206,120,0.18) 28%, rgba(255,240,200,0.3) 50%, rgba(247,206,120,0.18) 72%, transparent)',
              filter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -140,
              right: -140,
              top: 94,
              height: 2,
              background:
                'linear-gradient(90deg, transparent, rgba(245,220,150,0.5) 30%, rgba(255,245,215,0.9) 50%, rgba(245,220,150,0.5) 70%, transparent)',
              filter: 'blur(1px)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: '0.42em',
              textIndent: '0.42em',
              color: C.cream,
            }}
          >
            TOTAL BOUNTY
          </div>

          <div
            style={{
              marginTop: 2,
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              filter: 'drop-shadow(0 4px 30px rgba(255,214,110,0.5))',
            }}
          >
            <Amount value={totalPrize} solid />
          </div>

          <div
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontFamily: 'var(--font-kr)',
              fontWeight: 600,
              fontSize: 17,
              color: C.cream,
            }}
          >
            <span
              style={{
                width: 72,
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(212,168,84,0.7))',
              }}
            />
            남은 티켓 {remainingTickets}장
            <span
              style={{
                width: 72,
                height: 1,
                background: 'linear-gradient(90deg, rgba(212,168,84,0.7), transparent)',
              }}
            />
          </div>
        </div>

        {/* 금액대별 잔여 목록 — 잭팟 배너가 빠진 자리를 나눠 갖도록 위 여백을 늘렸다 */}
        <div style={{ width: 857, margin: '72px auto 0', flexShrink: 0 }}>
          <TierTable tiers={tiers} height={TABLE_H} />
        </div>

        {/* 추첨 버튼 — 남은 공간의 아래쪽에 붙인다 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 30,
          }}
        >
          <AngledFrame clip={BUTTON_CLIP} borderWidth={1.5} frame={C.goldDim}>
            <button
              onClick={() => setEntryOpen(true)}
              disabled={remainingTickets === 0 || drawing}
              onMouseEnter={(e) => {
                if (remainingTickets > 0) e.currentTarget.style.background = 'rgba(233,200,126,0.14)';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.panelInk)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: 282,
                height: 43,
                justifyContent: 'center',
                background: C.panelInk,
                border: 'none',
                clipPath: BUTTON_CLIP,
                color: '#F0E4C4',
                fontSize: 17,
                fontWeight: 700,
                cursor: remainingTickets === 0 || drawing ? 'not-allowed' : 'pointer',
                opacity: remainingTickets === 0 || drawing ? 0.4 : 1,
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-kr)' }}>추첨 진행</span>
              <span style={{ fontStyle: 'italic', letterSpacing: '0.06em' }}>→ DRAW</span>
            </button>
          </AngledFrame>
        </div>

        {/*
         * 당첨 기록 바로가기 — 표 아래 오른쪽 빈 자리.
         * 가운데 DRAW 버튼과 가로로 겹치지 않는 자리라 흐름 배치에 끼우지 않고 겹쳐 띄운다.
         */}
        <button
          onClick={() => navigate('/results')}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233,200,126,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          style={{
            position: 'absolute',
            right: 40,
            bottom: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.goldDim}`,
            color: C.gold,
            cursor: 'pointer',
            transition: 'background 0.15s',
            zIndex: 4,
          }}
        >
          <span style={{ fontFamily: 'var(--font-kr)', fontWeight: 700, fontSize: 14 }}>
            당첨 기록
          </span>
          <span
            style={{ fontStyle: 'italic', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em' }}
          >
            RESULTS →
          </span>
        </button>

      </div>

      {/*
       * 추첨 연출은 현황판 위를 덮는 레이어다 (페이지 이동 없음).
       * position:fixed 라 transform 이 걸린 무대 안에 두면 기준이 무대로 바뀐다 — 반드시 바깥에 둔다.
       */}
      <LoadErrorBanner message={loadError} onRetry={load} />
      <DrawEntryModal
        open={entryOpen}
        busy={drawing}
        onSubmit={(name, phoneLast4) => void runDraw(name, phoneLast4)}
        onClose={() => setEntryOpen(false)}
      />
      <DrawStage
        open={stageOpen}
        amount={stageAmount}
        runKey={runKey}
        onClose={() => setStageOpen(false)}
      />
    </div>
  );
}

/**
 * 고정 크기 무대를 실제 화면에 맞춰 줄이는 배율을 잰다.
 *
 * 높이는 `window.innerHeight` 가 아니라 실제 렌더된 영역을 잰다. 100vh 가 눈에 보이는 높이보다
 * 큰 환경(주소창/툴바가 접혔다 펴지는 브라우저)에서 창 높이를 믿으면 아래가 잘린다.
 * ref 는 반드시 내용이 없는 센티넬(`position:absolute; inset:0`)에 달아야 한다 —
 * 내용이 든 요소를 재면 내용이 커서 잰 높이도 커지고 배율이 내려가지 않는다.
 */
function useStageFit(w: number, h: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { clientWidth: cw, clientHeight: ch } = el;
      if (cw <= 0 || ch <= 0) return;
      setScale(Math.min(cw / w, ch / h));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  return [ref, scale] as const;
}

/**
 * 각진 테두리 틀.
 * clip-path 로 자르면 border 도 같이 잘려 사라지므로, 골드로 칠한 바깥면 위에
 * 같은 모양으로 자른 어두운 면을 얹어 테두리처럼 보이게 한다.
 */
function AngledFrame({
  clip,
  frame,
  children,
  borderWidth = 2,
  style,
  innerStyle,
}: {
  clip: string;
  frame: string;
  children: ReactNode;
  borderWidth?: number;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}) {
  return (
    <div style={{ background: frame, clipPath: clip, padding: borderWidth, ...style }}>
      <div style={{ clipPath: clip, background: C.panelInk, ...innerStyle }}>{children}</div>
    </div>
  );
}

/** 배경 — 검은 바탕에 대각선 금빛 줄기와 HGP 워터마크 */
function Backdrop() {
  const streak = (s: CSSProperties): CSSProperties => ({
    position: 'absolute',
    transform: 'rotate(-47deg)',
    pointerEvents: 'none',
    ...s,
  });

  return (
    // z-index: -1 이 없으면 '위치 지정된' 이 레이어가 본문(표 헤더처럼 position 이 없는 요소)
    // 위에 그려져 글자를 덮는다. 무대에 transform 이 걸려 있어 여기서 음수 z 가 안전하다.
    <div
      style={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {/* 위쪽이 살짝 밝은 바탕 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 55% at 50% 0%, #131313, #050505 70%)',
        }}
      />

      <img
        src="/assets/hgp-logo.png"
        alt=""
        style={{
          position: 'absolute',
          left: -18,
          bottom: 30,
          width: 260,
          opacity: 0.05,
          filter: 'grayscale(1) brightness(2.4)',
        }}
      />

      {/* 좌상단 */}
      <div
        style={streak({
          top: -30,
          left: -200,
          width: 440,
          height: 130,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          filter: 'blur(18px)',
        })}
      />
      <div
        style={streak({
          top: 60,
          left: -150,
          width: 340,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(232,150,60,0.55), transparent)',
        })}
      />
      <div
        style={streak({
          top: 160,
          left: -190,
          width: 300,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(232,150,60,0.3), transparent)',
        })}
      />

      {/* 우하단 */}
      <div
        style={streak({
          bottom: -40,
          right: -200,
          width: 460,
          height: 150,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.045), transparent)',
          filter: 'blur(18px)',
        })}
      />
      <div
        style={streak({
          bottom: 90,
          right: -160,
          width: 360,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(232,150,60,0.5), transparent)',
        })}
      />
      <div
        style={streak({
          bottom: 190,
          right: -120,
          width: 300,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(232,150,60,0.28), transparent)',
        })}
      />
    </div>
  );
}
