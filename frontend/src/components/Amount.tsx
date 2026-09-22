import type { CSSProperties } from 'react';
import { formatWon } from '@/lib/format';

/**
 * 금액 표기(예: '83,500,000'). 원 단위 전체 숫자로만 찍는다.
 *
 * 자릿수가 바뀌어도 폭이 흔들리지 않도록 고정폭 숫자를 쓴다.
 * (추첨 결과 카운트업처럼 숫자가 빠르게 변하는 자리에서 특히 중요)
 */
const STYLE: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

type Props = {
  value: number;
  /**
   * 입체(3D) 금속 숫자로 그린다. 두께·그림자가 붙으므로 큰 글자에서만 쓴다.
   * depth 로 한 층 간격을 조절한다(기본 0.013em). 작은 글자는 0.01em 이하 권장.
   *
   * 이 모드에서는 컴포넌트가 골드 그라데이션까지 직접 칠하므로,
   * 바깥에 .gold-text 를 또 걸면 안 된다.
   */
  solid?: boolean;
  depth?: string;
};

export function Amount({ value, solid, depth }: Props) {
  const text = formatWon(value);

  if (!solid) return <span style={STYLE}>{text}</span>;

  // 두께 레이어는 앞면과 글자가 똑같아야 정확히 겹친다 → 같은 문자열을 두 번 그린다.
  return (
    <span
      className="gold-3d"
      style={depth ? { ...STYLE, ['--gold-3d-depth' as string]: depth } : STYLE}
    >
      <span className="gold-3d__depth" aria-hidden="true">
        {text}
      </span>
      <span className="gold-3d__face">{text}</span>
    </span>
  );
}
