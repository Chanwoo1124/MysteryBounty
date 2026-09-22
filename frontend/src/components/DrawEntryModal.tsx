import { useEffect, useRef, useState, type FormEvent } from 'react';

/**
 * 추첨 전 당첨자 정보 입력 창.
 *
 * 입력값은 추첨 요청에 함께 실려 서버가 당첨 기록에 바로 저장한다.
 * 다만 둘 다 선택 입력이다 — 현장이 급하면 비운 채로 바로 뽑고 당첨 기록 화면에서 채워 넣는다.
 * (전화번호는 넣는다면 4자리를 다 채워야 한다. 1~3자리만 적힌 채로 저장되면 쓸모가 없다)
 */

interface DrawEntryModalProps {
  open: boolean;
  /** 추첨 요청 중 — 중복 제출 방지 */
  busy: boolean;
  onSubmit: (name: string, phoneLast4: string) => void;
  onClose: () => void;
}

export function DrawEntryModal({ open, busy, onSubmit, onClose }: DrawEntryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // 열릴 때마다 빈 칸으로 시작하고 이름 칸에 커서를 둔다
  useEffect(() => {
    if (!open) return;
    setName('');
    setPhone('');
    nameRef.current?.focus();
  }, [open]);

  // ESC 로 닫기 (추첨 요청 중에는 막는다)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  // 이름도 전화번호도 없이 바로 뽑을 수 있다 — 막는 조건은 '요청 중'뿐이다
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit(name.trim(), phone);
  };

  // 자유 입력이라 상자 대신 밑줄 한 획 — 쓰는 자리만 표시하고 나머지는 비운다
  const lineInputStyle = {
    width: '100%',
    padding: '10px 2px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--gold-border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-kr)',
    fontSize: 20,
    fontWeight: 600,
  } as const;

  // 라벨은 한 단계 물러선 크림 — 골드는 제목·포커스·추첨 버튼에만 쓴다
  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    fontFamily: 'var(--font-kr)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--text-dim)',
  } as const;

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'hgpStageIn 0.25s ease-out both',
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(452px, 100%)',
          background: 'var(--surface-card)',
          border: '1px solid var(--gold-border)',
          padding: '30px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: '0 24px 70px rgba(0,0,0,0.65)',
        }}
      >
        {/* 상단 골드 획 — 왼쪽에서 시작해 오른쪽으로 사라진다 (현황판의 구분선 모티프) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, var(--gold), rgba(233,200,126,0.2) 62%, transparent)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div
              style={{
                fontFamily: 'var(--font-kr)',
                fontWeight: 900,
                fontSize: 23,
                letterSpacing: '-0.01em',
                color: 'var(--gold-light)',
              }}
            >
              당첨자 정보
            </div>
            <div
              style={{
                fontStyle: 'italic',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.22em',
                color: 'var(--gold-dark)',
              }}
            >
              BEFORE DRAW
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--gold-border)' }} />
        </div>

        <label style={labelStyle}>
          이름 <span style={{ fontWeight: 500, color: 'var(--text-dimmer)' }}>(선택)</span>
          <input
            ref={nameRef}
            className="field-line"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            style={lineInputStyle}
          />
        </label>

        <label style={labelStyle}>
          전화번호 뒷자리 4자리{' '}
          <span style={{ fontWeight: 500, color: 'var(--text-dimmer)' }}>(선택)</span>
          {/* 칸 너비를 4자리에 맞춘다 — 넓은 칸에 네 글자만 놓이면 빈자리가 어색하다 */}
          <input
            className="field-line"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 4))}
            disabled={busy}
            style={{
              ...lineInputStyle,
              width: 148,
              fontFamily: 'var(--font)',
              fontWeight: 800,
              letterSpacing: '0.28em',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <button
            type="button"
            className="btn-gold-outline"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              padding: '15px 0',
              fontSize: 15,
              fontFamily: 'var(--font-kr)',
              opacity: busy ? 0.5 : 1,
            }}
          >
            닫기
          </button>
          {/* 입력이 비어 있어도 언제든 누를 수 있다 — 요청 중에만 잠긴다 */}
          <button
            type="submit"
            className="btn-gold"
            disabled={busy}
            style={{
              flex: 2,
              padding: '15px 0',
              fontSize: 17,
              fontFamily: 'var(--font-kr)',
              fontStyle: 'italic',
              fontWeight: 900,
              letterSpacing: '0.12em',
              transition: 'all 0.18s',
              opacity: busy ? 0.7 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? '추첨 중…' : '추첨'}
          </button>
        </div>
      </form>
    </div>
  );
}
