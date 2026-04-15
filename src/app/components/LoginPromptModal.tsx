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

/**
 * 둘러보기 맥락의 가벼운 상호작용은 로그인만 시키고 모달만 닫음.
 * 작품 올리기/신고처럼 신원이 필요한 동작은 온보딩을 강제.
 */
const BROWSE_CONTEXT_ACTIONS: ReadonlySet<LoginPromptAction> = new Set(['like', 'save', 'follow']);

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
    const isBrowseContext = BROWSE_CONTEXT_ACTIONS.has(action);
    // 둘러보기 중 좋아요/저장/팔로우에선 온보딩으로 튕기지 않고 흐름 유지
    if (!onboardingDone && !isBrowseContext) {
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
