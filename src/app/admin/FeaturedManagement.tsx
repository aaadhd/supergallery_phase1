import { useState, useEffect, useMemo } from 'react';
import { Star, ExternalLink, Search, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
import { workStore, useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { appendAuditLog } from '../utils/adminAuditLog';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { imageUrls } from '../imageUrls';

export default function FeaturedManagement() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [popupSearch, setPopupSearch] = useState('');
  const featuredExhibitionIds = useFeaturedExhibitions();
  useWorkStore();

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(t);
  }, []);

  const toggleFeatured = (workId: string) => {
    featuredStore.toggle(workId);
    appendAuditLog({ action: 'curation_saved', targetId: workId, targetSnapshot: { featured: true }, actorId: 'admin', actorRole: 'admin' });
  };

  const featuredSet = new Set(featuredExhibitionIds);
  const publicWorks = workStore.getWorks().filter(isWorkPublic);

  // 추천 활성 먼저, 이후 전시명 가나다순
  const sortedWorks = useMemo(() => [...publicWorks].sort((a, b) => {
    const aF = featuredSet.has(a.id) ? 0 : 1;
    const bF = featuredSet.has(b.id) ? 0 : 1;
    if (aF !== bF) return aF - bF;
    return displayExhibitionTitle(a, '').localeCompare(displayExhibitionTitle(b, ''), 'ko');
  }), [publicWorks, featuredExhibitionIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedWorks;
    const q = search.trim().toLowerCase();
    return sortedWorks.filter((w) =>
      displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
      (w.artist?.name ?? '').toLowerCase().includes(q),
    );
  }, [sortedWorks, search]);

  // 추천 중인 것만
  const featuredWorks = useMemo(
    () => publicWorks.filter((w) => featuredSet.has(w.id)),
    [publicWorks, featuredExhibitionIds],
  );

  const filteredFeatured = useMemo(() => {
    if (!search.trim()) return featuredWorks;
    const q = search.trim().toLowerCase();
    return featuredWorks.filter((w) =>
      displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
      (w.artist?.name ?? '').toLowerCase().includes(q),
    );
  }, [featuredWorks, search]);

  // 추천 안 된 것만 (최신순)
  const popupWorks = useMemo(() => {
    const q = popupSearch.trim().toLowerCase();
    return publicWorks
      .filter((w) => !featuredSet.has(w.id))
      .filter((w) => {
        if (!q) return true;
        return (
          displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
          (w.artist?.name ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  }, [publicWorks, featuredExhibitionIds, popupSearch]);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">추천 전시</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">추천 전시</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            추천된 전시는 둘러보기 피드에서 상위 노출됩니다. 상한 없음.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Star className="w-3 h-3 fill-primary" />
            {featuredExhibitionIds.length}개 추천 중
          </span>
          <button
            type="button"
            onClick={() => { setShowAddPopup(true); setPopupSearch(''); }}
            className="inline-flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-2 text-sm font-medium lg:hover:bg-primary/90 min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> 추천 추가
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="추천 중인 전시 검색"
          className="w-full sm:w-72 border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {featuredWorks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          추천 중인 전시가 없습니다. "추천 추가"로 추가해 보세요.
        </div>
      ) : filteredFeatured.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          "{search}"에 해당하는 추천 전시가 없습니다.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {filteredFeatured.map((w) => {
            const coverImg = Array.isArray(w.image) ? w.image[0] : w.image;
            const coverSrc = coverImg ? (imageUrls[coverImg] || coverImg) : '';
            return (
              <div key={w.id} className="flex items-center gap-3 p-3">
                {coverSrc && (
                  <div className="w-12 h-12 rounded overflow-hidden border border-border shrink-0">
                    <ImageWithFallback src={coverSrc} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(w, '제목 없음')}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.artist?.name ?? w.groupName ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/exhibitions/${w.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 inline-flex items-center justify-center rounded border border-border text-muted-foreground lg:hover:bg-muted/40"
                    aria-label="전시 보기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(w.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded border border-amber-200 bg-amber-50 text-amber-600 lg:hover:bg-amber-100"
                    title="추천 해제"
                    aria-label="추천 해제"
                  >
                    <Star className="w-4 h-4 fill-amber-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추천 추가 팝업 */}
      {showAddPopup && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowAddPopup(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-5 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">추천 추가</h2>
              <button type="button" onClick={() => setShowAddPopup(false)}
                className="p-1 rounded lg:hover:bg-muted/60" aria-label="닫기">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={popupSearch}
                onChange={(e) => setPopupSearch(e.target.value)}
                placeholder="전시·작가 검색 (최신순)"
                className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {popupWorks.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {popupSearch ? `"${popupSearch}"에 해당하는 전시가 없습니다.` : '추가할 전시가 없습니다.'}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {popupWorks.map((w) => {
                    const coverImg = Array.isArray(w.image) ? w.image[0] : w.image;
                    const coverSrc = coverImg ? (imageUrls[coverImg] || coverImg) : '';
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          toggleFeatured(w.id);
                          // 팝업은 열린 상태 유지 (여러 개 추가 가능)
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border text-left lg:hover:border-primary/40 lg:hover:bg-muted/30 transition-colors"
                      >
                        {coverSrc ? (
                          <div className="w-12 h-12 rounded overflow-hidden border border-border shrink-0">
                            <ImageWithFallback src={coverSrc} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted border border-border shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(w, '제목 없음')}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.artist?.name ?? w.groupName ?? '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{w.uploadedAt?.slice(0, 10) ?? ''}</p>
                        </div>
                        <Star className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
