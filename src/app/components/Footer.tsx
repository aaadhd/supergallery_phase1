import { Link } from 'react-router-dom';
import { LABELS } from '../admin/constants';
import { useI18n } from '../i18n/I18nProvider';

const BIZ_SEP = ' | ';

type FooterProps = {
  /** 홈 무한 스크롤 모드: 하단 탭바 위 얇은 바 스타일 */
  docked?: boolean;
};

export function Footer({ docked = false }: FooterProps) {
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
    <footer
      className={`shrink-0 border-t border-border z-30 ${
        docked ? 'bg-background/92 backdrop-blur-md md:bg-muted/40 md:backdrop-blur-none' : 'bg-muted/40'
      }`}
    >
      <div
        className={`mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 ${
          docked ? 'py-2.5 sm:py-3' : 'py-8 sm:py-10 pb-20 md:pb-10'
        }`}
      >
        {/* 링크 — 둘러보기(docked)는 노트폴리오처럼 메뉴명만 */}
        <div
          className={`flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 ${
            docked ? 'text-[12px] sm:text-[13px] justify-center sm:justify-start' : 'text-[13px]'
          } text-muted-foreground`}
        >
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

        {!docked && (
          <>
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
          </>
        )}
      </div>
    </footer>
  );
}
