# WorkImageViewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전시상세모달·내 작품 탭 공통 풀스크린 이미지 뷰어(`WorkImageViewer`) 생성 — 싱글탭 진입, 딥줌(MAX 4x, 버튼 0.5 step), 플로팅 버튼 레이아웃.

**Architecture:** 새 컴포넌트 `WorkImageViewer`를 만들어 기존 `DeepZoomViewer`를 대체한다. `WorkDetailModal`은 싱글탭 시 뷰어를 열고 기존 CSS 2.5x 인라인 줌 state를 제거한다. `Profile` PRF-14 인라인 뷰어 JSX를 `WorkImageViewer`로 교체한다.

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react, `CopyrightProtectedImage`

---

## 파일 맵

| 동작 | 파일 |
|---|---|
| 신규 생성 | `src/app/components/WorkImageViewer.tsx` |
| 수정 | `src/app/components/WorkDetailModal.tsx` |
| 수정 | `src/app/pages/Profile.tsx` |
| 수정 | `src/app/i18n/messages.ts` |
| 삭제 | `src/app/components/DeepZoomViewer.tsx` |

---

## Task 1: WorkImageViewer 컴포넌트 신규 생성

**Files:**
- Create: `src/app/components/WorkImageViewer.tsx`

### 타입 정의 및 상수

- [ ] **Step 1: 파일 생성 — 타입·상수·헬퍼**

`src/app/components/WorkImageViewer.tsx`를 아래 내용으로 생성한다.

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { CopyrightProtectedImage } from './work';

export type ViewerImage = {
  src: string;
  title: string;
  artist: { name: string; avatar?: string };
};

export type WorkImageViewerProps = {
  images: ViewerImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function touchDist(touches: React.TouchList | TouchList) {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}
```

- [ ] **Step 2: 컴포넌트 선언 — state · ref**

Step 1 파일에 이어서 작성한다.

```tsx
export default function WorkImageViewer({
  images,
  initialIndex,
  open,
  onClose,
}: WorkImageViewerProps) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const draggingRef = useRef(false);
  const dragStartRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const lastPinchDist = useRef(0);
  const panTouchRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const lastTapTime = useRef(0);
  const swipeStartX = useRef<number | null>(null);
```

- [ ] **Step 3: 헬퍼 함수 — resetView · goTo**

```tsx
  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((newIdx: number) => {
    setIdx(newIdx);
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const isZoomed = scale > 1;
  const hasPrev = idx > 0;
  const hasNext = idx < images.length - 1;
  const current = images[idx];
```

- [ ] **Step 4: 사이드 이펙트 — open/close, body scroll, ESC키**

```tsx
  useEffect(() => {
    if (!open) { resetView(); setIdx(initialIndex); }
  }, [open, initialIndex, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && !isZoomed && hasPrev) goTo(idx - 1);
      if (e.key === 'ArrowRight' && !isZoomed && hasNext) goTo(idx + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, isZoomed, hasPrev, hasNext, idx, goTo]);
```

- [ ] **Step 5: 마우스 드래그 이벤트**

```tsx
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { sx, sy, ox, oy } = dragStartRef.current;
      setPos({ x: ox + e.clientX - sx, y: oy + e.clientY - sy });
    };
    const onUp = () => { draggingRef.current = false; setDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !isZoomed) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => clamp(s * (1 - e.deltaY * 0.0015), MIN_SCALE, MAX_SCALE));
  };
```

- [ ] **Step 6: 터치 이벤트 (핀치줌·패닝·스와이프·더블탭)**

```tsx
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = touchDist(e.touches);
      panTouchRef.current = null;
      swipeStartX.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const t0 = e.touches[0];
      panTouchRef.current = { id: t0.identifier, sx: t0.clientX, sy: t0.clientY, ox: pos.x, oy: pos.y };
      if (!isZoomed) swipeStartX.current = t0.clientX;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = touchDist(e.touches);
      if (lastPinchDist.current > 0 && d > 0)
        setScale(s => clamp(s * (d / lastPinchDist.current), MIN_SCALE, MAX_SCALE));
      lastPinchDist.current = d;
      return;
    }
    if (e.touches.length === 1 && panTouchRef.current && isZoomed) {
      const t0 = e.touches[0];
      if (t0.identifier !== panTouchRef.current.id) return;
      const p = panTouchRef.current;
      setPos({ x: p.ox + (t0.clientX - p.sx), y: p.oy + (t0.clientY - p.sy) });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastPinchDist.current = 0;

    // 더블탭 감지
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime.current < 280) {
        // 더블탭: 2x ↔ 1x 토글
        setScale(s => (Math.abs(s - 1) < 0.1 ? 2 : 1));
        setPos({ x: 0, y: 0 });
        lastTapTime.current = 0;
        swipeStartX.current = null;
        return;
      }
      lastTapTime.current = now;

      // 스와이프 판정 (scale=1일 때만)
      if (!isZoomed && swipeStartX.current !== null) {
        const dx = e.changedTouches[0].clientX - swipeStartX.current;
        if (Math.abs(dx) >= 50) {
          if (dx < 0 && hasNext) goTo(idx + 1);
          if (dx > 0 && hasPrev) goTo(idx - 1);
        }
      }
    }
    if (e.touches.length === 0) {
      panTouchRef.current = null;
      swipeStartX.current = null;
    }
  };
