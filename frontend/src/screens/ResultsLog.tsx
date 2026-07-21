import { useState } from 'react';
import { useBounty } from '@/store/BountyStore';
import { StatCard } from '@/components/StatCard';
import { formatKr, manToWon } from '@/lib/format';
import { groupByPerson } from '@/lib/grouping';
import { exportHistoryCsv } from '@/lib/csv';

const TABLE_COLUMNS = '50px 150px 1fr 1fr 70px 170px';

const EMPTY_FORM = { name: '', phone: '', ssn: '', account: '', amount: '' };

/** 당첨자 정보 기록/조회 · 동일인 합산 · 엑셀 내보내기 */
export function ResultsLog() {
  const { history, addRecord } = useBounty();
  const [form, setForm] = useState(EMPTY_FORM);

  const totalPaid = history.reduce((a, h) => a + h.amount, 0);
  const maxWin = history.reduce((a, h) => Math.max(a, h.amount), 0);
  // 최근 기록이 위로 오도록 뒤집는다
  const rows = groupByPerson(history).reverse();

  const submit = () => {
    const amount = manToWon(parseInt(form.amount || '0', 10) || 0);
    if (!amount) return; // 상금이 없으면 무시
    addRecord({ amount, name: form.name, phone: form.phone, ssn: form.ssn, account: form.account });
    setForm(EMPTY_FORM);
  };

  const inputStyle = {
    padding: '13px 14px',
    background: 'var(--surface-input)',
    border: '1px solid var(--gold-border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-kr)',
    fontSize: 14,
    fontWeight: 500,
  } as const;

  return (
    <div
      style={{
        flex: 1,
        padding: '36px 48px',
        overflow: 'auto',
        maxWidth: 1000,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div className="screen-title-row" style={{ marginBottom: 24 }}>
        <div className="screen-title">당첨 기록</div>
        <div className="screen-title-en">RESULTS LOG</div>
        <button
          className="btn-gold-outline"
          onClick={() => exportHistoryCsv(history)}
          style={{
            marginLeft: 'auto',
            padding: '12px 26px',
            border: '1.5px solid var(--gold)',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: '0.1em',
          }}
        >
          ⬇ 엑셀 다운로드
        </button>
      </div>

      {/* 통계 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard label="총 지급액" accent="var(--gold)" accentSide="top">
          <div className="gold-text-sm" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32 }}>
            {formatKr(totalPaid)}
          </div>
        </StatCard>
        <StatCard label="총 추첨 횟수" accent="var(--gold-dark)" accentSide="top">
          <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--gold)' }}>
            {history.length}
            <span style={{ fontSize: 16, color: 'rgba(247,241,227,0.45)', marginLeft: 4 }}>회</span>
          </div>
        </StatCard>
        <StatCard label="최고 당첨액" accent="var(--red)" accentSide="top">
          <div
            style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--red-bright)' }}
          >
            {formatKr(maxWin)}
          </div>
        </StatCard>
      </div>

      {/* 입력 폼 */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold-border)',
          borderLeft: '4px solid var(--gold)',
          padding: '18px 22px',
          marginBottom: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.2em',
            color: 'var(--gold)',
          }}
        >
          당첨 기록 입력
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="전화번호 (010-0000-0000)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="주민번호 (000000-0000000)"
            value={form.ssn}
            onChange={(e) => setForm({ ...form, ssn: e.target.value })}
            style={inputStyle}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-input)',
              border: '1px solid var(--gold-border)',
            }}
          >
            <input
              type="number"
              placeholder="상금"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '13px 12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontFamily: 'var(--font)',
                fontStyle: 'italic',
                fontWeight: 800,
                fontSize: 17,
              }}
            />
            <div
              style={{ paddingRight: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-dimmer)' }}
            >
              만원
            </div>
          </div>
          <input
            type="text"
            placeholder="계좌 (은행 · 계좌번호)"
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
            style={inputStyle}
          />
          <button className="btn-gold" onClick={submit} style={{ fontSize: 15, letterSpacing: '0.08em' }}>
            + 기록 추가
          </button>
        </div>
      </div>

      {/* 테이블 헤더 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: TABLE_COLUMNS,
          gap: 12,
          padding: '10px 18px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: 'var(--text-dimmer)',
          borderBottom: '2px solid rgba(212,168,84,0.35)',
        }}
      >
        <div>NO.</div>
        <div>이름</div>
        <div>연락처 · 주민번호</div>
        <div>계좌</div>
        <div>횟수</div>
        <div>합계 상금</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((h, i) => {
          const jackpot = h.total >= 10_000_000;
          const repeat = h.count >= 2;
          return (
            <div
              key={`${h.name}-${h.phone}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLUMNS,
                gap: 12,
                alignItems: 'center',
                padding: '13px 18px',
                borderBottom: '1px solid rgba(212,168,84,0.12)',
                background: jackpot ? 'rgba(200,30,46,0.12)' : 'transparent',
                borderLeft: `3px solid ${
                  jackpot ? 'var(--red)' : repeat ? 'rgba(245,198,74,0.6)' : 'transparent'
                }`,
              }}
            >
              <div
                style={{
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'rgba(247,241,227,0.45)',
                }}
              >
                {String(rows.length - i).padStart(2, '0')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: 'var(--font-kr)',
                    color: 'var(--text)',
                  }}
                >
                  {h.name || '미입력'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dimmer)' }}>
                  {h.timeList.join(' · ')}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(247,241,227,0.65)',
                  fontFamily: 'var(--font-kr)',
                }}
              >
                <div>{h.phone || '—'}</div>
                <div style={{ color: 'var(--text-dimmer)' }}>{h.ssn || '—'}</div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(247,241,227,0.65)',
                  fontFamily: 'var(--font-kr)',
                }}
              >
                {h.account || '—'}
              </div>
              <div
                style={{
                  fontStyle: 'italic',
                  fontWeight: 900,
                  fontSize: 18,
                  color: repeat ? 'var(--gold)' : 'rgba(247,241,227,0.55)',
                }}
              >
                {h.count}회
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    fontStyle: 'italic',
                    fontWeight: 900,
                    fontSize: 22,
                    color: jackpot
                      ? 'var(--red-bright)'
                      : h.total >= 1_000_000
                        ? 'var(--gold-light)'
                        : 'rgba(247,241,227,0.75)',
                  }}
                >
                  {formatKr(h.total)}
                </div>
                {jackpot && (
                  <div
                    className="skew"
                    style={{
                      fontStyle: 'italic',
                      fontWeight: 900,
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      padding: '4px 10px',
                      background: 'var(--red)',
                      color: 'var(--gold-light)',
                      border: '1px solid var(--gold)',
                    }}
                  >
                    <span className="unskew">JACKPOT</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
