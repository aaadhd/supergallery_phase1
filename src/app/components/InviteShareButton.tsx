/**
 * 비회원 초대 링크 공유 버튼 (Policy §3 v2.14).
 *
 * 탭 → 안내 다이얼로그 → 모바일: 네이티브 공유 시트 / PC: 링크 복사·이메일.
 * - 노출 조건: 본인 업로더 + 비회원 슬롯 존재 + 유효 토큰(active·inactive).
 * - revoked 토큰은 null 반환으로 미노출.
 */

import { useEffect, useState } from 'react';
import { Share2, Copy } from 'lucide-react';
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
  /** 카드 인라인 노출용 — 아이콘·텍스트 소형, min-h 없음 */
  compact?: boolean;
}

export function InviteShareButton({
  workId,
  workTitle,
  inviterName,
  variant = 'outline',
  className,
  compact = false,
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
  const isShareable = token.status === 'active' || token.status === 'inactive';
  // 모바일(터치 디바이스)이면 OS 공유 시트, PC면 링크 복사
  const isMobile = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  const shareUrl = buildInviteShareUrl(workId, token.token);
  const shareText = buildInviteShareText(workTitle, inviterName, locale === 'en' ? 'en' : 'ko', token.status);
  const fullMessage = `${shareText}\n${shareUrl}`;
  const expiresInDays = (() => {
    const ms = new Date(token.expiresAt).getTime() - Date.now();
    return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86_400_000)) : null;
  })();

  // 항상 안내 다이얼로그를 먼저 연다 — 모바일도 동일.
  const handleClick = () => {
    if (!isShareable) return;
    setOpen(true);
  };

  // 모바일: 네이티브 공유 시트 진입 (카카오톡·문자 등 앱 선택)
  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: workTitle, text: shareText, url: shareUrl });
      setOpen(false);
    } catch {
      // 사용자가 공유 시트를 닫음
    }
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullMessage);
      } else {
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

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={!isShareable}
        variant={compact ? 'ghost' : variant}
        className={compact
          ? `${className ?? ''} h-auto !px-0 py-0.5 text-xs font-medium text-primary hover:bg-transparent hover:text-primary/70 gap-1 justify-start`
          : `${className ?? ''} min-h-[44px] gap-2`}
        aria-label={t('invite.shareCta')}
      >
        <Share2 className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        {t('invite.shareCta')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invite.shareDialogTitle')}</DialogTitle>
            <DialogDescription>{t('invite.shareDialogBody')}</DialogDescription>
          </DialogHeader>

          {/* 만료 안내 */}
          {isActive && expiresInDays !== null && (
            <p className="text-xs text-muted-foreground -mt-1">
              {t('invite.shareLinkExpiresIn').replace('{n}', String(expiresInDays))}
            </p>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-1">
            {isMobile ? (
              /* 모바일: OS 공유 시트 — 원하는 앱 선택, 메시지 자동 채워짐 */
              <Button
                type="button"
                onClick={handleNativeShare}
                className="w-full min-h-[44px] gap-2 py-6 text-base"
              >
                <Share2 className="h-5 w-5" />
                {t('invite.shareNativeSend')}
              </Button>
            ) : (
              /* PC: 링크 복사 */
              <Button
                type="button"
                onClick={handleCopy}
                className="w-full min-h-[44px] gap-2"
              >
                <Copy className="h-4 w-4" />
                {t('invite.shareCopy')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
