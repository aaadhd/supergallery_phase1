import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { tPrivacy, type PrivacyContentKey } from '../i18n/privacyContent';

export default function Privacy() {
  const { locale } = useI18n();
  const tp = (key: PrivacyContentKey) => tPrivacy(locale, key);
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  useEffect(() => {
    if (!isEmbed) return;
    const style = document.createElement('style');
    style.innerHTML = 'header, footer { display: none !important; }';
    document.head.appendChild(style);
    return () => style.remove();
  }, [isEmbed]);

  return (
    <div className={isEmbed ? 'bg-white' : 'min-h-screen bg-white pb-20 md:pb-0'}>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-8">{tp('title')}</h1>
        <div className="prose prose-gray max-w-none text-base leading-relaxed space-y-6 text-foreground">
          <p className="text-muted-foreground">{tp('effective')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tp('s1h')}</h2>
          <p>{tp('s1p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tp('s2h')}</h2>
          <p>{tp('s2p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tp('s3h')}</h2>
          <p>{tp('s3p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tp('s4h')}</h2>
          <p>{tp('s4p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tp('s5h')}</h2>
          <p>{tp('s5p')}</p>

          <p className="text-muted-foreground mt-12 text-sm">{tp('footer')}</p>
        </div>
      </div>
    </div>
  );
}
