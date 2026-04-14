import { useI18n } from '../i18n/I18nProvider';
import { tTerms, type TermsContentKey } from '../i18n/termsContent';

export default function Terms() {
  const { locale } = useI18n();
  const tt = (key: TermsContentKey) => tTerms(locale, key);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-8">{tt('title')}</h1>
        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed space-y-6 text-foreground">
          <p className="text-muted-foreground">{tt('effective')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tt('art1h')}</h2>
          <p>{tt('art1p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tt('art2h')}</h2>
          <p>{tt('art2p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tt('art3h')}</h2>
          <p>{tt('art3p')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tt('art4h')}</h2>
          <p>
            {tt('art4p1a')}
            <strong>All Rights Reserved</strong>
            {tt('art4p1b')}
          </p>
          <p>{tt('art4p2')}</p>
          <p className="text-muted-foreground text-sm">{tt('art4note')}</p>

          <h2 className="text-lg font-bold text-foreground mt-8">{tt('art5h')}</h2>
          <p>{tt('art5p')}</p>

          <p className="text-muted-foreground mt-12 text-[13px]">{tt('footerNote')}</p>
        </div>
      </div>
    </div>
  );
}
