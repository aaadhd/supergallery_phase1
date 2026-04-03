import { Link } from 'react-router-dom';
import { LABELS } from '../admin/constants';
import { useI18n } from '../i18n/I18nProvider';

const BIZ_SEP = ' | ';

export function Footer() {
  const { t } = useI18n();
  const line1 = [
    `${t('footer.labelCompany')}: ${t('footer.bizCompanyValue')}`,
    `${t('footer.labelRepresentative')}: ${t('footer.bizRepValue')}`,
    `${t('footer.labelBizReg')}: ${t('footer.bizRegValue')}`,
  ].join(BIZ_SEP);
  const line2 = [
    `${t('footer.labelMailOrder')}: ${t('footer.mailOrderValue')}`,
    `${t('footer.labelPrivacyOfficer')}: ${t('footer.privacyOfficerValue')}`,
  ].join(BIZ_SEP);
  const line3 = [
    `${t('footer.labelAddress')}: ${t('footer.addressValue')}`,
    `${t('footer.labelEmail')}: ${t('footer.contactEmailValue')}`,
    `${t('footer.labelPhone')}: ${t('footer.phoneValue')}`,
  ].join(BIZ_SEP);

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-10 pb-20 md:pb-10">
        {/* 링크 */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/about" className="lg:hover:text-primary transition-colors">
            {t('footer.about')}
          </Link>
          <Link to="/notices" className="lg:hover:text-primary transition-colors">
            {t('footer.notices')}
          </Link>
          <Link to="/faq" className="lg:hover:text-primary transition-colors">
            {t('footer.faq')}
          </Link>
          <Link to="/contact" className="lg:hover:text-primary transition-colors">
            {t('footer.contact')}
          </Link>
          <Link to="/demo" className="lg:hover:text-primary transition-colors">
            {t('footer.demoLink')}
          </Link>
          <Link to="/terms" className="lg:hover:text-primary transition-colors">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className="lg:hover:text-primary transition-colors font-semibold text-foreground/80">
            {t('footer.privacy')}
          </Link>
        </div>

        {/* 사업자 정보 (전자상거래법 제10조) — 라벨·값 locale 연동 */}
        <div className="mt-6 text-xs text-muted-foreground/90 leading-relaxed space-y-0.5">
          <p>{line1}</p>
          <p>{line2}</p>
          <p>{line3}</p>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {LABELS.SERVICE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80">{t('footer.emailCollectionNotice')}</p>
        </div>

        <p className="mt-2 text-xs text-muted-foreground/80">
          {t('footer.labelJurisdiction')}: {t('footer.jurisdictionValue')}
        </p>
      </div>
    </footer>
  );
}
