import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { artists, type Work } from '../data';
import { workStore } from '../store';
import { TITLE_FIELD_MAX_LEN } from '../utils/workDisplay';
import { buildVisibilityPatch } from '../utils/workVisibility';
import { todayLocalIso } from '../utils/localDate';
import { containsProfanity } from '../utils/profanityFilter';
import { shouldBlockCameraPhoto } from '../utils/cameraExifBlock';
import { pointsOnWorkPublished } from '../utils/pointsBackground';
import { generatePieceIds } from '../utils/pieceId';

const MIN_SHORT_SIDE = 800;

function checkMinResolution(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(Math.min(img.naturalWidth, img.naturalHeight) >= MIN_SHORT_SIDE);
    img.onerror = () => resolve(true);
    img.src = dataUrl;
  });
}

type EventEntryModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventStartAt?: string;
  eventEndAt?: string;
};

/**
 * USR-EVT-04 응모 모달.
 * Policy §15.5·§25.2 — 새 1장짜리 개인 전시 발행 + 이벤트 연결.
 * - 한 사용자 한 이벤트 한 번 응모(중복 차단).
 * - 작품명 단일 필드(전시명 = 작품명 동일 저장, 시니어 단순화).
 * - 두 동의 체크박스 통과 필수(원작 + 게시 보존).
 */
export function EventEntryModal({ open, onClose, eventId, eventTitle, eventStartAt, eventEndAt }: EventEntryModalProps) {
  const { t } = useI18n();
  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [artworkTitle, setArtworkTitle] = useState('');
  const [isOriginalChecked, setIsOriginalChecked] = useState(false);
  const [eventConsentChecked, setEventConsentChecked] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);

  // 모달이 닫힐 때 입력값 폐기 (USR-EVT-04 AC-07)
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setArtworkTitle('');
      setIsOriginalChecked(false);
      setEventConsentChecked(false);
      setIsPublishing(false);
      setCameraBlocked(false);
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(tn('upload.errFileTooBig', { name: file.name }));
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error(tn('upload.errFileType', { name: file.name }));
      e.target.value = '';
      return;
    }
    try {
      if (await shouldBlockCameraPhoto(file)) {
        setCameraBlocked(true);
        e.target.value = '';
        return;
      }
      setCameraBlocked(false);
      const { convertImageFileToWebpDataUrlIfPossible } = await import('../utils/imageToWebp');
      const url = await convertImageFileToWebpDataUrlIfPossible(file);
      const passRes = await checkMinResolution(url);
      if (!passRes) {
        toast.error(t('upload.errMinShortSide800'));
        e.target.value = '';
        return;
      }
      setImageUrl(url);
    } catch {
      toast.error(tn('upload.errFileRead', { name: file.name }));
    } finally {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    if (!imageUrl) {
      toast.error(t('evt.errEntryImageRequired'));
      return;
    }
    if (!artworkTitle.trim()) {
      toast.error(t('evt.errEntryArtworkRequired'));
      return;
    }
    if (!isOriginalChecked) {
      toast.error(t('upload.errCheckOriginal'));
      return;
    }
    if (containsProfanity(artworkTitle)) {
      toast.error(t('upload.errProfanityExhibitionName'));
      return;
    }
    if (!eventConsentChecked) {
      toast.error(t('upload.errEventConsentRequired'));
      return;
    }

    // 한 사용자 한 이벤트 한 번 응모 (Policy §25.2)
    const currentUser = artists[0];
    const alreadyEntered = workStore.getWorks().some(
      (w) => String(w.linkedEventId) === eventId && w.artistId === currentUser?.id,
    );
    if (alreadyEntered) {
      toast.error(t('evt.errAlreadyEntered'));
      return;
    }

    setIsPublishing(true);
    const finalTitle = artworkTitle.trim().slice(0, TITLE_FIELD_MAX_LEN);
    const autoApprove = !import.meta.env.PROD && import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true';
    const newWork: Work = {
      id: `user-${crypto.randomUUID()}`,
      title: finalTitle,
      image: imageUrl,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      description: '',
      tags: [],
      exhibitionName: finalTitle,
      imagePieceTitles: [finalTitle],
      imagePieceIds: generatePieceIds(1),
      primaryExhibitionType: 'solo',
      imageArtists: [
        { type: 'member', memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar },
      ],
      ...buildVisibilityPatch(autoApprove ? 'public' : 'pending_review'),
      uploadedAt: todayLocalIso(),
      linkedEventId: eventId,
      coverImageIndex: 0,
    };

    try {
      await workStore.addWork(newWork);
      pointsOnWorkPublished(newWork);
      toast.success(t('evt.entrySubmittedToast'));
      onClose();
      navigate(`/events/${eventId}`, { replace: true });
    } catch {
      toast.error('발행 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
      setIsPublishing(false);
    }
  };

  const canSubmit = !!imageUrl && artworkTitle.trim().length > 0 && isOriginalChecked && eventConsentChecked && !isPublishing;
  const dateRange = eventStartAt && eventEndAt ? `${eventStartAt} ~ ${eventEndAt}` : '';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isPublishing) onClose(); }}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tn('evt.entryModalTitle', { eventName: eventTitle })}</DialogTitle>
          {dateRange && <p className="text-xs text-muted-foreground">{dateRange}</p>}
        </DialogHeader>

        <div className="space-y-4">
          {/* 이미지 1장 강제 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/60">
                <img src={imageUrl} alt="응모 작품" className="w-full aspect-square object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label="이미지 제거"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center px-4">{t('evt.entryModalImageHint')}</p>
                <p className="text-[11px] text-muted-foreground">{t('evt.entryHelperSinglePiece')}</p>
              </div>
            )}
            {cameraBlocked && (
              <p className="text-xs text-amber-600 mt-2">{t('upload.cameraBlockTitle')} — {t('upload.cameraBlockDesc')}</p>
            )}
          </div>

          {/* 작품명 */}
          <div className="space-y-1">
            <label htmlFor="evt-entry-artwork" className="text-sm font-medium text-foreground">
              {t('evt.entryModalArtworkLabel')}
              <span className="ml-1 text-xs text-destructive">*</span>
            </label>
            <Input
              id="evt-entry-artwork"
              type="text"
              value={artworkTitle}
              maxLength={TITLE_FIELD_MAX_LEN}
              placeholder={t('evt.entryModalArtworkPlaceholder')}
              onChange={(e) => setArtworkTitle(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
              className="w-full"
            />
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">{artworkTitle.length}/{TITLE_FIELD_MAX_LEN}</span>
            </div>
          </div>

          {/* 원작 확인 */}
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOriginalChecked}
                onChange={(e) => setIsOriginalChecked(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground leading-snug select-none">
                {t('upload.confirmOriginal')}<span className="ml-1 text-xs text-destructive">*</span>
              </span>
            </label>
          </div>

          {/* 응모 동의 */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={eventConsentChecked}
                onChange={(e) => setEventConsentChecked(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-amber-400 text-primary focus:ring-primary"
              />
              <span className="text-sm text-amber-900 leading-snug select-none">
                {t('upload.eventConsentLabel')}<span className="ml-1 text-xs text-destructive">*</span>
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="ghost" onClick={onClose} disabled={isPublishing}>
            {t('evt.entryModalCancel')}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canSubmit}
            className="bg-primary text-white hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Upload className="h-4 w-4 mr-1" />
            {isPublishing ? t('evt.entryModalSubmitting') : t('evt.entryModalSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
