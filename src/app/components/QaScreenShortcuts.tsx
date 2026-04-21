import { useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListTree } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { authStore, workStore } from '../store';
import { setOperatorRole } from '../utils/adminGate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';

const QA_NOT_FOUND_PATH = '/__artier_qa_not_found__';

const showQaNav =
  import.meta.env.DEV || import.meta.env.VITE_FOOTER_QA_LINKS === 'true';

/** AdminLayout이 `canAccessAdminRoutes`로 막지 않도록 운영팀 역할을 켠 뒤 이동합니다. */
const ADMIN_QA_PATHS: { path: string; labelKey: MessageKey }[] = [
  { path: '/admin', labelKey: 'footer.qaAdminDashboard' },
  { path: '/admin/issues', labelKey: 'footer.qaAdminIssues' },
  { path: '/admin/checklist', labelKey: 'footer.qaAdminChecklist' },
  { path: '/admin/partners', labelKey: 'footer.qaAdminPartners' },
  { path: '/admin/events', labelKey: 'footer.qaAdminEventParticipants' },
  { path: '/admin/content-review', labelKey: 'footer.qaAdminContentReview' },
  { path: '/admin/works', labelKey: 'footer.qaAdminWorks' },
  { path: '/admin/picks', labelKey: 'footer.qaAdminPicks' },
  { path: '/admin/curation', labelKey: 'footer.qaAdminCuration' },
  { path: '/admin/banners', labelKey: 'footer.qaAdminBanners' },
  { path: '/admin/managed-events', labelKey: 'footer.qaAdminManagedEvents' },
  { path: '/admin/reports', labelKey: 'footer.qaAdminReports' },
  { path: '/admin/members', labelKey: 'footer.qaAdminMembers' },
  { path: '/admin/inquiries', labelKey: 'footer.qaAdminInquiries' },
];

function useSampleWorkId(): string {
  return useSyncExternalStore(
    workStore.subscribe,
    () => {
      const works = workStore.getWorks();
      const w = works.find((x) => !x.isHidden) ?? works[0];
      return w?.id ?? '1';
    },
    () => '1',
  );
}

/**
 * 검수용 — GNB·푸터·작품 올리기 등 일반 경로로 갈 수 있는 화면은 제외하고,
 * 공유 초대·시연 쿼리·비표시 메뉴(어드민·데모)·오류만 노출합니다.
 */
export function QaScreenShortcuts() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const sampleWorkId = useSampleWorkId();

  if (!showQaNav) return null;

  const goAdmin = (path: string) => {
    setOperatorRole(true);
    if (authStore.isLoggedIn()) {
      navigate(path);
      return;
    }
    navigate(`/login?redirect=${encodeURIComponent(path)}`);
  };

  const linkCls = 'cursor-pointer';
  const shareInvitePath = `/exhibitions/${sampleWorkId}?from=invite`;
  const creditedPath = `/exhibitions/${sampleWorkId}?from=credited`;

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[60]',
        'bottom-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]',
        'right-[max(1rem,calc(0.75rem+env(safe-area-inset-right,0px)))]',
        'max-md:bottom-[max(5rem,calc(4.5rem+env(safe-area-inset-bottom,0px)))]',
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className={cn(
            'pointer-events-auto inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full',
            'border border-border bg-background/95 px-3 shadow-lg backdrop-blur-md',
            'text-muted-foreground text-xs sm:text-sm font-medium',
            'lg:hover:border-primary/40 lg:hover:text-primary transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          aria-label={t('footer.qaNavTrigger')}
        >
          <ListTree className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden max-w-[9rem] truncate sm:inline sm:max-w-none">
            {t('footer.qaNavTrigger')}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={8}
          className="z-[100] max-h-[min(75vh,560px)] w-[min(100vw-2rem,20rem)] overflow-y-auto"
        >
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupShareDeep')}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to={shareInvitePath} className={linkCls}>
              {t('footer.qaExhibitionInvite')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={creditedPath} className={linkCls}>
              {t('footer.qaExhibitionCredited')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupAuthUrl')}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/login" className={linkCls}>
              {t('footer.qaLogin')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/login?mode=email" className={linkCls}>
              {t('footer.qaLoginEmail')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/signup?step=1" className={linkCls}>
              {t('footer.qaSignup')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/onboarding" className={linkCls}>
              {t('footer.qaOnboarding')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/login?mode=email&demo=suspended" className={linkCls}>
              {t('footer.qaLoginDemoSuspended')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/auth/verify?demo=expired" className={linkCls}>
              {t('footer.qaAuthVerifyDemoExpired')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupErrors')}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/maintenance" className={linkCls}>
              {t('footer.qaMaintenance')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/500" className={linkCls}>
              {t('footer.qaServerError')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={QA_NOT_FOUND_PATH} className={linkCls}>
              {t('footer.qaNotFound')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupDemo')}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/demo" className={linkCls}>
              {t('footer.qaFlowDemo')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/demo/reference" className={linkCls}>
              {t('footer.qaReferenceToolkit')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupAdmin')}
          </DropdownMenuLabel>
          {ADMIN_QA_PATHS.map(({ path, labelKey }) => (
            <DropdownMenuItem
              key={path}
              className={linkCls}
              onSelect={() => {
                goAdmin(path);
              }}
            >
              {t(labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
