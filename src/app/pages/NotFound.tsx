import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pb-20 md:pb-0">
      <h1 className="text-7xl font-bold text-foreground mb-2">404</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('error404.message')}</p>
      <Link
        to="/"
        className="inline-flex items-center px-8 py-3.5 bg-foreground text-white rounded-lg text-sm font-medium lg:hover:bg-foreground/90 transition-colors"
      >
        {t('error404.home')}
      </Link>
    </div>
  );
}
