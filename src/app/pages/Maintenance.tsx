import { Wrench } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { SUPPORT_EMAIL } from '../config';

export default function Maintenance() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-muted/50 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full border border-border/40 bg-white p-5 mb-8 shadow-sm">
        <Wrench className="w-14 h-14 text-primary" strokeWidth={1.25} aria-hidden />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 max-w-md">
        {t('maintenance.title')}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground max-w-md whitespace-pre-line mb-8">
        {t('maintenance.body')}
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        {t('maintenance.eta')}{' '}
        <span className="text-foreground">{t('maintenance.etaPlaceholder')}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        {t('maintenance.contact')}{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-primary font-medium lg:hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
