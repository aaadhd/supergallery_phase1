/**
 * 비회원 초대 링크 공유 버튼 (Policy §3 v2.14).
 *
 * 작가가 본인 채널(카톡·문자·이메일·단톡방)로 친구에게 직접 보내는 흐름.
 * - 노출 조건: 본인이 전시 업로더이고(`work.artistId === currentUser.id`),
 *   비회원 슬롯이 존재하며, 토큰이 살아 있을 때.
 * - 토큰이 inactive(검수 대기·반려) 상태면 버튼은 비활성 + "검수 통과 후 활성화" 안내.
 * - 모바일: navigator.share. PC: 클립보드 복사 + mailto 폴백.
 */

import { useEffect, useState } from 'react';
import { Share2, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { useI18n } from '../i18n/I18nProvider';
import {
  findTokenForWork,
  buildInviteShareUrl,
  buildInviteShareText,
  subscribeInviteTokens,
  type InviteToken,
} from '../utils/inviteTokenStore';

interface Props {
  workId: string;
  workTitle: string;
  inviterName: string;
  /** 트리거 버튼 스타일 변형. 기본은 outline. */
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function InviteShareButton({
  workId,
  workTitle,
  inviterName,
  variant = 'outline',
  className,
}: Props) {
  const { t, locale } = useI18n();
  const [token, setToken] = useState<InviteToken | null>(() => findTokenForWork(workId));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setToken(findTokenForWork(workId));
    return subscribeInviteTokens(() => setToken(findTokenForWork(workId)));
  }, [workId]);

  if (!token || token.status === 'revoked') return null;

  const isActive = token.status === 'active';
  const shareUrl = buildInviteShareUrl(workId, token.token);
  const shareText = buildInviteShareText(workTitle, inviterName, locale === 'en' ? 'en' : 'ko');
  const fullMessage = `${shareText}\n${shareUrl}`;

  const handleClick = async () => {
    if (!isActive) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: workTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // 사용자가 공유 시트를 닫음 — 폴백 다이얼로그 노출 안 함.
        return;
      }
    }
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullMessage);
      } else {
        // fallback: 임시 textarea
        const ta = document.createElement('textarea');
        ta.value = fullMessage;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success(t('invite.shareCopyDone'));
      setOpen(false);
    } catch {
      toast.error(t('invite.shareCopyDone'));
    }
  };

  const mailtoHref = `mailto:?subject=${encodeURIComponent(workTitle)}&body=${encodeURIComponent(fullMessage)}`;

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={!isActive}
        variant={variant}
        className={`${className ?? ''} min-h-[44px] gap-2`}
        aria-label={t('invite.shareCta')}
      >
        <Share2 className="h-4 w-4" />
        {t('invite.shareCta')}
        {!isActive && (
          <span className="ml-1 text-xs text-muted-foreground">({t('invite.shareNotReady')})</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invite.shareDialogTitle')}</DialogTitle>
            <DialogDescription>{t('invite.shareDialogBody')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground break-all bg-muted/40 rounded-md px-3 py-2">
              {shareUrl}
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
            <Button
              type="button"
              onClick={handleCopy}
              className="w-full min-h-[44px] gap-2"
            >
              <Copy className="h-4 w-4" />
              {t('invite.shareCopy')}
            </Button>
            <a
              href={mailtoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full min-h-[44px] gap-2 rounded-md border border-input bg-background text-sm font-medium lg:hover:bg-muted/50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {t('invite.shareEmail')}
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
