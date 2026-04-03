import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';

export default function ServerError() {
  const { t } = useI18n();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pb-20 md:pb-0">
      <h1 className="text-7xl font-bold text-[#18181B] mb-2">500</h1>
      <p className="text-lg text-[#71717A] mb-2">{t('error500.message')}</p>
      <p className="text-[15px] text-[#A1A1AA] mb-8">{t('error500.hint')}</p>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-8 py-3.5 bg-white text-[#18181B] border border-[#D1D5DB] rounded-lg text-sm font-medium lg:hover:bg-[#FAFAFA] transition-colors"
        >
          {t('error500.refresh')}
        </Button>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-3.5 bg-[#18181B] text-white rounded-lg text-sm font-medium lg:hover:bg-[#000000] transition-colors"
        >
          {t('error500.home')}
        </Link>
      </div>
    </div>
  );
}
