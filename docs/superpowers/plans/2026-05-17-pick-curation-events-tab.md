# Pick · 기획전 — Events 탭 통합 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Events 탭에 Pick·기획전 탭을 추가하고, 픽 세션 상세 페이지·명예의 전당 페이지를 신규 생성한다.

**Architecture:** Events.tsx를 3탭(이벤트|Pick|기획전) 구조로 전환. CuratedExhibition에 pageUrl 필드를 추가해 기획전 상세는 외부 링크로 연결. PickDetail·PickHallOfFame은 pickStore와 workStore를 직접 구독하는 독립 페이지로 생성.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Router v6, pickStore, curationStore, workStore

---

## 파일 맵

| 작업 | 파일 |
|---|---|
| 수정 | `src/app/utils/curationStore.ts` |
| 수정 | `src/app/admin/CurationManagement.tsx` |
| 수정 | `src/app/i18n/messages.ts` |
| 신규 | `src/app/pages/PickDetail.tsx` |
| 신규 | `src/app/pages/PickHallOfFame.tsx` |
| 수정 | `src/app/routes.ts` |
| 수정 | `src/app/pages/Events.tsx` |

---

## Task 1: curationStore에 pageUrl 필드 추가

**Files:**
- Modify: `src/app/utils/curationStore.ts`

- [ ] **Step 1: CuratedExhibition 타입에 pageUrl 추가**

`src/app/utils/curationStore.ts`의 `CuratedExhibition` 타입을 아래로 교체:

```typescript
export type CuratedExhibition = {
  id: string;
  title: string;
  subtitle?: string;
  /** 기획전 대표 이미지 URL (선택). Events 페이지 카드에 노출 */
  bannerImageUrl?: string;
  /** YYYY-MM-DD. 미입력 시 상시 운영 */
  startAt?: string;
  /** YYYY-MM-DD. 미입력 시 상시 운영 */
  endAt?: string;
  /**
   * 기획전 상세 외부 링크 URL (필수 — 미설정 시 Events 기획전 탭 미노출).
   * Notion, Framer, 커스텀 HTML 등 자유 제작 후 URL 등록.
   */
  pageUrl?: string;
  pieces: CurationPieceRef[];
};
```

- [ ] **Step 2: readFromStorage에서 pageUrl 파싱 추가**

`readFromStorage` 내 `.map()` 안의 반환 객체에 `pageUrl` 줄 추가:

```typescript
return {
  id: typeof t.id === 'string' && t.id ? (t.id as string) : newCuratedExhibitionId(),
  title,
  subtitle: typeof t.subtitle === 'string' ? (t.subtitle as string) : undefined,
  bannerImageUrl: typeof t.bannerImageUrl === 'string' ? (t.bannerImageUrl as string) : undefined,
  startAt: typeof t.startAt === 'string' ? (t.startAt as string) : undefined,
  endAt: typeof t.endAt === 'string' ? (t.endAt as string) : undefined,
  pageUrl: typeof t.pageUrl === 'string' && t.pageUrl ? (t.pageUrl as string) : undefined,
  pieces,
};
```

- [ ] **Step 3: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

오류 없음 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/app/utils/curationStore.ts
git commit -m "feat: curationStore에 pageUrl 필드 추가"
```

---

## Task 2: CurationManagement에 pageUrl 입력 필드 추가

**Files:**
- Modify: `src/app/admin/CurationManagement.tsx`

- [ ] **Step 1: EditorState에 pageUrl 추가**

`EditorState` 타입 찾아서 `pageUrl: string` 추가:

```typescript
type EditorState = {
  mode: 'create' | 'edit';
  editingId?: string;
  title: string;
  subtitle: string;
  startAt: string;
  endAt: string;
  pageUrl: string;
  pieces: SelectedPiece[];
  search: string;
};
```

- [ ] **Step 2: emptyEditor와 fromExhibition 업데이트**

```typescript
function emptyEditor(): EditorState {
  return { mode: 'create', title: '', subtitle: '', startAt: '', endAt: '', pageUrl: '', pieces: [], search: '' };
}

