import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { StatCard } from '@/components/StatCard';
import { Amount } from '@/components/Amount';
import { manToWon } from '@/lib/format';
import { ApiError } from '@/api/client';

/**
 * 바운티 풀 구성 — 금액×개수 쌍을 입력한다.
 * 대회 시작 후에도 수정 가능하도록 잠금은 두지 않는다.
 */
export function TicketSetup() {
  const navigate = useNavigate();
  const { rows, setRows, currentTournamentId, loadTiersIntoRows, saveAndStart } = useBounty();
  const [busy, setBusy] = useState(false);

  // 선택된 대회가 없으면 목록으로. 있으면 기존 티어를 입력 폼에 채운다.
  useEffect(() => {
    if (!currentTournamentId) {
      navigate('/dashboard');
      return;
    }
    loadTiersIntoRows().catch((err) => {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    });
  }, [currentTournamentId, loadTiersIntoRows, navigate]);

  const totalCount = rows.reduce((a, r) => a + r.count, 0);
  const totalPrize = rows.reduce((a, r) => a + manToWon(r.amount) * r.count, 0);

  const updateRow = (index: number, field: 'amount' | 'count', value: string) => {
    // 숫자 이외 문자·앞자리 0 제거 후 정수로 변환 (빈 값은 0)
    const digits = value.replace(/[^0-9]/g, '');
    const parsed = digits === '' ? 0 : parseInt(digits, 10);
    setRows(rows.map((r, i) => (i === index ? { ...r, [field]: parsed } : r)));
  };

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveAndStart();
      navigate('/board');
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '대회 시작에 실패했습니다.');
    } finally {
      setBusy(false);
    }
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
        <button
          className="btn-gold-outline"
          onClick={() => navigate('/dashboard')}
          style={{
            marginLeft: 'auto',
            padding: '12px 20px',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.08em',
          }}
        >
          내 대회 목록
        </button>
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
            <Amount value={totalPrize} />
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
              className="field-group"
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
                  // 금액대를 골드의 밝기 3단계로 구분한다 (높을수록 밝게)
                  background:
                    row.amount >= 1000
                      ? 'var(--gold-lighter)'
                      : row.amount >= 100
                        ? 'var(--gold)'
                        : 'var(--gold-dark)',
                  transform: 'skewX(-12deg)',
                  margin: '4px 8px 4px 6px',
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                value={row.amount === 0 ? '' : String(row.amount)}
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
              className="field-group"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--gold-border)',
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={row.count === 0 ? '' : String(row.count)}
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
                e.currentTarget.style.borderColor = 'var(--gold-border)';
                e.currentTarget.style.color = 'var(--text-dim)';
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--gold-border)',
                color: 'var(--text-dim)',
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
            e.currentTarget.style.background = 'rgba(233,200,126,0.08)';
            e.currentTarget.style.borderColor = 'var(--gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--gold-border-strong)';
          }}
          style={{
            marginTop: 6,
            padding: 13,
            background: 'transparent',
            border: '1px dashed var(--gold-border-strong)',
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
          disabled={busy}
          style={{
            padding: 20,
            fontSize: 20,
            opacity: busy ? 0.7 : 1,
            cursor: busy ? 'wait' : 'pointer',
            boxShadow: '0 6px 28px rgba(233,200,126,0.3)',
          }}
        >
          대회 시작 // START
        </button>
      </div>
    </div>
  );
}
