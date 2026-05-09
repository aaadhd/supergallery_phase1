import { useState, useEffect } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
import { workStore, useWorkStore } from '../store';
import { isWorkPublic } from '../utils/workVisibility';
import { displayExhibitionTitle } from '../utils/workDisplay';
import { appendAuditLog } from '../utils/adminAuditLog';

export default function FeaturedManagement() {
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6 text-foreground">추천 전시</h1>
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
      </div>
    );
  }

  const featuredSet = new Set(featuredExhibitionIds);
  const publicWorks = workStore.getWorks().filter(isWorkPublic);

  return (
    <div className="min-h-full">
      <h1 className="text-xl font-bold text-foreground mb-1">추천 전시</h1>
      <p className="text-sm text-muted-foreground mb-6">
        체크한 전시는 둘러보기 피드에서 상위 노출됩니다. 사용자에게 별도 라벨 없이 순서에만 영향.
        현재 <strong className="text-foreground">{featuredExhibitionIds.length}</strong>개 활성.
      </p>

      {publicWorks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          공개된 전시가 없습니다.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {publicWorks.map((w) => {
            const active = featuredSet.has(w.id);
            const coverImg = Array.isArray(w.image) ? w.image[0] : w.image;
            return (
              <div
                key={w.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  active ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleFeatured(w.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer"
                />
                {coverImg && (
                  <img src={coverImg} alt="" className="h-12 w-12 rounded object-cover border border-border shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(w, '제목 없음')}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.artistId}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {active && <Star className="w-4 h-4 text-primary fill-primary" />}
                  <Link
                    to={`/exhibitions/${w.id}`}
                    target="_blank"
                    className="h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground lg:hover:bg-muted/40 lg:hover:text-foreground"
                    aria-label="전시 보기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
