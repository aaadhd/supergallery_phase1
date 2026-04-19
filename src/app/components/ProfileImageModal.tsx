import { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';

/** 프로필 이미지 제약 — Policy §20 확정 수치. */
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PROFILE_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type ProfileImageModalProps = {
  open: boolean;
  onClose: () => void;
  currentImage?: string;
  onSave: (imageUrl: string) => void;
};

export default function ProfileImageModal({
  open,
  onClose,
  currentImage,
  onSave,
}: ProfileImageModalProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null | '__default'>(null);

  useEffect(() => {
    if (open) setPreview(null);
  }, [open]);

  if (!open) return null;

  const displayUrl =
    preview === '__default' ? null : preview !== null ? preview : currentImage;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 입력 초기화는 finally에 두어 같은 파일 재선택이 가능하도록 함.
    try {
      if (!file) return;
      // 1) 포맷 검증 (JPG·PNG·WebP·GIF)
      if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(file.type)) {
        toast.error(t('profilePhoto.errFileType'));
        return;
      }
      // 2) 크기 검증 (5MB 이하)
      if (file.size > PROFILE_IMAGE_MAX_BYTES) {
        toast.error(t('profilePhoto.errFileTooBig'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (preview === '__default') {
      onSave('');
    } else if (preview !== null) {
      onSave(preview);
    } else {
      onSave(currentImage ?? '');
    }
    onClose();
  };

  const handleCancel = () => {
    setPreview(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-image-modal-title"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="profile-image-modal-title" className="text-lg font-bold text-foreground">
          {t('profilePhoto.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('profilePhoto.lead')}</p>

        <div className="mt-8 flex justify-center">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
            {displayUrl ? (
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.25} />
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold"
        >
          {t('profilePhoto.change')}
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={() => setPreview('__default')}
          className="mt-3 w-full text-center text-sm font-medium"
        >
          {t('profilePhoto.reset')}
        </Button>

        <div className="mt-8 flex gap-3">
          <Button variant="ghost"
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground lg:hover:bg-muted/50"
          >
            {t('loginPrompt.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition lg:hover:opacity-90"
          >
            {t('profilePhoto.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
