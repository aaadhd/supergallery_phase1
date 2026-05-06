import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ArrowLeft,
  FileSearch,
  ImageIcon,
  Star,
  Sparkles,
  PanelTop,
  CalendarRange,
  Flag,
  UserCog,
  MessageSquare,
  Megaphone,
  Telescope,
} from 'lucide-react';
import { LABELS } from './constants';
import { authStore } from '../store';
import {
  canAccessAdminRoutes,
  touchOperatorSession,
  OPERATOR_SESSION_CHANGED_EVENT,
} from '../utils/adminGate';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

type NavItem = { to: string; icon: typeof LayoutDashboard; labelKey: MessageKey; end?: boolean };
type NavSection = { sectionLabelKey?: MessageKey; items: NavItem[] };

// PRD_Admin §0.3: 5섹션 그룹화 (시니어 운영자 멘탈 모델 단순화).
const navSections: NavSection[] = [
  {
    items: [
      { to: '/admin', icon: LayoutDashboard, labelKey: 'admin.nav.dashboard', end: true },
    ],
  },
  {
    sectionLabelKey: 'admin.section.moderation',
    items: [
      { to: '/admin/content-review', icon: FileSearch, labelKey: 'admin.nav.contentReview' },
      { to: '/admin/reports', icon: Flag, labelKey: 'admin.nav.reports' },
    ],
  },
  {
    sectionLabelKey: 'admin.section.contentOps',
    items: [
      { to: '/admin/picks', icon: Star, labelKey: 'admin.nav.picks' },
      { to: '/admin/featured', icon: Telescope, labelKey: 'admin.nav.featured' },
      { to: '/admin/curation', icon: Sparkles, labelKey: 'admin.nav.curation' },
      { to: '/admin/contests', icon: CalendarRange, labelKey: 'admin.nav.contests' },
      { to: '/admin/banners', icon: PanelTop, labelKey: 'admin.nav.banners' },
    ],
  },
  {
    sectionLabelKey: 'admin.section.members',
    items: [
      { to: '/admin/members', icon: UserCog, labelKey: 'admin.nav.members' },
      { to: '/admin/notices', icon: Megaphone, labelKey: 'admin.nav.notices' },
      { to: '/admin/inquiries', icon: MessageSquare, labelKey: 'admin.nav.inquiries' },
    ],
  },
];

// 폐기·통합 화면(PRD §9·§10): /admin/works·/admin/partners 라우트는 2026-04-26 제거됨.
// 운영자는 ADM-RPT-01(신고 큐) / ADM-MBR-01(회원 관리)에서 접근.
void ImageIcon; void Users;

export default function AdminLayout() {
  const { t } = useI18n();
  const location = useLocation();
  // PRD_Admin §0.5.2: 세션 만료·해제를 감지해 자동 리다이렉트. 최초 렌더 값은 함수 평가로 즉시 판정.
  const [sessionValid, setSessionValid] = useState(() =>
    canAccessAdminRoutes(authStore.isLoggedIn()),
  );

  // 어드민은 시니어 폰트 스케일 미적용 — 진입 시 16px로 고정, 이탈 시 복원.
  useEffect(() => {
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = '16px';
    return () => { document.documentElement.style.fontSize = prev; };
  }, []);

  // 사용자 활동 감지 → 세션 타임스탬프 갱신 (adminGate가 60s throttle).
  useEffect(() => {
    const onActivity = () => touchOperatorSession();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('click', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('click', onActivity);
    };
  }, []);

  // 주기적·이벤트 기반 세션 유효성 재평가. 만료 감지 시 안내 토스트 + 리다이렉트 트리거.
  useEffect(() => {
    let lastValid = sessionValid;
    const reevaluate = () => {
      const next = canAccessAdminRoutes(authStore.isLoggedIn());
      if (next !== lastValid) {
        lastValid = next;
        setSessionValid(next);
        if (!next) {
          toast.error('세션이 만료되어 로그아웃되었어요. 다시 로그인해 주세요.');
        }
      }
    };
    const id = window.setInterval(reevaluate, 60_000);
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, reevaluate);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'artier_admin_session_v1' || e.key === 'artier_auth') reevaluate();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, reevaluate);
      window.removeEventListener('storage', onStorage);
    };
  }, [sessionValid]);

  if (!sessionValid) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-60 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 lg:hover:text-white mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-white">Artier Admin</h1>
        </div>
        <nav className="flex-1 p-3 space-y-3">
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-1">
              {section.sectionLabelKey ? (
                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {t(section.sectionLabelKey)}
                </p>
              ) : null}
              {section.items.map(({ to, icon: Icon, labelKey, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-slate-900'
                        : 'text-slate-300 lg:hover:bg-slate-800 lg:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {t(labelKey)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50/80">
        <div key={location.pathname} className="max-w-[1200px] mx-auto p-6 animate-in fade-in duration-150">
          <Outlet />
        </div>
        <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
      </main>
    </div>
  );
}
