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

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginPromptModal({ open, onClose }: LoginPromptModalProps) {
  const handleLogin = () => {
    authStore.login();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        <DialogHeader className="items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">로그인이 필요해요</DialogTitle>
          <DialogDescription className="text-center">
            좋아요, 저장, 팔로우 기능을 이용하려면 로그인해 주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
          <Button onClick={handleLogin} className="w-full text-base py-3">
            로그인
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-base">
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
