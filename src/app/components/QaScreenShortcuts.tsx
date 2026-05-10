import { useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListTree } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { authStore, workStore } from '../store';
import { setOperatorRole } from '../utils/adminGate';
import { clearMockSession, persistMockSession } from '../services/sessionTokens';
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
    if (!authStore.isLoggedIn()) {
      authStore.login();
      persistMockSession('qa-admin-auto');
    }
    setOperatorRole(true);
    navigate(path);
  };

  const linkCls = 'cursor-pointer';
  // 일반 전시 공유 URL (Browse fallthrough → 작품 모달 오픈)
  const shareInvitePath = `/exhibitions/${sampleWorkId}?from=invite`;

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
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2',
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

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {t('footer.qaGroupAuthUrl')}
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              ['kakao', 'google', 'apple'].forEach((p) =>
                localStorage.setItem(`artier_social_signed_up__${p}`, '1')
              );
              localStorage.setItem('artier_onboarding_done', 'true');
              authStore.login();
              persistMockSession('qa-relogin-auto');
              navigate('/');
            }}
          >
            로그인 상태 바로가기
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              ['kakao', 'google', 'apple'].forEach((p) =>
                localStorage.removeItem(`artier_social_signed_up__${p}`)
              );
              authStore.logout();
              clearMockSession();
              navigate('/login');
            }}
          >
            소셜 가입 기록 초기화 → /login
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/onboarding" className={linkCls}>
              {t('footer.qaOnboarding')}
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
            어드민
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/admin/login" className={linkCls}>
              어드민 로그인 화면
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={linkCls}
            onSelect={() => goAdmin('/admin')}
          >
            어드민 로그인 상태 바로가기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
