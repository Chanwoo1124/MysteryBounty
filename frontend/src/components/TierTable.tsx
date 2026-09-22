import type { CSSProperties } from 'react';
import { Amount } from './Amount';
import type { Tier } from '@/lib/types';

/** 이 금액 이상은 노란색(골드)으로 강조한다 */
const HIGHLIGHT_MIN = 1_000_000;

/** 헤더(AMOUNT / REMAINING) 줄 높이 */
const HEAD_H = 30;
/** 한 줄의 기본 높이 — 금액대가 많으면 이보다 줄어든다 */
const ROW_H = 42;

/** 금액 / 잔여 2열 격자 — 헤더와 본문이 같은 컬럼을 쓴다 */
const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: 16,
  padding: '0 4px 0 16px',
};

/** 한 자리 수도 두 자리로 맞춰 열이 흔들리지 않게 한다 (01 / 06 / 27) */
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * 현황판 금액대 목록 — 금액(원) / 잔여 수량.
 * 최고 금액대는 잭팟 배너로 따로 강조하지만, 상금 구조를 한눈에 보도록 표에도 함께 싣는다.
 *
 * 100만원 이상은 골드 글자 + 왼쪽 골드 표식으로 강조하고, 그 미만은 흰 글자로 담담하게 둔다.
 * 현황판은 고정 크기 무대(LiveBoard) 위에 올라가므로 크기 단위는 모두 px 이고,
 * 금액대가 많아지면 주어진 높이 안에 들어가도록 줄 높이와 글자를 함께 줄인다.
 */
export function TierTable({ tiers, height }: { tiers: Tier[]; height: number }) {
  // 6개 이상부터 두 열 — 그 아래는 한 열이 더 보기 좋다
  const split = tiers.length >= 6;
  const perCol = split ? Math.ceil(tiers.length / 2) : tiers.length;
  const columns = split ? [tiers.slice(0, perCol), tiers.slice(perCol)] : [tiers];

  const rowH = Math.min(ROW_H, (height - HEAD_H) / Math.max(perCol, 1));
  const fontSize = Math.max(12, Math.min(26, rowH * 0.62));

  return (
    <div
      style={{
        height,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
        gap: 40,
        alignContent: 'start',
      }}
    >
      {columns.map((column, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              ...GRID,
              height: HEAD_H,
              alignItems: 'end',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.18)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#8E8878',
            }}
          >
            <div>AMOUNT</div>
            <div style={{ textAlign: 'right' }}>REMAINING</div>
          </div>

          {column.map((tier, i) => (
            <TierRow key={`${tier.amount}-${i}`} tier={tier} rowH={rowH} fontSize={fontSize} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TierRow({ tier, rowH, fontSize }: { tier: Tier; rowH: number; fontSize: number }) {
  const out = tier.left <= 0;
  // 100만원 이상은 노란색 + 왼쪽 골드 표식으로 강조
  const hot = tier.amount >= HIGHLIGHT_MIN;

  return (
    <div
      style={{
        ...GRID,
        height: rowH,
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        opacity: out ? 0.3 : 1,
      }}
    >
      {hot && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '22%',
            bottom: '22%',
            width: 4,
            background: 'linear-gradient(180deg, #F2D68C, #C9962B)',
          }}
        />
      )}

      <div
        style={{
          fontSize,
          lineHeight: 1.1,
          // 강조 행만 기울임 + 골드, 나머지는 담담한 흰 글자
          fontStyle: hot ? 'italic' : 'normal',
          fontWeight: hot ? 800 : 500,
          color: hot ? '#F7DFA8' : '#EDE7DA',
          textDecoration: out ? 'line-through' : undefined,
        }}
      >
        <Amount value={tier.amount} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          fontSize,
          lineHeight: 1.1,
          fontStyle: 'italic',
          fontWeight: 800,
          color: '#FBF8F0',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pad2(tier.left)}
        <span
          style={{
            fontSize: fontSize * 0.78,
            fontStyle: 'normal',
            fontWeight: 500,
            color: '#8E8878',
          }}
        >
          / {pad2(tier.total)}
        </span>
      </div>
    </div>
  );
}
