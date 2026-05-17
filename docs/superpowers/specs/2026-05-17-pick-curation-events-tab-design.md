# Pick · 기획전 — Events 탭 통합 설계

**작성일**: 2026-05-17  
**상태**: 승인 대기  

---

## 1. 배경 및 목적

현재 Pick과 기획전은 홈 배너를 통해서만 진입 가능하며, 배너가 지나면 재진입 경로가 없다. 사용자가 배너에서 본 콘텐츠를 Events 탭에서도 찾을 것으로 기대하지만 없어서 혼란이 생긴다.

**목표**: Pick·기획전의 재진입 경로를 Events 탭 내 탭으로 제공하고, 각각의 전용 페이지를 만든다.

---

## 2. 최종 구조

### 2.1 Events 탭 — 3탭 구조

```
Events 메뉴 (하단 네비 "이벤트" 슬롯 재사용, 이름 변경 없음)
├── [이벤트 탭]   — 응모전 + 일반이벤트 통합 (현행 유지, 배지 구분)
├── [Pick 탭]     — 현재 픽 세션 + 명예의 전당 진입
└── [기획전 탭]   — 진행중 / 지난 기획전 목록
```

### 2.2 신규 라우트

| 경로 | 설명 |
|---|---|
| `/picks/:id` | 픽 세션 상세 — 선정 전시 그리드 |
| `/picks/hall-of-fame` | 명예의 전당 — 역대 픽 선정 전시 갤러리 |

기존 `/curations/:id`는 신규 기획전에서 사용하지 않음 (레거시 시드 데이터 호환만).

---

## 3. 화면별 상세 설계

### 3.1 Events 페이지 — Pick 탭

**구성**:
- 현재 활성 픽 세션이 있을 때: 세션 카드 (제목 "4월 3주차 Proud's Pick", 기간, 선정 전시 수) + `[선정 전시 보기 →]` CTA → `/picks/:id`
- 현재 활성 픽 세션이 없을 때: "현재 진행 중인 Pick이 없습니다" 안내
- 하단: `[🏅 명예의 전당 →]` 카드 (항상 노출) → `/picks/hall-of-fame`

### 3.2 Events 페이지 — 기획전 탭

**구성**: 진행중 / 지난 기획전 섹션 구분 목록

**노출 조건**: `curation.pageUrl`이 설정된 기획전만 표시. pageUrl 없으면 탭에 노출하지 않음 (미게시 상태).

- **진행중 섹션**: 가로 썸네일 + 제목 + 작품 수 + 기간. 클릭 → `pageUrl`을 새 탭으로 열기 (`window.open`)
- **지난 기획전 섹션**: 동일 레이아웃, 흐리게(opacity 감소). 클릭 불가 (이력 표시만)
- `endAt`이 없는 기획전은 항상 진행중 처리
- **Phase 2**: 종료 기획전을 포인트(AP) 소모로 잠금 해제하여 pageUrl 접근 가능

**기획전 상세 페이지 방식**: 외부 링크 (Notion, Framer, 커스텀 HTML 등 자유 제작). `/curations/:id` 내부 페이지 미사용.

### 3.3 /picks/:id — 픽 세션 상세

**비주얼 컨셉**: 축하·시상식 분위기. 배너 이미지 없이 배경 자체로 특별함 표현.

**헤더**:
- 순수 블랙 배경 (`#000000`)
- 중앙에서 방사하는 골드 광선 (CSS linear-gradient)
- 트로피 🏆 이모지 (float 애니메이션)
- "Proud's Pick" 골드 레터링
- 세션 제목 (예: "4월 3주차")
- 기간 + 선정 전시 수

**선정 전시 그리드**:
- 2열 카드 그리드
- 카드: 커버 이미지 + 전시명 + 작가 표기
  - 단독 전시: `"김민서 작가"`
  - 그룹 전시: `work.groupName` 표시. groupName 없으면 `work.artist.name + " 외"` 폴백
