import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tosConsentStore, type PendingTos } from '../utils/tosConsentStore';
import { useAuthStore, performAccountWithdrawal } from '../store';
import { artists } from '../data';
import { openConfirm } from './ConfirmDialog';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';

function useTosConsentStore() {
  const [pending, setPending] = useState<PendingTos | null>(() => tosConsentStore.getPending());
  useEffect(() => tosConsentStore.subscribe(() => setPending(tosConsentStore.getPending())), []);
  return pending;
}

export function TosConsentModal() {
  const { t } = useI18n();
  const auth = useAuthStore();
  const pending = useTosConsentStore();

  if (!auth.isLoggedIn() || !pending) return null;

  const handleAgree = () => {
    tosConsentStore.recordConsent(pending.version);
    tosConsentStore.clearPending();
    toast.success(t('tosModal.toastAgreed'));
  };

  const handleDisagree = async () => {
    const confirmed = await openConfirm({
      title: t('tosModal.disagreeConfirmTitle'),
      description: t('tosModal.disagreeConfirmDesc'),
      destructive: true,
    });
    if (!confirmed) return;
    performAccountWithdrawal(artists[0].id);
    tosConsentStore.clearPending();
  };

  return (
    <div
      className="fixed inset-0 z-[49] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tos-modal-title"
    >
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <h2 id="tos-modal-title" className="text-2xl font-bold text-foreground mb-2">
            {t('tosModal.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('tosModal.effectiveDate').replace('{date}', pending.effectiveDate)}
          </p>
        </div>

        <ul className="space-y-2">
          {pending.summary.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
              <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>

        <a
          href={pending.fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary lg:hover:underline"
        >
          {t('tosModal.viewFull')} →
        </a>

        {pending.isImplied && (
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 leading-relaxed">
            {t('tosModal.impliedConsent').replace('{date}', pending.effectiveDate)}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            className="min-h-[48px] w-full rounded-xl text-base font-semibold"
            onClick={handleAgree}
          >
            {t('tosModal.agree')}
          </Button>
          <Button
            variant="outline"
            className="min-h-[48px] w-full rounded-xl text-base font-semibold"
            onClick={handleDisagree}
          >
            {t('tosModal.disagree')}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          {t('tosModal.disagreeHint')}
        </p>
      </div>
    </div>
  );
}
