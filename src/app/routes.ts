import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { AppRootShell } from './AppRootShell';
import Layout from './Layout';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventResults from './pages/EventResults';
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
import PickDetail from './pages/PickDetail';
import PickHallOfFame from './pages/PickHallOfFame';
import ServerError from './pages/ServerError';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

import ContentReview from './admin/ContentReview';
import PickManagement from './admin/PickManagement';
import CurationManagement from './admin/CurationManagement';
import FeaturedManagement from './admin/FeaturedManagement';
import BannerManagement from './admin/BannerManagement';
import ContestManagement from './admin/ContestManagement';
import GeneralEventManagement from './admin/GeneralEventManagement';
import ReportManagement from './admin/ReportManagement';
import MemberManagement from './admin/MemberManagement';
import AdminInquiries from './admin/AdminInquiries';
import NoticeManagement from './admin/NoticeManagement';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import ExhibitionRoute from './pages/ExhibitionRoute';
import CurationDetail from './pages/CurationDetail';
import FlowDemoTools from './pages/FlowDemoTools';
import DemoReferenceToolkit from './pages/DemoReferenceToolkit';

function redirectWorksToExhibitions({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) return redirect('/');
  return redirect(`/exhibitions/${id}`);
}

// Policy §25.2 — 이벤트 응모는 USR-EVT-04 응모 모달 단일 진입점.
// /upload?event=<id> 외부 링크는 이벤트 상세 + 응모 모달 자동 오픈으로 redirect.
function redirectUploadEventToEntry({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('event');
  if (eventId) return redirect(`/events/${eventId}?entry=open`);
  return null;
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
          { path: 'upload', Component: Upload, loader: redirectUploadEventToEntry },
          { path: 'profile', Component: Profile },
          { path: 'profile/:id', Component: Profile },
          { path: 'me', Component: Profile },
          { path: 'me/edit', loader: () => redirect('/settings') },
          { path: 'events', Component: Events },
          { path: 'events/:id', Component: EventDetail },
          { path: 'events/:id/results', Component: EventResults },
          { path: 'search', Component: Search },
          { path: 'notifications', Component: Notifications },
          { path: 'settings', Component: Settings },
          { path: 'settings/notifications', loader: () => redirect('/settings#notifications') },
          { path: 'exhibitions/:id', Component: ExhibitionRoute },
          { path: 'curations/:id', Component: CurationDetail },
          { path: 'picks/hall-of-fame', Component: PickHallOfFame },
          { path: 'picks/:id', Component: PickDetail },
          ...demoRoutes,
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
      { path: '/admin/login', Component: AdminLogin },
      // Admin (접근 제어는 AdminLayout 내부에서 처리)
      {
        path: '/admin',
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: 'content-review', Component: ContentReview },
          { path: 'picks', Component: PickManagement },
          { path: 'curation', Component: CurationManagement },
          { path: 'featured', Component: FeaturedManagement },
          { path: 'banners', Component: BannerManagement },
          { path: 'contests', Component: ContestManagement },
          { path: 'general-events', Component: GeneralEventManagement },
          { path: 'reports', Component: ReportManagement },
          { path: 'members', Component: MemberManagement },
          { path: 'inquiries', Component: AdminInquiries },
          { path: 'notices', Component: NoticeManagement },
        ],
      },
    ],
  },
]);
