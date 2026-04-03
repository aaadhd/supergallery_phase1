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
import { authStore } from '../store';
import {
  addHiddenForReporter,
  hasAlreadyReported,
  markSignatureReported,
} from '../utils/reportStorage';
import { appendUserReport } from '../utils/reportsStore';

const REPORT_REASON_KEYS = [
  'report.reasonCopyright',
  'report.reasonInappropriate',
  'report.reasonSpam',
  'report.reasonMisleading',
  'report.reasonOther',
] as const satisfies readonly MessageKey[];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'work' | 'artist';
  targetName: string;
  targetId?: string;
  onReported?: () => void;
}

export function ReportModal({
  open,
  onClose,
  targetType,
  targetName,
  targetId,
  onReported,
}: ReportModalProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'form' | 'done'>('form');
  const [selectedReasonKey, setSelectedReasonKey] = useState<MessageKey | ''>('');
  const [detail, setDetail] = useState('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('form');
      setSelectedReasonKey('');
      setDetail('');
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [open]);

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
    if (!selectedReasonKey) {
      toast.error(t('report.errReason'));
      return;
    }
    if (hasAlreadyReported(targetType, targetId)) {
      toast.error(t('report.toastDuplicate'));
      return;
    }

    const reasonText = t(selectedReasonKey);
    appendUserReport({
      id: `report-${Date.now()}`,
      targetType,
      targetId,
      targetName,
      reason: reasonText,
      reasonKey: selectedReasonKey,
      reasonLabel: reasonText,
      detail: detail.trim(),
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

  const lead =
    targetType === 'work'
      ? t('report.leadWork').replace('{name}', targetName)
      : t('report.leadArtist').replace('{name}', targetName);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[460px] z-[110] [&~[data-slot=dialog-overlay]]:z-[105]">
        <DialogHeader className="items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 mb-2">
            <Flag className="h-7 w-7 text-red-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            {targetType === 'work' ? t('report.titleWork') : t('report.titleArtist')}
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
              className="w-full text-base py-3 bg-red-500 lg:hover:bg-red-600 text-white"
            >
              {t('report.okClose')}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                {REPORT_REASON_KEYS.map((key) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedReasonKey === key
                        ? 'border-red-400 bg-red-50'
                        : 'border-[#E5E7EB] lg:hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={key}
                      checked={selectedReasonKey === key}
                      onChange={() => setSelectedReasonKey(key)}
                      className="h-4 w-4 text-red-500 accent-red-500"
                    />
                    <span className="text-sm text-[#3F3F46]">{t(key)}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={detail}
                onChange={(e) => { if (e.target.value.length <= 200) setDetail(e.target.value); }}
                placeholder={t('report.detailPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none"
              />
              <div className="text-right text-xs text-gray-400">{detail.length}/200</div>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
              <Button
                type="button"
                onClick={handleSubmit}
                className="w-full text-base py-3 bg-red-500 lg:hover:bg-red-600 text-white"
                disabled={!selectedReasonKey}
              >
                {t('report.submit')}
              </Button>
              <Button type="button" variant="ghost" onClick={handleClose} className="w-full text-base">
                {t('loginPrompt.cancel')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
