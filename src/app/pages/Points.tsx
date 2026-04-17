import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';
import {
  POINTS_LEDGER_EVENT,
  readPointsLedger,
  getApBalanceFromLedger,
  getPpBalance,
  addDemoPp,
  type PointLedgerEntry,
} from '../utils/pointsBackground';
import { Button } from '../components/ui/button';

type LedgerFilter = 'all' | 'earn' | 'use';

function filterLedger(list: PointLedgerEntry[], f: LedgerFilter): PointLedgerEntry[] {
  if (f === 'all') return list;
  if (f === 'earn') return list.filter((e) => e.ap > 0);
  return list.filter((e) => e.ap < 0);
}

export default function Points() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [ledger, setLedger] = useState<PointLedgerEntry[]>(() => readPointsLedger());
  const ap = useMemo(() => getApBalanceFromLedger(), [ledger]);
  const pp = useMemo(() => getPpBalance(), [ledger]);

  const refresh = useCallback(() => {
    setLedger(readPointsLedger());
  }, []);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate('/login?redirect=/points', { replace: true });
    }
  }, [auth, navigate]);

  useEffect(() => {
    refresh();
    const onEvt = () => refresh();
    window.addEventListener(POINTS_LEDGER_EVENT, onEvt);
    window.addEventListener('storage', onEvt);
    return () => {
      window.removeEventListener(POINTS_LEDGER_EVENT, onEvt);
      window.removeEventListener('storage', onEvt);
    };
  }, [refresh]);

  const rows = useMemo(() => filterLedger(ledger, filter), [ledger, filter]);

  const formatAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (!auth.isLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24 md:pb-10">
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white lg:hover:bg-muted"
            aria-label={t('points.back')}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('points.title')}</h1>
        </div>

        {import.meta.env.DEV && (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t('points.demoNote')}</p>
            <div className="mb-6 rounded-xl border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">{t('points.demoToolbarTitle')}</p>
              <Button
                type="button"
                onClick={() => addDemoPp(50)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium lg:hover:opacity-90"
              >
                {t('points.demoPpButton')}
              </Button>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('points.apLabel')}</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{ap.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('points.ppLabel')}</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{pp.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{t('points.ppHint')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'earn', 'use'] as const).map((k) => (
            <Button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium transition-colors ${
                filter === k ? 'bg-foreground text-white' : 'bg-white border border-border text-muted-foreground lg:hover:bg-muted/50'
              }`}
            >
              {k === 'all' ? t('points.filterAll') : k === 'earn' ? t('points.filterEarn') : t('points.filterUse')}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('points.empty')}</p>
          ) : (
            <ul className="divide-y divide-[#F0F0F0]">
              {rows.map((e) => (
                <li key={e.id} className="px-4 py-3.5 flex gap-3 justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{e.kind}</p>
                    {e.note ? <p className="text-xs text-muted-foreground mt-0.5 break-words">{e.note}</p> : null}
                    <p className="text-xs text-muted-foreground mt-1">{formatAt(e.at)}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      e.ap > 0 ? 'text-emerald-600' : e.ap < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {e.ap > 0 ? '+' : ''}
                    {e.ap}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/demo" className="text-sm font-medium text-primary lg:hover:underline">
            {t('points.linkFlowMap')}
          </Link>
        </p>
      </div>
    </div>
  );
}
