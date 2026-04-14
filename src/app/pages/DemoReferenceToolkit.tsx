import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Globe, Mail, ListChecks, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import {
  loadMockSession,
  refreshMockAccessToken,
  isAccessExpired,
  type MockJwtSession,
} from '../services/sessionTokens';
import { fetchGeoDemo, type GeoDemoResult } from '../utils/geoIpDemo';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

function truncateToken(s: string, n = 56) {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function parseEmailMasterRows(raw: string) {
  return raw
    .trim()
    .split('\n')
    .map((line) => {
      const [no, name, trigger, req] = line.split('|');
      return { no: no ?? '', name: name ?? '', trigger: trigger ?? '', req: req ?? '' };
    })
    .filter((r) => r.no);
}

const EMAIL_PREVIEW_KEYS: readonly { subject: MessageKey; body: MessageKey }[] = [
  { subject: 'refStub.tplWelcomeSubject', body: 'refStub.tplWelcomeBody' },
  { subject: 'refStub.tplVerifySubject', body: 'refStub.tplVerifyBody' },
  { subject: 'refStub.tplResetSubject', body: 'refStub.tplResetBody' },
  { subject: 'refStub.tplPwdChangedSubject', body: 'refStub.tplPwdChangedBody' },
  { subject: 'refStub.tplPickSubject', body: 'refStub.tplPickBody' },
  { subject: 'refStub.tplWeeklySubject', body: 'refStub.tplWeeklyBody' },
  { subject: 'refStub.tplPolicySubject', body: 'refStub.tplPolicyBody' },
  { subject: 'refStub.tplMarketingSubject', body: 'refStub.tplMarketingBody' },
  { subject: 'refStub.tplSuspendSubject', body: 'refStub.tplSuspendBody' },
  { subject: 'refStub.tplWithdrawSubject', body: 'refStub.tplWithdrawBody' },
];

function EmailFrame({
  subject,
  children,
}: {
  subject: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="rounded-md border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border/40 px-4 py-2.5 bg-muted/50">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Subject</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{subject}</p>
        </div>
        <div className="px-4 py-4 text-sm text-foreground leading-relaxed whitespace-pre-line font-sans">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DemoReferenceToolkit() {
  const { t, locale } = useI18n();
  const [, bumpSession] = useState(0);
  const [geo, setGeo] = useState<GeoDemoResult | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const session: MockJwtSession | null = loadMockSession();
  const accessDead = isAccessExpired(session);

  const reloadSession = useCallback(() => bumpSession((x) => x + 1), []);

  const handleRefreshJwt = () => {
    const next = refreshMockAccessToken();
    if (next) {
      toast.success(t('refStub.jwtToastRefreshed'));
      reloadSession();
    } else {
      toast.error(t('refStub.jwtToastNoSession'));
    }
  };

  const runGeo = async (skipCache: boolean) => {
    setGeoLoading(true);
    setGeo(null);
    try {
      const r = await fetchGeoDemo({ skipCache });
      setGeo(r);
    } finally {
      setGeoLoading(false);
    }
  };

  const emailRows = parseEmailMasterRows(t('refStub.emailMasterBlock'));

  return (
    <div className="min-h-screen bg-muted/50 pb-24 md:pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-12">
        <Link
          to="/demo"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary lg:hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('refStub.backDemo')}
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t('refStub.title')}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-10">{t('refStub.lead')}</p>

        {/* JWT */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-bold text-foreground">{t('refStub.jwtTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('refStub.jwtLead')}</p>
          {!session ? (
            <p className="text-sm text-muted-foreground">{t('refStub.jwtEmpty')}</p>
          ) : (
            <div className="space-y-3 font-mono text-[11px] sm:text-xs break-all">
              <p>
                <span className="text-muted-foreground">{t('refStub.jwtSub')} </span>
                <span className="text-foreground">{session.sub}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t('refStub.jwtAccessLabel')} </span>
                <span className="text-foreground">{truncateToken(session.accessToken)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t('refStub.jwtRefreshLabel')} </span>
                <span className="text-foreground">{truncateToken(session.refreshToken)}</span>
              </p>
              <p className="text-muted-foreground">
                {t('refStub.jwtAccessExpires')}{' '}
                {new Date(session.accessExpiresAt).toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}
                {accessDead ? ` (${t('refStub.jwtExpired')})` : ''}
              </p>
              <p className="text-muted-foreground">
                {t('refStub.jwtRefreshExpires')}{' '}
                {new Date(session.refreshExpiresAt).toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}
              </p>
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={handleRefreshJwt}>
                {t('refStub.jwtRefreshCta')}
              </Button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-4 leading-snug">{t('refStub.jwtHint')}</p>
        </section>

        {/* GeoIP */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-bold text-foreground">{t('refStub.geoTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('refStub.geoLead')}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button type="button" size="sm" variant="default" disabled={geoLoading} onClick={() => runGeo(false)}>
              {geoLoading ? t('refStub.geoLoading') : t('refStub.geoCta')}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={geoLoading} onClick={() => runGeo(true)}>
              {t('refStub.geoAgain')}
            </Button>
          </div>
          {geo ? (
            <ul className="text-sm space-y-1.5 text-foreground">
              <li>
                <span className="text-muted-foreground">{t('refStub.geoCode')} </span>
                <strong>{geo.countryCode}</strong>
              </li>
              <li>
                <span className="text-muted-foreground">{t('refStub.geoName')} </span>
                {geo.countryName}
              </li>
              {geo.region ? (
                <li>
                  <span className="text-muted-foreground">{t('refStub.geoRegion')} </span>
                  {geo.region}
                </li>
              ) : null}
              <li>
                <span className="text-muted-foreground">{t('refStub.geoSource')} </span>
                {geo.source === 'ipapi' ? t('refStub.geoSourceIpapi') : t('refStub.geoSourceFallback')}
              </li>
            </ul>
          ) : null}
        </section>

        {/* Email templates */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-bold text-foreground">{t('refStub.tplTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{t('refStub.tplLead')}</p>
          <div className="space-y-6">
            {EMAIL_PREVIEW_KEYS.map(({ subject, body }) => (
              <EmailFrame key={subject} subject={t(subject)}>
                {t(body)}
              </EmailFrame>
            ))}
          </div>
        </section>

        {/* Email master table (기능 모음) */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-bold text-foreground">{t('refStub.rulesTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('refStub.rulesLead')}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{t('refStub.rulesColNo')}</TableHead>
                <TableHead className="min-w-[120px]">{t('refStub.rulesColName')}</TableHead>
                <TableHead className="min-w-[160px]">{t('refStub.rulesColTrigger')}</TableHead>
                <TableHead className="min-w-[100px]">{t('refStub.rulesColReq')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailRows.map((row) => (
                <TableRow key={row.no}>
                  <TableCell className="align-top text-sm font-medium text-foreground">{row.no}</TableCell>
                  <TableCell className="align-top text-sm">{row.name}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">{row.trigger}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">{row.req}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
