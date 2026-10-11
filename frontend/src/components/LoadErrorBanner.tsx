import { ApiError } from '@/api/client';

/**
 * 화면 진입 시 불러오기 실패 메시지.
 * 401(세션 만료)은 스토어가 로그인 화면으로 돌려보내므로 안내하지 않는다 — 빈 문자열을 돌려준다.
 */
export function loadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.status === 401 ? '' : err.message;
  return '데이터를 불러오지 못했습니다.';
}

/**
 * 불러오기 실패 안내 — 화면 위쪽에 띄우고 다시 시도 버튼을 준다.
 * 서버가 끊겨도 빈 화면·이전 숫자만 남아 원인을 모르는 일이 없도록 한다.
 * position:fixed 라 transform 이 걸린 무대(현황판) 안이 아니라 바깥에 두어야 한다.
 */
export function LoadErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        maxWidth: 'calc(100% - 32px)',
        padding: '12px 16px',
        fontFamily: 'var(--font-kr)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.5,
        color: 'var(--red-bright)',
        background: 'rgba(20,6,6,0.95)',
        borderLeft: '3px solid var(--red)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span>{message}</span>
      <button
        className="btn-gold-outline"
        onClick={onRetry}
        style={{ flexShrink: 0, padding: '6px 14px', fontSize: 13 }}
      >
        다시 시도
      </button>
    </div>
  );
}
