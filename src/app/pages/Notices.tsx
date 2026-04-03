import { Link } from 'react-router-dom';
import { ChevronRight, Megaphone } from 'lucide-react';
import { NOTICES, getNoticeTitle } from '../data/notices';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const CATEGORY_COLORS: Record<string, string> = {
  서비스: 'bg-muted text-muted-foreground',
  이벤트: 'bg-amber-50 text-amber-600',
  정책: 'bg-red-50 text-red-600',
  기타: 'bg-[#F4F4F5] text-gray-600',
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

export default function Notices() {
  const { t, locale } = useI18n();
  const notices = NOTICES;
  const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-[800px] px-6 py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">{t('notices.title')}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t('notices.subtitle').replace('{brand}', t('brand.name'))}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-6 py-6">
        {notices.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('notices.empty')}</h3>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                to={`/notices/${notice.id}`}
                className={`flex items-center gap-4 w-full p-5 rounded-xl text-left transition-colors bg-white lg:hover:bg-[#FAFAFA] ${
                  notice.isPinned ? 'border-2 border-border' : 'border border-[#E5E7EB]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {notice.isPinned ? (
                      <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-bold">
                        {t('notices.pinned')}
                      </span>
                    ) : null}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[notice.category] ?? CATEGORY_COLORS['기타']}`}
                    >
                      {categoryLabel(notice.category, t)}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#18181B] truncate">
                    {getNoticeTitle(notice, locale)}
                  </h3>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(notice.createdAt).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