- 카드 배경: 다크(`#161616`), 골드 테두리(`rgba(255,200,0,0.15)`)
- 카드 클릭 → 전시 상세 모달 (기존 WorkDetailModal)

**하단**:
- `[🏅 명예의 전당 →]` 진입 카드 → `/picks/hall-of-fame`

### 3.4 /picks/hall-of-fame — 명예의 전당

**컨셉**: 역대 Proud's Pick에 선정된 전시 전체를 한 갤러리에.

**데이터 소스**: `pickBadge: true`인 전시 전체 (workStore에서 필터)

**레이아웃**:
- 헤더: 다크 배경 + 골드 시머 "🏅 명예의 전당" 제목 + 총 선정 전시 수
- 3열 평면 갤러리 그리드 (세션별 그룹 없음)
- 카드: 커버 이미지 + 전시명 (소형 텍스트)
- 카드 클릭 → 전시 상세 모달
- **빈 상태**: "아직 선정된 전시가 없습니다. 첫 번째 Proud's Pick을 기다려 주세요."

**엣지케이스**:
- `/picks/:id`에서 세션 ID를 찾을 수 없으면 "존재하지 않는 Pick 세션입니다" + Events Pick 탭으로 복귀

---

## 4. 이벤트 탭 — 변경 사항

- 응모전(`type: 'contest'`) + 일반이벤트(`type: 'general'`) 통합 목록 (유지)
- **예정(scheduled) 섹션 제거** — 배너로 홍보하고, 탭에는 진행중·종료만 노출
- 섹션 구조: `[진행 중]` + `[지난 이벤트]`
- 일반이벤트에 응모 CTA 노출 버그 수정 완료 (`event.type !== 'contest'` 가드)
- 탭 이름 "이벤트", 하단 네비 아이콘 변경 없음

---

## 5. 데이터 모델 의존성

| 기능 | 의존 스토어/필드 |
|---|---|
| Pick 탭 현재 세션 | `pickStore` — `publicationOpen:true` + `status:'active'` 세션 |
| Pick 상세 선정 전시 | `pickStore.selectedWorkIds` → `workStore` 조회 |
| 명예의 전당 | `workStore` — `pickBadge:true` 필터 |
| 기획전 목록 | `curationStore.curatedExhibitions` — `pageUrl` 있는 것만 |
| 기획전 진행중/종료 판단 | `curation.endAt` vs `todayLocalIso()` |
| 기획전 외부 링크 | `curation.pageUrl` → `window.open(pageUrl, '_blank')` |
| 그룹전시 판단 | `work.primaryExhibitionType === 'group'` |
| 그룹명 표시 | `work.groupName` (없으면 `work.artist.name + " 외"`) |

---

## 6. 신규 컴포넌트/파일

| 파일 | 역할 |
|---|---|
| `src/app/pages/PickDetail.tsx` | /picks/:id 픽 세션 상세 페이지 (신규) |
| `src/app/pages/PickHallOfFame.tsx` | /picks/hall-of-fame 명예의 전당 (신규) |
| `src/app/pages/Events.tsx` (수정) | Pick·기획전 탭 추가 |
| `src/app/routes.ts` (수정) | 신규 라우트 등록 |
| `src/app/utils/curationStore.ts` (수정) | `pageUrl` 필드 추가 |
| `src/app/admin/CurationManagement.tsx` (수정) | `pageUrl` 입력 필드 추가 (게시 시 필수 검증) |

---

## 7. Phase 2 메모

- 종료된 기획전을 포인트(AP) 소모로 잠금 해제하여 다시 볼 수 있는 기능
- 구현 시 `/curations/:id` 접근 제어 로직에 포인트 소모 분기 추가

---

## 8. 범위 외

- 어드민 변경 없음 (Pick 세션 관리·기획전 관리 기존 그대로)
- 배너 linkUrl 연결은 어드민에서 수동 설정 (예: `/picks/세션ID`, `/picks/hall-of-fame`, `/curations/기획전ID`)
- 명예의 전당 필터/검색 기능 — Phase 2 검토
