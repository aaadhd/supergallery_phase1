# Pick · 기획전 · 추천 전시 UX 재설계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pick·기획전·추천전시 어드민 3개 페이지를 분할 레이아웃 + 갤러리 클릭 토글 패턴으로 재설계하고, ContentReview에 ★ 즉시 추천 토글을 추가한다.

**Architecture:** Pick·기획전은 좌측 목록 + 우측 갤러리 분할 레이아웃으로 교체 (검수·신고·문의와 동일 패턴). 기존 비즈니스 로직(publishPickSession, saveEditor, featuredStore.toggle 등)은 완전 보존하고 렌더링 구조만 교체한다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, @dnd-kit/core + @dnd-kit/sortable (이미 설치됨), imageUrls 패턴

---

## 수정 파일 목록

| 파일 | 변경 규모 |
|---|---|
| `src/app/admin/PickManagement.tsx` | 대형 — 레이아웃 전면 교체, 갤러리 선정 추가 |
| `src/app/admin/CurationManagement.tsx` | 대형 — 평면 갤러리 + dnd-kit 하단 바 |
| `src/app/admin/FeaturedManagement.tsx` | 중형 — 추천 중 목록 + 팝업 |
| `src/app/admin/ContentReview.tsx` | 소형 — ★/☆ 아이콘 추가 |

---

## 코드 이해에 필요한 기존 API

### pickStore (src/app/utils/pickStore.ts)
```ts
pickStore.add(payload)            // 새 세션 생성, 생성된 PickSession 반환
pickStore.update(id, patch)       // 세션 업데이트
pickStore.get(id)                 // 단건 조회
pickStore.getAll()                // 전체 조회
usePickSessions()                 // 구독 훅
derivePickStatus(session)         // 'scheduled'|'active'|'ended'
type PickSession = { id, title, startAt, endAt, bannerImageUrl, selectedWorkIds, publicationOpen, status }
```

### featuredStore (src/app/utils/featuredStore.ts)
```ts
featuredStore.toggle(workId)      // 즉시 추천/해제 (localStorage 영속)
useFeaturedExhibitions()          // string[] 구독 훅
```

### curationStore (src/app/utils/curationStore.ts)
```ts
curationStore.addCuratedExhibition(payload)
curationStore.updateCuratedExhibition(id, patch)
curationStore.deleteCuratedExhibition(id)
useCuration()  // { curatedExhibitions: CuratedExhibition[] }
type CurationPieceRef = { workId: string; pieceId: string }
type CuratedExhibition = { id, title, subtitle?, startAt?, endAt?, pieces: CurationPieceRef[] }
```

### imageUrls 패턴
```ts
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
// 사용:
const key = getCoverImage(w.image, w.coverImageIndex);
const src = imageUrls[key] || key;
```

---

## Task 1: PickManagement — 분할 레이아웃 + 갤러리 선정

**Files:**
- Modify: `src/app/admin/PickManagement.tsx`

기존 모달 편집기를 제거하고, 좌측 세션 목록 + 우측 갤러리/폼 분할 레이아웃으로 교체한다. 비즈니스 로직(`publishPickSession`, `saveDraft`, `validateDraft` 등)은 그대로 유지한다.

- [ ] **Step 1-1: 상태 단순화 — showEditor + editingId → selectedId**

`showEditor: boolean` + `editingId: string | null` → `selectedId: string | null`으로 통합 (`null`=아무것도 선택 안 됨, `'new'`=신규 생성, 그 외=세션 ID).  
`showWorkPicker: boolean`, `viewingHistoryId: string | null`도 삭제.

```tsx
// 삭제:
// const [showEditor, setShowEditor] = useState(false);
// const [editingId, setEditingId] = useState<string | null>(null);
// const [showWorkPicker, setShowWorkPicker] = useState(false);
// const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

// 추가:
const [selectedId, setSelectedId] = useState<string | null>(null);
// draft, pickerSearch, pickedReason 등 나머지 상태는 유지
```

