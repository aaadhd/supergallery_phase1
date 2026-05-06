import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { authStore, profileStore } from '../store';

const INQUIRY_CATEGORY_KEYS = [
  'workInquiry.catPurchase',
  'workInquiry.catLicense',
  'workInquiry.catCollab',
  'workInquiry.catInfo',
  'workInquiry.catOther',
] as const satisfies readonly MessageKey[];

interface WorkInquiryModalProps {
  open: boolean;
  onClose: () => void;
  workId: string;
  workTitle: string;
  pieceImages?: string[];
}

export function WorkInquiryModal({ open, onClose, workId, workTitle, pieceImages }: WorkInquiryModalProps) {
  const { t } = useI18n();
  const [selectedKey, setSelectedKey] = useState<MessageKey | ''>('');
  const [message, setMessage] = useState('');
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  const totalPieces = pieceImages?.length ?? 0;
  const requiresPieceSelection = totalPieces > 1;

  useEffect(() => {
    if (!open) {
      setSelectedKey('');
      setMessage('');
      setSelectedPiece(null);
    } else {
      setSelectedPiece(requiresPieceSelection ? null : 0);
    }
  }, [open, requiresPieceSelection]);

  const handleSubmit = () => {
    if (!selectedKey) { toast.error(t('workInquiry.errCategory')); return; }
    if (requiresPieceSelection && selectedPiece === null) { toast.error(t('workInquiry.errPieceRequired')); return; }
    const profile = profileStore.getProfile();
    try {
      const list = JSON.parse(localStorage.getItem('artier_inquiries') || '[]');
      list.push({
        id: `inq-${Date.now()}`,
        name: profile.nickname || profile.name || '',
        email: profile.email || '',
        category: 'workInquiry',
        categoryDetail: selectedKey,
        workId, workTitle,
        pieceIndex: selectedPiece ?? undefined,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('artier_inquiries', JSON.stringify(list));
    } catch { /* ignore */ }
    toast.success(t('workInquiry.toastSubmitted'));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">{t('workInquiry.title')}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{workTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('workInquiry.lead')}</p>
        </div>

        {!authStore.isLoggedIn() ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">{t('loginPrompt.general')}</div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-3">
              {/* piece 선택 */}
              {requiresPieceSelection && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t('workInquiry.piecePickerLabel')}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {pieceImages!.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPiece(idx)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedPiece === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border lg:hover:border-zinc-300'
                        }`}
                        aria-label={t('workInquiry.piecePickerAria').replace('{n}', String(idx + 1))}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold py-0.5 text-center">{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 카테고리 선택 — 심플 라디오 리스트 */}
              <div className="space-y-1">
                {INQUIRY_CATEGORY_KEYS.map((key) => {
                  const hintKey = `${key}Hint` as MessageKey;
                  const isSelected = selectedKey === key;
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border lg:hover:bg-muted/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="work-inquiry-category"
                        value={key}
                        checked={isSelected}
                        onChange={() => setSelectedKey(key)}
                        className="mt-0.5 h-3.5 w-3.5 accent-primary shrink-0"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground leading-tight">{t(key)}</span>
                        <span className="block text-xs text-muted-foreground leading-snug mt-0.5">{t(hintKey)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* 메시지 */}
              <textarea
                value={message}
                onChange={(e) => { if (e.target.value.length <= 200) setMessage(e.target.value); }}
                placeholder={t('workInquiry.detailPlaceholder')}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
              />
              <p className="text-right text-xs text-muted-foreground -mt-1">{message.length}/200</p>
            </div>

            {/* 푸터 */}
            <div className="px-5 pb-5 flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm text-foreground lg:hover:bg-muted/40"
              >
                {t('loginPrompt.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedKey || (requiresPieceSelection && selectedPiece === null)}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {t('workInquiry.submit')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WorkInquiryModal;
