import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Button } from '../components/ui/button';

type FaqCat = 'all' | 'account' | 'upload' | 'exhibition' | 'other';

type FaqRowDef = {
  cat: Exclude<FaqCat, 'all'>;
  q: MessageKey;
  a: MessageKey;
};

const FAQ_ROWS: FaqRowDef[] = [
  { cat: 'account', q: 'faq.q1', a: 'faq.a1' },
  { cat: 'account', q: 'faq.q2', a: 'faq.a2' },
  { cat: 'account', q: 'faq.q3', a: 'faq.a3' },
  { cat: 'upload', q: 'faq.q4', a: 'faq.a4' },
  { cat: 'upload', q: 'faq.q5', a: 'faq.a5' },
  { cat: 'upload', q: 'faq.q6', a: 'faq.a6' },
  { cat: 'exhibition', q: 'faq.q7', a: 'faq.a7' },
  { cat: 'exhibition', q: 'faq.q8', a: 'faq.a8' },
  { cat: 'other', q: 'faq.q9', a: 'faq.a9' },
  { cat: 'other', q: 'faq.q10', a: 'faq.a10' },
];

const CAT_LABEL_KEYS: { id: FaqCat; labelKey: MessageKey }[] = [
  { id: 'all', labelKey: 'faq.catAll' },
  { id: 'account', labelKey: 'faq.catAccount' },
  { id: 'upload', labelKey: 'faq.catUpload' },
  { id: 'exhibition', labelKey: 'faq.catExhibition' },
  { id: 'other', labelKey: 'faq.catOther' },
];

const CAT_KEY_FOR_ROW: Record<FaqRowDef['cat'], MessageKey> = {
  account: 'faq.catAccount',
  upload: 'faq.catUpload',
  exhibition: 'faq.catExhibition',
  other: 'faq.catOther',
};

export default function Faq() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<FaqCat>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = useMemo(
    () =>
      FAQ_ROWS.map((row, index) => ({
        index,
        cat: row.cat,
        categoryLabel: t(CAT_KEY_FOR_ROW[row.cat]),
        q: t(row.q),
        a:
          row.a === 'faq.a10'
            ? t(row.a).replace('{brand}', t('brand.name'))
            : t(row.a),
      })),
    [t],
  );

  const filtered =
    activeCategory === 'all' ? rows : rows.filter(r => r.cat === activeCategory);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <HelpCircle className="h-6 w-6 sm:h-7 sm:h-7 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('faq.title')}</h1>
          </div>
          <p className="text-[13px] sm:text-sm text-muted-foreground">
            {t('faq.contactLead')}{' '}
            <Link to="/contact" className="text-primary lg:hover:underline font-medium">
              {t('faq.contactLink')}
            </Link>
          </p>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
            {CAT_LABEL_KEYS.map(({ id, labelKey }) => (
              <Button
                key={id}
                type="button"
                variant="ghost"
                onClick={() => setActiveCategory(id)}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-colors ${
                  activeCategory === id
                    ? 'bg-foreground text-white lg:hover:bg-foreground/90 lg:hover:text-white'
                    : 'bg-muted text-muted-foreground lg:hover:bg-muted/80 lg:hover:text-foreground'
                }`}
              >
                {t(labelKey)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-5 sm:py-8">
        <div className="space-y-2 sm:space-y-3">
          {filtered.map(item => {
            const isOpen = openId === item.index;
            return (
              <div
                key={item.index}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenId(isOpen ? null : item.index)}
                  className="flex items-center justify-between w-full h-auto p-4 sm:p-5 text-left rounded-none lg:hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="shrink-0 self-start px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[13px] sm:text-sm font-medium text-foreground">{item.q}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 ml-2 sm:ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
                {isOpen ? (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="pl-0 sm:pl-[72px] text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