- [ ] **Step 1-2: openNew / openEdit / closeEditor 함수 교체**

```tsx
const openNew = () => {
  setSelectedId('new');
  setDraft(emptyDraft);
  setPickerSearch('');
};

const openEdit = (session: PickSession) => {
  setSelectedId(session.id);
  setDraft({
    title: session.title,
    startAt: session.startAt,
    endAt: session.endAt,
    bannerImageUrl: session.bannerImageUrl ?? '',
    workIds: session.selectedWorkIds ?? [],
  });
  setPickerSearch('');
};

const closePanel = () => {
  setSelectedId(null);
  setDraft(emptyDraft);
  setPickerSearch('');
};
```

- [ ] **Step 1-3: saveDraft / handlePublish / endSession 함수 내 editingId → selectedId 교체**

```tsx
const saveDraft = (e: FormEvent) => {
  e.preventDefault();
  if (!validateDraft()) return;
  const payload = buildPayload();
  if (selectedId && selectedId !== 'new') {
    pickStore.update(selectedId, payload);
    appendAuditLog({ action: 'event_saved', targetId: selectedId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
  } else {
    const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
    setSelectedId(created.id);
    appendAuditLog({ action: 'event_saved', targetId: created.id, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
  }
  toast.success('임시저장되었습니다.');
};

const handlePublish = async () => {
  if (!validateDraft(true)) return;
  const hasOtherActive = sessions.some((e) => e.id !== selectedId && getPickStatus(e) === 'active');
  if (hasOtherActive) {
    const ok = await openConfirm({
      title: '현재 발행 중인 픽 세션이 있습니다',
      description: '기존 세션을 종료하고 새 세션을 발행합니다. 계속할까요?',
      confirmLabel: '발행',
    });
    if (!ok) return;
  }
  const payload = buildPayload();
  let targetId = (selectedId && selectedId !== 'new') ? selectedId : null;
  if (targetId) {
    pickStore.update(targetId, payload);
  } else {
    const created = pickStore.add({ description: '', publicationOpen: false, ...payload });
    targetId = created.id;
    setSelectedId(targetId);
  }
  publishPickSession(targetId);
  appendAuditLog({ action: 'event_published', targetId, targetSnapshot: { title: payload.title }, actorId: 'admin', actorRole: 'admin' });
  toast.success('발행되었습니다.');
};
```

- [ ] **Step 1-4: toggleWork 함수 추가 (갤러리 클릭 토글)**

```tsx
const toggleWork = (work: Work) => {
  if (draftWorkIdSet.has(work.id)) {
    removeWork(work.id);
  } else {
    addWork(work);
  }
};
```

- [ ] **Step 1-5: galleryWorks — 전체 공개 전시 목록 (검색 필터)**

```tsx
const debouncedGallerySearch = useDebouncedValue(pickerSearch, 300);
const galleryWorks = useMemo(() => {
  const q = debouncedGallerySearch.trim().toLowerCase();
  return works
    .filter(isWorkPublic)
    .filter((w) => {
      if (!q) return true;
      return (
        displayExhibitionTitle(w, '').toLowerCase().includes(q) ||
        (w.artist?.name || '').toLowerCase().includes(q)
      );
    });
}, [debouncedGallerySearch, works]);
```

- [ ] **Step 1-6: return JSX — 분할 레이아웃으로 전면 교체**

`loading` 처리 아래의 전체 return JSX를 아래로 교체:

```tsx
return (
  <div className="min-h-full">
    <h1 className="text-xl font-bold mb-1 text-foreground">픽 관리</h1>
    <p className="text-sm text-muted-foreground mb-4">
      Proud's Pick 세션을 만들고 선정 작품을 관리합니다.
    </p>

    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>

        {/* 좌: 세션 목록 */}
        <div className="border-r border-border bg-muted/30 flex flex-col" style={{ minHeight: '72vh' }}>
          <div className="p-3 border-b border-border flex justify-between items-center">
            <span className="text-sm font-semibold">픽 세션</span>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1 bg-primary text-white rounded-md px-2.5 py-1 text-xs font-medium lg:hover:bg-primary/90"
            >
              <Plus className="w-3 h-3" /> 새로
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {sessions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">세션이 없습니다</div>
            )}
            {sessions.map((session) => {
              const status = getPickStatus(session);
              const isSelected = selectedId === session.id;
              const isEnded = status === 'ended';
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => openEdit(session)}
                  className={`w-full text-left px-3 py-3 border-b border-border/40 transition-colors ${
                    isSelected ? 'bg-primary/[.06] border-l-2 border-l-primary' : 'lg:hover:bg-muted/50'
                  } ${isEnded ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium text-sm truncate mb-1">{session.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    <span>{session.startAt?.slice(5)} ~ {session.endAt?.slice(5)}</span>
                    <span>{(session.selectedWorkIds?.length ?? 0)}개</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우: 폼 또는 갤러리 */}
        <div className="flex flex-col" style={{ minHeight: '72vh' }}>
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              세션을 선택하거나 새로 만드세요
            </div>
          ) : selectedId === 'new' ? (
            /* 신규 세션 생성 폼 */
            <div className="p-6 max-w-md">
              <h2 className="text-base font-bold mb-4">새 픽 세션</h2>
              <form onSubmit={saveDraft} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">제목 <span className="text-destructive">*</span></label>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="5월 2주차 Proud's Pick"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">시작일 *</label>
                    <input type="date" value={draft.startAt}
                      onChange={(e) => setDraft((d) => ({ ...d, startAt: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <span className="mt-4 text-muted-foreground">~</span>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">종료일 *</label>
                    <input type="date" value={draft.endAt}
                      onChange={(e) => setDraft((d) => ({ ...d, endAt: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">배너 이미지 URL <span className="text-muted-foreground text-xs">(선택)</span></label>
                  <input
                    value={draft.bannerImageUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, bannerImageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={closePanel}
                    className="flex-1 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground lg:hover:bg-muted/50">
                    취소
                  </button>
                  <button type="submit"
                    className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium lg:hover:bg-primary/90">
                    저장 → 작품 선정으로
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 기존 세션 편집 — 갤러리 + 하단 바 */
            (() => {
              const session = sessions.find((s) => s.id === selectedId);
              const isEnded = session ? getPickStatus(session) === 'ended' : false;
              return (
                <>
                  {/* 갤러리 영역 */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <h2 className="text-sm font-bold flex-1 truncate">{draft.title}</h2>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="작품·작가 검색…"
                        className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm w-48"
                      />
                    </div>
                    {!isEnded && (
                      <form onSubmit={saveDraft}>
                        <button type="submit"
                          className="border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground lg:hover:bg-muted/50">
                          정보 수정
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                    {galleryWorks.length === 0 ? (
                      <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                        {galleryWorks.map((w) => {
                          const key = getCoverImage(w.image, w.coverImageIndex);
                          const src = imageUrls[key] || key;
                          const orderIdx = draft.workIds.indexOf(w.id);
                          const isSelected = orderIdx >= 0;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              disabled={isEnded}
                              onClick={() => toggleWork(w)}
                              className={`group relative rounded-lg overflow-hidden border-2 transition-all disabled:pointer-events-none ${
                                isSelected ? 'border-primary shadow-md' : 'border-transparent lg:hover:border-primary/40'
                              }`}
                            >
                              <div className="aspect-square bg-muted">
                                <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                              </div>
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {orderIdx + 1}
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {displayExhibitionTitle(w, '')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 하단 고정 바 */}
                  {!isEnded && (
                    <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 shrink-0">
                      {draftWorks.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext items={draft.workIds} strategy={verticalListSortingStrategy}>
                            <div className="flex gap-1.5 overflow-x-auto">
                              {draftWorks.map((w) => {
                                const key = getCoverImage(w.image, w.coverImageIndex);
                                const src = imageUrls[key] || key;
                                return (
                                  <PickBottomBarItem
                                    key={w.id}
                                    id={w.id}
                                    src={src}
                                    onRemove={() => removeWork(w.id)}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <span className="text-slate-500 text-xs">갤러리에서 작품을 클릭해 선정하세요</span>
                      )}
                      <div className="text-violet-300 text-xs font-semibold shrink-0 ml-1">
                        {draft.workIds.length} / {MAX_PICKS}개
                      </div>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={(e) => saveDraft(e as unknown as FormEvent)}
                        className="border border-slate-600 text-slate-300 rounded-md px-3 py-1.5 text-xs lg:hover:bg-slate-700"
                      >
                        임시저장
                      </button>
                      <button
                        type="button"
                        onClick={handlePublish}
                        className="bg-primary text-white rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-primary/90"
                      >
                        발행
                      </button>
                      {session && getPickStatus(session) === 'active' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await openConfirm({ title: '게시 종료', description: '픽 세션을 종료하면 선정 작품의 픽 배지가 해제됩니다.', confirmLabel: '종료', destructive: true });
                            if (ok) endPickSession(selectedId);
                          }}
                          className="border border-red-800 text-red-400 rounded-md px-3 py-1.5 text-xs lg:hover:bg-red-900/30"
                        >
                          게시 종료
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>

      </div>
    </div>
  </div>
);
```

- [ ] **Step 1-7: PickBottomBarItem 인라인 컴포넌트 추가 (파일 하단)**

```tsx
function PickBottomBarItem({ id, src, onRemove }: { id: string; src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative w-10 h-10 rounded overflow-hidden border-2 border-violet-500 shrink-0 cursor-grab"
    >
      <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        className="absolute top-0 right-0 bg-black/60 text-white rounded-bl text-[8px] px-0.5 leading-none lg:hover:bg-red-600"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 1-8: 불필요한 기존 JSX 제거**

기존 모달 오버레이 (`{showEditor && <div className="fixed inset-0 z-40 ...">`) 전체 블록, 히스토리 섹션(`viewingHistoryId`) 관련 JSX, 세션 카드 그리드 전체 삭제.

- [ ] **Step 1-9: import 정리**

추가: `getCoverImage` (이미 있음), `imageUrls` (이미 있음)  
`Search` lucide 아이콘 import에 추가 (이미 있을 수 있음 — 확인 후 추가).

- [ ] **Step 1-10: TypeScript 검사**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본"
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 1-11: 브라우저 확인 (localhost:5173/admin/picks)**

- 좌측 세션 목록 + 우측 갤러리 분할 레이아웃 확인
- `[+ 새로]` 클릭 → 우측에 폼 표시
- 폼 저장 → 갤러리 자동 진입
- 전시 클릭 → 선정/해제, 번호 뱃지 확인
- 10개 초과 클릭 → 토스트
- 하단 바 드래그 순서 조정 확인
- 발행 버튼 클릭 → 기존 픽 로직 동작

- [ ] **Step 1-12: Commit**

```bash
git add src/app/admin/PickManagement.tsx
git commit -m "feat: PickManagement 분할 레이아웃 + 갤러리 클릭 선정"
```

---

## Task 2: CurationManagement — 평면 이미지 갤러리 + dnd-kit 하단 바

**Files:**
- Modify: `src/app/admin/CurationManagement.tsx`

기존 2단계 선택(작품 펼침 → piece 클릭)을 평면 갤러리(모든 이미지 한 그리드)로 교체한다. 순서 조정을 화살표 버튼에서 dnd-kit 하단 바로 교체한다.

- [ ] **Step 2-1: import 추가 및 EditorState 수정**

파일 상단에 추가:
```tsx
import { getCoverImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
```

`EditorState`에서 `expandedWorkId: string | null` 제거:
```tsx
type EditorState = {
  mode: 'create' | 'edit';
  editingId?: string;
  title: string;
  subtitle: string;
  startAt: string;
  endAt: string;
  pieces: SelectedPiece[];
  search: string;
  // expandedWorkId 제거
};

function emptyEditor(): EditorState {
  return { mode: 'create', title: '', subtitle: '', startAt: '', endAt: '', pieces: [], search: '' };
}

function fromExhibition(c: CuratedExhibition): EditorState {
  return {
    mode: 'edit', editingId: c.id, title: c.title, subtitle: c.subtitle ?? '',
    startAt: c.startAt ?? '', endAt: c.endAt ?? '',
    pieces: c.pieces.map((p) => ({ workId: p.workId, pieceId: p.pieceId })),
    search: '',
  };
}
```

- [ ] **Step 2-2: selectedCurationId 상태 추가**

```tsx
const [selectedCurationId, setSelectedCurationId] = useState<string | null>(null);
```

`openCreate`:
```tsx
const openCreate = () => {
  setEditor(emptyEditor());
  setSelectedCurationId('new');
};
```

`openEdit`:
```tsx
const openEdit = (c: CuratedExhibition) => {
  setEditor(fromExhibition(c));
  setSelectedCurationId(c.id);
};
```

`closeEditor`:
```tsx
const closeEditor = () => {
  setEditor(null);
  setSelectedCurationId(null);
};
```

- [ ] **Step 2-3: movePiece 삭제 → handlePieceDragEnd 추가**

`movePiece` 함수 삭제. 대신:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);

const handlePieceDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  setEditor((prev) => {
    if (!prev) return prev;
    const oldIdx = prev.pieces.findIndex((p) => pieceKey(p) === active.id);
    const newIdx = prev.pieces.findIndex((p) => pieceKey(p) === over.id);
    if (oldIdx < 0 || newIdx < 0) return prev;
    return { ...prev, pieces: arrayMove(prev.pieces, oldIdx, newIdx) };
  });
};
```

- [ ] **Step 2-4: allPieces — 평면 이미지 목록 빌드**

```tsx
type PieceItem = {
  workId: string;
  pieceId: string;
  imgKey: string;
  workTitle: string;
  isPublic: boolean;
};

const allPieces = useMemo((): PieceItem[] => {
  const q = editor?.search.trim().toLowerCase() ?? '';
  return allWorks
    .filter((w) => {
      if (!q) return true;
      const title = (w.exhibitionName || w.title || '').toLowerCase();
      const artist = (w.artist?.name || '').toLowerCase();
      return title.includes(q) || artist.includes(q);
    })
    .flatMap((w) => {
      const images = getWorkImages(w);
      const pieceIds = Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${w.id}_piece${i}`);
      return images.map((imgKey, i) => ({
        workId: w.id,
        pieceId: pieceIds[i] ?? `${w.id}_piece${i}`,
        imgKey,
        workTitle: displayExhibitionTitle(w, ''),
        isPublic: isWorkPublic(w),
      }));
    });
}, [allWorks, editor?.search]);
```

- [ ] **Step 2-5: selectedPieceKeys 집합**

```tsx
const selectedPieceKeys = useMemo(
  () => new Set(editor?.pieces.map(pieceKey) ?? []),
  [editor?.pieces],
);
```

- [ ] **Step 2-6: return JSX — 분할 레이아웃으로 교체**

현재 `if (isEditorOpen)` 분기로 full-screen 편집기를 표시하는 구조를 분할 레이아웃으로 교체:

```tsx
return (
  <div className="min-h-full">
    <h1 className="text-xl font-bold mb-1 text-foreground">기획전 관리</h1>
    <p className="text-sm text-muted-foreground mb-4">
      테마 기획전을 만들고 개별 이미지(piece)를 큐레이션합니다.
    </p>

    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>

        {/* 좌: 기획전 목록 */}
        <div className="border-r border-border bg-muted/30 flex flex-col" style={{ minHeight: '72vh' }}>
          <div className="p-3 border-b border-border flex justify-between items-center">
            <span className="text-sm font-semibold">기획전</span>
            <button type="button" onClick={openCreate}
              className="inline-flex items-center gap-1 bg-sky-600 text-white rounded-md px-2.5 py-1 text-xs font-medium lg:hover:bg-sky-700">
              <Plus className="w-3 h-3" /> 새로
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {curatedExhibitions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">기획전이 없습니다</div>
            )}
            {curatedExhibitions.map((c) => {
              const isSelected = selectedCurationId === c.id;
              const bannerWork = c.pieces[0]
                ? workStore.getWork(c.pieces[0].workId) : null;
              const bannerKey = bannerWork ? getCoverImage(bannerWork.image, bannerWork.coverImageIndex) : '';
              const bannerSrc = bannerKey ? (imageUrls[bannerKey] || bannerKey) : '';
              return (
                <button key={c.id} type="button" onClick={() => openEdit(c)}
                  className={`w-full text-left flex gap-3 items-start px-3 py-3 border-b border-border/40 transition-colors ${
                    isSelected ? 'bg-sky-50 border-l-2 border-l-sky-600' : 'lg:hover:bg-muted/50'
                  }`}>
                  {bannerSrc ? (
                    <div className="w-10 h-10 rounded overflow-hidden border border-border shrink-0">
                      <ImageWithFallback src={bannerSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted border border-border shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground">piece {c.pieces.length}개</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우: 편집기 */}
        <div className="flex flex-col" style={{ minHeight: '72vh' }}>
          {!editor ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              기획전을 선택하거나 새로 만드세요
            </div>
          ) : (
            <>
              {/* 기획전 메타 + 검색 */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">제목 *</label>
                    <input value={editor.title}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                      placeholder="봄의 기억들"
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">부제</label>
                    <input value={editor.subtitle}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, subtitle: e.target.value } : prev)}
                      placeholder="봄을 담은 작품 모음"
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">시작일</label>
                    <input type="date" value={editor.startAt}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, startAt: e.target.value } : prev)}
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">종료일</label>
                    <input type="date" value={editor.endAt}
                      onChange={(e) => setEditor((prev) => prev ? { ...prev, endAt: e.target.value } : prev)}
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={editor.search}
                    onChange={(e) => setEditor((prev) => prev ? { ...prev, search: e.target.value } : prev)}
                    placeholder="전시·작가 검색…"
                    className="w-full pl-7 pr-3 py-1.5 border border-border rounded-lg text-sm" />
                </div>
              </div>

              {/* 평면 이미지 갤러리 */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                {allPieces.length === 0 ? (
                  <div className="text-center py-16 text-sm text-muted-foreground">공개된 전시가 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                    {allPieces.map((piece) => {
                      const key = `${piece.workId}:${piece.pieceId}`;
                      const src = imageUrls[piece.imgKey] || piece.imgKey;
                      const orderIdx = editor.pieces.findIndex((p) => pieceKey(p) === key);
                      const isSelected = orderIdx >= 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!piece.isPublic}
                          onClick={() => togglePiece(piece.workId, piece.pieceId)}
                          title={piece.workTitle}
                          className={`group relative rounded-lg overflow-hidden border-2 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                            isSelected ? 'border-primary shadow-md' : 'border-transparent lg:hover:border-primary/40'
                          }`}
                        >
                          <div className="aspect-square bg-muted">
                            <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {orderIdx + 1}
                            </div>
                          )}
                          {!piece.isPublic && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-white text-[9px] font-medium">비공개</span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {piece.workTitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 하단 고정 바 */}
              <div className="bg-sky-950 px-4 py-3 flex items-center gap-3 shrink-0">
                {editor.pieces.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePieceDragEnd}>
                    <SortableContext items={editor.pieces.map(pieceKey)} strategy={verticalListSortingStrategy}>
                      <div className="flex gap-1.5 overflow-x-auto">
                        {editor.pieces.map((p) => {
                          const w = workStore.getWork(p.workId);
                          const images = w ? getWorkImages(w) : [];
                          const pieceIds = w && Array.isArray(w.imagePieceIds) ? w.imagePieceIds : images.map((_, i) => `${p.workId}_piece${i}`);
                          const idx = pieceIds.indexOf(p.pieceId);
                          const imgKey = images[idx] ?? '';
                          const src = imageUrls[imgKey] || imgKey;
                          const pKey = pieceKey(p);
                          return (
                            <CurationBottomBarItem
                              key={pKey}
                              id={pKey}
                              src={src}
                              onRemove={() => removeSelected(pKey)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <span className="text-sky-400 text-xs">갤러리에서 이미지를 클릭해 piece를 선정하세요</span>
                )}
                <div className="text-sky-300 text-xs font-semibold shrink-0 ml-1">
                  {editor.pieces.length}개 선정
                </div>
                <div className="flex-1" />
                <button type="button" onClick={closeEditor}
                  className="border border-sky-700 text-sky-300 rounded-md px-3 py-1.5 text-xs lg:hover:bg-sky-900">
                  취소
                </button>
                <button type="button" onClick={saveEditor}
                  className="bg-sky-600 text-white rounded-md px-3 py-1.5 text-xs font-semibold lg:hover:bg-sky-700">
                  게시
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  </div>
);
```

- [ ] **Step 2-7: CurationBottomBarItem 컴포넌트 추가 (파일 하단)**

```tsx
function CurationBottomBarItem({ id, src, onRemove }: { id: string; src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative w-10 h-10 rounded overflow-hidden border-2 border-sky-400 shrink-0 cursor-grab"
    >
      <ImageWithFallback src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        className="absolute top-0 right-0 bg-black/60 text-white rounded-bl text-[8px] px-0.5 leading-none lg:hover:bg-red-600"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2-8: 기존 편집기 JSX 제거**

기존 `isEditorOpen` 분기로 렌더링하던 full-page 편집기(작품 카드 그리드 + right 패널)와 기획전 카드 그리드 전체 삭제.

- [ ] **Step 2-9: 불필요한 import 정리**

삭제: `ArrowUp`, `ArrowDown` (movePiece 제거됨).  
`Check` 아이콘도 확인 후 불필요하면 삭제.

- [ ] **Step 2-10: TypeScript 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 2-11: 브라우저 확인 (localhost:5173/admin/curations)**

- 좌측 기획전 목록 + 우측 평면 갤러리 확인
- 이미지 클릭 → piece 선정/해제, 번호 뱃지 표시
- 비공개 이미지 클릭 불가 + "비공개" 오버레이
- 하단 바 드래그 순서 조정 확인
- 게시 → 기존 알림 로직 동작

- [ ] **Step 2-12: Commit**

```bash
git add src/app/admin/CurationManagement.tsx
git commit -m "feat: CurationManagement 평면 갤러리 + dnd-kit 하단 바"
```

---

## Task 3: FeaturedManagement — 추천 중 목록 + 팝업 추가

**Files:**
- Modify: `src/app/admin/FeaturedManagement.tsx`

추천 중인 전시만 메인에 표시하고, 새 추천은 "추천 추가" 팝업 갤러리를 통해 등록한다.

- [ ] **Step 3-1: showAddPopup 상태 + popupSearch 추가**

```tsx
const [showAddPopup, setShowAddPopup] = useState(false);
const [popupSearch, setPopupSearch] = useState('');
```

- [ ] **Step 3-2: featuredList — 추천 중인 것만**

```tsx
// 기존 sortedWorks / filtered 유지하되, 추천 중 목록은 별도로 분리
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
```

- [ ] **Step 3-3: popupWorks — 추천 안 된 것만**

```tsx
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
```

- [ ] **Step 3-4: return JSX 교체**

```tsx
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
```

- [ ] **Step 3-5: import 추가**

```tsx
import { Plus, X } from 'lucide-react';  // 기존 import에 추가
import { ImageWithFallback } from '../components/ImageWithFallback';  // 추가
import { imageUrls } from '../imageUrls';  // 추가
```

- [ ] **Step 3-6: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 3-7: 브라우저 확인 (localhost:5173/admin/featured)**

- 추천 중인 전시만 표시
- ★ 클릭 → 즉시 해제
- `[추천 추가]` → 팝업 열림, 검색 가능
- 팝업에서 전시 클릭 → 즉시 추천 + 메인 목록에 나타남
- 팝업 닫기 → 메인 목록 확인

- [ ] **Step 3-8: Commit**

```bash
git add src/app/admin/FeaturedManagement.tsx
git commit -m "feat: FeaturedManagement 추천 중 목록 + 팝업 추가"
```

---

## Task 4: ContentReview — ★/☆ 즉시 추천 토글 추가

**Files:**
- Modify: `src/app/admin/ContentReview.tsx`

검수 좌측 목록 각 행에 ★/☆ 아이콘을 추가해 검수 중에 바로 추천 토글이 가능하게 한다.

- [ ] **Step 4-1: featuredStore import + useFeaturedExhibitions 구독**

파일 상단에 추가:
```tsx
import { featuredStore, useFeaturedExhibitions } from '../utils/featuredStore';
```

컴포넌트 내에 추가 (기존 `const { t } = useI18n();` 아래):
```tsx
const featuredIds = useFeaturedExhibitions();
const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);
```

- [ ] **Step 4-2: Star 아이콘 import 추가**

```tsx
import { Check, X, Star } from 'lucide-react';
```

- [ ] **Step 4-3: 목록 각 행에 ★/☆ 버튼 추가**

ContentReview의 좌측 목록 `<button key={w.id}...>` 내부, 썸네일과 텍스트 영역 사이에 추가. 현재 `div className="flex-1 min-w-0"` 다음에:

```tsx
<button
  type="button"
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => {
    e.stopPropagation();
    featuredStore.toggle(w.id);
  }}
  className={`shrink-0 p-1 rounded transition-colors ${
    featuredSet.has(w.id)
      ? 'text-amber-500 lg:hover:text-amber-400'
      : 'text-muted-foreground/40 lg:hover:text-amber-400'
  }`}
  title={featuredSet.has(w.id) ? '추천 중 — 클릭해서 해제' : '클릭해서 추천'}
>
  <Star className={`w-3.5 h-3.5 ${featuredSet.has(w.id) ? 'fill-amber-500' : ''}`} />
</button>
```

- [ ] **Step 4-4: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 4-5: 브라우저 확인 (localhost:5173/admin/review)**

- 검수 목록 각 행에 ★/☆ 아이콘 표시
- ★ 클릭 → 즉시 채워짐 (추천), 다시 클릭 → 해제
- 행 클릭(상세 패널 열기)이 ★ 클릭에 의해 트리거되지 않음 (stopPropagation 확인)
- `/admin/featured`에서 해당 전시가 추천 목록에 나타남 확인

- [ ] **Step 4-6: Commit**

```bash
git add src/app/admin/ContentReview.tsx
git commit -m "feat: ContentReview 검수 목록에 즉시 추천 ★ 토글 추가"
```

---

## 최종 검증 체크리스트

- [ ] `npx tsc --noEmit` — 에러 없음
- [ ] Pick: 세션 클릭 → 갤러리, 전시 클릭 토글, 번호 뱃지, 하단 바 드래그, 발행
- [ ] Pick: 10개 초과 → 토스트, 발행 시 이전 활성 세션 자동 종료
- [ ] 기획전: 이미지 클릭 piece 선정, 비공개 이미지 차단, 하단 바 드래그, 게시 알림
- [ ] 추천 전시: 추천 중 목록만 표시, 팝업 검색·추가·해제 동작
- [ ] ContentReview: ★ 클릭 추천 토글, 행 선택과 충돌 없음
- [ ] `/admin/featured` ↔ ContentReview ★ 상태 동기화 (같은 featuredStore)
