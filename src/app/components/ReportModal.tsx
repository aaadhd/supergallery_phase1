import { useState } from 'react';
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

const REPORT_REASON_KEYS = [
  'report.reasonCopyright',
  'report.reasonInappropriate',
  'report.reasonSpam',
  'report.reasonHate',
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
  const [selectedReasonKey, setSelectedReasonKey] = useState<MessageKey | ''>('');
  const [detail, setDetail] = useState('');

  const handleSubmit = () => {
    if (!selectedReasonKey) {
      toast.error(t('report.errReason'));
      return;
    }

    const reports = JSON.parse(localStorage.getItem('artier_reports') || '[]');
    const reasonText = t(selectedReasonKey);
    reports.push({
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
    localStorage.setItem('artier_reports', JSON.stringify(reports));

    if (targetId) {
      const hiddenKey = targetType === 'work' ? 'artier_reported_works' : 'artier_reported_artists';
      const hidden = JSON.parse(localStorage.getItem(hiddenKey) || '[]') as string[];
      if (!hidden.includes(targetId)) {
        hidden.push(targetId);
        localStorage.setItem(hiddenKey, JSON.stringify(hidden));
      }
    }

    toast.success(t('report.toastSuccess'));
    onReported?.();

    setTimeout(() => {
      setSelectedReasonKey('');
      setDetail('');
      onClose();
    }, 2000);
  };

  const lead =
    targetType === 'work'
      ? t('report.leadWork').replace('{name}', targetName)
      : t('report.leadArtist').replace('{name}', targetName);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
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

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            {REPORT_REASON_KEYS.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedReasonKey === key
                    ? 'border-red-400 bg-red-50'
                    : 'border-[#E5E7EB] hover:bg-[#FAFAFA]'
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
            onClick={handleSubmit}
            className="w-full text-base py-3 bg-red-500 hover:bg-red-600 text-white"
            disabled={!selectedReasonKey}
          >
            {t('report.submit')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-base">
            {t('loginPrompt.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
