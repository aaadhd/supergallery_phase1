import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { authStore, workStore, withdrawnArtistStore } from '../store';
import { artists } from '../data';
import {
  addHiddenForReporter,
  hasAlreadyReported,
  markSignatureReported,
} from '../utils/reportStorage';
import { appendUserReport } from '../utils/reportsStore';

const REPORT_REASON_KEY: MessageKey = 'report.reasonHeading';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'work';
  targetName: string;
  targetId?: string;
  pieceImages?: string[];
  onReported?: () => void;
}

export function ReportModal({
  open,
  onClose,
  targetType,
  targetName,
  targetId,
  pieceImages,
  onReported,
}: ReportModalProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'form' | 'done'>('form');
  const [detail, setDetail] = useState('');
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPieces = pieceImages?.length ?? 0;
  const requiresPieceSelection = totalPieces > 1;

  useEffect(() => {
    if (!open) {
      setPhase('form');
      setDetail('');
      setSelectedPiece(null);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    } else {
      setSelectedPiece(requiresPieceSelection ? null : 0);
    }
  }, [open, requiresPieceSelection]);

  const handleClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!authStore.isLoggedIn()) { toast.error(t('loginPrompt.report')); return; }
    if (requiresPieceSelection && selectedPiece === null) { toast.error(t('report.errPieceRequired')); return; }
    if (targetId) {
      const targetWork = workStore.getWork(targetId);
      if (targetWork && withdrawnArtistStore.isWithdrawn(targetWork.artistId)) { toast.error(t('report.errWithdrawnArtist')); return; }
      const me = artists[0];
      if (targetWork && me && targetWork.artistId === me.id) { toast.error(t('report.errOwnWork')); return; }
      if (typeof selectedPiece === 'number' && targetWork) {
        const imageCount = Array.isArray(targetWork.image) ? targetWork.image.length : (targetWork.image ? 1 : 0);
        if (selectedPiece < 0 || selectedPiece >= imageCount) { toast.error(t('report.errPieceRequired')); setSelectedPiece(null); return; }
      }
    }
    if (hasAlreadyReported(targetType, targetId)) { toast.error(t('report.toastDuplicate')); return; }

    const reasonText = t(REPORT_REASON_KEY);
    appendUserReport({
      id: `report-${Date.now()}`,
      targetType, targetId, targetName,
      reason: reasonText, reasonKey: REPORT_REASON_KEY, reasonLabel: reasonText,
      detail: detail.trim(),
      pieceIndex: selectedPiece ?? undefined,
      createdAt: new Date().toISOString(),
    });
    markSignatureReported(targetType, targetId);
    addHiddenForReporter(targetType, targetId);
    toast.success(t('report.toastSuccess'));
    onReported?.();
    setPhase('done');
    closeTimerRef.current = setTimeout(() => { closeTimerRef.current = null; handleClose(); }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        {/* 헤더 */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Flag className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base font-bold leading-tight">{t('report.titleWork')}</DialogTitle>
            <p className="text-xs text-muted-foreground truncate">{targetName}</p>
          </div>
        </div>

        {phase === 'done' ? (
          <div className="px-5 py-8 text-center space-y-2">
            <p className="font-semibold text-foreground">{t('report.step2Title')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('report.step2Body')}</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              {/* 신고 사유 */}
              <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
                <p className="text-sm font-medium text-foreground">{t('report.reasonHeading')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{t('report.reasonHelp')}</p>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">{t('report.otherReasonsHint')}</p>

              {/* 작품(piece) 선택 */}
              {requiresPieceSelection && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t('report.piecePickerLabel')}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {pieceImages!.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPiece(idx)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedPiece === idx ? 'border-red-500 ring-2 ring-red-200' : 'border-border lg:hover:border-zinc-300'
                        }`}
                        aria-label={t('report.piecePickerAria').replace('{n}', String(idx + 1))}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold py-0.5 text-center">{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 추가 설명 */}
              <textarea
                value={detail}
                onChange={(e) => { if (e.target.value.length <= 200) setDetail(e.target.value); }}
                placeholder={t('report.detailPlaceholder')}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
              <p className="text-right text-xs text-muted-foreground -mt-2">{detail.length}/200</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('report.falseReportNotice')}</p>
            </div>

            {/* 푸터 */}
            <div className="px-5 pb-5 flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm text-foreground lg:hover:bg-muted/40"
              >
                {t('loginPrompt.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={requiresPieceSelection && selectedPiece === null}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium lg:hover:bg-red-600 disabled:opacity-50"
              >
                {t('report.submit')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