function fromExhibition(c: CuratedExhibition): EditorState {
  return {
    mode: 'edit', editingId: c.id, title: c.title, subtitle: c.subtitle ?? '',
    startAt: c.startAt ?? '', endAt: c.endAt ?? '',
    pageUrl: c.pageUrl ?? '',
    pieces: c.pieces.map((p) => ({ workId: p.workId, pieceId: p.pieceId })),
    search: '',
  };
}
```

- [ ] **Step 3: saveEditor에 pageUrl 전달**

`saveEditor` 함수에서 `updateCuratedExhibition`과 `addCuratedExhibition` 호출 시 `pageUrl` 포함:

```typescript
// updateCuratedExhibition 호출 부분
curationStore.updateCuratedExhibition(editor.editingId, {
  title,
  subtitle: editor.subtitle.trim() || undefined,
  startAt: editor.startAt.trim() || undefined,
  endAt: editor.endAt.trim() || undefined,
  pageUrl: editor.pageUrl.trim() || undefined,
  pieces,
});

// addCuratedExhibition 호출 부분
const created = curationStore.addCuratedExhibition({
  title,
  subtitle: editor.subtitle.trim() || undefined,
  startAt: editor.startAt.trim() || undefined,
  endAt: editor.endAt.trim() || undefined,
  pageUrl: editor.pageUrl.trim() || undefined,
  pieces,
});
```

- [ ] **Step 4: 폼에 pageUrl 입력 필드 추가**

편집기 폼의 grid 아래 (검색창 위) pageUrl 입력 필드 추가:

```tsx
<div className="grid grid-cols-2 gap-3">
  {/* 기존 제목, 부제, 시작일, 종료일 필드들 */}
  ...
</div>
{/* pageUrl 필드 — 기획전 탭 노출 조건 */}
<div>
  <label className="block text-xs text-muted-foreground mb-1">
    기획전 페이지 URL
    <span className="ml-1 text-amber-600 font-medium">※ 없으면 기획전 탭 미노출</span>
  </label>
  <input
    value={editor.pageUrl}
    onChange={(e) => setEditor((prev) => prev ? { ...prev, pageUrl: e.target.value } : prev)}
    placeholder="https://notion.so/... 또는 https://..."
    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm"
  />
</div>
```

- [ ] **Step 5: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/CurationManagement.tsx
git commit -m "feat: 기획전 관리에 pageUrl 입력 필드 추가"
```

---

## Task 3: i18n 메시지 키 추가

**Files:**
- Modify: `src/app/i18n/messages.ts`

- [ ] **Step 1: KO 블록(line ~923)에 키 추가**

`admin.nav.dashboard` 키 근처의 KO 블록에서 기존 `events.*` 키 목록 끝부분을 찾아 아래 키들을 추가:

```typescript
// Events 탭 구조
'events.tabEvents': '이벤트',
'events.tabPick': 'Pick',
'events.tabCuration': '기획전',
// Pick 탭
'events.pickNoActive': '현재 진행 중인 Pick이 없습니다',
'events.pickViewSelected': '선정 전시 보기',
'events.pickHallOfFameCta': '🏅 명예의 전당',
'events.pickHallOfFameCtaDesc': '역대 Proud\'s Pick 선정 전시 모음',
// 기획전 탭
'events.curationActive': '진행 중',
'events.curationEnded': '지난 기획전',
'events.curationNone': '현재 진행 중인 기획전이 없습니다',
'events.curationEndedBlocked': '종료된 기획전입니다',
// PickDetail 페이지
'pickDetail.heading': 'Proud\'s Pick',
'pickDetail.selectedCount': '{n}개 전시 선정',
'pickDetail.notFound': '존재하지 않는 Pick 세션입니다',
'pickDetail.backToEvents': '← 이벤트로',
// 명예의 전당
'hallOfFame.title': '명예의 전당',
'hallOfFame.subtitle': '역대 Proud\'s Pick 선정 전시',
'hallOfFame.total': '{n}개 전시',
'hallOfFame.empty': '아직 선정된 전시가 없습니다. 첫 번째 Proud\'s Pick을 기다려 주세요.',
'hallOfFame.back': '← Pick으로',
```

- [ ] **Step 2: EN 블록(line ~2014)에 동일 키 추가**

EN 블록의 같은 위치에 동일 내용 추가 (어드민은 KO 전용이지만 사용자 앱 키는 양쪽 모두 필요):

