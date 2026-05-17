import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Star, Search, Plus, X } from 'lucide-react';
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
import { workStore, useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { appendAuditLog } from '../utils/adminAuditLog';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import type { Work } from '../data';

function getImgs(w: Work): string[] {
  return (Array.isArray(w.image) ? w.image : [w.image])
    .filter(Boolean)
    .map((k: string) => imageUrls[k] || k);
}

export default function FeaturedManagement() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [popupSearch, setPopupSearch] = useState('');
  const [hoverImg, setHoverImg] = useState<{ src: string; x: number; y: number } | null>(null);
  const [modalImgs, setModalImgs] = useState<{ images: string[]; idx: number } | null>(null);
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
  const allWorks = workStore.getWorks();

  const featuredWorks = useMemo(
    () => allWorks.filter((w) => featuredSet.has(w.id) && isWorkPublic(w)),
    [allWorks, featuredExhibitionIds],
  );

  const filteredFeatured = useMemo(() => {
    if (!search.trim()) return featuredWorks;
    const q = search.trim().toLowerCase();
    return featuredWorks.filter((w) =>
      displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
      (w.artist?.name ?? '').toLowerCase().includes(q),
    );
  }, [featuredWorks, search]);

  const popupWorks = useMemo(() => {
    const q = popupSearch.trim().toLowerCase();
    return [...allWorks]
      .filter((w) => isWorkPublic(w) && !featuredSet.has(w.id))
      .filter((w) => {
        if (!q) return true;
        return (
          displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
          (w.artist?.name ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  }, [allWorks, featuredExhibitionIds, popupSearch]);

  const handleThumbEnter = (e: React.MouseEvent<HTMLDivElement>, src: string) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    let x = r.right + 8;
    let y = r.top + r.height / 2 - 120;
    if (x + 240 > window.innerWidth) x = r.left - 248;
    y = Math.max(8, Math.min(y, window.innerHeight - 248));
    setHoverImg({ src, x, y });
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-base font-semibold mb-4 text-foreground">추천 전시</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-base font-semibold text-foreground">추천 전시</h1>
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
            const imgs = getImgs(w);
            return (
              <div key={w.id} className="flex items-center gap-3 px-3 py-2">
                <div className="w-48 shrink-0 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{displayExhibitionTitle(w, '(제목 없음)')}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.artist?.name ?? w.groupName ?? '—'}</p>
                </div>
                <div className="flex gap-1 overflow-x-auto flex-1">
                  {imgs.map((src, i) => (
                    <div
                      key={i}
                      className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-muted cursor-pointer"
                      onMouseEnter={(e) => handleThumbEnter(e, src)}
                      onMouseLeave={() => setHoverImg(null)}
                      onClick={() => setModalImgs({ images: imgs, idx: i })}
                    >
                      <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => toggleFeatured(w.id)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded border border-amber-200 bg-amber-50 text-amber-600 lg:hover:bg-amber-100 shrink-0"
                  title="추천 해제"
                  aria-label="추천 해제"
                >
                  <Star className="w-4 h-4 fill-amber-500" />
                </button>
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
            <div className="overflow-y-auto flex-1 space-y-1">
              {popupWorks.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {popupSearch ? `"${popupSearch}"에 해당하는 전시가 없습니다.` : '추가할 전시가 없습니다.'}
                </div>
              ) : (
                popupWorks.map((w) => {
                  const imgs = getImgs(w);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleFeatured(w.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-transparent text-left lg:hover:border-primary/20 lg:hover:bg-muted/30 transition-all"
                    >
                      <div className="w-28 shrink-0 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{displayExhibitionTitle(w, '(제목 없음)')}</p>
                        <p className="text-xs text-muted-foreground truncate">{w.artist?.name ?? w.groupName ?? '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{w.uploadedAt?.slice(0, 10) ?? ''}</p>
                      </div>
                      <div className="flex gap-1 overflow-x-auto flex-1">
                        {imgs.map((src, i) => (
                          <div
                            key={i}
                            className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-muted"
                            onMouseEnter={(e) => handleThumbEnter(e, src)}
                            onMouseLeave={() => setHoverImg(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImgs({ images: imgs, idx: i });
                            }}
                          >
                            <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <Star className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {hoverImg && createPortal(
        <div
          className="fixed z-[60] pointer-events-none rounded-lg overflow-hidden shadow-2xl border border-border"
          style={{ left: hoverImg.x, top: hoverImg.y, width: 240, height: 240 }}
        >
          <ImageWithFallback src={hoverImg.src} alt="" className="w-full h-full object-cover" />
        </div>,
        document.body
      )}

      {modalImgs && createPortal(
        <FeaturedImageModal
          images={modalImgs.images}
          initialIdx={modalImgs.idx}
          onClose={() => setModalImgs(null)}
        />,
        document.body
      )}
    </div>
  );
}

function FeaturedImageModal({
  images,
  initialIdx,
  onClose,
}: {
  images: string[];
  initialIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-9 right-0 text-white/70 lg:hover:text-white text-sm"
        >
          닫기 ✕
        </button>
        <div className="rounded-xl overflow-hidden bg-black aspect-square">
          <ImageWithFallback src={images[idx]} alt="" className="w-full h-full object-contain" />
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white text-base rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/80"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white text-base rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-20 lg:hover:bg-black/80"
            >
              ›
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === idx ? 'bg-white' : 'bg-white/40 lg:hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
