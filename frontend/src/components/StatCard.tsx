import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  children: ReactNode;
  /** 강조 컬러 — accent 위치에 따라 왼쪽 또는 위쪽 테두리로 들어간다 */
  accent: string;
  accentSide?: 'left' | 'top';
}

/** 티켓 구성 요약 / 당첨 기록 통계에 공통으로 쓰이는 지표 카드 */
export function StatCard({ label, children, accent, accentSide = 'left' }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--gold-border)',
        borderLeft: accentSide === 'left' ? `4px solid ${accent}` : undefined,
        borderTop: accentSide === 'top' ? `3px solid ${accent}` : undefined,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(247,241,227,0.45)',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
