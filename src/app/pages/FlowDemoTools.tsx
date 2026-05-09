import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Bell, UserPlus, Map, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { setProdAdminBrowserUnlock, hasProdAdminBrowserUnlock } from '../utils/adminGate';
import { tosConsentStore } from '../utils/tosConsentStore';
import { artists } from '../data';
import { workStore } from '../store';
import { Button } from '../components/ui/button';

const FLOW_MAP_KEYS: MessageKey[] = [
  'flowMap.section01',
  'flowMap.section02',
  'flowMap.section03',
  'flowMap.section04',
  'flowMap.section05',
  'flowMap.section06',
  'flowMap.section07',
  'flowMap.section08',
  'flowMap.section09',
  'flowMap.section10',
  'flowMap.section11',
  'flowMap.section12',
  'flowMap.section13',
  'flowMap.section14',
  'flowMap.section15',
];

function parseFlowBlock(raw: string): { title: string; items: { path: string; desc: string }[] } {
  const lines = raw
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { title: '', items: [] };
  const [title, ...rest] = lines;
  const items = rest.map((line) => {
    const i = line.indexOf('|');
    if (i === -1) return { path: line, desc: '' };
    return { path: line.slice(0, i).trim(), desc: line.slice(i + 1).trim() };
  });
  return { title: title ?? '', items };
}

function FlowMapBlock({ text }: { text: string }) {
  const { title, items } = parseFlowBlock(text);
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {items.map((it, idx) => (
          <li key={`${it.path}-${idx}`} className="flex flex-col gap-0.5 border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
            <Link
              to={it.path}
              className="font-mono text-xs sm:text-sm text-primary lg:hover:underline break-all"
            >
              {it.path}
            </Link>
            {it.desc ? <span className="text-xs text-muted-foreground leading-snug">{it.desc}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FlowDemoTools() {
  const { t } = useI18n();
  const [adminBrowserUnlocked, setAdminBrowserUnlocked] = useState(() => hasProdAdminBrowserUnlock());

  const pushGroupInvite = () => {
    pushDemoNotification({
      type: 'event',
      message: t('demo.notifGroupInviteMsg'),
    });
    toast.success(t('demo.toastNotifPushed'));
  };

  const pushFollowNotif = () => {
    const a = artists[3];
    pushDemoNotification({
      type: 'follow',
      message: t('demo.notifFollowMsg'),
      fromUser: { name: a.name, avatar: a.avatar, id: a.id },
    });
    toast.success(t('demo.toastNotifPushed'));
  };

  return (
    <div className="min-h-screen bg-muted/50 pb-24 md:pb-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
            <FlaskConical className="h-6 w-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('demo.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t('demo.lead')}</p>
        <Link
          to="/demo/reference"
          className="inline-flex mb-8 text-sm font-semibold text-primary lg:hover:underline"
        >
          {t('demo.linkReferenceToolkit')} →
        </Link>

        <section className="rounded-2xl border-2 border-border bg-card p-5 sm:p-6 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Map className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-bold text-foreground">{t('flowMap.heading')}</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5">{t('flowMap.intro')}</p>
          <div className="space-y-4 max-h-[min(70vh,720px)] overflow-y-auto pr-1">
            {FLOW_MAP_KEYS.map((key) => (
              <FlowMapBlock key={key} text={t(key)} />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-foreground" />
              {t('demo.sectionNotif')}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{t('demo.sectionNotifHint')}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button variant="ghost"
                type="button"
                onClick={pushFollowNotif}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50 text-left"
              >
                <UserPlus className="inline h-4 w-4 mr-2 -mt-0.5 text-muted-foreground" />
                {t('demo.btnNotifFollow')}
              </Button>
              <Button variant="ghost"
                type="button"
                onClick={pushGroupInvite}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50 text-left"
              >
                {t('demo.btnNotifGroup')}
              </Button>
            </div>
            <Link
              to="/notifications"
              className="inline-block mt-4 text-sm font-medium text-primary lg:hover:underline"
            >
              {t('demo.linkOpenNotif')}
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('demo.sectionAdminGate')}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t('demo.sectionAdminGateHint')}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setProdAdminBrowserUnlock(true);
                  setAdminBrowserUnlocked(true);
                  toast.success(t('demo.toastAdminUnlocked'));
                }}
                disabled={adminBrowserUnlocked}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50 text-left disabled:opacity-50 disabled:pointer-events-none"
              >
                {t('demo.btnAdminUnlock')}
              </Button>
              {adminBrowserUnlocked ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setProdAdminBrowserUnlock(false);
                    setAdminBrowserUnlocked(false);
                    toast.success(t('demo.toastAdminLocked'));
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  {t('demo.btnAdminLock')}
                </Button>
              ) : null}
            </div>
            {adminBrowserUnlocked && (
              <p className="mt-3 text-xs text-emerald-700">{t('demo.operatorRoleActive')}</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-foreground" />
              {t('demo.sectionTos')}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{t('demo.sectionTosHint')}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  tosConsentStore.setPending({
                    version: '1.1',
                    effectiveDate: '2026. 6. 1.',
                    summary: [
                      '마케팅 수신 동의 항목이 이메일·알림톡·문자로 세분화됩니다.',
                      '개인정보 보관 기간이 탈퇴 후 30일로 단축됩니다.',
                      '이용약관 제7조(금지 행위) 항목이 구체화됩니다.',
                    ],
                    isImplied: false,
                    fullUrl: '/terms',
                  });
                  toast.success(t('demo.toastTosTriggered'));
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50 text-left"
              >
                {t('demo.btnTosTrigger')}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  tosConsentStore.setPending({
                    version: '1.1',
                    effectiveDate: '2026. 6. 1.',
                    summary: [
                      '마케팅 수신 동의 항목이 이메일·알림톡·문자로 세분화됩니다.',
                      '개인정보 보관 기간이 탈퇴 후 30일로 단축됩니다.',
                    ],
                    isImplied: true,
                    fullUrl: '/terms',
                  });
                  toast.success(t('demo.toastTosTriggered'));
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50 text-left"
              >
                {t('demo.btnTosImpliedTrigger')}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('demo.sectionWithdraw')}</h2>
            <p className="text-xs text-muted-foreground mb-4">{t('demo.sectionWithdrawHint')}</p>
            <Link
              to="/settings"
              className="inline-flex px-4 py-2.5 rounded-xl border border-border text-sm font-medium lg:hover:bg-muted/50"
            >
              {t('demo.linkSettings')}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
