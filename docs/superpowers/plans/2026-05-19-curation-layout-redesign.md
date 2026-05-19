# 기획전 레이아웃 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기획전 탭의 배너를 21:9 가로형으로 전환하고, 진행 중 전시를 캐러셀로 표시하며, 모든 텍스트 오버레이를 제거한다.

**Architecture:** `CurationCarousel` 컴포넌트를 신규 생성해 자동 전환·터치 스와이프·컨트롤 로직을 캡슐화한다. Browse.tsx는 캐러셀 렌더 여부(1개/2개 이상/0개)만 판단하고, CurationDetail.tsx는 배너 이미지만 표시하는 단순 블록으로 교체한다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react, react-router-dom

---

## 파일 맵

| 작업 | 파일 |
|---|---|
| 신규 생성 | `src/app/components/CurationCarousel.tsx` |
| 수정 | `src/app/i18n/messages.ts` |
| 수정 | `src/app/pages/Browse.tsx` |
| 수정 | `src/app/pages/CurationDetail.tsx` |

---

## Task 1: i18n 키 추가 — `browse.curationOnView`

**Files:**
- Modify: `src/app/i18n/messages.ts:243` (KO), `src/app/i18n/messages.ts:1358` (EN)

- [ ] **Step 1: KO 섹션에 키 추가**

`messages.ts` 243번 줄 (`'browse.curationEmpty': '진행 중인 기획전이 없어요',`) 바로 뒤에 삽입:

```ts
  'browse.curationOnView': '현재 전시 중',
```

- [ ] **Step 2: EN 섹션에 키 추가**

`messages.ts` 1358번 줄 (`'browse.curationEmpty': 'No curated exhibitions right now',`) 바로 뒤에 삽입:

```ts
  'browse.curationOnView': 'On View',
```

- [ ] **Step 3: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/i18n/messages.ts
git commit -m "feat: browse.curationOnView i18n 키 추가"
```

---

## Task 2: `CurationCarousel` 컴포넌트 생성

**Files:**
- Create: `src/app/components/CurationCarousel.tsx`

- [ ] **Step 1: 파일 생성**

`src/app/components/CurationCarousel.tsx` 를 아래 내용으로 생성:

```tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { CuratedExhibition } from '../utils/curationStore';

type Props = {
  curations: CuratedExhibition[];
};

