// src/app/components/upload/Step4Submit.tsx
import React from 'react';
import { Monitor, X, Plus, Star } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { RequiredMark } from '../RequiredMark';
import { ImageWithFallback } from '../ImageWithFallback';
import type { ContentItem } from './types';

interface Props {
  contents: ContentItem[];
  uploadType: 'solo' | 'group';
  coverImageIndex: number;
  setCoverImageIndex: (i: number) => void;
  customCoverUrl: string | null;
  setCustomCoverUrl: (url: string | null) => void;
  coverFileInputRef: React.RefObject<HTMLInputElement | null>;
  isOriginalWork: boolean;
  setIsOriginalWork: (v: boolean) => void;
  consentCuration: boolean;
  setConsentCuration: (v: boolean) => void;
  isPublishing: boolean;
  editingWorkId: string | null;
  editingRejectedWork: { rejectionReason?: string } | null;
  onPublish: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
}

export function Step4Submit({
  contents,
  uploadType,
  coverImageIndex,
  setCoverImageIndex,
  customCoverUrl,
  setCustomCoverUrl,
  coverFileInputRef,
  isOriginalWork,
  setIsOriginalWork,
  consentCuration,
  setConsentCuration,
  isPublishing,
  editingWorkId,
  editingRejectedWork,
  onPublish,
  onBack,
  onSaveDraft,
  onPreview,
}: Props) {
  const { t } = useI18n();

  const validContents = contents.filter((c) => c.url);

  const confirmLabel =
    uploadType === 'group' ? t('upload.confirmStudent') : t('upload.confirmOriginal');

  const publishLabel = isPublishing
    ? t('upload.editModeSaving')
    : editingRejectedWork
    ? t('review.editCtaResubmit')
    : editingWorkId
    ? t('upload.editModeSave')
    : t('upload.publish');

  const isPublishDisabled = isPublishing || !isOriginalWork;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Header */}
      <span className="inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
        {uploadType === 'group' ? t('upload.typeGroup') : t('upload.typeSolo')}
      </span>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step4Title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('upload.step4Subtitle')}</p>

      {/* 2. Cover image selection */}
      <section className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-3">{t('upload.coverSectionTitle')}</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* 커스텀 커버 (파일 업로드) */}
          {customCoverUrl && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCoverImageIndex(-1)}
                className={`relative shrink-0 flex w-16 h-16 items-center justify-center rounded-lg overflow-hidden bg-muted/30 transition-all min-h-[44px] ${
                  coverImageIndex === -1
                    ? 'ring-2 ring-primary ring-offset-2 shadow-md'
                    : 'border-2 border-border/50 opacity-70 hover:opacity-100'
                }`}
                aria-label={t('upload.customCoverLabel')}
              >
                <img src={customCoverUrl} alt="" className="w-full h-full object-cover" />
                {coverImageIndex === -1 && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="bg-primary text-white rounded-full p-0.5">
                      <Star className="h-2.5 w-2.5 fill-white" />
                    </div>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setCustomCoverUrl(null); setCoverImageIndex(0); }}
                aria-label={t('upload.customCoverRemove')}
                className="absolute -top-3 -right-3 z-10 h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <span className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                  <X className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          )}
          {/* 작품 썸네일 */}
          {validContents.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCoverImageIndex(i)}
              className={`relative shrink-0 flex w-16 h-16 items-center justify-center rounded-lg overflow-hidden bg-muted/30 transition-all min-h-[44px] ${
                coverImageIndex === i
                  ? 'ring-2 ring-primary ring-offset-2 shadow-md'
                  : 'border-2 border-border/50 opacity-70 hover:opacity-100'
              }`}
            >
              <ImageWithFallback src={c.url!} alt={c.title || `${i + 1}`} className="w-full h-full object-contain object-center" />
              {coverImageIndex === i && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="bg-primary text-white rounded-full p-0.5">
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
          {/* + 버튼 (별도 파일 업로드) */}
          <button
            type="button"
            onClick={() => coverFileInputRef.current?.click()}
            className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[44px]"
            aria-label={t('upload.coverUpload')}
          >
            <Plus className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight">{t('upload.coverUpload')}</span>
          </button>
        </div>
      </section>

      {/* 3. Consent checkboxes */}
      <section className="mb-6 flex flex-col gap-3">
        {/* Required — original work / student consent */}
        <label
          className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 cursor-pointer min-h-[44px]"
        >
          <input
            type="checkbox"
            checked={isOriginalWork}
            onChange={(e) => setIsOriginalWork(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
          />
          <span className="text-sm text-foreground leading-snug">
            {confirmLabel}
            <RequiredMark />
          </span>
        </label>

        {/* 선택 (사전 체크) — curation consent */}
        <label
          className="flex items-start gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 cursor-pointer min-h-[44px]"
        >
          <input
            type="checkbox"
            checked={consentCuration}
            onChange={(e) => setConsentCuration(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
          />
          <span className="text-sm text-foreground leading-snug">
            {t('upload.consentCurationLabel')}
          </span>
        </label>
      </section>

      {/* 4. Review info box */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm font-semibold text-foreground mb-2">{t('upload.reviewInfoTitle')}</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li className="text-xs text-muted-foreground">{t('upload.reviewInfoTimeline')}</li>
          <li className="text-xs text-muted-foreground">{t('upload.reviewInfoEditImg')}</li>
          <li className="text-xs text-muted-foreground">{t('upload.reviewInfoReject')}</li>
        </ul>
      </section>

      {/* 5. Bottom buttons */}
      <div className="flex flex-col gap-3">
        {/* Primary — publish */}
        <Button
          disabled={isPublishDisabled}
          onClick={onPublish}
          className={`w-full py-6 text-base font-bold rounded-2xl min-h-[44px] ${
            !isPublishDisabled ? 'bg-foreground text-background hover:bg-foreground/90' : ''
          }`}
        >
          {publishLabel}
        </Button>

        {/* Hint text when original work not checked */}
        {!isOriginalWork && (
          <p className="text-xs text-red-500 text-center">
            {t(uploadType === 'group' ? 'upload.hintCheckConsent' : 'upload.hintCheckOriginal')}
          </p>
        )}

        {/* Secondary row */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 min-h-[44px]"
          >
            {t('upload.wizardBack')}
          </Button>
          <Button
            variant="outline"
            onClick={onSaveDraft}
            className="flex-1 min-h-[44px]"
          >
            {t('upload.saveDraft')}
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            className="flex-1 min-h-[44px] gap-1"
          >
            <Monitor className="h-4 w-4" />
            {t('upload.screenPreview')}
          </Button>
        </div>
      </div>
    </div>
  );
}
