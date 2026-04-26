import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

export type LoginPromptAction = 'like' | 'save' | 'follow' | 'upload' | 'report' | 'general';

const ACTION_KEYS: Record<LoginPromptAction, MessageKey> = {
  like: 'loginPrompt.like',
  save: 'loginPrompt.save',
  follow: 'loginPrompt.follow',
  upload: 'loginPrompt.upload',
  report: 'loginPrompt.report',
  general: 'loginPrompt.general',
};

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  action?: LoginPromptAction;
}

/**
 * IA CM-02 / PRD §USR-AUT-02: CTA 클릭 시 `/login?redirect=<현재 경로>`로 이동.
 * 즉시 로그인 처리는 하지 않는다 — 사용자는 가입·로그인 흐름에서 본인 인증을 거친다.
 */
export function LoginPromptModal({ open, onClose, action = 'general' }: LoginPromptModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const handleLogin = () => {
    const redirect = location.pathname + location.search;
    onClose();
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        <DialogHeader className="items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 mb-2">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{t('loginPrompt.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t(ACTION_KEYS[action])}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
          <Button onClick={handleLogin} className="w-full text-sm py-3">
            {t('loginPrompt.login')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-sm">
            {t('loginPrompt.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
