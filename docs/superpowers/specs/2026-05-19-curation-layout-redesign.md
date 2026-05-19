# 기획전 레이아웃 개편 설계

**날짜**: 2026-05-19  
**범위**: Browse 기획전 탭 + CurationDetail 페이지  
**수정 파일**: `src/app/pages/Browse.tsx`, `src/app/pages/CurationDetail.tsx`

---

## 배경

기존 기획전 레이아웃이 세로형 포스터 판형으로 심심하다는 피드백. 가로형으로 전환해 갤러리·미술관 느낌을 강화한다. 포스터 이미지 자체에 제목·기간 등 모든 콘텐츠를 포함하고, 코드는 네비게이션만 담당한다.

---

## 1. Browse 페이지 — 기획전 탭

### 1-1. 활성 기획전 (현재 전시 중)

**배너 위 레이블**
- 캐러셀 바로 위에 `현재 전시 중` 초록 배지 표시
- 조건: `activeCurations.length > 0`일 때만 렌더

**활성 기획전 1개: 정적 배너**
- `aspect-[21/9]` full-width 이미지
- 캐러셀 컨트롤 없음 (화살표, 도트, 정지 버튼 모두 숨김)

**활성 기획전 2개 이상: 캐러셀**
- `aspect-[21/9]` full-width, 슬라이드 전환 fade (450ms)
- 3초 자동 전환
- **이미지 위 오버레이 없음** — 포스터 이미지 그대로 표시
- **데스크톱**: 좌우 화살표 hover 시에만 노출 (기본 `opacity-0`, hover `opacity-100`)
- **모바일**: 화살표 없음, 스와이프로 이동 (`touchstart`/`touchend` delta ≥ 50px 감지)
- **우하단 플로팅 컨트롤** (항상 표시):
  - pill 형태 (`rounded-full`, `bg-black/40`, `backdrop-blur`)
  - 도트 인디케이터: 비활성 = 반투명 채움, 활성 = 속 빈 링(`border-2 border-white bg-transparent`)
  - 구분선 (1px)
  - 정지/플레이 토글 버튼
- **슬라이드 클릭**: 해당 전시 `/curations/:id` 로 이동 (기존 동작 유지)

### 1-2. 지난 기획전 (`EndedCurationsSection`)

| 항목 | 현재 | 변경 |
|---|---|---|
| 그리드 | `grid-cols-2 sm:grid-cols-3` | `grid-cols-1 sm:grid-cols-2` |
| 이미지 비율 | `aspect-[3/4]` | `aspect-[21/9]` |
| 텍스트 오버레이 | 제목 + 날짜 오버레이 있음 | **제거** — 이미지만 |
| grayscale/opacity | `grayscale opacity-50` | 유지 |
| hover | 없음 | `hover:opacity-75 hover:grayscale-0` + `transition-all` 부드러운 복원 |

---

## 2. CurationDetail 페이지 (`/curations/:id`)

### 헤더 영역

- `curation.bannerImageUrl` 있을 때: `aspect-[21/9]` full-width 정적 배너 표시
- `curation.bannerImageUrl` 없을 때: 기존 텍스트 헤더(제목·날짜·subtitle) 폴백으로 유지
- 배너 있을 때 기존 텍스트 헤더 제거 (제목·날짜는 포스터 이미지에 포함)
- 이미지 위 오버레이 없음 (배너 = 포스터 이미지 그대로)

### 작품 목록

- 기존 3가지 패턴 레이아웃 유지

---

## 엣지 케이스

| 상황 | 처리 |
|---|---|
| 활성 전시 0개 | 기존 `curationEmpty` 메시지 유지 |
| 활성 전시 1개 | 정적 배너, 컨트롤 없음 |
| 활성 전시 2개 이상 | 캐러셀 모드 |
| `bannerImageUrl` 없음 (CurationDetail) | 텍스트 헤더 폴백 |

---

## 변경하지 않는 것

- Browse 활성 기획전 카드 클릭 → `/curations/:id` 이동 로직
- CurationDetail 작품 목록 레이아웃 (3패턴)
- 어드민 `CurationManagement.tsx`
