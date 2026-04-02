import { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

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
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        <h2 id="profile-image-modal-title" className="text-lg font-bold text-zinc-900">
          {t('profilePhoto.title')}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t('profilePhoto.lead')}</p>

        <div className="mt-8 flex justify-center">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-50">
            {displayUrl ? (
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-zinc-300" strokeWidth={1.25} />
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

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          {t('profilePhoto.change')}
        </button>

        <button
          type="button"
          onClick={() => setPreview('__default')}
          className="mt-3 w-full text-center text-sm font-medium text-[#6366F1] hover:underline"
        >
          {t('profilePhoto.reset')}
        </button>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {t('loginPrompt.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#6366F1' }}
          >
            {t('profilePhoto.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
