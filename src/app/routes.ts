import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { AppRootShell } from './AppRootShell';
import Layout from './Layout';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthVerify from './pages/AuthVerify';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Notices from './pages/Notices';
import NoticeDetail from './pages/NoticeDetail';
import ServerError from './pages/ServerError';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import UnresolvedIssues from './admin/UnresolvedIssues';
import LaunchChecklist from './admin/LaunchChecklist';
import PartnerArtists from './admin/PartnerArtists';
import EventParticipants from './admin/EventParticipants';
import ContentReview from './admin/ContentReview';
import WorkManagement from './admin/WorkManagement';
import PickManagement from './admin/PickManagement';
import CurationManagement from './admin/CurationManagement';
import BannerManagement from './admin/BannerManagement';
import EventManagement from './admin/EventManagement';
import ReportManagement from './admin/ReportManagement';
import MemberManagement from './admin/MemberManagement';
import AdminInquiries from './admin/AdminInquiries';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import ExhibitionRoute from './pages/ExhibitionRoute';
import FlowDemoTools from './pages/FlowDemoTools';
import DemoReferenceToolkit from './pages/DemoReferenceToolkit';

function redirectWorksToExhibitions({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return redirect('/');
  return redirect(`/exhibitions/${id}`);
}

// /demo, /demo/reference는 PM 시연·QA 검수용. 프로덕션 빌드에서는 제거되며 catch-all이 404 처리.
const demoRoutesEnabled =
  !import.meta.env.PROD || import.meta.env.VITE_FOOTER_QA_LINKS === 'true';
const demoRoutes = demoRoutesEnabled
  ? [
      { path: 'demo', Component: FlowDemoTools },
      { path: 'demo/reference', Component: DemoReferenceToolkit },
    ]
  : [];

export const router = createBrowserRouter([
  {
    Component: AppRootShell,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          { index: true, Component: Browse },
          { path: 'browse', loader: () => redirect('/') },
          { path: 'works/:id', loader: redirectWorksToExhibitions },
          { path: 'upload', Component: Upload },
          { path: 'profile', Component: Profile },
          { path: 'profile/:id', Component: Profile },
          { path: 'me', Component: Profile },
          { path: 'me/edit', loader: () => redirect('/settings') },
          { path: 'events', Component: Events },
          { path: 'events/:id', Component: EventDetail },
          { path: 'search', Component: Search },
          { path: 'notifications', Component: Notifications },
          { path: 'settings', Component: Settings },
          { path: 'settings/notifications', loader: () => redirect('/settings#notifications') },
          { path: 'exhibitions/:id', Component: ExhibitionRoute },
          ...demoRoutes,
          { path: 'points', loader: () => redirect('/') },
          { path: 'about', Component: About },
          { path: 'faq', Component: Faq },
          { path: 'contact', Component: Contact },
          { path: 'notices', Component: Notices },
          { path: 'notices/:id', Component: NoticeDetail },
          { path: '500', Component: ServerError },
          { path: 'terms', Component: Terms },
          { path: 'privacy', Component: Privacy },
          { path: '*', Component: NotFound },
        ],
      },
      // 온보딩·초대·로그인 (Layout 밖 — Header/Footer 없음)
      { path: '/onboarding', Component: Onboarding },
      { path: '/login', Component: Login },
      { path: '/maintenance', Component: Maintenance },
      { path: '/signup', Component: Signup },
      { path: '/auth/verify', Component: AuthVerify },
      // Admin (접근 제어는 AdminLayout 내부에서 처리)
      {
        path: '/admin',
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'issues', Component: UnresolvedIssues },
          { path: 'checklist', Component: LaunchChecklist },
          { path: 'partners', Component: PartnerArtists },
          { path: 'events', Component: EventParticipants },
          { path: 'content-review', Component: ContentReview },
          { path: 'works', Component: WorkManagement },
          { path: 'picks', Component: PickManagement },
          { path: 'curation', Component: CurationManagement },
          { path: 'banners', Component: BannerManagement },
          { path: 'managed-events', Component: EventManagement },
          { path: 'reports', Component: ReportManagement },
          { path: 'members', Component: MemberManagement },
          { path: 'inquiries', Component: AdminInquiries },
        ],
      },
    ],
  },
]);
