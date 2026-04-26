import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
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
  /** 다중 이미지 전시면 사용자가 문의 대상 작품을 선택. 단일 이미지면 자동 0번. */
  pieceImages?: string[];
}

/**
 * 작품 단위 운영팀 문의 모달 (Policy §33).
 * - 운영팀 큐 ADM-INQ-01의 "작품 문의" 카테고리로 적재.
 * - 작가에게 자동 전달되지 않음(시니어 작가 보호).
 * - 카테고리 분포로 Phase 2 BM 가설 검증.
 */
export function WorkInquiryModal({
  open,
  onClose,
  workId,
  workTitle,
  pieceImages,
}: WorkInquiryModalProps) {
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
    if (!selectedKey) {
      toast.error(t('workInquiry.errCategory'));
      return;
    }
    if (requiresPieceSelection && selectedPiece === null) {
      toast.error(t('workInquiry.errPieceRequired'));
      return;
    }
    const profile = profileStore.getProfile();
    try {
      const list = JSON.parse(localStorage.getItem('artier_inquiries') || '[]');
      list.push({
        id: `inq-${Date.now()}`,
        name: profile.nickname || profile.name || '',
        email: profile.email || '',
        category: 'workInquiry',
        categoryDetail: selectedKey,
        workId,
        workTitle,
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
      <DialogContent className="sm:max-w-[480px] z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        <DialogHeader className="items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">{t('workInquiry.title')}</DialogTitle>
          <DialogDescription className="text-center space-y-1">
            <span className="font-medium text-foreground">{workTitle}</span>
            <span className="block text-xs text-muted-foreground mt-2">{t('workInquiry.lead')}</span>
          </DialogDescription>
        </DialogHeader>

        {!authStore.isLoggedIn() ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('loginPrompt.general')}
          </div>
        ) : (
          <>
            {requiresPieceSelection && (
              <div className="mt-2">
                <p className="text-sm font-medium text-foreground mb-2">{t('workInquiry.piecePickerLabel')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {pieceImages!.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPiece(idx)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 min-h-[44px] transition-colors ${
                        selectedPiece === idx ? 'border-primary ring-2 ring-primary/30' : 'border-border lg:hover:border-zinc-300'
                      }`}
                      aria-label={t('workInquiry.piecePickerAria').replace('{n}', String(idx + 1))}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold py-0.5 text-center">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mt-3">
              {INQUIRY_CATEGORY_KEYS.map((key) => {
                const hintKey = `${key}Hint` as MessageKey;
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedKey === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border lg:hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="work-inquiry-category"
                      value={key}
                      checked={selectedKey === key}
                      onChange={() => setSelectedKey(key)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">{t(key)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">{t(hintKey)}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <textarea
              value={message}
              onChange={(e) => { if (e.target.value.length <= 200) setMessage(e.target.value); }}
              placeholder={t('workInquiry.detailPlaceholder')}
              rows={3}
              className="mt-3 w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/30 focus:border-transparent resize-none"
            />
            <div className="text-right text-xs text-muted-foreground">{message.length}/200</div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
              <Button
                type="button"
                onClick={handleSubmit}
                className="w-full text-sm py-3"
                disabled={!selectedKey || (requiresPieceSelection && selectedPiece === null)}
              >
                {t('workInquiry.submit')}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="w-full text-sm">
                {t('loginPrompt.cancel')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WorkInquiryModal;
