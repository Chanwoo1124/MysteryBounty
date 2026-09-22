import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBounty } from '@/store/BountyStore';
import { StatCard } from '@/components/StatCard';
import { Amount } from '@/components/Amount';
import { ApiError } from '@/api/client';
import type { WinRecord } from '@/lib/types';

/** 전화번호 뒷자리 입력 — 숫자만, 최대 4자리 */
const toPhoneLast4 = (v: string) => v.replace(/\D/g, '').slice(0, 4);

/**
 * 당첨 기록 — 추첨할 때 입력한 이름·전화번호 뒷자리와 함께 자동으로 목록에 오르고,
 * 각 행마다 이름·전화번호 뒷자리·상금을 수정하고 삭제(되돌리기)할 수 있다.
 *
 * 기록은 추첨으로만 생긴다. 직접 추가하면 금액대 잔여가 줄지 않아 현황판과 어긋나므로
 * 수동 추가 기능은 두지 않는다. (금액을 잘못 뽑았으면 행에서 상금을 고치거나 되돌린다)
 */
export function ResultsLog() {
  const navigate = useNavigate();
  const { winRecords, stats, currentTournamentId, loadRecords, exportRecords } = useBounty();

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

  const handleExport = () => {
    exportRecords().catch((err) => {
      window.alert(err instanceof ApiError ? err.message : '엑셀 다운로드에 실패했습니다.');
    });
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '26px 40px 32px',
        overflow: 'auto',
        maxWidth: 1040,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div className="screen-title-row" style={{ marginBottom: 18 }}>
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
          marginBottom: 18,
        }}
      >
        <StatCard label="총 지급액" accent="var(--gold)" accentSide="top">
          <div className="gold-text-sm" style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32 }}>
            <Amount value={stats.totalPaid} />
          </div>
        </StatCard>
        <StatCard label="총 추첨 횟수" accent="var(--gold-dark)" accentSide="top">
          <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--gold)' }}>
            {stats.drawCount}
            <span style={{ fontSize: 16, color: 'var(--text-faint)', marginLeft: 4 }}>회</span>
          </div>
        </StatCard>
        <StatCard label="최고 당첨액" accent="var(--red)" accentSide="top">
          <div
            style={{ fontStyle: 'italic', fontWeight: 900, fontSize: 32, color: 'var(--red-bright)' }}
          >
            <Amount value={stats.maxWin} />
          </div>
        </StatCard>
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

      {/* 열 이름 — 한 줄 행이 무슨 칸인지 위에서 한 번만 알려준다 */}
      {winRecords.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: ROW_GRID,
            gap: 10,
            padding: '0 12px 6px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'var(--text-dimmer)',
          }}
        >
          <div>NO</div>
          <div>TIME</div>
          <div>이름</div>
          <div>전화 뒷자리</div>
          <div>상금</div>
          <div />
          <div />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

/**
 * 기록 행의 열 구성 — 번호 / 시각 / 이름 / 전화 뒷자리 / 상금 / 저장 / 되돌리기.
 * 모든 행이 같은 격자를 쓰므로 목록이 표처럼 세로로 줄이 맞는다.
 */
const ROW_GRID = '26px 52px 1fr 104px 132px 72px 38px';

/**
 * 당첨 기록 1건 — 한 줄짜리 인라인 편집 행 (한 화면에 많이 담기도록 높이를 낮췄다).
 *
 * 고칠 수 있는 건 이름과 전화번호 뒷자리뿐이다. 상금은 추첨이 정한 값이고 금액대 잔여와 묶여 있어,
 * 여기서 고치면 현황판 숫자와 어긋난다. 금액이 잘못됐으면 되돌리기로 지우고 다시 뽑는다.
 */
function RecordRow({ record, no }: { record: WinRecord; no: number }) {
  const { updateRecord, deleteRecord } = useBounty();
  const [form, setForm] = useState(() => toForm(record));
  const [busy, setBusy] = useState(false);

  // 서버 기록이 갱신되면(저장/삭제 후 재조회) 폼을 다시 맞춘다
  useEffect(() => {
    setForm(toForm(record));
  }, [record.name, record.phone]);

  const jackpot = record.amount >= 10_000_000;
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(record));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateRecord(record.id, { name: form.name, phone: form.phone });
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
    padding: '8px 10px',
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
        border: '1px solid var(--gold-border)',
        // 최고 금액 기록은 왼쪽 획을 골드로 켜서 구분한다 (나머지는 흐린 골드)
        borderLeft: `3px solid ${jackpot ? 'var(--gold)' : 'var(--gold-border)'}`,
        padding: '7px 12px',
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          fontStyle: 'italic',
          fontWeight: 800,
          fontSize: 13,
          color: 'var(--text-faint)',
        }}
      >
        {String(no).padStart(2, '0')}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dimmer)' }}>
        {record.time || '—'}
      </div>

      <input
        className="field-input"
        type="text"
        placeholder="이름"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={cell}
      />

      <input
        className="field-input"
        type="text"
        inputMode="numeric"
        placeholder="전화 뒷 4자리"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: toPhoneLast4(e.target.value) })}
        style={cell}
      />

      {/* 상금 — 추첨이 정한 값이라 읽기 전용이다 (입력칸 없이 숫자만 보여준다) */}
      <div
        style={{
          textAlign: 'right',
          paddingRight: 4,
          // 최고 금액 기록은 금액 글자도 한 단계 밝게 — 왼쪽 골드 획과 함께 눈에 띄게 한다
          color: jackpot ? 'var(--gold-lighter)' : 'var(--gold-light)',
          fontStyle: 'italic',
          fontWeight: 800,
          fontSize: 14,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Amount value={record.amount} />
      </div>

      {/* 저장 — 값을 바꾸면(작성·수정) 활성화된다 */}
      <button
        className="btn-gold"
        onClick={save}
        disabled={!dirty || busy}
        title={dirty ? '변경사항 저장' : '변경사항 없음'}
        style={{
          padding: '8px 0',
          fontSize: 13,
          letterSpacing: '0.06em',
          opacity: !dirty || busy ? 0.35 : 1,
          cursor: !dirty || busy ? 'default' : 'pointer',
        }}
      >
        {busy ? '…' : '저장'}
      </button>

      <button
        onClick={remove}
        disabled={busy}
        title="되돌리기 — 기록 삭제 (추첨 건이면 티켓 복구)"
        aria-label="되돌리기"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#C81E2E';
          e.currentTarget.style.color = '#FF6B76';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gold-border)';
          e.currentTarget.style.color = 'var(--text-dim)';
        }}
        style={{
          padding: '8px 0',
          background: 'transparent',
          border: '1px solid var(--gold-border)',
          color: 'var(--text-dim)',
          fontStyle: 'italic',
          fontWeight: 800,
          fontSize: 14,
          cursor: busy ? 'wait' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        ↺
      </button>
    </div>
  );
}

/** 서버 기록 → 편집 폼 값 (예전에 저장된 전체 전화번호는 뒷자리 4자리만 남긴다) */
function toForm(r: WinRecord) {
  return {
    name: r.name,
    phone: r.phone.replace(/\D/g, '').slice(-4),
  };
}