```

- [ ] **Step 7: JSX 렌더**

```tsx
  if (!open || !current) return null;

  const transition = dragging ? 'none' : 'transform 0.15s ease-out';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
    >
      {/* 우상단: ✕ */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
        aria-label={t('viewer.close')}
      >
        <X className="h-5 w-5" />
      </button>

      {/* 좌상단: 배율 + 원래 크기 (확대 시만) */}
      {isZoomed && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            ×{scale.toFixed(1)}
          </span>
          <button
            type="button"
            onClick={resetView}
            className="rounded-2xl bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            {t('viewer.fitScreen')}
          </button>
        </div>
      )}

      {/* 이미지 영역 */}
      <div
        className={`absolute inset-0 flex items-center justify-center overflow-hidden ${isZoomed ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onWheel={handleWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <CopyrightProtectedImage
            src={current.src}
            alt={current.title}
            preventRightClick
            preventDrag
            className="max-h-[100dvh] max-w-[100vw] select-none object-contain"
          />
        </div>
      </div>

      {/* 좌측: ‹ 이전 */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => !isZoomed && goTo(idx - 1)}
          className={`absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition ${isZoomed ? 'opacity-20 pointer-events-none' : 'lg:hover:bg-black/70'}`}
          aria-label={t('viewer.prev')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 우측: › 다음 */}
      {hasNext && (
        <button
          type="button"
          onClick={() => !isZoomed && goTo(idx + 1)}
          className={`absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition ${isZoomed ? 'opacity-20 pointer-events-none' : 'lg:hover:bg-black/70'}`}
          aria-label={t('viewer.next')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 좌하단: 아바타 + 작가명 + 작품명 */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {current.artist.avatar && (
            <img
              src={current.artist.avatar}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          )}
          <span className="text-sm text-white/80 drop-shadow">{current.artist.name}</span>
        </div>
        <span className="text-sm font-semibold text-white drop-shadow">{current.title}</span>
      </div>

      {/* 우하단: − + */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => setScale(s => clamp(s - ZOOM_STEP, MIN_SCALE, MAX_SCALE))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm lg:hover:bg-black/70"
          aria-label={t('viewer.zoomOut')}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setScale(s => clamp(s + ZOOM_STEP, MIN_SCALE, MAX_SCALE))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm lg:hover:bg-black/70"
          aria-label={t('viewer.zoomIn')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* 하단 중앙: 페이지 표시 (2장 이상일 때) */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-xs text-white/40">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: TypeScript 검사**

```bash
cd "Supergallery 복사본" && npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 9: 커밋**

```bash
git add src/app/components/WorkImageViewer.tsx
git commit -m "feat: WorkImageViewer 컴포넌트 신규 생성 — 딥줌 뷰어 (MAX 4x, step 0.5)"
```

---

## Task 2: i18n 키 교체

**Files:**
- Modify: `src/app/i18n/messages.ts`

- [ ] **Step 1: KO — deepZoom.* → viewer.* 교체 및 prev/next 추가**

`messages.ts` KO 섹션에서 아래를 찾아 교체한다.

찾을 내용:
```
  'deepZoom.zoomOut': '축소',
  'deepZoom.zoomIn': '확대',
  'deepZoom.fit': '맞춤 보기',
  'deepZoom.close': '닫기',
```

교체 내용:
```
  'viewer.zoomOut': '축소',
  'viewer.zoomIn': '확대',
  'viewer.fitScreen': '원래 크기',
  'viewer.close': '닫기',
  'viewer.prev': '이전 작품',
  'viewer.next': '다음 작품',
```

- [ ] **Step 2: EN — 동일 교체**

찾을 내용:
```
  'deepZoom.zoomOut': 'Zoom out',
  'deepZoom.zoomIn': 'Zoom in',
  'deepZoom.fit': 'Fit to screen',
  'deepZoom.close': 'Close',
```

교체 내용:
```
  'viewer.zoomOut': 'Zoom out',
  'viewer.zoomIn': 'Zoom in',
  'viewer.fitScreen': 'Fit to screen',
  'viewer.close': 'Close',
  'viewer.prev': 'Previous',
  'viewer.next': 'Next',
```

- [ ] **Step 3: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/i18n/messages.ts
git commit -m "feat: i18n deepZoom.* → viewer.* 키 교체, prev/next 추가"
```

---

## Task 3: WorkDetailModal 수정

**Files:**
- Modify: `src/app/components/WorkDetailModal.tsx`

기존 인라인 CSS 2.5x 줌 state와 DeepZoomViewer를 제거하고, WorkImageViewer로 대체한다.

- [ ] **Step 1: import 교체**

`import DeepZoomViewer from './DeepZoomViewer';` 줄을 아래로 교체:

```tsx
import WorkImageViewer, { type ViewerImage } from './WorkImageViewer';
```

- [ ] **Step 2: state 교체**

아래 3줄을 찾아:
```tsx
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [deepZoomSrc, setDeepZoomSrc] = useState<string | null>(null);
```

아래로 교체:
```tsx
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
```

- [ ] **Step 3: handleZoomClick 함수 삭제**

아래 블록 전체를 삭제:
```tsx
  const handleZoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsZoomed(false);
      setZoomOrigin('center center');
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin(`${x}% ${y}%`);
      setIsZoomed(true);
    }
  };
