import { useMemo, useState, useEffect, useSyncExternalStore, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Users, Trophy, ListChecks } from 'lucide-react';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import {
  eventsStore,
  useManagedEvents,
  deriveEventStatus,
  statusLabelKo,
  type ManagedEvent,
  type EventStatus,
  type EventSubtype,
} from '../utils/eventsStore';
import { workStore } from '../store';
import { appendAuditLog } from '../utils/adminAuditLog';
import { useI18n } from '../i18n/I18nProvider';
import EventParticipants from './EventParticipants';

type Tab = 'list' | 'participants';

type DraftState = {
  title: string;
  subtitle: string;
  description: string;
  bannerImageUrl: string;
  startAt: string;
  endAt: string;
  displayStartAt: string;
  displayEndAt: string;
  participantsLabel: string;
  subtype: EventSubtype;
  status: EventStatus | '';
  publicationOpen: boolean;
  publishedAt: string;
  resultUrl: string;
};

const emptyDraft: DraftState = {
  title: '',
  subtitle: '',
  description: '',
  bannerImageUrl: '',
  startAt: '',
  endAt: '',
  displayStartAt: '',
  displayEndAt: '',
  participantsLabel: '',
  subtype: 'irregular',
  status: '',
  publicationOpen: false,
  publishedAt: '',
  resultUrl: '',
};

function statusBadgeClass(s: EventStatus) {
  if (s === 'active') return 'bg-primary/10 text-primary border border-border';
  if (s === 'scheduled') return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-muted/50 text-muted-foreground border border-border';
}

