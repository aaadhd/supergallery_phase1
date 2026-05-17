import { useState } from 'react';
import { Megaphone, Pin, Pencil, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { noticeStore, useNotices, type AdminNotice, type NoticeCategory, type NoticeStatus } from '../utils/noticeStore';
import { appendAuditLog } from '../utils/adminAuditLog';
import { useI18n } from '../i18n/I18nProvider';

const CATEGORIES: NoticeCategory[] = ['서비스', '이벤트', '정책', '기타'];

const STATUS_BADGE: Record<NoticeStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  stopped: 'bg-red-50 text-red-700 border border-red-200',
};

type EditorState = {
  mode: 'create' | 'edit';
  id?: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  category: NoticeCategory;
  isPinned: boolean;
  status: NoticeStatus;
};

function emptyEditor(): EditorState {
  return { mode: 'create', title: '', titleEn: '', content: '', contentEn: '', category: '서비스', isPinned: false, status: 'draft' };
}

export default function NoticeManagement() {
  const { t } = useI18n();
  const notices = useNotices();
  const [statusFilter, setStatusFilter] = useState<NoticeStatus | 'all'>('all');
  const [editor, setEditor] = useState<EditorState | null>(null);

  const filtered = notices
    .filter((n) => statusFilter === 'all' || n.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const openCreate = () => setEditor(emptyEditor());

  const openEdit = (n: AdminNotice) =>
    setEditor({ mode: 'edit', id: n.id, title: n.title, titleEn: n.titleEn, content: n.content, contentEn: n.contentEn, category: n.category, isPinned: n.isPinned, status: n.status });

  const closeEditor = () => setEditor(null);

  const save = () => {
    if (!editor) return;
    if (!editor.title.trim()) { toast.error(t('admin.notice.errTitleRequired')); return; }
    if (!editor.content.trim()) { toast.error(t('admin.notice.errContentRequired')); return; }
    if (editor.isPinned) {
      const pinnedCount = noticeStore.getPinnedCount();
      const alreadyPinned = editor.mode === 'edit' && notices.find((n) => n.id === editor.id)?.isPinned;
      if (!alreadyPinned && pinnedCount >= noticeStore.maxPinned) {
        toast.error(t('admin.notice.pinnedLimit'));
        return;
      }
    }
    if (editor.mode === 'edit' && editor.id) {
      noticeStore.update(editor.id, { title: editor.title.trim(), titleEn: editor.titleEn.trim(), content: editor.content.trim(), contentEn: editor.contentEn.trim(), category: editor.category, isPinned: editor.isPinned });
      appendAuditLog({ action: 'notice_saved', targetId: editor.id, targetSnapshot: { title: editor.title.trim(), status: editor.status }, actorId: 'admin', actorRole: 'admin' });
      toast.success(t('admin.notice.toastUpdated'));
    } else {
      const created = noticeStore.add({ title: editor.title.trim(), titleEn: editor.titleEn.trim(), content: editor.content.trim(), contentEn: editor.contentEn.trim(), category: editor.category, isPinned: editor.isPinned, status: editor.status });
      appendAuditLog({ action: 'notice_saved', targetId: created.id, targetSnapshot: { title: editor.title.trim(), status: editor.status }, actorId: 'admin', actorRole: 'admin' });
      toast.success(t('admin.notice.toastSaved'));
    }
    closeEditor();
  };

  const publish = (n: AdminNotice) => {
    if (n.isPinned && noticeStore.getPinnedCount() >= noticeStore.maxPinned && n.status !== 'published') {
      toast.error(t('admin.notice.pinnedLimit'));
    }
    noticeStore.update(n.id, { status: 'published' });
    appendAuditLog({ action: 'notice_published', targetId: n.id, targetSnapshot: { title: n.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success(t('admin.notice.toastPublished'));
  };

  const stopPublish = (n: AdminNotice) => {
    noticeStore.update(n.id, { status: 'stopped', isPinned: false });
    appendAuditLog({ action: 'notice_stopped', targetId: n.id, targetSnapshot: { title: n.title }, actorId: 'admin', actorRole: 'admin' });
    toast.message(t('admin.notice.toastStopped'));
  };

  const deleteNotice = async (n: AdminNotice) => {
    if (n.status === 'published') {
      toast.error(t('admin.notice.publishedOnly'));
      return;
    }
    const ok = await openConfirm({ title: t('admin.notice.confirmDelete').replace('{title}', n.title), description: t('admin.notice.confirmDeleteDesc'), destructive: true, confirmLabel: t('admin.notice.delete') });
    if (!ok) return;
    noticeStore.remove(n.id);
    appendAuditLog({ action: 'notice_deleted', targetId: n.id, targetSnapshot: { title: n.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success(t('admin.notice.toastDeleted'));
  };

  const statusLabel: Record<NoticeStatus, string> = {
    draft: t('admin.notice.statusDraft'),
    published: t('admin.notice.statusPublished'),
    stopped: t('admin.notice.statusStopped'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-foreground" />
          <h1 className="text-base font-semibold text-foreground">{t('admin.notice.title')}</h1>
        </div>
        <button type="button" onClick={openCreate} className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          {t('admin.notice.new')}
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {(['all', 'draft', 'published', 'stopped'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {s === 'all' ? t('admin.notice.filterAll') : statusLabel[s]}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">{t('admin.notice.empty')}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground">{t('admin.notice.colTitle')}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground w-20">{t('admin.notice.colCategory')}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground w-24">{t('admin.notice.colStatus')}</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground w-28">{t('admin.notice.colPublishedAt')}</th>
                <th className="px-4 py-3 w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {n.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                      {n.title}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{n.titleEn}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{n.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[n.status]}`}>
                      {statusLabel[n.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {n.createdAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(n)}>
                        <Pencil className="w-3 h-3 mr-1" />{t('admin.notice.edit')}
                      </Button>
                      {n.status !== 'published' ? (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-700" onClick={() => publish(n)}>
                          <Eye className="w-3 h-3 mr-1" />{t('admin.notice.publish')}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => stopPublish(n)}>
                          <EyeOff className="w-3 h-3 mr-1" />{t('admin.notice.stop')}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteNotice(n)}>
                        <Trash2 className="w-3 h-3 mr-1" />{t('admin.notice.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 작성/수정 모달 */}
      {editor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="text-base font-bold text-foreground">
                {editor.mode === 'create' ? t('admin.notice.new') : t('admin.notice.edit')}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 카테고리 + 고정 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.notice.labelCategory')}</label>
                  <select
                    value={editor.category}
                    onChange={(e) => setEditor((p) => p && ({ ...p, category: e.target.value as NoticeCategory }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2 gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editor.isPinned}
                      onChange={(e) => setEditor((p) => p && ({ ...p, isPinned: e.target.checked }))}
                      className="w-4 h-4 rounded accent-foreground"
                    />
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    {t('admin.notice.labelPinned')}
                  </label>
                </div>
              </div>
              {/* 제목 ko/en */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.notice.labelTitle')} <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={editor.title}
                  onChange={(e) => setEditor((p) => p && ({ ...p, title: e.target.value }))}
                  placeholder={t('admin.notice.placeholderTitle')}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
              {/* 본문 */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.notice.labelContent')} <span className="text-destructive">*</span></label>
                <textarea
                  value={editor.content}
                  onChange={(e) => setEditor((p) => p && ({ ...p, content: e.target.value }))}
                  placeholder={t('admin.notice.placeholderContent')}
                  rows={5}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-y"
                />
              </div>
              {/* 상태 (신규 작성 시만) */}
              {editor.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.notice.labelStatus')}</label>
                  <div className="flex gap-3">
                    {(['draft', 'published'] as NoticeStatus[]).map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={editor.status === s}
                          onChange={() => setEditor((p) => p && ({ ...p, status: s }))}
                          className="accent-foreground"
                        />
                        {s === 'draft' ? t('admin.notice.statusDraft') : t('admin.notice.statusPublished')}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={closeEditor} className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30">{t('admin.notice.cancel')}</button>
              <button type="button" onClick={save} className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90">{t('admin.notice.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
