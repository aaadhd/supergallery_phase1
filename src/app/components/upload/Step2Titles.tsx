// src/app/components/upload/Step2Titles.tsx
import { Monitor } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { RequiredMark } from '../RequiredMark';
import { TITLE_FIELD_MAX_LEN } from '../../utils/workDisplay';
import type { ContentItem } from './types';
import type { MessageKey } from '../../i18n/messages';

interface Props {
  contents: ContentItem[];
  setContents: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  uploadType: 'solo' | 'group';
  exhibitionName: string;
  setExhibitionName: (v: string) => void;
  groupName: string;
  setGroupName: (v: string) => void;
  groupSuggestions: string[];
  groupSuggestOpen: boolean;
  setGroupSuggestOpen: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  hasImages: boolean;
}

export function Step2Titles({
  contents, setContents, uploadType, exhibitionName, setExhibitionName,
  groupName, setGroupName, groupSuggestions, groupSuggestOpen, setGroupSuggestOpen,
  onNext, onBack, onSaveDraft, onPreview, hasImages,
}: Props) {
  const { t } = useI18n();
  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };

  const validContents = contents.filter((c) => c.url);

  const canNext =
    exhibitionName.trim().length > 0 &&
    (uploadType !== 'group' || groupName.trim().length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <span className="inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
        {uploadType === 'group' ? t('upload.typeGroup') : t('upload.typeSolo')}
      </span>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step2Title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('upload.step2Subtitle')}</p>

      {/* 전시 이름 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t('upload.exhibitionTitlePlaceholder')}<RequiredMark />
        </label>
        <input
          type="text"
          value={exhibitionName}
          onChange={(e) => setExhibitionName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
          placeholder={t('upload.exhibitionTitleExample')}
          maxLength={TITLE_FIELD_MAX_LEN}
          className={`w-full text-xl font-bold border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-0 min-h-[44px] transition-all ${
            !exhibitionName.trim() ? 'border-border/60 focus:border-primary' : 'border-primary/30 focus:border-primary'
          }`}
        />
        <div className="flex justify-between mt-1 px-1">
          <span className={`text-xs font-medium ${!exhibitionName.trim() && validContents.length > 0 ? 'text-red-500' : 'text-transparent'}`}>
            {t('upload.blockerExhibitionTitle')}
          </span>
          <span className="text-xs text-muted-foreground">{exhibitionName.length}/{TITLE_FIELD_MAX_LEN}</span>
        </div>
      </div>

      {/* 그룹 이름 (여러 작가만) */}
      {uploadType === 'group' && (
        <div className="mb-6 relative">
          <label className="block text-sm font-bold text-foreground mb-2">
            {t('upload.groupNamePlaceholder2')}<RequiredMark />
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
            onFocus={() => setGroupSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setGroupSuggestOpen(false), 200)}
            placeholder={t('upload.groupNameExample')}
            maxLength={TITLE_FIELD_MAX_LEN}
            className={`w-full border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-0 min-h-[44px] transition-all ${
              !groupName.trim() && validContents.length > 0 ? 'border-red-300 focus:border-red-400' : 'border-border/60 focus:border-primary'
            }`}
          />
          <div className="flex justify-between mt-1 px-1">
            <span className={`text-xs font-medium ${!groupName.trim() && validContents.length > 0 ? 'text-red-500' : 'text-transparent'}`}>
              {t('upload.blockerGroupName')}
            </span>
            <span className="text-xs text-muted-foreground">{groupName.length}/{TITLE_FIELD_MAX_LEN}</span>
          </div>
          {/* 자동완성 */}
          {groupSuggestOpen && groupSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {groupSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={() => setGroupName(name)}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-muted min-h-[44px]"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 작품별 이름 */}
      {validContents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              {t('upload.pieceTitleLabel')}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{t('upload.labelOptional')}</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-4 border border-border/30">
            💡 {t('upload.pieceTitleNoneHint')}
          </p>
          <div className="flex flex-col gap-3">
            {validContents.map((c, idx) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground border border-border/30">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={c.title || ''}
                    maxLength={TITLE_FIELD_MAX_LEN}
                    onChange={(e) => {
                      const v = e.target.value.slice(0, TITLE_FIELD_MAX_LEN);
                      setContents((prev) => prev.map((item) => item.id === c.id ? { ...item, title: v } : item));
                    }}
                    placeholder={t('upload.pieceTitlePlaceholder')}
                    className="w-full min-h-[44px] px-4 py-3 bg-muted/20 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                  {(c.title || '').length}/{TITLE_FIELD_MAX_LEN}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 mt-8">
        <Button
          disabled={!canNext}
          onClick={onNext}
          className={`w-full py-6 text-base font-bold rounded-2xl ${canNext ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
        >
          {t('upload.wizardNext')} →
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={onBack} className="flex-1 min-h-[44px]">
            {t('upload.wizardBack')}
          </Button>
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">
            {t('upload.saveDraft')}
          </Button>
          {hasImages && (
            <Button variant="outline" onClick={onPreview} className="flex-1 min-h-[44px] gap-1">
              <Monitor className="h-4 w-4" />
              {t('upload.screenPreview')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
