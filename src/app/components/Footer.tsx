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
    <footer className="border-t border-[#F0F0F0] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-10 pb-20 md:pb-10">
        {/* 링크 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#71717A]">
          <Link to="/about" className="hover:text-[#18181B] transition-colors">{t('footer.about')}</Link>
          <Link to="/notices" className="hover:text-[#18181B] transition-colors">{t('footer.notices')}</Link>
          <Link to="/faq" className="hover:text-[#18181B] transition-colors">{t('footer.faq')}</Link>
          <Link to="/contact" className="hover:text-[#18181B] transition-colors">{t('footer.contact')}</Link>
          <Link to="/terms" className="hover:text-[#18181B] transition-colors">{t('footer.terms')}</Link>
          <Link to="/privacy" className="hover:text-[#18181B] transition-colors font-semibold">{t('footer.privacy')}</Link>
        </div>

        {/* 사업자 정보 (전자상거래법 제10조) — 라벨·값 locale 연동 */}
        <div className="mt-6 text-xs text-[#A1A1AA] leading-relaxed space-y-0.5">
          <p>{line1}</p>
          <p>{line2}</p>
          <p>{line3}</p>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-xs text-[#A1A1AA]">
            © {new Date().getFullYear()} {LABELS.SERVICE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-[#B4B4BC]">{t('footer.emailCollectionNotice')}</p>
        </div>

        <p className="mt-2 text-xs text-[#B4B4BC]">
          {t('footer.labelJurisdiction')}: {t('footer.jurisdictionValue')}
        </p>
      </div>
    </footer>
  );
}
