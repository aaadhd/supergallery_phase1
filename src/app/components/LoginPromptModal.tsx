import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { authStore } from '../store';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export function LoginPromptModal({ open, onClose, action = 'general' }: LoginPromptModalProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogin = () => {
    authStore.login();
    const onboardingDone = localStorage.getItem('artier_onboarding_done');
    if (!onboardingDone) {
      navigate('/onboarding');
    }
    onClose();
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
