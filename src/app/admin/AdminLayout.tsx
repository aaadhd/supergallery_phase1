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
  PanelTop,
  CalendarRange,
  Flag,
  UserCog,
} from 'lucide-react';
import { LABELS } from './constants';
import { authStore } from '../store';
import { canAccessAdminRoutes } from '../utils/adminGate';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/admin/issues', icon: AlertCircle, label: '미결 이슈' },
  { to: '/admin/checklist', icon: CheckSquare, label: '런칭 체크리스트' },
  { to: '/admin/partners', icon: Users, label: '파트너 작가' },
  { to: '/admin/events', icon: CalendarDays, label: '이벤트 참여자' },
  { to: '/admin/content-review', icon: FileSearch, label: '콘텐츠 검토' },
  { to: '/admin/works', icon: ImageIcon, label: '작품 관리' },
  { to: '/admin/picks', icon: Star, label: "Artier's Pick" },
  { to: '/admin/banners', icon: PanelTop, label: '배너 관리' },
  { to: '/admin/managed-events', icon: CalendarRange, label: '이벤트 관리' },
  { to: '/admin/reports', icon: Flag, label: '신고 관리' },
  { to: '/admin/members', icon: UserCog, label: '회원 관리' },
];

export default function AdminLayout() {
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
            {LABELS.SERVICE_NAME} 사용자 앱으로
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">운영 콘솔</p>
          <h1 className="text-lg font-bold text-white mt-0.5">{LABELS.NAV_ADMIN}</h1>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            URL 직접 접속: <span className="text-slate-300">/admin</span> · 로컬 storage와 동기화
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
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
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">{LABELS.PROJECT_NAME} Phase 1 · 사용자 메뉴에 링크 없음</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50/80">
        <div className="max-w-[1200px] mx-auto p-6">
          <Outlet />
        </div>
        <Toaster position="top-center" richColors />
      </main>
    </div>
  );
}
