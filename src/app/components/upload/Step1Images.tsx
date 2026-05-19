// src/app/components/upload/Step1Images.tsx
import { Monitor, Plus, X, Replace, Trash2, ArrowUpDown } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import type { MessageKey } from '../../i18n/messages';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../ImageWithFallback';
import { openConfirm } from '../ConfirmDialog';
import type { ContentItem } from './types';

interface Props {
  contents: ContentItem[];
  uploadType: 'solo' | 'group';
  editingRejectedWork: { rejectionReason?: string } | null;
  editingWorkId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  replaceFileInputRef: React.RefObject<HTMLInputElement | null>;
  replaceTargetId: string | null;
  setReplaceTargetId: (id: string | null) => void;
  cameraBlockNotice: boolean;
  setCameraBlockNotice: (v: boolean) => void;
  reorderMode: boolean;
  setReorderMode: (v: boolean) => void;
  coverImageIndex: number;
  setCoverImageIndex: React.Dispatch<React.SetStateAction<number>>;
  setContents: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  onNext: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  hasImages: boolean;
  step3NeedsReview: boolean;
  setStep3NeedsReview: (v: boolean) => void;
}

export function Step1Images({
  contents, uploadType, editingRejectedWork, editingWorkId,
  fileInputRef, replaceFileInputRef, replaceTargetId, setReplaceTargetId,
  cameraBlockNotice, setCameraBlockNotice, reorderMode, setReorderMode,
  coverImageIndex, setCoverImageIndex, setContents,
  onNext, onSaveDraft, onPreview, hasImages,
  step3NeedsReview, setStep3NeedsReview,
}: Props) {
  const { t } = useI18n();
  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };
  const validContents = contents.filter((c) => c.url);
  const minImages = uploadType === 'group' ? 2 : 1;
  const canNext = validContents.length >= minImages;

  const handleDelete = async (id: string) => {
    if (!(await openConfirm({ title: t('upload.confirmDeleteImage'), destructive: true, confirmLabel: t('profile.delete') }))) return;
    const removeIdx = contents.findIndex((c) => c.id === id);
    setContents((prev) => prev.filter((c) => c.id !== id));
    setCoverImageIndex((prev) => {
      if (removeIdx < 0) return prev;
      if (prev === removeIdx) return 0;
      if (prev > removeIdx) return Math.max(0, prev - 1);
      return prev;
    });
    setStep3NeedsReview(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 반려 배너 */}
      {editingRejectedWork && (
        <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 leading-relaxed animate-in fade-in duration-500">
          <p className="font-medium">{t('review.editBannerRejected')}</p>
        </div>
      )}

      {/* 수정 모드 이미지 변경 경고 (반려 모드 아닐 때만) */}
      {!editingRejectedWork && editingWorkId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t('upload.editModeImageChangeHint')}
        </div>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step1Title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('upload.step1Subtitle')}</p>

      {/* 드롭존 (이미지 없을 때) */}
      {validContents.length === 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-input bg-white p-12 text-center transition-all hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <p className="mb-2 text-sm font-medium text-foreground">{t('upload.dropzoneTitle')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('upload.dropzoneFormats')}</p>
          <Button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            {t('upload.step1Title')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {validContents.map((c, idx) => (
            <div key={c.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <ImageWithFallback src={c.url!} alt={tn('upload.imageFallback', { n: String(idx + 1) })} className="w-full h-full object-contain" />
              <div className="absolute top-2 left-2 bg-black/60 text-white rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                {idx + 1}
              </div>
              {/* 교체 버튼 */}
              <button
                type="button"
                onClick={() => { setReplaceTargetId(c.id); replaceFileInputRef.current?.click(); }}
                className="absolute bottom-2 left-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                aria-label={t('upload.toolbarReplace')}
              >
                <Replace className="h-4 w-4" />
              </button>
              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="absolute bottom-2 right-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                aria-label={t('upload.toolbarDelete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {validContents.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 min-h-[80px] transition-all"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{validContents.length}/10</span>
            </button>
          )}
        </div>
      )}

      {/* 카메라 사진 차단 안내 */}
      {cameraBlockNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <p className="text-sm text-amber-800 flex-1">{t('upload.cameraBlockDesc')}</p>
            <button
              type="button"
              onClick={() => setCameraBlockNotice(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-400 hover:text-amber-600 shrink-0"
              aria-label={t('upload.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 mt-6">
        <Button
          disabled={!canNext}
          onClick={onNext}
          className={`w-full py-6 text-base font-bold rounded-2xl ${canNext ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
        >
          {t('upload.wizardNext')} →
        </Button>
        {!canNext && validContents.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {uploadType === 'group' ? t('upload.blockerGroupMinImages') : t('upload.blockerImage')}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">
            {t('upload.saveDraft')}
          </Button>
          {hasImages && (
            <Button variant="ghost" onClick={onPreview} className="flex-1 min-h-[44px] gap-1">
              <Monitor className="h-4 w-4" />
              {t('upload.screenPreview')}
            </Button>
          )}
          {validContents.length >= 2 && (
            <Button variant="ghost" onClick={() => setReorderMode(true)} className="flex-1 min-h-[44px] gap-1">
              <ArrowUpDown className="h-4 w-4" />
              {t('upload.reorderGridBtn')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
