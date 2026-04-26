import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkStore, useAuthStore } from '../store';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { Button } from '../components/ui/button';
import { getCoverImage, getImageCount } from '../utils/imageHelper';
import { displayExhibitionTitle, displayProminentHeadline } from '../utils/workDisplay';
import { useI18n } from '../i18n/I18nProvider';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { getInviteToken, type InviteTokenStatus } from '../utils/inviteTokenStore';
import type { Work } from '../data';

/**
 * 전시 단위 초대 링크 오픈 화면 (Policy §3 v2.14).
 * - `?invite=<token>` : 작가가 직접 친구에게 보낸 초대 링크. 가입 시 본인 작품 카드 노출 트리거.
 * - 그 외(직접 URL 입력 등): 일반 전시 미리보기로 동작 (가입 CTA만 노출).
 * 작품 한 점 단위 공유는 `?from=work` → ExhibitionWorkShareLanding.
 */
function collectExhibitionWorks(seed: Work, all: Work[]): Work[] {
  const ex = seed.exhibitionName?.trim();
  const gn = seed.groupName?.trim();
  const pool = all.filter((w) => w.id === seed.id || isWorkVisibleOnPublicFeed(w));
  const matches = pool.filter((w) => {
    if (w.id === seed.id) return true;
    if (ex && w.exhibitionName?.trim() === ex) return true;
    if (gn && w.groupName?.trim() === gn && seed.primaryExhibitionType === 'group' && w.primaryExhibitionType === 'group') return true;
    return false;
  });
  const seedIdx = matches.findIndex((w) => w.id === seed.id);
  if (seedIdx > 0) {
    const [first] = matches.splice(seedIdx, 1);
    matches.unshift(first);
  }
  return matches;
}