```typescript
'events.tabEvents': '이벤트',
'events.tabPick': 'Pick',
'events.tabCuration': '기획전',
'events.pickNoActive': '현재 진행 중인 Pick이 없습니다',
'events.pickViewSelected': '선정 전시 보기',
'events.pickHallOfFameCta': '🏅 명예의 전당',
'events.pickHallOfFameCtaDesc': '역대 Proud\'s Pick 선정 전시 모음',
'events.curationActive': '진행 중',
'events.curationEnded': '지난 기획전',
'events.curationNone': '현재 진행 중인 기획전이 없습니다',
'events.curationEndedBlocked': '종료된 기획전입니다',
'pickDetail.heading': 'Proud\'s Pick',
'pickDetail.selectedCount': '{n} exhibitions selected',
'pickDetail.notFound': 'Pick session not found',
'pickDetail.backToEvents': '← Events',
'hallOfFame.title': '명예의 전당',
'hallOfFame.subtitle': 'All-time Proud\'s Pick',
'hallOfFame.total': '{n} exhibitions',
'hallOfFame.empty': 'No exhibitions yet. Stay tuned for the first Proud\'s Pick.',
'hallOfFame.back': '← Pick',
```

- [ ] **Step 3: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/i18n/messages.ts
git commit -m "feat: Pick·기획전·명예의 전당 i18n 키 추가"
```

---

## Task 4: PickDetail.tsx 신규 생성

**Files:**
- Create: `src/app/pages/PickDetail.tsx`

- [ ] **Step 1: 파일 생성**

`src/app/pages/PickDetail.tsx`를 아래 내용으로 생성:

```tsx
import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { pickStore, usePickSessions, derivePickStatus } from '../utils/pickStore';
import { workStore, useWorkStore } from '../store';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { displayExhibitionTitle } from '../utils/workDisplay';
import type { Work } from '../data';

