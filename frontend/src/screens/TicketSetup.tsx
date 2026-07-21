import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { StatCard } from '@/components/StatCard';
import { formatKr, manToWon } from '@/lib/format';

/**
 * 바운티 풀 구성 — 금액×개수 쌍을 입력한다.
 * 대회 시작 후에도 수정 가능하도록 잠금은 두지 않는다.
 */
export function TicketSetup() {
  const navigate = useNavigate();
  const { rows, setRows, commitRows } = useBounty();

  const totalCount = rows.reduce((a, r) => a + r.count, 0);
  const totalPrize = rows.reduce((a, r) => a + manToWon(r.amount) * r.count, 0);

  const updateRow = (index: number, field: 'amount' | 'count', value: string) => {
    const parsed = Math.max(0, parseInt(value || '0', 10) || 0);
    setRows(rows.map((r, i) => (i === index ? { ...r, [field]: parsed } : r)));
  };

  const start = () => {
    commitRows();
    navigate('/board');
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '36px 48px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 860,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div className="screen-title-row">
        <div className="screen-title">티켓 구성</div>
        <div className="screen-title-en">BOUNTY POOL SETUP</div>
      </div>

      {/* 요약 — 입력 변경 시 실시간 재계산 */}
      <div
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <StatCard label="총 티켓 수" accent="var(--gold-dark)">
          <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 38, color: 'var(--gold)' }}>
            {totalCount}
            <span style={{ fontSize: 18, marginLeft: 6, color: 'var(--text-dim)' }}>장</span>
          </div>
        </StatCard>
        <StatCard label="총 상금 합계" accent="var(--red)">
          <div className="gold-text-sm" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 38 }}>
            {formatKr(totalPrize)}
          </div>
        </StatCard>
      </div>

      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 44px',
            gap: 12,
            padding: '0 4px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--text-dimmer)',
          }}
        >
          <div>금액 (만원)</div>
          <div>개수</div>
          <div />
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 44px',
              gap: 12,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--gold-border)',
              }}
            >
              {/* 금액대별 컬러 스트라이프 */}
              <div
                style={{
                  width: 8,
                  alignSelf: 'stretch',
                  background:
                    row.amount >= 1000
                      ? 'var(--red)'
                      : row.amount >= 100
                        ? 'var(--gold)'
                        : 'rgba(212,168,84,0.4)',
                  transform: 'skewX(-12deg)',
                  margin: '4px 8px 4px 6px',
                }}
              />
              <input
                type="number"
                value={row.amount}
                onChange={(e) => updateRow(i, 'amount', e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '14px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontFamily: 'var(--font)',
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: 20,
                }}
              />
              <div
                style={{
                  paddingRight: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-dimmer)',
                }}
              >
                만원
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--gold-border)',
              }}
            >
              <input
                type="number"
                value={row.count}
                onChange={(e) => updateRow(i, 'count', e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '14px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontFamily: 'var(--font)',
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: 20,
                  textAlign: 'center',
                }}
              />
              <div
                style={{
                  paddingRight: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-dimmer)',
                }}
              >
                개
              </div>
            </div>

            <button
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C81E2E';
                e.currentTarget.style.color = '#C81E2E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,168,84,0.3)';
                e.currentTarget.style.color = 'rgba(247,241,227,0.5)';
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(212,168,84,0.3)',
                color: 'rgba(247,241,227,0.5)',
                fontSize: 18,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-label="금액대 삭제"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={() => setRows([...rows, { amount: 10, count: 1 }])}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(245,198,74,0.1)';
            e.currentTarget.style.borderColor = '#F5C64A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(245,198,74,0.55)';
          }}
          style={{
            marginTop: 6,
            padding: 13,
            background: 'transparent',
            border: '1px dashed rgba(245,198,74,0.55)',
            color: 'var(--gold)',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          + 금액대 추가
        </button>
      </div>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 34,
          paddingBottom: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          className="btn-gold"
          onClick={start}
          style={{
            padding: 20,
            fontSize: 20,
            boxShadow: '0 6px 28px rgba(245,198,74,0.35)',
          }}
        >
          대회 시작 // START
        </button>
      </div>
    </div>
  );
}
