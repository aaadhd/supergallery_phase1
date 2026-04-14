import { Outlet, NavLink, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  AlertCircle,
  CheckSquare,
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
} from 'lucide-react';
import { LABELS } from './constants';
import { authStore } from '../store';
import { canAccessAdminRoutes } from '../utils/adminGate';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const navItems: { to: string; icon: typeof LayoutDashboard; labelKey: MessageKey; end?: boolean }[] = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'admin.nav.dashboard', end: true },
  { to: '/admin/issues', icon: AlertCircle, labelKey: 'admin.nav.issues' },
  { to: '/admin/checklist', icon: CheckSquare, labelKey: 'admin.nav.checklist' },
  { to: '/admin/partners', icon: Users, labelKey: 'admin.nav.partners' },
  { to: '/admin/events', icon: CalendarDays, labelKey: 'admin.nav.eventParticipants' },
  { to: '/admin/content-review', icon: FileSearch, labelKey: 'admin.nav.contentReview' },
  { to: '/admin/works', icon: ImageIcon, labelKey: 'admin.nav.works' },
  { to: '/admin/picks', icon: Star, labelKey: 'admin.nav.picks' },
  { to: '/admin/curation', icon: Sparkles, labelKey: 'admin.nav.curation' },
  { to: '/admin/banners', icon: PanelTop, labelKey: 'admin.nav.banners' },
  { to: '/admin/managed-events', icon: CalendarRange, labelKey: 'admin.nav.managedEvents' },
  { to: '/admin/reports', icon: Flag, labelKey: 'admin.nav.reports' },
  { to: '/admin/members', icon: UserCog, labelKey: 'admin.nav.members' },
];

export default function AdminLayout() {
  const { t } = useI18n();

  if (!canAccessAdminRoutes(authStore.isLoggedIn())) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-60 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 lg:hover:text-white mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {LABELS.SERVICE_NAME} {t('admin.backToApp')}
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">{t('admin.consoleLabel')}</p>
          <h1 className="text-lg font-bold text-white mt-0.5">{LABELS.NAV_ADMIN}</h1>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {t('admin.roleBadge')}
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-snug">
            {t('admin.sidebarNote')}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, labelKey, end }) => (
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
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">{LABELS.PROJECT_NAME} {t('admin.footerNote')}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50/80">
        <div className="max-w-[1200px] mx-auto p-6">
          <Outlet />
        </div>
        <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
      </main>
    </div>
  );
}