export default function PickDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  usePickSessions(); // subscribe
  useWorkStore();

  const session = useMemo(() => (id ? pickStore.get(id) : null), [id]);
  const allWorks = workStore.getWorks();

  const selectedWorks = useMemo<Work[]>(() => {
    if (!session) return [];
    const map = new Map(allWorks.map((w) => [w.id, w]));
    return (session.selectedWorkIds ?? [])
      .map((wid) => map.get(wid))
      .filter((w): w is Work => w !== undefined);
  }, [session, allWorks]);

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t('pickDetail.notFound')}</p>
        <Link to="/events?tab=pick" className="text-sm text-primary hover:underline">
          {t('pickDetail.backToEvents')}
        </Link>
      </div>
    );
  }

  const status = derivePickStatus(session);
  const isEnded = status === 'ended';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* 헤더 — 다크 배경 + 골드 광선 + 트로피 */}
      <div
        className="relative overflow-hidden text-center py-12 px-4"
        style={{ background: 'linear-gradient(180deg, #000000 0%, #0d0900 60%, #1a1000 100%)' }}
      >
        {/* 골드 광선 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
            style={{ background: 'linear-gradient(180deg,rgba(255,200,0,0.5),transparent)', boxShadow: '0 0 30px 8px rgba(255,200,0,0.12)' }} />
          <div className="absolute top-0 w-px h-4/5"
            style={{ left: '42%', background: 'linear-gradient(180deg,rgba(255,200,0,0.2),transparent)', transform: 'rotate(-12deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-4/5"
            style={{ left: '58%', background: 'linear-gradient(180deg,rgba(255,200,0,0.2),transparent)', transform: 'rotate(12deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-3/5"
            style={{ left: '33%', background: 'linear-gradient(180deg,rgba(255,200,0,0.1),transparent)', transform: 'rotate(-25deg)', transformOrigin: 'top' }} />
          <div className="absolute top-0 w-px h-3/5"
            style={{ left: '67%', background: 'linear-gradient(180deg,rgba(255,200,0,0.1),transparent)', transform: 'rotate(25deg)', transformOrigin: 'top' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10"
            style={{ background: 'radial-gradient(ellipse,rgba(255,200,0,0.15),transparent 70%)' }} />
        </div>

        <div className="relative">
          {/* 뒤로가기 */}
          <Link
            to="/events?tab=pick"
            className="absolute left-0 top-0 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {t('pickDetail.backToEvents')}
          </Link>

          {/* 트로피 */}
          <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(255,200,0,0.5))' }}>
            🏆
          </div>

          <p className="text-xs font-semibold tracking-[2.5px] uppercase mb-3" style={{ color: '#b8862f' }}>
            {t('pickDetail.heading')}
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
            {session.title}
          </h1>
          <p className="text-sm" style={{ color: '#4a3f2a' }}>
            {session.startAt} ~ {session.endAt}
            {' · '}
            {t('pickDetail.selectedCount').replace('{n}', String(selectedWorks.length))}
          </p>
          {isEnded && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
              종료된 Pick
            </span>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,0,0.3),transparent)' }} />

      {/* 선정 전시 그리드 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {selectedWorks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">선정된 전시가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {selectedWorks.map((w) => {
              const coverKey = getCoverImage(w.image, w.coverImageIndex);
              const src = imageUrls[coverKey] || coverKey;
              const isGroup = w.primaryExhibitionType === 'group';
              const artistLabel = isGroup
                ? (w.groupName?.trim() || `${w.artist.name} 외`)
                : `${w.artist.name} 작가`;

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkId(w.id)}
                  className="text-left rounded-xl overflow-hidden transition-transform lg:hover:scale-[1.02]"
                  style={{ background: '#161616', border: '1px solid rgba(255,200,0,0.15)' }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-slate-100 leading-snug truncate">
                      {displayExhibitionTitle(w, '(제목 없음)')}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>
                      {artistLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 명예의 전당 CTA */}
        <Link
          to="/picks/hall-of-fame"
          className="flex items-center justify-between mt-8 px-4 py-4 rounded-xl transition-colors lg:hover:opacity-80"
          style={{ border: '1px solid rgba(255,200,0,0.2)', background: 'rgba(255,200,0,0.04)' }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: '#ffd700' }}>{t('events.pickHallOfFameCta')}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4a5568' }}>{t('events.pickHallOfFameCtaDesc')}</p>
          </div>
          <span className="text-sm" style={{ color: '#b8862f' }}>→</span>
        </Link>
      </div>

      {/* 전시 상세 모달 */}
      {selectedWorkId && (
        <WorkDetailModal
          workId={selectedWorkId}
          onClose={() => setSelectedWorkId(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/pages/PickDetail.tsx
git commit -m "feat: PickDetail 픽 세션 상세 페이지 추가"
```

---

## Task 5: PickHallOfFame.tsx 신규 생성

**Files:**
- Create: `src/app/pages/PickHallOfFame.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { workStore, useWorkStore } from '../store';
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { displayExhibitionTitle } from '../utils/workDisplay';

export default function PickHallOfFame() {
  const { t } = useI18n();
  useWorkStore();

  const honoredWorks = useMemo(
    () => workStore.getWorks().filter((w) => w.pickBadge === true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workStore.getWorks().length],
  );

  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* 헤더 */}
      <div
        className="relative overflow-hidden text-center py-10 px-4"
        style={{ background: 'linear-gradient(180deg,#0a0600 0%,#080808 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
            style={{ background: 'linear-gradient(180deg,rgba(255,200,0,0.35),transparent)' }} />
        </div>
        <div className="relative">
          <Link
            to="/events?tab=pick"
            className="absolute left-0 top-0 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {t('hallOfFame.back')}
          </Link>
          <h1
            className="text-2xl font-black mb-2"
            style={{
              background: 'linear-gradient(90deg,#b8862f,#ffd700,#e8c04a,#ffd700,#b8862f)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('hallOfFame.title')}
          </h1>
          <p className="text-xs" style={{ color: '#4a3f2a' }}>{t('hallOfFame.subtitle')}</p>
          {honoredWorks.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#4a3f2a' }}>
              {t('hallOfFame.total').replace('{n}', String(honoredWorks.length))}
            </p>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,0,0.3),transparent)' }} />

      {/* 갤러리 그리드 */}
      <div
        className="min-h-[60vh] px-3 py-6"
        style={{ background: '#0d0d0d' }}
      >
        {honoredWorks.length === 0 ? (
          <div className="flex items-center justify-center h-60">
            <p className="text-sm text-center" style={{ color: '#4a5568' }}>
              {t('hallOfFame.empty')}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2">
            {honoredWorks.map((w) => {
              const coverKey = getCoverImage(w.image, w.coverImageIndex);
              const src = imageUrls[coverKey] || coverKey;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWorkId(w.id)}
                  className="text-left rounded-lg overflow-hidden transition-transform lg:hover:scale-[1.03]"
                  style={{ border: '1px solid rgba(255,200,0,0.12)' }}
                >
                  <div className="aspect-square overflow-hidden" style={{ background: '#161616' }}>
                    <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2 py-1.5" style={{ background: '#111' }}>
                    <p className="text-[10px] font-medium truncate" style={{ color: '#9ca3af' }}>
                      {displayExhibitionTitle(w, '(제목 없음)')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedWorkId && (
        <WorkDetailModal
          workId={selectedWorkId}
          onClose={() => setSelectedWorkId(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/pages/PickHallOfFame.tsx
git commit -m "feat: PickHallOfFame 명예의 전당 페이지 추가"
```

---

## Task 6: routes.ts에 신규 라우트 등록

**Files:**
- Modify: `src/app/routes.ts`

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 두 줄 추가:

```typescript
import PickDetail from './pages/PickDetail';
import PickHallOfFame from './pages/PickHallOfFame';
```

- [ ] **Step 2: admin 라우트 앞에 picks 라우트 추가**

`/admin` 라우트 블록 바로 위에 추가 (hall-of-fame를 `:id` 앞에 배치):

```typescript
{ path: '/picks/hall-of-fame', Component: PickHallOfFame },
{ path: '/picks/:id', Component: PickDetail },
```

레이아웃 안에 있어야 Header/Footer가 표시됨. Layout children 배열의 `...demoRoutes` 위에 추가:

```typescript
{ path: 'picks/hall-of-fame', Component: PickHallOfFame },
{ path: 'picks/:id', Component: PickDetail },
```

- [ ] **Step 3: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/routes.ts
git commit -m "feat: /picks/:id, /picks/hall-of-fame 라우트 등록"
```

---

## Task 7: Events.tsx 3탭 구조 전환

**Files:**
- Modify: `src/app/pages/Events.tsx`

- [ ] **Step 1: 필요한 import 추가**

기존 import에 추가:

```typescript
import { Link } from 'react-router-dom';
import { useCuration } from '../utils/curationStore';
import { usePickSessions, derivePickStatus } from '../utils/pickStore';
import { todayLocalIso } from '../utils/localDate';
```

- [ ] **Step 2: 탭 상태 + 데이터 준비 코드 교체**

기존 `upcomingItems` useMemo 제거. 파일 전체를 아래로 교체:

```tsx
import { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { useManagedEvents, deriveEventStatus, type ManagedEvent } from '../utils/eventsStore';
import { toast } from 'sonner';
import { useEventSubscription, setEventSubscribed } from '../utils/eventSubscriptionStore';
import { authStore } from '../store';
import { todayLocalIso } from '../utils/localDate';
import { useCuration } from '../utils/curationStore';
import { usePickSessions, derivePickStatus } from '../utils/pickStore';

type EventsTab = 'events' | 'pick' | 'curation';

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();

  // 탭 URL 동기화
  const rawTab = searchParams.get('tab');
  const activeTab: EventsTab =
    rawTab === 'pick' ? 'pick' : rawTab === 'curation' ? 'curation' : 'events';

  const setTab = (tab: EventsTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'events') next.delete('tab');
        else next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  };

  // 이벤트 탭 데이터
  const allManagedEvents = useManagedEvents();
  const today = todayLocalIso();

  function isDisplayVisible(e: ManagedEvent): boolean {
    const dispStart = e.displayStartAt ?? e.startAt;
    const dispEnd = e.displayEndAt ?? e.endAt;
    return today >= dispStart && today <= dispEnd;
  }

  const activeEvents = useMemo<ManagedEvent[]>(
    () => allManagedEvents.filter((e) => deriveEventStatus(e) === 'active' && isDisplayVisible(e)),
    [allManagedEvents, today],
  );
  const endedEvents = useMemo<ManagedEvent[]>(
    () => allManagedEvents.filter((e) => deriveEventStatus(e) === 'ended'),
    [allManagedEvents],
  );
  const [showEnded, setShowEnded] = useState(false);

  // 이벤트 알림 구독
  const [subscribed, setSubscription] = useEventSubscription();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('unsubscribe') === '1') {
      setEventSubscribed(false);
      toast.success(t('events.unsubscribeToastDone'));
      const next = new URLSearchParams(searchParams);
      next.delete('unsubscribe');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const handleNotifyCta = () => {
    if (!authStore.isLoggedIn()) { setLoginPromptOpen(true); return; }
    if (subscribed) {
      setSubscription(false);
      toast.success(t('events.unsubscribeToastDone'));
    } else {
      setSubscription(true);
      toast.success(t('events.notifyToastSubscribed'));
    }
  };

  // Pick 탭 데이터
  const pickSessions = usePickSessions();
  const activePickSession = useMemo(
    () => pickSessions.find((s) => s.publicationOpen && derivePickStatus(s) === 'active') ?? null,
    [pickSessions],
  );

  // 기획전 탭 데이터
  const { curatedExhibitions } = useCuration();
  const publishedCurations = useMemo(
    () => curatedExhibitions.filter((c) => !!c.pageUrl),
    [curatedExhibitions],
  );
  const activeCurations = useMemo(
    () => publishedCurations.filter((c) => !c.endAt || today <= c.endAt),
    [publishedCurations, today],
  );
  const endedCurations = useMemo(
    () => publishedCurations.filter((c) => !!c.endAt && today > c.endAt),
    [publishedCurations, today],
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">{t('events.title')}</h1>

        {/* 탭 */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(['events', 'pick', 'curation'] as EventsTab[]).map((tab) => {
            const label = tab === 'events' ? t('events.tabEvents') : tab === 'pick' ? t('events.tabPick') : t('events.tabCuration');
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground lg:hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 이벤트 탭 */}
        {activeTab === 'events' && (
          <div>
            {/* 진행 중 */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('events.activeSection')}</h2>
              {activeEvents.length === 0 ? (
                <div className="rounded-2xl bg-muted/40 h-[140px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-7 w-7" />
                  <p className="text-sm font-medium">{t('events.noActiveEvents')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {activeEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="group cursor-pointer relative overflow-hidden rounded-2xl"
                    >
                      <div className="relative h-[200px] sm:h-[260px] lg:h-[320px] w-full overflow-hidden">
                        <ImageWithFallback
                          src={event.bannerImageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-700 lg:group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              {t('events.activeBadge')}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-1.5">
                            {event.title}
                          </h3>
                          {event.subtitle && (
                            <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-2 max-w-2xl">
                              {event.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{event.startAt} ~ {event.endAt}</span>
                            {event.participantsLabel && (
                              <span className="opacity-80">· {event.participantsLabel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 지난 이벤트 */}
            {endedEvents.length > 0 && (
              <section className="mb-12 sm:mb-16">
                <button
                  type="button"
                  onClick={() => setShowEnded((v) => !v)}
                  className="flex items-center gap-2 text-base sm:text-lg font-semibold text-muted-foreground lg:hover:text-foreground transition-colors mb-4 min-h-[44px]"
                >
                  {t('events.endedSection')}
                  <span className="text-sm font-normal opacity-60">({endedEvents.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showEnded ? 'rotate-180' : ''}`} />
                </button>
                {showEnded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {endedEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card opacity-70 lg:hover:opacity-100 transition-all duration-300 lg:hover:shadow-md"
                      >
                        <div className="relative h-[140px] sm:h-[160px] overflow-hidden grayscale lg:group-hover:grayscale-0 transition-all duration-300">
                          <ImageWithFallback
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-bold text-foreground mb-1 leading-snug">{event.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{event.startAt} ~ {event.endAt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 알림받기 */}
            <div className="mb-12">
              <Button
                variant={subscribed ? 'outline' : 'default'}
                onClick={handleNotifyCta}
                className="min-h-[44px]"
              >
                {subscribed ? t('events.notifySubscribed') : t('events.notifyCta')}
              </Button>
            </div>
          </div>
        )}

        {/* Pick 탭 */}
        {activeTab === 'pick' && (
          <div className="max-w-2xl">
            {activePickSession ? (
              <Link
                to={`/picks/${activePickSession.id}`}
                className="block rounded-2xl overflow-hidden border border-border bg-card lg:hover:shadow-md transition-shadow mb-8"
                style={{ background: 'linear-gradient(135deg,#0d0900,#1a1000)' }}
              >
                <div className="p-6 text-center">
                  <p className="text-2xl mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(255,200,0,0.4))' }}>🏆</p>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#b8862f' }}>
                    {t('pickDetail.heading')}
                  </p>
                  <h2 className="text-xl font-black mb-2" style={{ color: '#ffd700' }}>
                    {activePickSession.title}
                  </h2>
                  <p className="text-xs mb-4" style={{ color: '#4a3f2a' }}>
                    {activePickSession.startAt} ~ {activePickSession.endAt}
                    {' · '}
                    {t('pickDetail.selectedCount').replace('{n}', String(activePickSession.selectedWorkIds?.length ?? 0))}
                  </p>
                  <span className="inline-block text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: 'rgba(255,200,0,0.15)', color: '#ffd700' }}>
                    {t('events.pickViewSelected')} →
                  </span>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl bg-muted/40 h-[140px] flex items-center justify-center mb-8">
                <p className="text-sm text-muted-foreground">{t('events.pickNoActive')}</p>
              </div>
            )}

            {/* 명예의 전당 CTA */}
            <Link
              to="/picks/hall-of-fame"
              className="flex items-center justify-between px-5 py-4 rounded-xl transition-colors lg:hover:opacity-80"
              style={{ border: '1px solid rgba(255,200,0,0.25)', background: 'rgba(255,200,0,0.03)' }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: '#ffd700' }}>{t('events.pickHallOfFameCta')}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{t('events.pickHallOfFameCtaDesc')}</p>
              </div>
              <span className="text-sm" style={{ color: '#b8862f' }}>→</span>
            </Link>
          </div>
        )}

        {/* 기획전 탭 */}
        {activeTab === 'curation' && (
          <div className="max-w-2xl">
            {/* 진행 중 기획전 */}
            {activeCurations.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t('events.curationActive')}
                </h2>
                <div className="flex flex-col gap-3">
                  {activeCurations.map((c) => (
                    <a
                      key={c.id}
                      href={c.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card lg:hover:shadow-sm transition-shadow"
                    >
                      {c.bannerImageUrl ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border">
                          <ImageWithFallback src={c.bannerImageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                        {c.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.pieces.length}작품
                          {c.startAt && c.endAt ? ` · ${c.startAt} ~ ${c.endAt}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-primary shrink-0">{t('events.curationViewPage')} ↗</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {activeCurations.length === 0 && endedCurations.length === 0 && (
              <div className="rounded-2xl bg-muted/40 h-[140px] flex items-center justify-center mb-8">
                <p className="text-sm text-muted-foreground">{t('events.curationNone')}</p>
              </div>
            )}

            {/* 지난 기획전 */}
            {endedCurations.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t('events.curationEnded')}
                </h2>
                <div className="flex flex-col gap-3">
                  {endedCurations.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card opacity-50 cursor-not-allowed"
                      title={t('events.curationEndedBlocked')}
                    >
                      {c.bannerImageUrl ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border">
                          <ImageWithFallback src={c.bannerImageUrl} alt="" className="w-full h-full object-cover grayscale" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.pieces.length}작품 · {c.startAt} ~ {c.endAt}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{t('events.curationEndedBlocked')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="like" />
    </div>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

- [ ] **Step 3: 개발 서버에서 확인**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npm run dev
```

브라우저에서 확인:
- `http://localhost:5173/events` → 이벤트 탭 (예정 섹션 없음, 진행중 + 지난)
- `http://localhost:5173/events?tab=pick` → Pick 탭
- `http://localhost:5173/events?tab=curation` → 기획전 탭
- `http://localhost:5173/picks/hall-of-fame` → 명예의 전당
- 어드민 `/admin/picks`에서 픽 세션 ID 확인 후 `http://localhost:5173/picks/<id>` 접속

- [ ] **Step 4: 커밋**

```bash
git add src/app/pages/Events.tsx
git commit -m "feat: Events 탭 3탭 구조 전환 (이벤트|Pick|기획전), 예정 섹션 제거"
```
