import { Link, useNavigate, useParams } from 'react-router-dom';
import { getNoticeById, getNoticeNeighbors, getNoticeContent, getNoticeTitle } from '../data/notices';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Button } from '../components/ui/button';

const CATEGORY_COLORS: Record<string, string> = {
  서비스: 'bg-muted text-muted-foreground',
  이벤트: 'bg-amber-50 text-amber-600',
  정책: 'bg-red-50 text-destructive',
  기타: 'bg-muted text-muted-foreground',
};

function categoryLabel(cat: string, t: (k: MessageKey) => string): string {
  const keys: Record<string, MessageKey> = {
    서비스: 'notices.categoryService',
    이벤트: 'notices.categoryEvent',
    정책: 'notices.categoryPolicy',
    기타: 'notices.categoryOther',
  };
  const k = keys[cat];
  return k ? t(k) : cat;
}

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';
  const notice = id ? getNoticeById(id) : undefined;
  const { prev, next } = id ? getNoticeNeighbors(id) : { prev: null, next: null };

  if (!notice) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
        <p className="text-muted-foreground mb-6">{t('noticeDetail.notFound')}</p>
        <Link to="/notices" className="text-primary font-medium lg:hover:underline">
          {t('noticeDetail.backList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[800px] px-6 py-8">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/notices')}
            className="text-sm text-muted-foreground lg:hover:text-foreground transition-colors mb-4"
          >
            {t('noticeDetail.back')}
          </Button>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[notice.category] ?? CATEGORY_COLORS['기타']}`}
            >
              {categoryLabel(notice.category, t)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(notice.createdAt).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{getNoticeTitle(notice, locale)}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <div className="bg-white rounded-xl border border-border p-8 mb-8">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {getNoticeContent(notice, locale)}
          </p>
        </div>

        <nav
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border/40"
          aria-label={t('noticeDetail.navA11y')}
        >
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            {prev ? (
              <Link
                to={`/notices/${prev.id}`}
                className="text-primary lg:hover:underline truncate max-w-full"
              >
                {t('noticeDetail.prev').replace('{title}', getNoticeTitle(prev, locale))}
              </Link>
            ) : (
              <span className="text-muted-foreground">{t('noticeDetail.prevNone')}</span>
            )}
            {next ? (
              <Link
                to={`/notices/${next.id}`}
                className="text-primary lg:hover:underline truncate max-w-full sm:text-right sm:ml-auto"
              >
                {t('noticeDetail.next').replace('{title}', getNoticeTitle(next, locale))}
              </Link>
            ) : (
              <span className="text-muted-foreground sm:text-right sm:ml-auto">{t('noticeDetail.nextNone')}</span>
            )}
          </div>
          <Link
            to="/notices"
            className="inline-flex justify-center sm:justify-end text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2.5 min-h-[44px] lg:hover:bg-muted/50 transition-colors"
          >
            {t('noticeDetail.toList')}
          </Link>
        </nav>
      </div>
    </div>
  );
}
