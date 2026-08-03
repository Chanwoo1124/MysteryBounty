import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { StatCard } from '@/components/StatCard';
import { formatKr, manToWon } from '@/lib/format';
import { ApiError } from '@/api/client';
import type { WinRecord } from '@/lib/types';

const EMPTY_FORM = { name: '', phone: '', ssn: '', bank: '', accountNumber: '', amount: '' };

/**
 * 당첨 기록 — 추첨 확정 건이 자동으로 목록에 오르고,
 * 각 행마다 이름·전화·주민번호·상금·은행·계좌를 입력/수정하고 삭제(되돌리기)할 수 있다.
 */
export function ResultsLog() {
  const navigate = useNavigate();
  const { winRecords, stats, addRecord, currentTournamentId, loadRecords, exportRecords } =
    useBounty();
  const [form, setForm] = useState(EMPTY_FORM);

  // 진입 시 기록을 불러온다.
  useEffect(() => {
    if (!currentTournamentId) {
      navigate('/dashboard');
      return;
    }
    loadRecords().catch((err) => {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    });
  }, [currentTournamentId, loadRecords, navigate]);

  const submit = async () => {
    const amount = manToWon(parseInt(form.amount || '0', 10) || 0);
    if (!amount) return; // 상금이 없으면 무시
    try {
      await addRecord({
        amount,
        name: form.name,
        phone: form.phone,
        ssn: form.ssn,
        bank: form.bank,
        accountNumber: form.accountNumber,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '기록 추가에 실패했습니다.');
    }
  };

  const handleExport = () => {
    exportRecords().catch((err) => {
      window.alert(err instanceof ApiError ? err.message : '엑셀 다운로드에 실패했습니다.');
    });
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
        maxWidth: 1040,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div className="screen-title-row" style={{ marginBottom: 24 }}>
        <button
          className="btn-gold-outline"
          onClick={() => navigate('/board')}
          style={{
            padding: '12px 20px',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.08em',
          }}
        >
          ← 현황판
        </button>
        <div className="screen-title">당첨 기록</div>
        <div className="screen-title-en">RESULTS LOG</div>
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
        <button
          className="btn-gold-outline"
          onClick={handleExport}
          style={{
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
            {formatKr(stats.totalPaid)}
          </div>
        </StatCard>
        <StatCard label="총 추첨 횟수" accent="var(--gold-dark)" accentSide="top">
          <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--gold)' }}>
            {stats.drawCount}
            <span style={{ fontSize: 16, color: 'rgba(247,241,227,0.45)', marginLeft: 4 }}>회</span>
          </div>
        </StatCard>
        <StatCard label="최고 당첨액" accent="var(--red)" accentSide="top">
          <div
            style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--red-bright)' }}
          >
            {formatKr(stats.maxWin)}
          </div>
        </StatCard>
      </div>

      {/* 추첨 없이 직접 추가 (선택) */}
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
          추첨 없이 직접 추가
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
            placeholder="은행"
            value={form.bank}
            onChange={(e) => setForm({ ...form, bank: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="계좌번호"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            style={inputStyle}
          />
          <button className="btn-gold" onClick={submit} style={{ fontSize: 15, letterSpacing: '0.08em' }}>
            + 기록 추가
          </button>
        </div>
      </div>

      {/* 당첨 기록 목록 — 행별 편집/삭제 */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: 'var(--text-dimmer)',
          marginBottom: 12,
          paddingLeft: 2,
        }}
      >
        기록 {winRecords.length}건 · 최신순
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {winRecords.length === 0 && (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: 'var(--text-dimmer)',
              fontFamily: 'var(--font-kr)',
              fontSize: 14,
            }}
          >
            아직 당첨 기록이 없습니다. 추첨을 진행하면 여기에 자동으로 쌓입니다.
          </div>
        )}
        {winRecords.map((r, i) => (
          <RecordRow key={r.id} record={r} no={winRecords.length - i} />
        ))}
      </div>
    </div>
  );
}

/** 당첨 기록 1건 — 인라인 입력/수정 + 삭제(되돌리기) */
function RecordRow({ record, no }: { record: WinRecord; no: number }) {
  const { updateRecord, deleteRecord } = useBounty();
  const [form, setForm] = useState(() => toForm(record));
  const [busy, setBusy] = useState(false);

  // 서버 기록이 갱신되면(저장/삭제 후 재조회) 폼을 다시 맞춘다
  useEffect(() => {
    setForm(toForm(record));
  }, [record.amount, record.name, record.phone, record.ssnMasked, record.bank, record.accountNumber]);

  const jackpot = record.amount >= 10_000_000;
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(record));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateRecord(record.id, {
        amount: manToWon(parseInt(form.amount || '0', 10) || 0),
        name: form.name,
        phone: form.phone,
        ssn: form.ssn,
        bank: form.bank,
        accountNumber: form.accountNumber,
      });
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    if (!window.confirm('이 당첨 기록을 삭제할까요? 추첨으로 뽑힌 건이면 티켓이 복구됩니다.')) return;
    setBusy(true);
    try {
      await deleteRecord(record.id);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : '삭제에 실패했습니다.');
      setBusy(false);
    }
  };

  const cell = {
    padding: '11px 12px',
    background: 'var(--surface-input)',
    border: '1px solid var(--gold-border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-kr)',
    fontSize: 13,
    fontWeight: 500,
    minWidth: 0,
    width: '100%',
  } as const;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid rgba(212,168,84,0.22)',
        borderLeft: `3px solid ${jackpot ? 'var(--red)' : 'rgba(245,198,74,0.5)'}`,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* 상단: 번호·시각·금액 + 삭제 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 14,
            color: 'rgba(247,241,227,0.4)',
          }}
        >
          {String(no).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dimmer)' }}>
          {record.time || '—'}
        </div>
        <div
          style={{
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 20,
            color: jackpot ? 'var(--red-bright)' : 'var(--gold-light)',
          }}
        >
          {formatKr(record.amount)}
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
        <button
          onClick={remove}
          disabled={busy}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#C81E2E';
            e.currentTarget.style.color = '#FF6B76';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,168,84,0.3)';
            e.currentTarget.style.color = 'rgba(247,241,227,0.5)';
          }}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid rgba(212,168,84,0.3)',
            color: 'rgba(247,241,227,0.5)',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 13,
            cursor: busy ? 'wait' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ↺ 되돌리기
        </button>
      </div>

      {/* 입력 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        <input
          type="text"
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={cell}
        />
        <input
          type="tel"
          placeholder="전화번호"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={cell}
        />
        <input
          type="text"
          placeholder={record.ssnMasked || '주민번호'}
          value={form.ssn}
          onChange={(e) => setForm({ ...form, ssn: e.target.value })}
          style={cell}
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
            type="text"
            inputMode="numeric"
            placeholder="상금"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value.replace(/[^0-9]/g, '') })
            }
            style={{
              flex: 1,
              minWidth: 0,
              padding: '11px 12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--font)',
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: 15,
            }}
          />
          <div style={{ paddingRight: 11, fontSize: 11, fontWeight: 700, color: 'var(--text-dimmer)' }}>
            만원
          </div>
        </div>
        <input
          type="text"
          placeholder="은행"
          value={form.bank}
          onChange={(e) => setForm({ ...form, bank: e.target.value })}
          style={cell}
        />
        <input
          type="text"
          placeholder="계좌번호"
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          style={cell}
        />
      </div>

      {/* 저장 — 값을 바꾸면(작성·수정) 활성화된다 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'var(--font-kr)',
            color: dirty ? 'var(--gold)' : 'var(--text-dimmer)',
          }}
        >
          {dirty ? '변경사항이 있습니다' : '언제든 값을 수정할 수 있어요'}
        </div>
        <button
          className="btn-gold"
          onClick={save}
          disabled={!dirty || busy}
          style={{
            padding: '10px 30px',
            fontSize: 14,
            letterSpacing: '0.08em',
            opacity: !dirty || busy ? 0.45 : 1,
            cursor: !dirty || busy ? 'default' : 'pointer',
          }}
        >
          {busy ? '저장 중…' : dirty ? '저장' : '저장됨'}
        </button>
      </div>
    </div>
  );
}

/** 서버 기록 → 편집 폼 값 (상금은 만원 단위 문자열, 주민번호는 재입력 시에만 전송하므로 빈값) */
function toForm(r: WinRecord) {
  return {
    name: r.name,
    phone: r.phone,
    ssn: '',
    bank: r.bank,
    accountNumber: r.accountNumber,
    amount: r.amount ? String(Math.round(r.amount / 10_000)) : '',
  };
}
