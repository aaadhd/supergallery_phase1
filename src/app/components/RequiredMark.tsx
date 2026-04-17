import { useI18n } from '../i18n/I18nProvider';

export function RequiredMark() {
  const { t } = useI18n();
  return (
    <span className="ml-1 text-xs font-medium text-red-500 align-middle">
      {t('common.required')}
      <span className="sr-only"> {t('common.requiredSr')}</span>
    </span>
  );
}
