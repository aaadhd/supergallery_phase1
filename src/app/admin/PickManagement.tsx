import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { GripVertical, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { workStore } from '../store';
import type { Work } from '../data';
import { displayExhibitionTitle } from '../utils/workDisplay';

const MAX_PICKS = 10;
const PICKS_KEY = 'artier_admin_picks_v1';

function loadPickIds(): string[] {
  try {
    const raw = localStorage.getItem(PICKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    // 과거 형식[{id,title,...}]과 신규 형식[string] 모두 허용
    const ids = parsed
      .map((item) =>
        typeof item === 'string'
          ? item
          : item && typeof item === 'object' && 'id' in item
            ? String((item as { id: string }).id)
            : '',
      )
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  } catch { /* ignore */ }
  return [];
}

function savePickIds(ids: string[]) {
  localStorage.setItem(PICKS_KEY, JSON.stringify(ids));
}

function toAdminPickItem(work: Work): { id: string; title: string; artist: string; thumb: string } {
  return {
    id: work.id,
    title: displayExhibitionTitle(work, '무제'),
    artist: work.artist?.name || '작가 미상',
    thumb: work.id.slice(-4).toUpperCase(),
  };
}

export default function PickManagement() {
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState(workStore.getWorks());
  const [pickIds, setPickIds] = useState<string[]>(loadPickIds);
  const [pickIdsHydrated, setPickIdsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = workStore.subscribe(() => setWorks(workStore.getWorks()));
    return unsubscribe;
  }, []);

  const worksById = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);
  const picks = useMemo(
    () => pickIds.map((id) => worksById.get(id)).filter((w): w is Work => Boolean(w)),
    [pickIds, worksById],
  );
  const pickIdSet = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);
  const pickHistory = useMemo(
    () =>
      works
        .filter((w) => w.pickBadge === true)
        .sort((a, b) => {
          const aActive = pickIdSet.has(a.id) ? 1 : 0;
          const bActive = pickIdSet.has(b.id) ? 1 : 0;
          if (aActive !== bActive) return bActive - aActive;
          return (b.likes + b.saves) - (a.likes + a.saves);
        }),
    [works, pickIdSet],
  );

  useEffect(() => {
    if (!pickIdsHydrated) return;
    // 현재 Pick 목록을 work.pick 플래그와 동기화.
    // pick: 주간 활성 목록 / pickBadge: 이력 배지(한 번 선정되면 유지)
    for (const w of works) {
      const shouldBeActivePick = pickIdSet.has(w.id);
      if ((w.pick === true) !== shouldBeActivePick) {
        workStore.updateWork(w.id, { pick: shouldBeActivePick });
      }
      if (shouldBeActivePick && w.pickBadge !== true) {
        workStore.updateWork(w.id, { pickBadge: true });
      }
    }
  }, [works, pickIdSet, pickIdsHydrated]);

  useEffect(() => {
    if (!pickIdsHydrated) return;
    savePickIds(pickIds);
  }, [pickIds, pickIdsHydrated]);

  useEffect(() => {
    if (!pickIdsHydrated) {
      const stored = loadPickIds();
      const initial = stored.length > 0
        ? stored.filter((id) => worksById.has(id))
        : works
          .filter((w) => w.pick === true)
          .slice(0, MAX_PICKS)
          .map((w) => w.id);
      setPickIds(initial);
      setPickIdsHydrated(true);
      return;
    }
    // 저장된 pick 목록이 실제 데이터에서 사라졌으면 정리
    const aliveIds = pickIds.filter((id) => worksById.has(id));
    if (aliveIds.length !== pickIds.length) setPickIds(aliveIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksById, works, pickIdsHydrated]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return works
      .filter((w) => !pickIdSet.has(w.id) && w.feedReviewStatus === 'approved')
      .filter((w) => {
        const title = displayExhibitionTitle(w, '').toLowerCase();
        const artist = (w.artist?.name || '').toLowerCase();
        return title.includes(q) || artist.includes(q);
      })
      .slice(0, 30);
  }, [search, pickIdSet, works]);

  const addPick = (work: Work) => {
    if (pickIds.length >= MAX_PICKS) {
      toast.error(`Pick은 최대 ${MAX_PICKS}개까지입니다.`);
      return;
    }
    if (pickIdSet.has(work.id)) return;
    setPickIds((prev) => [...prev, work.id]);
    // 활성 Pick + 영구 Pick 이력 배지
    workStore.updateWork(work.id, { pick: true, pickBadge: true });
    setSearch('');
    toast.success('Pick에 추가되었습니다.');
  };

  const removePick = (id: string) => {
    setPickIds((prev) => prev.filter((pid) => pid !== id));
    // 이력 배지는 유지하고, 활성 Pick만 해제
    workStore.updateWork(id, { pick: false });
    toast.message('Pick에서 제거되었습니다.');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">Artier&apos;s Pick 관리</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold mb-6 text-foreground">Artier&apos;s Pick 관리</h1>
      <div className="mb-5 inline-flex rounded-lg border border-border p-1 bg-muted/30">
        <Button
          type="button"
          onClick={() => setActiveTab('current')}
          className={`min-h-9 px-3 text-sm rounded-md ${activeTab === 'current' ? 'bg-white text-foreground shadow-sm' : 'bg-transparent text-muted-foreground lg:hover:bg-white/70'}`}
        >
          현재 Pick ({pickIds.length})
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`min-h-9 px-3 text-sm rounded-md ${activeTab === 'history' ? 'bg-white text-foreground shadow-sm' : 'bg-transparent text-muted-foreground lg:hover:bg-white/70'}`}
        >
          Pick 이력 ({pickHistory.length})
        </Button>
      </div>
      <div className="mb-6 space-y-1.5">
        <p className="text-sm text-muted-foreground">
          현재 {pickIds.length} / {MAX_PICKS} · 드래그로 순서 변경은 추후 연동 예정(번호만 표시)
        </p>
        <p className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
          <span aria-hidden>↻</span>
          현재 Pick은 주간 운영(최대 10개), 선정 이력 배지는 유지됩니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={activeTab === 'current' ? '작품명 또는 작가로 검색하여 현재 Pick에 추가' : '이력 내 작품/작가 검색'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {activeTab === 'current' && search && searchResults.length > 0 && (
        <div className="mb-6 border border-border rounded-lg divide-y divide-[#F0F0F0]">
          {searchResults.map((work) => {
            const c = toAdminPickItem(work);
            return (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 lg:hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-border">
                  {c.thumb}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.artist}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => addPick(work)}
                disabled={pickIds.length >= MAX_PICKS}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-40"
              >
                추가
              </Button>
            </div>
          )})}
        </div>
      )}

      {activeTab === 'current' && (
        <>
          {pickIds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              등록된 현재 Pick이 없습니다. 검색으로 추가해 보세요.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
              {picks.map((work) => {
                const p = toAdminPickItem(work);
                return (
                  <div
                    key={p.id}
                    className="border border-border rounded-lg p-3 lg:hover:bg-muted/50 transition-colors relative group"
                  >
                    <div className="aspect-square rounded-md bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-sm font-semibold text-primary border border-border/40 mb-2">
                      {p.thumb}
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.artist}</p>
                    <Button
                      type="button"
                      onClick={() => removePick(p.id)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-white border border-border text-muted-foreground lg:hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                      aria-label="제거"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <h2 className="text-sm font-semibold text-foreground mb-3">순서 (드래그 자리 표시)</h2>
          <ol className="border border-border rounded-lg divide-y divide-[#F0F0F0]">
            {picks.map((work, idx) => {
              const p = toAdminPickItem(work);
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 lg:hover:bg-muted/50">
                  <span className="text-xs text-muted-foreground w-6 tabular-nums">{idx + 1}.</span>
                  <GripVertical className="w-4 h-4 text-muted-foreground/60 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{p.title}</span>
                    <span className="text-sm text-muted-foreground"> · {p.artist}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removePick(p.id)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground lg:hover:bg-white"
                  >
                    제거
                  </Button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {activeTab === 'history' && (
        <>
          {pickHistory.filter((w) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            const title = displayExhibitionTitle(w, '').toLowerCase();
            const artist = (w.artist?.name || '').toLowerCase();
            return title.includes(q) || artist.includes(q);
          }).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Pick 이력에 표시할 작품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pickHistory
                .filter((w) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  const title = displayExhibitionTitle(w, '').toLowerCase();
                  const artist = (w.artist?.name || '').toLowerCase();
                  return title.includes(q) || artist.includes(q);
                })
                .map((work) => {
                  const p = toAdminPickItem(work);
                  const isCurrent = pickIdSet.has(work.id);
                  const canActivate = !isCurrent && pickIds.length < MAX_PICKS && work.feedReviewStatus === 'approved';
                  return (
                    <div key={p.id} className="border border-border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.artist}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isCurrent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-muted text-muted-foreground border border-border'}`}>
                          {isCurrent ? '현재 Pick' : 'Pick 이력'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <Button type="button" onClick={() => removePick(work.id)} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground lg:hover:bg-muted">
                            현재 Pick 해제
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={!canActivate}
                            onClick={() => addPick(work)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-40"
                          >
                            현재 Pick으로 재편입
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
