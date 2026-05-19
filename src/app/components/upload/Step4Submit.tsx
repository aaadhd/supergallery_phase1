// src/app/components/upload/Step4Submit.tsx
import React from 'react';
import { Monitor, X } from 'lucide-react';
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

  let publishLabel: string;
  if (isPublishing && editingWorkId) {
    publishLabel = t('upload.editModeSaving');
  } else if (isPublishing && !editingWorkId) {
    publishLabel = t('upload.publishing');
  } else if (editingRejectedWork) {
    publishLabel = t('review.editCtaResubmit');
  } else if (editingWorkId) {
    publishLabel = t('upload.editModeSave');
  } else {
    publishLabel = t('upload.publish');
  }

  const isPublishDisabled = isPublishing || !isOriginalWork;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 1. Header */}
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step4Title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('upload.step4Subtitle')}</p>

      {/* 2. Cover image selection */}
      <section className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-3">{t('upload.coverSectionTitle')}</p>

        {/* Thumbnail row */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {validContents.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCoverImageIndex(i);
                setCustomCoverUrl(null);
              }}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all min-h-[44px] ${
                coverImageIndex === i && !customCoverUrl
                  ? 'border-blue-500 ring-2 ring-blue-400'
                  : 'border-border/40 hover:border-border'
              }`}
              aria-label={`${i + 1}`}
            >
              {c.url && (
                <ImageWithFallback
                  src={c.url}
                  alt={c.title || `${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Custom cover */}
        {customCoverUrl ? (
          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border/40">
            <ImageWithFallback
              src={customCoverUrl}
              alt={t('upload.coverSectionTitle')}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setCustomCoverUrl(null);
                setCoverImageIndex(0);
              }}
              className="absolute top-1 right-1 min-h-[44px] min-w-[44px] flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
              aria-label={t('upload.close') as string}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverFileInputRef.current?.click()}
            className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-sm text-muted-foreground font-medium transition-all px-4 py-3"
          >
            {t('upload.coverUpload')}
          </button>
        )}
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

        {/* Optional — curation consent */}
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
          <p className="text-xs text-red-500 text-center">{t('upload.hintCheckOriginal')}</p>
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
            variant="ghost"
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