```

- [ ] **Step 4: 스크롤 컨테이너 isZoomed 리셋 제거**

아래 블록을 찾아:
```tsx
            onClick={(e) => {
              e.stopPropagation();
              if (isZoomed) { setIsZoomed(false); setZoomOrigin('center center'); }
            }}
```

아래로 교체:
```tsx
            onClick={(e) => { e.stopPropagation(); }}
```

- [ ] **Step 5: 이미지 컨테이너 내 줌 div 교체**

아래를 찾아:
```tsx
                    <div
                      className={`relative flex justify-center text-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-[0_15px_50px_rgba(0,0,0,0.2)] bg-black/5 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={handleZoomClick}
                      style={{
                        transform: `scale(${isZoomed ? 2.5 : 1})`,
                        transformOrigin: isZoomed ? zoomOrigin : 'top center',
                      }}
                    >
```

아래로 교체 (`workImageIndex`는 이미 해당 map 클로저에 존재함):
```tsx
                    <div
                      className="relative flex justify-center text-center shadow-[0_15px_50px_rgba(0,0,0,0.2)] bg-black/5 cursor-pointer"
                      onClick={!isCoverSlide ? (e) => { e.stopPropagation(); setViewerIndex(workImageIndex); } : undefined}
                    >
```

- [ ] **Step 6: CopyrightProtectedImage의 onDoubleClick 제거**

아래를 찾아:
```tsx
                        onDoubleClick={() => setDeepZoomSrc(src)}
```

이 줄을 삭제 (onDoubleClick prop 제거).

- [ ] **Step 7: DeepZoomViewer 렌더 블록을 WorkImageViewer로 교체**

아래를 찾아:
```tsx
      {deepZoomSrc && (
        <DeepZoomViewer src={deepZoomSrc} alt={headline} open onClose={() => setDeepZoomSrc(null)} />
      )}
```

아래로 교체. `workImages`는 이미 파일 안에 정의돼 있고(`const workImages = ...`), `images`는 커버 포함 배열이다. 뷰어는 커버 페이지를 제외한 실제 작품 이미지만 전달한다.

```tsx
      {viewerIndex !== null && (
        <WorkImageViewer
          images={workImages.map((img, i): ViewerImage => {
            const src = imageUrls[img] || img;
            const ia = work.imageArtists?.[i];
            const artist = (ia?.type === 'member' && ia.memberId)
              ? allArtists.find(a => a.id === ia.memberId) ?? work.artist
              : work.artist;
            return {
              src,
              title: displayPieceTitleAtIndex(work, i, t('work.untitled')),
              artist: { name: artist?.name ?? '', avatar: artist?.avatar },
            };
          })}
          initialIndex={viewerIndex}
          open
          onClose={() => setViewerIndex(null)}
        />
      )}
```

- [ ] **Step 8: TypeScript 검사**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 9: 브라우저 확인**

1. 개발 서버 실행: `npm run dev`
2. 전시상세모달 오픈
3. 작품 이미지 싱글탭 → WorkImageViewer가 풀스크린으로 열리는지 확인
4. +/− 버튼으로 확대/축소 확인
5. 확대 중 ‹ › 흐리게·비활성 확인
6. "원래 크기" 버튼 1배 복귀 확인
7. 더블탭 2x 토글 확인

- [ ] **Step 10: 커밋**

```bash
git add src/app/components/WorkDetailModal.tsx
git commit -m "feat: WorkDetailModal — 싱글탭으로 WorkImageViewer 진입, 기존 인라인 줌 제거"
```

---

## Task 4: Profile PRF-14 뷰어 교체

**Files:**
- Modify: `src/app/pages/Profile.tsx`

- [ ] **Step 1: import 추가**

Profile.tsx 상단 import 목록에 추가:

```tsx
import WorkImageViewer, { type ViewerImage } from '../components/WorkImageViewer';
```

- [ ] **Step 2: 인라인 뷰어 JSX를 WorkImageViewer로 교체**

아래 블록 전체를 찾아:

```tsx
      {worksViewerIndex !== null && worksManageFlatImages.length > 0 && (() => {
        const fi = worksManageFlatImages[worksViewerIndex];
        if (!fi) return null;
        const hasPrev = worksViewerIndex > 0;
        const hasNext = worksViewerIndex < worksManageFlatImages.length - 1;
        const viewerArtist = (() => {
          ...
        })();
        return (
          <div
            className="fixed inset-0 z-[9999] ...
            ...
          </div>
        );
      })()}
```

아래로 교체:

```tsx
      {worksViewerIndex !== null && (
        <WorkImageViewer
          images={worksManageFlatImages.map((fi): ViewerImage => {
            const ias = fi.work.imageArtists;
            const ia = ias?.[fi.imgIndex];
            const artist = (ia?.type === 'member' && ia.memberId)
              ? artists.find(a => a.id === ia.memberId) ?? fi.work.artist
              : fi.work.artist;
            return {
              src: fi.imgSrc,
              title: fi.pieceTitle,
              artist: { name: artist?.name ?? '', avatar: artist?.avatar },
            };
          })}
          initialIndex={worksViewerIndex}
          open
          onClose={() => setWorksViewerIndex(null)}
        />
      )}
```

> **주의**: 기존 `swipeTouchStartX` ref와 키보드 이벤트 `useEffect`(ArrowLeft/ArrowRight/Escape)도 WorkImageViewer 내부로 이관됐으므로 Profile.tsx에서 해당 코드를 함께 삭제한다.

구체적으로 삭제할 코드:
- `const swipeTouchStartX = useRef<number | null>(null);` 줄
- `useEffect` 블록 (조건: `if (worksViewerIndex === null) return;` 로 시작하는 키보드 핸들러)

- [ ] **Step 3: TypeScript 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 브라우저 확인**

1. 마이페이지 내 작품 탭 접근
2. 작품 카드 탭 → WorkImageViewer 열림 확인
3. ‹ › 로 이전/다음 이동 확인
4. +/− 줌, 더블탭 토글 확인

- [ ] **Step 5: 커밋**

```bash
git add src/app/pages/Profile.tsx
git commit -m "feat: Profile PRF-14 뷰어 → WorkImageViewer 교체"
```

---

## Task 5: DeepZoomViewer 삭제 및 최종 정리

**Files:**
- Delete: `src/app/components/DeepZoomViewer.tsx`

- [ ] **Step 1: 잔여 import 확인**

```bash
grep -rn "DeepZoomViewer\|deepZoom\." src/app/ --include="*.tsx" --include="*.ts"
```

출력 없어야 함.

- [ ] **Step 2: 파일 삭제**

```bash
rm src/app/components/DeepZoomViewer.tsx
```

- [ ] **Step 3: TypeScript 최종 검사**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋 및 푸시**

```bash
git add -A
git commit -m "chore: DeepZoomViewer 삭제 — WorkImageViewer로 통합 완료"
git push
```
