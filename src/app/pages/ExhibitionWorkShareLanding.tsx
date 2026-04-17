import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkStore, useAuthStore } from '../store';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { Button } from '../components/ui/button';
import { getCoverImage, getImageCount, getThumbCover } from '../utils/imageHelper';
import { displayExhibitionTitle, displayProminentHeadline } from '../utils/workDisplay';
import { useI18n } from '../i18n/I18nProvider';

/**
 * 작품 단위 공유 링크 (`/exhibitions/:workId?from=work`).
 * 한 링크 = 이 작품(Work) 한 점만 — 같은 전시의 다른 작품은 노출하지 않음.
 * (전시 단위 `?from=invite` 와 구분)
 */
export default function ExhibitionWorkShareLanding() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const auth = useAuthStore();
  const store = useWorkStore();
  const works = store.getWorks();
  const work = useMemo(() => works.find((w) => w.id === id), [works, id]);

  if (!work) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground text-center">{t('invite.invalid')}</p>
        <Link to="/" className="mt-4 text-sm font-medium text-primary lg:hover:underline">
          {t('invite.browse')}
        </Link>
      </div>
    );
  }

  const pieceTitle = displayProminentHeadline(work, t('work.untitled'));
  const exhibitionTitle = displayExhibitionTitle(work, t('work.exhibitionFallback'));
  const coverKey = getThumbCover(work);
  const coverSrc = imageUrls[coverKey] || coverKey;
  const imgCount = getImageCount(work.image);
  const creatorName = work.artist.name;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: pieceTitle, url });
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
      <header className="relative h-[220px] sm:h-[320px] lg:h-[400px] w-full overflow-hidden">
        <ImageWithFallback src={coverSrc} alt="" className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-8 sm:pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80 mb-2">
            {t('invite.workShareKicker')}
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
            {pieceTitle}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/85 font-medium">{creatorName}</p>
          <p className="mt-1 text-sm text-white/75">
            {t('invite.workShareExhibitionLine').replace('{title}', exhibitionTitle)}
          </p>
          {work.feedReviewStatus === 'pending' && (
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/50 px-3 py-1 text-xs font-medium text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {t('review.badgePending')} · {t('invite.pendingNotice')}
            </div>
          )}
        </div>
      </header>

      <section className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="relative rounded-2xl border border-border bg-muted/20 overflow-hidden">
          <div className="relative aspect-square max-h-[min(72vh,560px)] mx-auto bg-muted/30">
            <ImageWithFallback
              src={coverSrc}
              alt={pieceTitle}
              className="w-full h-full object-contain"
            />
            {imgCount > 1 && (
              <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-medium text-white">
                {imgCount}
              </div>
            )}
          </div>
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            {t('invite.workShareSingleHint')}
          </p>
        </div>
      </section>

      {!auth.isLoggedIn() && (
        <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-muted/30 to-muted/10 p-6 sm:p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              {t('workDetail.inspireCtaTitle')}
            </p>
            <p className="text-base sm:text-lg text-foreground leading-relaxed mb-6 max-w-xl mx-auto">
              {t('workDetail.inspireCtaBody').replace('{artist}', creatorName)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/signup"
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

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-16 flex justify-center gap-3 flex-wrap">
        <Button
          type="button"
          onClick={() => navigate(`/exhibitions/${work.id}`)}
          variant="secondary"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          {t('invite.workShareOpenInApp')}
        </Button>
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
