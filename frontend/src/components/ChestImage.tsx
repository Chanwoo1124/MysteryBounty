import type { CSSProperties } from 'react';

/**
 * 보물상자 이미지 + 잔여 수량 뱃지.
 * 현황판 티어 카드 / 잭팟 배너 / 추첨 화면 세 곳에서 크기만 달리해 재사용한다.
 *
 * NOTE: 현재 에셋은 캔버스로 제작한 임시 일러스트다. 실서비스 전 고품질 3D 렌더로 교체 권장.
 */
interface ChestImageProps {
  width: number;
  height: number;
  /** 잔여 수량 — 지정 시 우상단에 원형 뱃지 표시 */
  left?: number;
  /** 뱃지 지름 (px) */
  badgeSize?: number;
  /** 소진 상태 — 흑백 처리 */
  depleted?: boolean;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function ChestImage({
  width,
  height,
  left,
  badgeSize = 36,
  depleted = false,
  style,
  className,
  onClick,
}: ChestImageProps) {
  const badgeOffset = -badgeSize / 3;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        width,
        height,
        flexShrink: 0,
        filter: depleted ? 'grayscale(0.9) brightness(0.6)' : undefined,
        ...style,
      }}
    >
      <img
        src="/assets/chest-3d.png"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {left !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: badgeOffset,
            right: badgeOffset,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            background: depleted ? '#2A1F12' : 'var(--red)',
            border: `2px solid ${depleted ? 'rgba(212,168,84,0.3)' : 'var(--gold-light)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: badgeSize * 0.48,
            color: depleted ? 'rgba(247,241,227,0.35)' : '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {left}
        </div>
      )}
    </div>
  );
}
