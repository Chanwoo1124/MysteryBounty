import type { CSSProperties } from 'react';

/**
 * 상자 이미지의 정렬 기준값.
 *
 * 값은 모두 이미지 크기 대비 0~1 이며 알파 채널에서 실측했다.
 * - box : 투명 여백을 제외한 실제 그림 영역. 상자가 틀을 꽉 채우게 하는 데 쓴다.
 */
const CHEST = {
  src: '/assets/chest-1-closed.png',
  w: 760,
  h: 760,
  box: { x0: 0.1342, y0: 0.2342, x1: 0.8632, y1: 0.7737 },
} as const;

/**
 * 닫힌 보물상자 그림.
 * 추첨 영상이 재생되지 않는 환경에서 대체 연출(DrawStage 의 폴백)에 쓴다.
 */
interface ChestImageProps {
  width: number;
  height: number;
  style?: CSSProperties;
}

export function ChestImage({ width, height, style }: ChestImageProps) {
  // 원본의 투명 여백을 걷어내고 그림 영역만 틀에 맞춘다(contain)
  const { box } = CHEST;
  const boxW = (box.x1 - box.x0) * CHEST.w;
  const boxH = (box.y1 - box.y0) * CHEST.h;
  const scale = Math.min(width / boxW, height / boxH);
  const renderW = CHEST.w * scale;
  const renderH = CHEST.h * scale;

  return (
    <div style={{ position: 'relative', width, height, flexShrink: 0, ...style }}>
      <img
        src={CHEST.src}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: (width - boxW * scale) / 2 - box.x0 * renderW,
          top: (height - boxH * scale) / 2 - box.y0 * renderH,
          width: renderW,
          height: renderH,
        }}
      />
    </div>
  );
}
