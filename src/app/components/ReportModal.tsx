import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
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

/**
 * Policy §12.0: 신고 사유는 단일 카테고리("이 작품은 작가 본인의 그림이 아니에요")로 단순화.
 * 부적절·스팸 등은 검수 단계 + 운영팀 직권 등록 채널로 처리.
 */
const REPORT_REASON_KEY: MessageKey = 'report.reasonHeading';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'work';
  targetName: string;
  targetId?: string;
  /** 다중 이미지 전시면 사용자가 신고 대상 작품을 선택. 단일 이미지면 자동 0번 선택. */
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
  /** 단일 이미지 전시면 자동 0, 다중이면 사용자가 선택할 때까지 null. */
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
      // 단일 이미지면 자동 선택
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
    if (!authStore.isLoggedIn()) {
      toast.error(t('loginPrompt.report'));
      return;
    }
    if (requiresPieceSelection && selectedPiece === null) {
      toast.error(t('report.errPieceRequired'));
      return;
    }
    // 탈퇴 작가의 작품·프로필에는 신고 불가(Policy §4.2).
    if (targetId) {
      const targetWork = workStore.getWork(targetId);
      if (targetWork && withdrawnArtistStore.isWithdrawn(targetWork.artistId)) {
        toast.error(t('report.errWithdrawnArtist'));
        return;
      }
      // 본인 작품 신고 차단.
      const me = artists[0];
      if (targetWork && me && targetWork.artistId === me.id) {
        toast.error(t('report.errOwnWork'));
        return;
      }
      // pieceIndex 바운드 검증 — 모달 열림 후 이미지 배열이 줄어들었을 수 있음.
      if (typeof selectedPiece === 'number' && targetWork) {
        const imageCount = Array.isArray(targetWork.image) ? targetWork.image.length : (targetWork.image ? 1 : 0);
        if (selectedPiece < 0 || selectedPiece >= imageCount) {
          toast.error(t('report.errPieceRequired'));
          setSelectedPiece(null);
          return;
        }
      }
    }
    if (hasAlreadyReported(targetType, targetId)) {
      toast.error(t('report.toastDuplicate'));
      return;
    }

    const reasonText = t(REPORT_REASON_KEY);
    appendUserReport({
      id: `report-${Date.now()}`,
      targetType,
      targetId,
      targetName,
      reason: reasonText,
      reasonKey: REPORT_REASON_KEY,
      reasonLabel: reasonText,
      detail: detail.trim(),
      pieceIndex: selectedPiece ?? undefined,
      createdAt: new Date().toISOString(),
    });

    markSignatureReported(targetType, targetId);
    addHiddenForReporter(targetType, targetId);

    toast.success(t('report.toastSuccess'));
    onReported?.();
    setPhase('done');

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      handleClose();
    }, 2000);
  };

  const lead = t('report.leadWork').replace('{name}', targetName);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[460px] z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        <DialogHeader className="items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 mb-2">
            <Flag className="h-7 w-7 text-red-500" />
          </div>
          <DialogTitle className="text-center text-lg">
            {t('report.titleWork')}
          </DialogTitle>
          <DialogDescription className="text-center space-y-1">
            <span className="font-medium text-foreground">{lead}</span>
            <span className="block text-xs text-muted-foreground mt-2">{t('report.policyNote')}</span>
          </DialogDescription>
        </DialogHeader>

        {phase === 'done' ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-lg font-semibold text-foreground">{t('report.step2Title')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed px-1">{t('report.step2Body')}</p>
            <Button
              type="button"
              onClick={handleClose}
              className="w-full text-sm py-3 bg-red-500 lg:hover:bg-red-600 text-white"
            >
              {t('report.okClose')}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3.5">
                <p className="text-sm font-semibold text-foreground">{t('report.reasonHeading')}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t('report.reasonHelp')}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed -mt-2">{t('report.otherReasonsHint')}</p>

              {requiresPieceSelection && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t('report.piecePickerLabel')}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {pieceImages!.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPiece(idx)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 min-h-[44px] transition-colors ${
                          selectedPiece === idx ? 'border-red-500 ring-2 ring-red-300' : 'border-border lg:hover:border-zinc-300'
                        }`}
                        aria-label={t('report.piecePickerAria').replace('{n}', String(idx + 1))}
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

              <textarea
                value={detail}
                onChange={(e) => { if (e.target.value.length <= 200) setDetail(e.target.value); }}
                placeholder={t('report.detailPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-red-300 focus:border-transparent resize-none"
              />
              <div className="text-right text-xs text-muted-foreground">{detail.length}/200</div>

              <p className="text-xs text-muted-foreground leading-relaxed">{t('report.falseReportNotice')}</p>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={requiresPieceSelection && selectedPiece === null}
                className="w-full text-sm py-3 bg-red-500 lg:hover:bg-red-600 text-white"
              >
                {t('report.submit')}
              </Button>
              <Button type="button" variant="ghost" onClick={handleClose} className="w-full text-sm">
                {t('loginPrompt.cancel')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
