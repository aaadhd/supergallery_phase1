import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { GripVertical, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';

type PickItem = { id: string; title: string; artist: string; thumb: string };

const initialPicks: PickItem[] = [
  { id: 'p1', title: '노을', artist: '김민서', thumb: 'P1' },
  { id: 'p2', title: '정물', artist: '이하준', thumb: 'P2' },
  { id: 'p3', title: '워터컬러', artist: '박지우', thumb: 'P3' },
  { id: 'p4', title: '야경', artist: '최유나', thumb: 'P4' },
  { id: 'p5', title: '라인 드로잉', artist: '정다은', thumb: 'P5' },
];

const catalogMock: PickItem[] = [
  { id: 'c1', title: '신규 추천 A', artist: '한소희', thumb: 'N1' },
  { id: 'c2', title: '신규 추천 B', artist: '오준영', thumb: 'N2' },
  { id: 'c3', title: '신규 추천 C', artist: '윤서아', thumb: 'N3' },
];

const MAX_PICKS = 10;
const PICKS_KEY = 'artier_admin_picks_v1';

function loadPicks(): PickItem[] {
  try {
    const raw = localStorage.getItem(PICKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return initialPicks;
}

function savePicks(items: PickItem[]) {
  localStorage.setItem(PICKS_KEY, JSON.stringify(items));
}

export default function PickManagement() {
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<PickItem[]>(loadPicks);
  const [search, setSearch] = useState('');

  useEffect(() => {
    savePicks(picks);
  }, [picks]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return catalogMock.filter(
      (c) =>
        !picks.some((p) => p.id === c.id) &&
        (c.title.toLowerCase().includes(q) || c.artist.toLowerCase().includes(q))
    );
  }, [search, picks]);

  const addPick = (item: PickItem) => {
    if (picks.length >= MAX_PICKS) {
      toast.error(`Pick은 최대 ${MAX_PICKS}개까지입니다.`);
      return;
    }
    if (picks.some((p) => p.id === item.id)) return;
    setPicks((prev) => [...prev, item]);
    setSearch('');
    toast.success('Pick에 추가되었습니다.');
  };

  const removePick = (id: string) => {
    setPicks((prev) => prev.filter((p) => p.id !== id));
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
      <p className="text-sm text-muted-foreground mb-6">
        현재 {picks.length} / {MAX_PICKS} · 드래그로 순서 변경은 추후 연동 예정(번호만 표시)
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="작품명 또는 작가로 검색하여 추가"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {search && searchResults.length > 0 && (
        <div className="mb-6 border border-border rounded-lg divide-y divide-[#F0F0F0]">
          {searchResults.map((c) => (
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
                onClick={() => addPick(c)}
                disabled={picks.length >= MAX_PICKS}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90 disabled:opacity-40"
              >
                추가
              </Button>
            </div>
          ))}
        </div>
      )}

      {picks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          등록된 Pick이 없습니다. 검색으로 추가해 보세요.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
          {picks.map((p) => (
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
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-foreground mb-3">순서 (드래그 자리 표시)</h2>
      <ol className="border border-border rounded-lg divide-y divide-[#F0F0F0]">
        {picks.map((p, idx) => (
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
        ))}
      </ol>
    </div>
  );
}
