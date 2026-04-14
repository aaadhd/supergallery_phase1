import { Link } from 'react-router-dom';
import { Palette, Users, Award, Globe, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useI18n } from '../i18n/I18nProvider';
import { useMemo } from 'react';

export default function About() {
  const { t } = useI18n();

  const features = useMemo(
    () =>
      [
        {
          icon: Palette,
          titleKey: 'about.feat1Title' as const,
          descKey: 'about.feat1Desc' as const,
        },
        {
          icon: Users,
          titleKey: 'about.feat2Title' as const,
          descKey: 'about.feat2Desc' as const,
        },
        {
          icon: Award,
          titleKey: 'about.feat3Title' as const,
          descKey: 'about.feat3Desc' as const,
        },
        {
          icon: Globe,
          titleKey: 'about.feat4Title' as const,
          descKey: 'about.feat4Desc' as const,
        },
      ] as const,
    [],
  );

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Hero */}
      <div className="relative bg-foreground text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/20" />
        <div className="relative mx-auto max-w-[900px] px-4 sm:px-6 py-12 sm:py-20 lg:py-24 text-center">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight mb-4 sm:mb-6 whitespace-pre-line">
            {t('about.heroTitle')}
          </h1>
          <p className="text-sm lg:text-lg text-white/80 max-w-[600px] mx-auto leading-relaxed mb-6 sm:mb-10">
            {t('about.heroLead')}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <Link to="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary lg:hover:bg-primary/90 text-sm px-6 sm:px-8 py-3 sm:py-3.5 h-auto">
                {t('about.ctaBrowse')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/upload" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white/40 text-white lg:hover:bg-white/10 lg:hover:text-white text-sm px-6 sm:px-8 py-3 sm:py-3.5 h-auto">
                {t('about.ctaUpload')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
        <h2 className="text-lg font-bold text-center mb-8 sm:mb-12 lg:mb-14">{t('about.featuresHeading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
          {features.map((f) => (
            <div
              key={f.titleKey}
              className="p-4 sm:p-5 lg:p-6 rounded-2xl border border-border lg:hover:border-primary/30 lg:hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] transition-all"
            >
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/10 mb-3 sm:mb-4">
                <f.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-2 sm:mb-3">{t(f.titleKey)}</h3>
              <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-10 sm:py-16 lg:py-20 text-center">
          <h2 className="text-lg font-bold mb-4 sm:mb-6">{t('about.missionTitle')}</h2>
          <p className="text-[13px] sm:text-sm lg:text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">
            {t('about.missionBody')}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-10 sm:py-16 lg:py-20 text-center">
        <h2 className="text-lg lg:text-xl font-bold mb-3 sm:mb-4">{t('about.bottomTitle')}</h2>
        <p className="text-[13px] sm:text-sm text-muted-foreground mb-6 sm:mb-8">{t('about.bottomLead')}</p>
        <Link to="/upload">
          <Button size="lg" className="bg-primary lg:hover:bg-primary/90 text-sm px-8 sm:px-10 py-3 sm:py-3.5 h-auto">
            {t('about.bottomCta')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