export function CurationCarousel({ curations }: Props) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const total = curations.length;

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % total) + total) % total),
    [total],
  );

  // 3초 자동 전환 — current 또는 isPlaying 변경 시 타이머 재설정
  useEffect(() => {
    if (!isPlaying || total < 2) return;
    const timer = setTimeout(() => goTo(current + 1), 3000);
    return () => clearTimeout(timer);
  }, [current, isPlaying, goTo, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= 50) goTo(current + (delta > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const showControls = total >= 2;

  return (
    <div
      className="relative aspect-[21/9] w-full overflow-hidden rounded-xl group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 슬라이드: 모두 렌더, opacity로 fade 전환 */}
      {curations.map((c, i) => (
        <div
          key={c.id}
          className={`absolute inset-0 transition-opacity duration-[450ms] cursor-pointer ${
            i === current ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
          }`}
          onClick={() => navigate(`/curations/${c.id}`)}
        >
          <img
            src={c.bannerImageUrl}
            alt={c.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ))}

      {showControls && (
        <>
          {/* 데스크톱 전용 hover 화살표 */}
          <button
            type="button"
            aria-label="이전 전시"
            onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="다음 전시"
            onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center bg-black/35 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 우하단 플로팅 컨트롤: 도트 + 구분선 + 정지/플레이 */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center bg-black/40 backdrop-blur-md border border-white/[0.14] rounded-full px-2.5 py-1.5">
            {curations.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번 전시`}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`mx-1.5 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                  i === current
                    ? 'w-2.5 h-2.5 bg-transparent border-2 border-white'
                    : 'w-2 h-2 bg-white/40 border-0'
                }`}
              />
            ))}
            <div className="w-px h-3 bg-white/20 mx-1.5 flex-shrink-0" />
            <button
              type="button"
              aria-label={isPlaying ? '자동 전환 정지' : '자동 전환 재생'}
              onClick={(e) => { e.stopPropagation(); setIsPlaying((p) => !p); }}
              className="flex items-center justify-center text-white bg-transparent border-0 cursor-pointer w-5 h-5 flex-shrink-0 min-h-[20px]"
            >
              {isPlaying
                ? <Pause className="w-3 h-3 fill-white stroke-none" />
                : <Play className="w-3 h-3 fill-white stroke-none" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/components/CurationCarousel.tsx
git commit -m "feat: CurationCarousel 컴포넌트 — 21:9 자동전환 캐러셀"
```

---

## Task 3: Browse — 활성 기획전 섹션 교체

**Files:**
- Modify: `src/app/pages/Browse.tsx`

기존 활성 기획전 렌더 블록(약 482–546번 줄)을 교체한다.

- [ ] **Step 1: import 추가**

Browse.tsx 상단 import 블록에 추가:

```tsx
import { CurationCarousel } from '../components/CurationCarousel';
```

- [ ] **Step 2: 활성 기획전 섹션 교체**

Browse.tsx의 아래 블록을 찾아서:

```tsx
          {activeCurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
              <p className="text-sm text-foreground font-medium">{t('browse.curationEmpty')}</p>
            </div>
          ) : (
            <div className={`flex items-start justify-center gap-6 sm:gap-8 ${activeCurations.length === 1 ? '' : 'flex-wrap sm:flex-nowrap'}`}>
              {(() => {
                return activeCurations.map((c, i) => {
```

부터

```tsx
              })()}
            </div>
          )}
```

까지 전체를 아래로 교체:

```tsx
          {activeCurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20 px-6">
              <p className="text-sm text-foreground font-medium">{t('browse.curationEmpty')}</p>
            </div>
          ) : (
            <>
              {/* 현재 전시 중 배지 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  {t('browse.curationOnView')}
                </span>
              </div>
              {/* 1개: 정적 배너 / 2개 이상: 캐러셀 */}
              {activeCurations.length === 1 ? (
                <div
                  className="aspect-[21/9] w-full overflow-hidden rounded-xl cursor-pointer"
                  onClick={() => navigate(`/curations/${activeCurations[0].id}`)}
                >
                  <img
                    src={activeCurations[0].bannerImageUrl}
                    alt={activeCurations[0].title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : (
                <CurationCarousel curations={activeCurations} />
              )}
            </>
          )}
```

- [ ] **Step 3: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 개발 서버에서 Browse → 기획전 탭 확인**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npm run dev
```

- 기획전 탭 접속: `http://localhost:5173/?tab=curation`
- "현재 전시 중" 초록 배지가 배너 위에 표시되는지 확인
- 활성 전시 1개 → 정적 21:9 배너, 컨트롤 없음
- 활성 전시 2개 이상 → 캐러셀, 3초마다 자동 전환, 우하단 컨트롤 표시
- 데스크톱 hover → 좌우 화살표 나타남
- 배너 클릭 → `/curations/:id` 이동

- [ ] **Step 5: 커밋**

```bash
git add src/app/pages/Browse.tsx
git commit -m "feat: 기획전 탭 활성 전시 — 21:9 캐러셀 전환"
```

---

## Task 4: Browse — `EndedCurationsSection` 레이아웃 변경

**Files:**
- Modify: `src/app/pages/Browse.tsx` (파일 상단 `EndedCurationsSection` 컴포넌트, 약 36–79번 줄)

- [ ] **Step 1: EndedCurationsSection 전체 교체**

Browse.tsx 상단의 `EndedCurationsSection` 함수 전체를 아래로 교체:

```tsx
function EndedCurationsSection({
  endedCurations,
}: {
  endedCurations: import('../utils/curationStore').CuratedExhibition[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? endedCurations : endedCurations.slice(0, 4);
  return (
    <section className="mt-14 sm:mt-16">
      <h2 className="text-sm font-semibold text-muted-foreground mb-5">지난 기획전</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {visible.map((c) => (
          <div
            key={c.id}
            className="overflow-hidden rounded-lg aspect-[21/9] grayscale opacity-50 hover:opacity-75 hover:grayscale-0 transition-all duration-300"
          >
            <ImageWithFallback
              src={c.bannerImageUrl}
              alt={c.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {!showAll && endedCurations.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-5 text-sm text-muted-foreground lg:hover:text-foreground transition-colors min-h-[44px]"
        >
          지난 기획전 더 보기 →
        </button>
      )}
    </section>
  );
}
```

> **변경 포인트:**
> - 그리드: `grid-cols-2 sm:grid-cols-3` → `grid-cols-1 sm:grid-cols-2`
> - 비율: `aspect-[3/4]` → `aspect-[21/9]`
> - 텍스트 오버레이(gradient + 제목/날짜) 완전 제거
> - hover: `hover:opacity-75 hover:grayscale-0 transition-all duration-300` 추가
> - 더 보기 기준: 3개 → 4개 (2열 그리드이므로 2행이 기본 노출)

- [ ] **Step 2: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 개발 서버에서 지난 기획전 섹션 확인**

- `http://localhost:5173/?tab=curation` 스크롤 다운
- 2열 21:9 카드, 텍스트 오버레이 없음
- hover 시 grayscale 부드럽게 해제

- [ ] **Step 4: 커밋**

```bash
git add src/app/pages/Browse.tsx
git commit -m "feat: 지난 기획전 — 21:9 2열 그리드, 오버레이 제거"
```

---

## Task 5: CurationDetail — 21:9 배너 추가

**Files:**
- Modify: `src/app/pages/CurationDetail.tsx`

- [ ] **Step 1: 헤더 영역 교체**

`CurationDetail.tsx`의 `<header>` 블록 전체를 찾아서:

```tsx
      {/* 전시 타이틀 섹션 */}
      <header className="mx-auto max-w-3xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 text-center">
        {(curation.startAt && curation.endAt) && (
          <p className="text-xs tracking-[3px] uppercase text-neutral-400 mb-5">
            {curation.startAt.replace(/-/g, '.')} — {curation.endAt.replace(/-/g, '.')}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight mb-5">
          {curation.title}
        </h1>
        {curation.subtitle && (
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto">
            {curation.subtitle}
          </p>
        )}
        <div className="mt-10 w-12 h-px bg-neutral-300 mx-auto" />
      </header>
```

아래로 교체:

```tsx
      {/* 배너: bannerImageUrl 있으면 21:9 이미지, 없으면 기존 텍스트 헤더 폴백 */}
      {curation.bannerImageUrl ? (
        <>
          <div className="w-full aspect-[21/9]">
            <img
              src={curation.bannerImageUrl}
              alt={curation.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex justify-center py-12">
            <div className="w-12 h-px bg-neutral-300" />
          </div>
        </>
      ) : (
        <header className="mx-auto max-w-3xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 text-center">
          {(curation.startAt && curation.endAt) && (
            <p className="text-xs tracking-[3px] uppercase text-neutral-400 mb-5">
              {curation.startAt.replace(/-/g, '.')} — {curation.endAt.replace(/-/g, '.')}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight mb-5">
            {curation.title}
          </h1>
          {curation.subtitle && (
            <p className="text-base sm:text-lg text-neutral-500 leading-relaxed max-w-xl mx-auto">
              {curation.subtitle}
            </p>
          )}
          <div className="mt-10 w-12 h-px bg-neutral-300 mx-auto" />
        </header>
      )}
```

- [ ] **Step 2: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 개발 서버에서 CurationDetail 확인**

seed 데이터의 기획전 ID를 사용해 접속 (예: `http://localhost:5173/curations/seed-curation-1`):

- `bannerImageUrl` 있는 전시: 21:9 배너가 페이지 상단 full-width로 표시됨
- 배너 아래 구분선 후 작품 목록 시작
- `bannerImageUrl` 없는 전시: 기존 텍스트 헤더(제목·날짜) 폴백 표시

- [ ] **Step 4: 커밋**

```bash
git add src/app/pages/CurationDetail.tsx
git commit -m "feat: CurationDetail — 21:9 배너 추가, 텍스트 헤더 폴백 유지"
```

---

## 셀프 리뷰 체크리스트

- [x] **스펙 커버리지**: 활성 1개 정적 배너 ✓ / 캐러셀 2개+ ✓ / "현재 전시 중" 배지 ✓ / hover 화살표 ✓ / 모바일 스와이프 ✓ / 우하단 컨트롤 ✓ / 지난 기획전 grid·ratio·오버레이 ✓ / CurationDetail 배너 ✓ / 폴백 ✓
- [x] **플레이스홀더 없음**: 모든 스텝에 실제 코드 포함
- [x] **타입 일관성**: `CuratedExhibition` 타입 → Task 2에서 import, Task 3에서 동일하게 사용
- [x] **더 보기 기준 수정**: 기존 3개 → 4개 (2열 그리드에서 2행 = 4개가 자연스러운 기본값)
