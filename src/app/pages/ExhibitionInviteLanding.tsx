import { useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkStore, useAuthStore } from '../store';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { Button } from '../components/ui/button';
import { getCoverImage, getImageCount } from '../utils/imageHelper';
import { displayExhibitionTitle, displayProminentHeadline } from '../utils/workDisplay';
import { useI18n } from '../i18n/I18nProvider';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import type { Work } from '../data';

/**
 * 전시 단위 링크 오픈 화면 (`?from=invite` | `?from=credited`).
 * - `invite`: 한 전시(동일 전시명·그룹) 맥락의 작품 그리드 — 링크 하나에 여러 전시를 묶지 않음.
 * - `credited`: 비회원 작가 알림.
 * 작품 한 점만 공유할 때는 `?from=work` → ExhibitionWorkShareLanding.
 */
function firstNonMemberDisplayName(seed: Work): string | null {
  const list = seed.imageArtists;
  if (!list?.length) return null;
  for (const a of list) {
    if (a.type === 'non-member' && a.displayName?.trim()) return a.displayName.trim();
  }
  return null;
}

function collectExhibitionWorks(seed: Work, all: Work[]): Work[] {
  const ex = seed.exhibitionName?.trim();
  const gn = seed.groupName?.trim();
  // seed 작품은 검수 상태와 무관하게 항상 포함 (공유한 본인의 작품이므로).
  // 같은 전시의 다른 작품은 검수 통과된 것만 공개 노출.
  const pool = all.filter((w) => w.id === seed.id || isWorkVisibleOnPublicFeed(w));
  const matches = pool.filter((w) => {
    if (w.id === seed.id) return true;
    if (ex && w.exhibitionName?.trim() === ex) return true;
    if (gn && w.groupName?.trim() === gn && seed.primaryExhibitionType === 'group' && w.primaryExhibitionType === 'group') return true;
    return false;
  });
  // seed을 맨 앞으로
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
  const variant = searchParams.get('from') === 'credited' ? 'credited' : 'share';
  const navigate = useNavigate();
  const { t } = useI18n();
  const auth = useAuthStore();
  const store = useWorkStore();
  const works = store.getWorks();
  const seed = useMemo(() => works.find((w) => w.id === id), [works, id]);

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

  // 자동·확정 비공개 전시 (Policy §3.3 · §12.2) — 본문 비노출, 가입 CTA 유지
  if (seed.isHidden === true) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">{t('invite.hiddenTitle')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">{t('invite.hiddenBody')}</p>
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          {!auth.isLoggedIn() && (
            <Link
              to="/signup?invited=1"
              onClick={() => {
                try {
                  localStorage.setItem('artier_pending_sms_invite', '1');
                  const invitedPhone = searchParams.get('invited_phone');
                  const invitedName = searchParams.get('invited_name');
                  if (invitedPhone) localStorage.setItem('artier_pending_signup_phone', invitedPhone);
                  if (invitedName) localStorage.setItem('artier_pending_signup_realname', invitedName);
                } catch { /* ignore */ }
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold lg:hover:bg-primary/90"
            >
              {t('workDetail.inspireCtaButton')}
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
  const creatorName = seed.artist.name;
  const creditedName = firstNonMemberDisplayName(seed);

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
          {variant === 'share' ? (
            <>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80 mb-2">
                {t('invite.exhibitionLabel')}
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
                {exhibitionTitle}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/80">
                {t('invite.inviteByline').replace('{name}', creatorName)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80 mb-2">
                {t('invite.creditedKicker')}
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
                {creditedName
                  ? t('invite.creditedHeadlineNamed').replace('{name}', creditedName)
                  : t('invite.creditedHeadline')}
              </h1>
              <p className="mt-3 text-lg sm:text-xl font-semibold text-white/95 max-w-3xl">
                {t('invite.creditedExhibitionLine').replace('{title}', exhibitionTitle)}
              </p>
              <p className="mt-2 text-sm sm:text-base text-white/80">
                {t('invite.creditedByline').replace('{uploader}', creatorName)}
              </p>
            </>
          )}
          {seed.feedReviewStatus === 'pending' && (
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
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              {variant === 'credited' ? t('invite.creditedCtaTitle') : t('workDetail.inspireCtaTitle')}
            </p>
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-6 max-w-xl mx-auto">
              {variant === 'credited'
                ? t('invite.creditedCtaBody')
                : t('workDetail.inspireCtaBody').replace('{artist}', creatorName)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/signup?invited=1"
                onClick={() => {
                  try {
                    localStorage.setItem('artier_pending_sms_invite', '1');
                    // URL에 실려온 초대 대상 정보 → Onboarding prefill (재입력 방지·매칭 성공률 ↑)
                    const invitedPhone = searchParams.get('invited_phone');
                    const invitedName = searchParams.get('invited_name');
                    if (invitedPhone) localStorage.setItem('artier_pending_signup_phone', invitedPhone);
                    if (invitedName) localStorage.setItem('artier_pending_signup_realname', invitedName);
                  } catch { /* ignore */ }
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold lg:hover:bg-primary/90"
              >
                {t('workDetail.inspireCtaButton')}
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50"
              >
                {t('invite.browse')}
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
          {variant === 'credited' ? t('invite.creditedShare') : t('invite.share')}
        </Button>
      </div>
    </div>
  );
}
