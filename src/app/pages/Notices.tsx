import { Link } from 'react-router-dom';
import { ChevronRight, Megaphone, Pin } from 'lucide-react';
import { noticeStore, useNotices } from '../utils/noticeStore';
import { useI18n } from '../i18n/I18nProvider';

void noticeStore; // 스토어 초기화 보장

export default function Notices() {
  const { t, locale } = useI18n();
  const allNotices = useNotices();
  const notices = allNotices
    .filter((n) => n.status === 'published')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[800px] px-6 py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('notices.title')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('notices.subtitle').replace('{brand}', t('brand.name'))}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-6 py-6">
        {notices.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('notices.empty')}</h3>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                to={`/notices/${notice.id}`}
                className={`flex items-center gap-4 w-full p-5 rounded-xl text-left transition-colors bg-white lg:hover:bg-muted/50 ${
                  notice.isPinned ? 'border-2 border-border' : 'border border-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {notice.isPinned && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Pin className="h-3.5 w-3.5 text-primary" aria-label={t('notices.pinned')} />
                    </div>
                  )}
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                    {locale === 'en' ? (notice.titleEn || notice.title) : notice.title}
                  </h3>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(notice.createdAt).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
