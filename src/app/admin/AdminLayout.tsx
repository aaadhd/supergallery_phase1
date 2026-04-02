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
  // Admin 접근 제어
  if (!authStore.isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3">
            <ArrowLeft className="w-4 h-4" />
            {LABELS.SERVICE_NAME}으로 돌아가기
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{LABELS.NAV_ADMIN}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{LABELS.PROJECT_NAME} Phase 1</p>
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
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Mock 데이터 기반 MVP</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white">
        <div className="max-w-[1200px] mx-auto p-6">
          <Outlet />
        </div>
        <Toaster position="top-center" richColors />
      </main>
    </div>
  );
}
