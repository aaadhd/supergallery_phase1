import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { workStore, profileStore } from '../store';
import { artists as seedArtists } from '../data';
import { claimBlockedInvite, type BlockedInvite } from '../utils/inviteMessaging';
import { addWarning } from '../utils/sanctionStore';
import { useI18n } from '../i18n/I18nProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';

const STORAGE_KEY = 'artier_pending_invite_claims';

type ResolvedItem = BlockedInvite & {
  workTitle: string;
  inviterId: string;
  inviterName: string;
};

/**
 * 가입 직후(홈 도착 시) 전화는 일치했지만 이름이 달라 매칭되지 않은 초대가 있으면
 * 본인 확인 모달을 띄운다.
 * - "네, 본인 맞아요" → 수동 claim (비회원 슬롯 → 회원 슬롯 승격)
 * - "아니요, 모르는 초대예요" → 발신 작가에게 경고 +1 (허위 초대), 슬롯은 그대로
 * - "닫기" → 보류 (다시 뜨지 않음)
 */
export function PendingInviteClaimGate() {
  const { t } = useI18n();
  const [items, setItems] = useState<ResolvedItem[] | null>(null);

  useEffect(() => {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (!raw) return;
    let parsed: BlockedInvite[] = [];
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    const resolved: ResolvedItem[] = [];
    for (const b of parsed) {
      const work = workStore.getWork(b.workId);
      if (!work) continue;
      resolved.push({
        ...b,
        workTitle: work.exhibitionName || work.title || t('claim.fallbackWorkTitle'),
        inviterId: work.artistId,
        inviterName: work.artist?.name || work.artistId,
      });
    }
    if (resolved.length === 0) {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return;
    }
    setItems(resolved);
  }, [t]);

  const close = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setItems(null);
  };

  const handleAccept = (item: ResolvedItem) => {
    const profile = profileStore.getProfile();
    const me = seedArtists[0];
    const ok = claimBlockedInvite(item.inviteId, {
      id: me.id,
      name: profile.name || me.name,
      avatar: profile.avatarUrl || me.avatar,
    });
    if (ok) toast.success(t('claim.accepted').replace('{title}', item.workTitle));
    else toast.error(t('claim.acceptFailed'));
    setItems((prev) => (prev ? prev.filter((x) => x.inviteId !== item.inviteId) : prev));
  };

  const handleReject = (item: ResolvedItem) => {
    addWarning(item.inviterId);
    toast.success(t('claim.rejected').replace('{artist}', item.inviterName));
    setItems((prev) => (prev ? prev.filter((x) => x.inviteId !== item.inviteId) : prev));
  };

  useEffect(() => {
    if (items && items.length === 0) close();
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <AlertDialog open onOpenChange={(next) => { if (!next) close(); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('claim.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('claim.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-2 space-y-3 max-h-[60vh] overflow-y-auto">
          {items.map((item) => (
            <div key={item.inviteId} className="rounded-lg border border-border p-3 space-y-2">
              <div className="text-sm">
                <div className="font-medium text-foreground">{item.workTitle}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('claim.itemInviter').replace('{artist}', item.inviterName)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('claim.itemInvitedAs').replace('{name}', item.invitedName)}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 min-h-11" onClick={() => handleAccept(item)}>
                  {t('claim.accept')}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 min-h-11" onClick={() => handleReject(item)}>
                  {t('claim.reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={close}>{t('claim.close')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
