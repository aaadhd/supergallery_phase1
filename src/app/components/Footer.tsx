import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { LABELS } from '../admin/constants';
import { useI18n } from '../i18n/I18nProvider';

const BIZ_SEP = ' | ';

/**
 * button과 a(Link)의 user-agent 기본 스타일 차이를 완전히 제거하여 동일 폰트 크기/굵기/라인하이트로 렌더되도록 강제.
 * Tailwind v4의 arbitrary selector가 일부 reset에 제대로 적용되지 않는 경우를 대비한 inline style.
 */
const footItemStyle: CSSProperties = {
  font: 'inherit',
  fontWeight: 400,
  background: 'transparent',
  padding: 0,
  border: 0,
  color: 'inherit',
  lineHeight: 1,
  textDecoration: 'none',
};

/**
 * 노트폴리오 스타일 푸터.
 * - 항상 한 줄짜리 하단 바로 표시 (메뉴 링크 + "사업자 정보" 토글)
 * - "사업자 정보" 클릭 시 바 위로 상세 패널이 펼쳐짐 (회사 정보 · 카피라이트 · 이메일 무단수집 거부 · 관할 법원)
 * - 외부 클릭 / Esc 로 닫힘, 포커스 트랩은 걸지 않음 (단순 정보 패널)
 */
export function Footer() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [expanded]);

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
      ref={containerRef}
      className="shrink-0 border-t border-border bg-white/95 backdrop-blur-md z-30"
    >
      {/* 확장 상세 패널 (바 위로 슬라이드 업) */}
      {expanded && (
        <div
          className="border-b border-border/60 bg-white animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="region"
          aria-label={t('footer.businessInfo')}
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-5 sm:py-6 text-xs text-muted-foreground/90 leading-relaxed space-y-1">
            <p>{line1}</p>
            <p>{line2}</p>
            <p>{line3}</p>
            <p className="pt-3 text-muted-foreground">
              {t('footer.copyright')
                .replace('{year}', String(new Date().getFullYear()))
                .replace('{name}', LABELS.SERVICE_NAME)}
            </p>
            <p className="text-muted-foreground/80">{t('footer.emailCollectionNotice')}</p>
            <p className="text-muted-foreground/80">
              {t('footer.labelJurisdiction')}: {t('footer.jurisdictionValue')}
            </p>
          </div>
        </div>
      )}

      {/* 하단 한 줄 바 — 전 링크 동일 굵기/크기. button/Link 혼용을 inline style로 강제 통일 */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-2.5 sm:py-3">
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-[12px] sm:text-[13px] text-muted-foreground">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? t('footer.businessInfoClose') : t('footer.businessInfoOpen')}
            style={footItemStyle}
            className="inline-flex items-center gap-1 lg:hover:text-primary transition-colors"
          >
            {t('footer.businessInfo')}
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <Link to="/terms" style={footItemStyle} className="lg:hover:text-primary transition-colors">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" style={footItemStyle} className="lg:hover:text-primary transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link to="/contact" style={footItemStyle} className="lg:hover:text-primary transition-colors">
            {t('footer.contact')}
          </Link>
          <Link to="/notices" style={footItemStyle} className="hidden sm:inline lg:hover:text-primary transition-colors">
            {t('footer.notices')}
          </Link>
          <Link to="/faq" style={footItemStyle} className="hidden sm:inline lg:hover:text-primary transition-colors">
            {t('footer.faq')}
          </Link>
          <Link to="/about" style={footItemStyle} className="hidden md:inline lg:hover:text-primary transition-colors">
            {t('footer.about')}
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('artier_cookie_consent');
              window.dispatchEvent(new Event('artier-cookie-reset'));
            }}
            style={footItemStyle}
            className="hidden md:inline lg:hover:text-primary transition-colors"
          >
            {t('footer.cookieSettings')}
          </button>
          <span style={footItemStyle} className="ml-auto text-muted-foreground/70 tabular-nums hidden sm:inline">
            © {new Date().getFullYear()} {LABELS.SERVICE_NAME}
          </span>
        </div>
      </div>
    </footer>
  );
}
