import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';

const SESSION_DISMISS_KEY = 'artier_login_prompt_dismissed';

export type ProtectedAction = 'like' | 'save' | 'follow' | 'upload' | 'report' | 'general';

/**
 * 비로그인 보호 액션 시 로그인 유도 정책(IA CM-02 / PRD AC-14):
 * - 같은 세션 내 첫 시도: 모달 노출
 * - 모달 닫은 뒤 같은 세션 내 재시도: 토스트 리마인드만 (시니어 UX — 같은 모달 반복 차단)
 *
 * 모든 보호 액션 호출 화면(Browse·Profile·EventDetail·USR-EXH-01·USR-EVT-02 등)에서
 * 같은 패턴을 보장하기 위한 공용 훅.
 */
export function useLoginPrompt() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ProtectedAction>('general');

  const isDismissed = () => {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch { return false; }
  };

  /**
   * 보호 액션 시도 시 호출. 로그인 상태면 true, 아니면 false 반환 + 모달/토스트 노출.
   */
  const tryProtectedAction = useCallback(
    (next: ProtectedAction = 'general'): boolean => {
      if (authStore.isLoggedIn()) return true;
      if (isDismissed()) {
        toast(t('loginPrompt.toastReminder'), {
          duration: 4000,
          action: {
            label: t('loginPrompt.login'),
            onClick: () => navigate('/login'),
          },
        });
      } else {
        setAction(next);
        setOpen(true);
      }
      return false;
    },
    [navigate, t],
  );

  const close = useCallback(() => {
    if (!authStore.isLoggedIn()) {
      try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch { /* ignore */ }
    }
    setOpen(false);
  }, []);

  return { open, action, tryProtectedAction, close };
}
