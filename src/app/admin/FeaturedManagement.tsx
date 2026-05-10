import { useState, useEffect, useMemo } from 'react';
import { Star, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
import { workStore, useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { appendAuditLog } from '../utils/adminAuditLog';

export default function FeaturedManagement() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
            체크한 전시는 둘러보기 피드에서 상위 노출됩니다. 사용자에게 별도 라벨 없이 순서에만 영향.
          </p>
        </div>
        {featuredExhibitionIds.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Star className="w-3 h-3 fill-primary" />
            {featuredExhibitionIds.length}개 추천 중
          </span>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="전시명 또는 작가명 검색"
          className="w-full sm:w-72 border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {publicWorks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          공개된 전시가 없습니다.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          "{search}"에 해당하는 전시가 없습니다.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((w) => {
            const active = featuredSet.has(w.id);
            const coverImg = Array.isArray(w.image) ? w.image[0] : w.image;
            const artistName = w.artist?.name ?? w.groupName ?? '—';
            return (
              <label
                key={w.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  active ? 'border-primary bg-primary/5' : 'border-border lg:hover:border-primary/40 lg:hover:bg-muted/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleFeatured(w.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                {coverImg && (
                  <img src={coverImg} alt="" className="h-12 w-12 rounded object-cover border border-border shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(w, '제목 없음')}</p>
                  <p className="text-xs text-muted-foreground truncate">{artistName}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {active && <Star className="w-4 h-4 text-primary fill-primary shrink-0" />}
                  <Link
                    to={`/exhibitions/${w.id}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground lg:hover:bg-muted/40 lg:hover:text-foreground"
                    aria-label="전시 보기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