export default function ExhibitionInviteLanding() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const inviteTokenParam = searchParams.get('invite') ?? '';
  const navigate = useNavigate();
  const { t } = useI18n();
  const auth = useAuthStore();
  const store = useWorkStore();
  const works = store.getWorks();
  const seed = useMemo(() => works.find((w) => w.id === id), [works, id]);

  // SPA 환경의 검색엔진 인덱싱 차단 (Policy §3 v2.14 — 봇 일부는 무시할 수 있음)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      try { document.head.removeChild(meta); } catch { /* ignore */ }
    };
  }, []);

  /** 초대 토큰 상태 평가 (Policy §3.2). */
  const tokenInfo = useMemo<{ status: InviteTokenStatus | 'none' | 'mismatch' }>(() => {
    if (!inviteTokenParam) return { status: 'none' };
    const tok = getInviteToken(inviteTokenParam);
    if (!tok) return { status: 'mismatch' };
    if (tok.workId !== id) return { status: 'mismatch' };
    return { status: tok.status };
  }, [inviteTokenParam, id]);

  // 가입 CTA 클릭 시 토큰을 sessionStorage에 보관 (Onboarding 본인 작품 찾기 단계로 핸드오프)
  const stashTokenForSignup = () => {
    if (typeof window === 'undefined' || !inviteTokenParam) return;
    try {
      sessionStorage.setItem('artier_pending_invite_token', inviteTokenParam);
    } catch { /* ignore */ }
  };

  // 전시 삭제 (Policy §3.3)
  if (!seed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-3 text-center">
        <h1 className="text-lg font-semibold text-foreground">{t('invite.deletedTitle')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">{t('invite.deletedBody')}</p>
        <Link to="/" className="mt-2 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50">
          {t('invite.browse')}
        </Link>
      </div>
    );
  }

  // 토큰이 명시되었으나 만료·취소·불일치인 경우: 본문 차단 + 안내 메시지
  if (inviteTokenParam && (tokenInfo.status === 'mismatch' || tokenInfo.status === 'revoked')) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">
          {tokenInfo.status === 'mismatch' ? t('invite.tokenExpired') : t('invite.tokenRevoked')}
        </h1>
        <Link to="/" className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50">
          {t('invite.browse')}
        </Link>
      </div>
    );
  }

  // 자동·확정 비공개 전시 (Policy §3.3 · §12.2)
  if (seed.isHidden === true) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">{t('invite.hiddenTitle')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">{t('invite.hiddenBody')}</p>
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          {!auth.isLoggedIn() && (
            <Link
              to="/signup?invited=1"
              onClick={stashTokenForSignup}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold lg:hover:bg-primary/90"
            >
              {t('invite.landingCta')}
            </Link>
          )}
          <Link to="/" className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50">
            {t('invite.browse')}
          </Link>
        </div>
      </div>
    );
  }

  const exhibitionWorks = collectExhibitionWorks(seed, works);
  const exhibitionTitle = displayExhibitionTitle(seed, t('work.exhibitionFallback'));
  const coverKey = getCoverImage(seed.image, seed.coverImageIndex);
  const coverSrc = imageUrls[coverKey] || coverKey;
  const inviterName = seed.artist.name;
  const isInviteFlow = tokenInfo.status === 'active' || tokenInfo.status === 'inactive';

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: exhibitionTitle, url });
        return;
      }
    } catch {
      /* 사용자 취소 등 */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('invite.clipboardOk'));
    } catch {
      toast.error(t('invite.clipboardFail'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 전시 헤더 */}
      <header className="relative h-[220px] sm:h-[320px] lg:h-[400px] w-full overflow-hidden">
        <ImageWithFallback src={coverSrc} alt="" className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-8 sm:pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80 mb-2">
            {t('invite.exhibitionLabel')}
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
            {exhibitionTitle}
          </h1>
          {isInviteFlow ? (
            <p className="mt-2 text-sm sm:text-base text-white/80">
              {t('invite.landingHeadline').replace('{inviter}', inviterName)}
            </p>
          ) : (
            <p className="mt-2 text-sm sm:text-base text-white/80">
              {t('invite.inviteByline').replace('{name}', inviterName)}
            </p>
          )}
          {tokenInfo.status === 'inactive' && (
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/50 px-3 py-1 text-xs font-medium text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {t('invite.tokenInactive')}
            </div>
          )}
          {tokenInfo.status !== 'inactive' && seed.feedReviewStatus === 'pending' && (
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/50 px-3 py-1 text-xs font-medium text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {t('review.badgePending')} · {t('invite.pendingNotice')}
            </div>
          )}
        </div>
      </header>

      {/* 작품 갤러리 그리드 */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {exhibitionWorks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20">{t('invite.invalid')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {exhibitionWorks.map((w) => {
              const firstImage = getCoverImage(w.image, w.coverImageIndex);
              const count = getImageCount(w.image);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => navigate(`/exhibitions/${w.id}`)}
                  className="group text-left"
                >
                  <div className="relative aspect-square bg-muted/30 rounded-xl overflow-hidden border border-border">
                    <ImageWithFallback
                      src={imageUrls[firstImage] || firstImage}
                      alt={displayProminentHeadline(w, t('work.untitled'))}
                      className="w-full h-full object-contain hover-scale"
                    />
                    {count > 1 && (
                      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                        {count}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-semibold leading-tight text-white">
                        {displayProminentHeadline(w, t('work.untitled'))}
                      </p>
                      <p className="text-xs text-white/80">{w.artist.name}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 비로그인 가입 유도 배너 */}
      {!auth.isLoggedIn() && (
        <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-muted/30 to-muted/10 p-6 sm:p-8 text-center">
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-6 max-w-xl mx-auto">
              {isInviteFlow
                ? t('invite.landingHeadline').replace('{inviter}', inviterName)
                : t('workDetail.inspireCtaBody').replace('{artist}', inviterName)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/signup?invited=1"
                onClick={stashTokenForSignup}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold lg:hover:bg-primary/90"
              >
                {isInviteFlow ? t('invite.landingCta') : t('workDetail.inspireCtaButton')}
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50"
              >
                {isInviteFlow ? t('invite.landingBrowse') : t('invite.browse')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 재공유 버튼 */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-16 flex justify-center">
        <Button
          type="button"
          onClick={share}
          variant="outline"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          <Share2 className="h-4 w-4" />
          {t('invite.share')}
        </Button>
      </div>
    </div>
  );
}
