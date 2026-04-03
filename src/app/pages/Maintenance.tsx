import { Wrench } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const CONTACT_EMAIL = 'support@artier.com';

export default function Maintenance() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full border border-[#F0F0F0] bg-white p-5 mb-8 shadow-sm">
        <Wrench className="w-14 h-14 text-primary" strokeWidth={1.25} aria-hidden />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-[#18181B] mb-4 max-w-md">
        {t('maintenance.title')}
      </h1>
      <p className="text-[15px] leading-relaxed text-[#52525B] max-w-md whitespace-pre-line mb-8">
        {t('maintenance.body')}
      </p>
      <p className="text-sm text-[#71717A] mb-2">
        {t('maintenance.eta')}{' '}
        <span className="text-[#3F3F46]">{t('maintenance.etaPlaceholder')}</span>
      </p>
      <p className="text-sm text-[#71717A]">
        {t('maintenance.contact')}{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-primary font-medium lg:hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
