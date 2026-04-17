import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const CATEGORY_VALUES = ['account', 'upload', 'report', 'suggestion', 'bug', 'other'] as const;

function categoryMessageKey(v: string): MessageKey {
  const map: Record<string, MessageKey> = {
    account: 'contact.categoryAccount',
    upload: 'contact.categoryUpload',
    report: 'contact.categoryReport',
    suggestion: 'contact.categorySuggestion',
    bug: 'contact.categoryBug',
    other: 'contact.categoryOther',
  };
  return map[v] ?? 'contact.categoryOther';
}

export default function Contact() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !category || !message.trim()) {
      toast.error(t('contact.toastRequired'));
      return;
    }

    setSubmitting(true);

    const inquiries = JSON.parse(localStorage.getItem('artier_inquiries') || '[]');
    inquiries.push({
      id: `inq-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
      attachments: attachments.map(f => ({ name: f.name, size: f.size })),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('artier_inquiries', JSON.stringify(inquiries));

    setTimeout(() => {
      setSubmitting(false);
      toast.success(t('contact.toastSuccess'));
      toast(t('contact.autoResponse'), { duration: 5000 });
      setName('');
      setEmail('');
      setCategory('');
      setMessage('');
      setAttachments([]);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[700px] px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Send className="h-6 w-6 sm:h-7 sm:h-7 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('contact.title')}</h1>
          </div>
          <p className="text-sm sm:text-sm text-muted-foreground">
            {t('contact.leadBeforeFaq')}
            <Link to="/faq" className="text-primary lg:hover:underline font-medium">
              {t('footer.faq')}
            </Link>
            {t('contact.leadAfterFaq')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[700px] px-4 sm:px-6 py-5 sm:py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-5 sm:p-8 space-y-4 sm:space-y-6">
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground sm:mb-2 sm:text-sm">
              {t('contact.name')} <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('contact.placeholderName')}
              className="min-h-[44px] rounded-lg border-border px-3 py-3 text-sm sm:px-4 sm:py-3.5 sm:text-sm focus-visible:ring-primary/20"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground sm:mb-2 sm:text-sm">
              {t('contact.email')} <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('contact.placeholderEmail')}
              className="min-h-[44px] rounded-lg border-border px-3 py-3 text-sm sm:px-4 sm:py-3.5 sm:text-sm focus-visible:ring-primary/20"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground sm:mb-2 sm:text-sm">
              {t('contact.category')} <span className="text-red-500">*</span>
            </Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger className="min-h-[44px] w-full rounded-lg border-border px-3 py-3 text-sm sm:px-4 sm:py-3.5 sm:text-sm focus:ring-primary/20">
                <SelectValue placeholder={t('contact.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(categoryMessageKey(v))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground sm:mb-2 sm:text-sm">
              {t('contact.message')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= 1000) setMessage(e.target.value);
              }}
              placeholder={t('contact.placeholderMessage')}
              rows={6}
              className="min-h-[140px] resize-none rounded-lg border-border px-3 py-3 text-sm sm:px-4 sm:py-3.5 sm:text-sm focus-visible:ring-primary/20"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {t('contact.charCount').replace('{n}', String(message.length))}
            </div>
          </div>

          {/* 파일 첨부 (최대 5MB × 3) */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold text-foreground sm:mb-2 sm:text-sm">
              {t('contact.attachments')}
            </Label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
                if (valid.length < files.length) toast.error(t('contact.fileTooLarge'));
                setAttachments(prev => [...prev, ...valid].slice(0, 3));
                e.target.value = '';
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-muted/50 file:text-foreground lg:file:hover:bg-muted"
            />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-3 py-1.5">
                    <span className="truncate">{f.name} ({(f.size / 1024).toFixed(0)}KB)</span>
                    <button type="button" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="text-destructive ml-2 shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{t('contact.attachHint')}</p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary lg:hover:bg-primary/90 text-sm py-3 sm:py-3.5 h-auto"
          >
            {submitting ? t('contact.submitting') : t('contact.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
