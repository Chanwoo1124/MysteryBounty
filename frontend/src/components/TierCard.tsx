import { ChestImage } from './ChestImage';
import { formatKr } from '@/lib/format';
import type { Tier } from '@/lib/types';

/** 현황판의 금액대별 잔여 카드. 소진 시 흑백 + DEPLETED 표시 */
export function TierCard({ tier }: { tier: Tier }) {
  const out = tier.left <= 0;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1D1309, #140D05)',
        border: `1px solid ${
          out
            ? 'rgba(212,168,84,0.15)'
            : tier.amount >= 5_000_000
              ? 'var(--gold-border-strong)'
              : 'rgba(212,168,84,0.35)'
        }`,
        padding: '20px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: out ? 0.4 : 1,
        position: 'relative',
      }}
    >
      <ChestImage width={96} height={76} left={tier.left} badgeSize={36} depleted={out} />
      <div
        style={{
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 28,
          lineHeight: 1,
          background: out ? 'var(--dim-text-gradient)' : 'var(--gold-text-gradient)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {formatKr(tier.amount)}
      </div>
      {out ? (
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(247,241,227,0.35)',
          }}
        >
          DEPLETED · 소진
        </div>
      ) : (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'rgba(247,241,227,0.45)',
          }}
        >
          {tier.total}개 중 잔여
        </div>
      )}
    </div>
  );
}
