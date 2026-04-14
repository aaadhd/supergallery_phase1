import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';

export default function ServerError() {
  const { t } = useI18n();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pb-20 md:pb-0">
      <h1 className="text-7xl font-bold text-foreground mb-2">500</h1>
      <p className="text-sm text-muted-foreground mb-2">{t('error500.message')}</p>
      <p className="text-[15px] text-muted-foreground mb-8">{t('error500.hint')}</p>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-8 py-3.5 bg-white text-foreground border border-input rounded-lg text-sm font-medium lg:hover:bg-muted/50 transition-colors"
        >
          {t('error500.refresh')}
        </Button>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-3.5 bg-foreground text-white rounded-lg text-sm font-medium lg:hover:bg-foreground/90 transition-colors"
        >
          {t('error500.home')}
        </Link>
      </div>
    </div>
  );
}