export default function ContestManagement() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const allEvents = useManagedEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);

  const activeTab: Tab = searchParams.get('tab') === 'participants' ? 'participants' : 'list';

  const switchTab = (tab: Tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'list') {
        next.delete('tab');
        next.delete('event');
      } else {
        next.set('tab', tab);
      }
      return next;
    }, { replace: true });
    if (tab === 'list') {
      setShowForm(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, []);

  const works = useSyncExternalStore(workStore.subscribe, workStore.getWorks, workStore.getWorks);

  const entryCountByEvent = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of works) {
      if (w.linkedEventId != null) {
        const key = String(w.linkedEventId);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [works]);

  const contests = useMemo<ManagedEvent[]>(() => {
    const order: Record<EventStatus, number> = { active: 0, scheduled: 1, ended: 2 };
    return allEvents
      .filter((e) => e.type === 'contest')
      .sort((a, b) => order[deriveEventStatus(a)] - order[deriveEventStatus(b)]);
  }, [allEvents]);

  const startEdit = (ev: ManagedEvent) => {
    setEditingId(ev.id);
    setDraft({
      title: ev.title,
      subtitle: ev.subtitle ?? '',
      description: ev.description,
      bannerImageUrl: ev.bannerImageUrl,
      startAt: ev.startAt,
      endAt: ev.endAt,
      displayStartAt: ev.displayStartAt ?? '',
      displayEndAt: ev.displayEndAt ?? '',
      participantsLabel: ev.participantsLabel ?? '',
      subtype: ev.subtype ?? 'irregular',
      status: ev.status ?? '',
      publicationOpen: ev.publicationOpen ?? false,
      publishedAt: ev.publishedAt ?? '',
      resultUrl: ev.resultUrl ?? '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(false);
  };

  const removeContest = async (ev: ManagedEvent) => {
    const ok = await openConfirm({
      title: t('admin.contest.confirmDelete').replace('{title}', ev.title),
      description: t('admin.contest.confirmDeleteDesc'),
      destructive: true,
      confirmLabel: t('admin.notice.delete'),
    });
    if (!ok) return;
    eventsStore.remove(ev.id);
    workStore.getWorks().forEach((w) => {
      if (w.linkedEventId?.toString() === ev.id) {
        workStore.updateWork(w.id, { linkedEventId: undefined });
      }
    });
    appendAuditLog({ action: 'event_deleted', targetId: ev.id, targetSnapshot: { title: ev.title }, actorId: 'admin', actorRole: 'admin' });
    toast.success(t('admin.contest.toastDeleted'));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    const img = draft.bannerImageUrl.trim();
    const start = draft.startAt.trim();
    const end = draft.endAt.trim();
    const desc = draft.description.trim();

    if (!title || !img || !start || !end || !desc) {
      toast.error(t('admin.contest.errRequired'));
      return;
    }
    if (start > end) {
      toast.error(t('admin.contest.errDateOrder'));
      return;
    }
    const displayStart = draft.displayStartAt.trim() || undefined;
    const displayEnd = draft.displayEndAt.trim() || undefined;
    if (displayStart && displayEnd && displayStart > displayEnd) {
      toast.error('게시 기간 시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    const existing = editingId ? eventsStore.get(editingId) : null;
    if (draft.publicationOpen && (existing?.selectedWorkIds?.length ?? 0) === 0) {
      toast.warning(t('admin.contest.warnEmptySelected'));
    }
    const payload: Omit<ManagedEvent, 'id'> = {
      type: 'contest',
      subtype: draft.subtype,
      title,
      subtitle: draft.subtitle.trim() || undefined,
      description: desc,
      bannerImageUrl: img,
      startAt: start,
      endAt: end,
      displayStartAt: displayStart,
      displayEndAt: displayEnd,
      participantsLabel: draft.participantsLabel.trim() || undefined,
      status: draft.status || undefined,
      publicationOpen: draft.publicationOpen,
      publishedAt: draft.publishedAt.trim() || undefined,
      resultUrl: draft.resultUrl.trim() || undefined,
    };
    if (editingId) {
      eventsStore.update(editingId, payload);
      appendAuditLog({ action: 'event_saved', targetId: editingId, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success(t('admin.contest.toastUpdated'));
    } else {
      const created = eventsStore.add(payload);
      appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title }, actorId: 'admin', actorRole: 'admin' });
      toast.success(t('admin.contest.toastAdded'));
    }
    cancelEdit();
  };

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-bold text-foreground">응모전 관리</h1>
        {activeTab === 'list' && (
          <Button
            type="button"
            onClick={() => { setEditingId(null); setDraft(emptyDraft); setShowForm((v) => !v); }}
            className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            새 응모전
          </Button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => switchTab('list')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground lg:hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4" />
          응모전 목록
        </button>
        <button
          type="button"
          onClick={() => switchTab('participants')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'participants'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground lg:hover:text-foreground'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          응모자 관리
        </button>
      </div>

      {/* 응모전 목록 탭 */}
      {activeTab === 'list' && (
        <>
          {loading ? (
            <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">{t('admin.loading')}</div>
          ) : (
            <>
              {showForm && (
                <form
                  onSubmit={submit}
                  className="mb-6 border border-border rounded-lg p-4 space-y-4 bg-muted/50"
                >
                  <p className="text-sm font-medium text-foreground">{editingId ? t('admin.contest.editorEdit') : t('admin.contest.editorCreate')}</p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">제목 <span className="text-destructive">*</span></label>
                      <input
                        placeholder="5월 드로잉 챌린지"
                        value={draft.title}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">부제 <span className="text-muted-foreground font-normal">(선택)</span></label>
                      <input
                        placeholder={t('admin.contest.placeholderSubtitle')}
                        value={draft.subtitle}
                        onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">참여 대상 <span className="text-muted-foreground font-normal">(선택)</span></label>
                      <input
                        placeholder="예: 디지털 드로잉 작가 누구나"
                        value={draft.participantsLabel}
                        onChange={(e) => setDraft((d) => ({ ...d, participantsLabel: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">배너 이미지 URL <span className="text-destructive">*</span></label>
                      <input
                        placeholder="https://..."
                        value={draft.bannerImageUrl}
                        onChange={(e) => setDraft((d) => ({ ...d, bannerImageUrl: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">상세 설명 <span className="text-destructive">*</span></label>
                      <textarea
                        placeholder="응모전 내용을 입력하세요"
                        value={draft.description}
                        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white min-h-[80px]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-foreground mb-2">실행 기간 <span className="text-destructive">*</span></p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {t('admin.contest.labelStartAt')}
                          <input type="date" value={draft.startAt} onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground" />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {t('admin.contest.labelEndAt')}
                          <input type="date" value={draft.endAt} onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground" />
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-foreground mb-2">게시 기간 <span className="font-normal text-muted-foreground">(미입력 시 실행 기간과 동일)</span></p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          게시 시작일
                          <input type="date" value={draft.displayStartAt} onChange={(e) => setDraft((d) => ({ ...d, displayStartAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground" />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          게시 종료일
                          <input type="date" value={draft.displayEndAt} onChange={(e) => setDraft((d) => ({ ...d, displayEndAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground" />
                        </label>
                      </div>
                    </div>

                    <select
                      value={draft.subtype}
                      onChange={(e) => setDraft((d) => ({ ...d, subtype: e.target.value as EventSubtype }))}
                      className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="regular">{t('admin.contest.subtypeRegular')}</option>
                      <option value="irregular">{t('admin.contest.subtypeIrregular')}</option>
                    </select>
                    <div className="sm:col-span-2 pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-semibold text-foreground">{t('admin.contest.publicationTitle')}</p>
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" checked={draft.publicationOpen} onChange={(e) => setDraft((d) => ({ ...d, publicationOpen: e.target.checked }))} />
                        {t('admin.contest.publicationOpenLabel')}
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:max-w-xs">
                        {t('admin.contest.publishedAtLabel')}
                        <input type="date" value={draft.publishedAt} onChange={(e) => setDraft((d) => ({ ...d, publishedAt: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:max-w-xs">
                        결과 발표 URL
                        <span className="text-[11px] text-amber-600">※ 입력 시 종료 후 "결과 발표 보기" 버튼 노출</span>
                        <input
                          type="url"
                          value={draft.resultUrl}
                          onChange={(e) => setDraft((d) => ({ ...d, resultUrl: e.target.value }))}
                          placeholder="https://..."
                          className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
                        />
                      </label>
                      <p className="text-[11px] text-muted-foreground">{t('admin.contest.selectedWorkHint')}</p>
                    </div>

                    <select
                      value={draft.status}
                      onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as EventStatus | '' }))}
                      className="border border-border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2 sm:max-w-xs"
                    >
                      <option value="">{t('admin.contest.statusAuto')}</option>
                      <option value="scheduled">{t('admin.contest.statusScheduled')}</option>
                      <option value="active">{t('admin.contest.statusActive')}</option>
                      <option value="ended">{t('admin.contest.statusEnded')}</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white">
                      {editingId ? t('admin.contest.edit') : t('admin.contest.save')}
                    </Button>
                    <button type="button" onClick={cancelEdit} className="text-sm px-3 py-1.5 rounded-lg border border-border">
                      {t('admin.contest.cancel')}
                    </button>
                  </div>
                </form>
              )}

              {contests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                  {t('admin.contest.empty')}
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="bg-muted text-left text-foreground">
                        <th className="px-4 py-3 font-medium">응모전명</th>
                        <th className="px-4 py-3 font-medium">실행 기간</th>
                        <th className="px-4 py-3 font-medium">게시 기간</th>
                        <th className="px-4 py-3 font-medium text-center">응모</th>
                        <th className="px-4 py-3 font-medium">{t('admin.contest.colStatus')}</th>
                        <th className="px-4 py-3 font-medium text-right">{t('admin.contest.colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contests.map((ev) => {
                        const s = deriveEventStatus(ev);
                        return (
                          <tr key={ev.id} className="border-b border-border/40 lg:hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {ev.title}
                              {ev.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{ev.subtitle}</p>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{ev.startAt} ~ {ev.endAt}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                              {ev.displayStartAt || ev.displayEndAt
                                ? `${ev.displayStartAt ?? ev.startAt} ~ ${ev.displayEndAt ?? ev.endAt}`
                                : <span className="text-border">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
                              {entryCountByEvent.get(ev.id) ?? 0}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">명</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(s)}`}>
                                {statusLabelKo(s)}
                                {ev.status && <span className="ml-1 text-xs opacity-70">{t('admin.contest.manual')}</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchParams((prev) => {
                                    const next = new URLSearchParams(prev);
                                    next.set('tab', 'participants');
                                    next.set('event', ev.id);
                                    return next;
                                  }, { replace: true });
                                }}
                                className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30 inline-flex items-center gap-1.5"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {t('admin.contest.participants')}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(ev)}
                                className="text-sm px-3 py-1.5 rounded-lg border border-border text-foreground lg:hover:bg-muted/30"
                              >
                                <Pencil className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                {t('admin.contest.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeContest(ev)}
                                className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-700 lg:hover:bg-red-50 inline-flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('admin.notice.delete')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 응모자 관리 탭 */}
      {activeTab === 'participants' && (
        <EventParticipants compact />
      )}
    </div>
  );
}
