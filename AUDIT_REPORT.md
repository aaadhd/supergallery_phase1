# SuperGallery Phase 1 구현 현황 감사 보고서

> **작성일**: 2026-03-30
> **대상**: Artier (SuperGallery) Phase 1 MVP
> **기술 스택**: React 19 + TypeScript + Vite 6.3 + Tailwind CSS
> **점검 방법**: 전체 코드베이스 파일 기반 스캔 (추측 없음)

---

## 1. 전체 요약

**Artier(SuperGallery)**는 현재 **클라이언트 전용 프로토타입/MVP** 상태입니다.

- **총 라우트**: 11개 (사용자 7개 + 관리자 4개)
- **백엔드/API**: 없음 — 100% localStorage + 하드코딩 mock 데이터
- **인증**: mock (boolean 토글, OAuth 미구현)
- **관리자 기능**: 대시보드, 이슈, 체크리스트, 파트너 작가 — 모두 mock 데이터 기반
- **빌드 상태**: Vite 빌드 성공

### 핵심 수치

| 항목 | 수치 |
|------|------|
| 페이지 컴포넌트 | 8개 (사용자 4 + 관리자 4) |
| UI 컴포넌트 (Radix) | 44개 |
| 데이터 스토어 | 9개 (localStorage 키 9개) |
| API 호출 | 0건 |
| TODO 주석 | 1건 (`Browse.tsx:390`) |
| Mock 데이터 엔티티 | 작가 25명, 작품 60+점, 그룹 12개, 이슈 8건, 체크리스트 17건, 파트너 12명 |

---

## 2. 구현된 기능

| 기능 | 근거 파일 | 데이터 소스 | 비고 |
|------|----------|------------|------|
| 메인 피드 (둘러보기) | `src/app/pages/Browse.tsx` | workStore (localStorage) + mock 배너 | Masonry 레이아웃, 카테고리 필터 |
| 작품 상세 모달 | `src/app/components/WorkDetailModal.tsx` | workStore | 이미지 뷰어, 좋아요/저장/공유 |
| 작품 업로드 | `src/app/pages/Upload.tsx` | workStore.addWork() | 최대 10장, 메타데이터, 배경색/간격 |
| 초안 저장/관리 | `src/app/pages/Upload.tsx`, `src/app/pages/Profile.tsx` | draftStore (localStorage) | 저장/불러오기/삭제 |
| 프로필 조회/편집 | `src/app/pages/Profile.tsx` | profileStore (localStorage) | 이름, 소개, 위치 편집 |
| 좋아요/저장 토글 | `src/app/components/WorkDetailModal.tsx` | userInteractionStore | 로그인 상태 체크 포함 |
| 로그인 유도 모달 | `src/app/components/LoginPromptModal.tsx` | authStore | 비로그인 시 좋아요/저장/팔로우 차단 |
| 이벤트 목록 | `src/app/pages/Events.tsx` | 하드코딩 mock | 배너 + 예정 이벤트 + 알림 구독 |
| 강사 대리 업로드 | `src/app/pages/Upload.tsx` | workStore | isInstructorUpload 토글, 이메일 태그 |
| 핀 코멘트 | `src/app/store/pinCommentStore.ts`, `src/app/components/work/PinCommentLayer.tsx` | localStorage | 이미지 위 좌표 기반 피드백 |
| Admin 대시보드 | `src/app/admin/AdminDashboard.tsx` | adminStore (mock) | 이슈/체크리스트/파트너 요약 |
| 미결 이슈 관리 | `src/app/admin/UnresolvedIssues.tsx` | issueStore (mock) | 테이블, 4종 필터, 인라인 상태 변경 |
| 런칭 체크리스트 | `src/app/admin/LaunchChecklist.tsx` | checklistStore (mock) | 카테고리별, 토글, 진행률 |
| 파트너 작가 관리 | `src/app/admin/PartnerArtists.tsx` | partnerStore (mock) | 단계/제출 필터, 인라인 메모 편집 |

---

## 3. 부분 구현 기능

| 기능 | 근거 파일 | 구현된 부분 | 미비 사항 |
|------|----------|------------|----------|
| 팔로우/언팔로우 | `src/app/pages/Profile.tsx`, `src/app/components/WorkDetailModal.tsx` | 버튼 UI + 토글 표시 | 실제 팔로워 수 변경/저장 미구현 |
| 카테고리 필터 | `src/app/pages/Browse.tsx:19-20` | "개인전시/공동전시" 필터 작동 | PRD에 "Phase 1에서 제공하지 않음"이라 했으나 구현됨 |
| 언어 전환 (한/영) | `src/app/components/Header.tsx:112-128` | 드롭다운 UI + state 변경 | 실제 번역 없음 |
| 용어 상수 파일 | `src/app/admin/constants.ts` | LABELS 객체 정의됨 | admin 폴더 외에서 **미사용** — 사용자 페이지는 모두 하드코딩 |
| 판매 옵션 | `src/app/groupData.ts` | groupWorks에 saleOptions 존재 | 개인 작품 미지원, UI 노출 제한적 |
| 작품 삭제 | `src/app/pages/Profile.tsx` | 삭제 confirm + 실행 | confirm 다이얼로그 단순 |

---

## 4. 미구현 기능

| 기능 | PRD 근거 | 구현 증거 |
|------|----------|----------|
| 소셜 로그인 (카카오/구글/애플) | USER-001 | 구현 증거 없음 — `src/app/store.ts:294-331` boolean 토글만 |
| 최초 로그인 온보딩 | USER-001 "최초 로그인 시 닉네임 설정 온보딩" | 구현 증거 없음 |
| 이벤트 상세 페이지 | PRD §3 "이벤트 상세 페이지" | `/events/:id` 라우트 없음 |
| 이벤트 참여 관리 (어드민) | MKT-001, MKT-002 "참여자 목록 어드민" | 구현 증거 없음 |
| SGF 드로잉 툴 연동 | SGF-001 | 구현 증거 없음 |
| SGF 인증 뱃지 | SGF-001 | 구현 증거 없음 |
| GA4 연동 | PRD §7 | 구현 증거 없음 |
| 에러 모니터링 (Sentry 등) | PRD §7 | 구현 증거 없음 |
| 이용약관/개인정보처리방침 | PRD §7 | 구현 증거 없음 — Footer 자체 없음 |
| 알림 아이콘/페이지 | PRD §5-1 | 구현 증거 없음 |
| Task/Board/WBS 관리 기능 | Notion PM 요구 | 구현 증거 없음 |
| 404 에러 페이지 | 일반 | 구현 증거 없음 |
| 검색 기능 | Phase 2 | 구현 증거 없음 (Phase 2이므로 정상) |
| 댓글 기능 | Phase 2 | 구현 증거 없음 (Phase 2이므로 정상) |

---

## 5. 라우트 기준 누락 페이지

### 5-1. 현재 정의된 라우트 (11개)

| 라우트 | 컴포넌트 | 네비게이션 진입점 | 상태 |
|--------|---------|------------------|------|
| `/` | Browse | 로고 클릭 | ✅ |
| `/browse` | Browse | Header "둘러보기" | ✅ (`/`와 중복) |
| `/works/:id` | Browse (모달) | WorkCard 클릭 | ✅ |
| `/upload` | Upload | Header "작품 올리기", Events "참여하기" | ✅ |
| `/profile` | Profile | Header 드롭다운 "내 프로필" | ✅ |
| `/profile/:id` | Profile | 작가명 클릭 | ✅ |
| `/events` | Events | Header "이벤트" | ✅ |
| `/admin` | AdminDashboard | Header 드롭다운 "운영 관리" | ✅ |
| `/admin/issues` | UnresolvedIssues | Admin 사이드바 "미결 이슈" | ✅ |
| `/admin/checklist` | LaunchChecklist | Admin 사이드바 "런칭 체크리스트" | ✅ |
| `/admin/partners` | PartnerArtists | Admin 사이드바 "파트너 작가" | ✅ |

### 5-2. 누락된 라우트

| 예상 라우트 | 근거 | 현재 상태 |
|------------|------|----------|
| `/events/:id` | PRD §3 "이벤트 상세 페이지" | 라우트 미정의, 컴포넌트 미존재 |
| `/admin/events` | MKT-001/002 "이벤트 참여자 어드민" | 라우트 미정의, 컴포넌트 미존재 |
| `/onboarding` | USER-001 "최초 로그인 시 온보딩" | 라우트 미정의, 컴포넌트 미존재 |
| `/terms`, `/privacy` | PRD §7 법적 요구 | 라우트 미정의, Footer 없음 |
| `/*` (404 폴백) | 일반 | 와일드카드 라우트 미정의 |

### 5-3. 라우트 이슈

| 이슈 | 설명 |
|------|------|
| `/`와 `/browse` 중복 | 동일 컴포넌트(Browse)를 두 경로에서 렌더링 — SEO/분석 불리 |
| Admin 접근 제어 없음 | `/admin` URL 직접 입력 시 비로그인 사용자도 접근 가능 |

---

## 6. 목업(Mock UI)만 있는 항목

| 항목 | 파일 | 설명 |
|------|------|------|
| 이벤트 배너/목록 | `src/app/pages/Events.tsx` | promotionBanners, upcomingEvents 하드코딩 텍스트 |
| 이벤트 알림 구독 | `src/app/pages/Events.tsx` | 이메일 입력 모달 — 실제 전송 없음 (성공 메시지만) |
| 프로모션 배너 | `src/app/pages/Browse.tsx` | 7개 배너 하드코딩, CMS 연결 없음 |
| 팔로우 버튼 | `src/app/pages/Profile.tsx`, `src/app/components/WorkDetailModal.tsx` | UI 토글만 — 팔로워 수 변경/저장 안 됨 |
| 언어 전환 | `src/app/components/Header.tsx:112-128` | 한/영 드롭다운 — 번역 없음 |
| 작가 팔로워/팔로잉 수 | `src/app/data.ts:34-60` | 하드코딩 숫자, 변경 불가 |
| 공유하기 | `src/app/components/WorkDetailModal.tsx` | 클립보드 복사만 — SNS 직접 공유 미구현 |

---

## 7. 데이터 연결 안 된 항목

| 항목 | 파일 | 현재 상태 | 필요한 연결 |
|------|------|----------|------------|
| 모든 사용자 데이터 | `src/app/store.ts` | localStorage 9개 키 | 실제 DB + REST/GraphQL API |
| 관리자 데이터 | `src/app/admin/adminStore.ts` | localStorage (seed 데이터) | 실제 DB + API |
| 이미지 | `src/app/imageUrls.ts` | Unsplash 외부 URL 70개 매핑 | S3/CloudFront 업로드 |
| 작가 프로필 | `src/app/data.ts:34-60` | 25명 하드코딩 | 실제 사용자 DB |
| 작품 데이터 | `src/app/data.ts:63+` | 60+개 하드코딩 | 실제 DB |
| LABELS 상수 | `src/app/admin/constants.ts` | 정의만 됨, admin 외 미사용 | 전체 앱에 import 적용 필요 |
| 인증 | `src/app/store.ts:294-331` | boolean 토글 (`artier_auth`) | OAuth + JWT |
| 댓글 수 | `src/app/data.ts` Work.comments | 하드코딩 숫자 | Phase 2 댓글 기능 연동 |

### localStorage 키 전체 목록

| 키 | 용도 | 스토어 |
|----|------|--------|
| `artier_works` | 작품 데이터 | workStore |
| `artier_drafts` | 초안 | draftStore |
| `artier_profile` | 프로필 | profileStore |
| `artier_interactions` | 좋아요/저장 | userInteractionStore |
| `artier_auth` | 인증 상태 | authStore |
| `artier_pin_comments` | 핀 코멘트 | pinCommentStore |
| `artier_admin_issues` | 미결 이슈 | issueStore |
| `artier_admin_checklist` | 런칭 체크리스트 | checklistStore |
| `artier_admin_partners` | 파트너 작가 | partnerStore |

---

## 8. 용어 불일치 항목

### 8-1. 사람 호칭 (가장 심각)

| 현재 사용 | 위치 | 권장 |
|-----------|------|------|
| `작가` | Upload.tsx:434, Profile.tsx:708 | **작가** (정규) |
| `작업자` | Upload.tsx:718 (사이드바 라벨) | → 작가 |
| `여러 작업자` | Browse.tsx:436, WorkDetailModal.tsx:80 | → 공동 작가 |
| `공동 작업자` | Profile.tsx:710, 790 | → 공동 작가 |
| `참여 작가` | Browse.tsx:421, WorkDetailModal.tsx:283 | → 공동 작가 |
| `공동 소유자` | Upload.tsx (모달 라벨) | → 공동 작가 |

### 8-2. 전시 유형

| 현재 사용 | 위치 | 권장 |
|-----------|------|------|
| `개인전시` (띄어쓰기 없음) | Browse.tsx:19 | → 개인 전시 |
| `공동전시` (띄어쓰기 없음) | Browse.tsx:20 | → 공동 전시 |
| `개인` / `그룹` | Profile.tsx 필터 | → 개인 전시 / 공동 전시 |
| `개인 전시` / `공동 전시` | constants.ts LABELS | **정규** (사용 안 됨) |

### 8-3. 액션

| 현재 사용 | 위치 | 권장 |
|-----------|------|------|
| `발행하기` | Upload.tsx:577, 926 | 발행하기 (정규) |
| `작품 올리기` | Header.tsx:70 | 작품 올리기 (네비게이션용) |
| `작품 업로드 하기` | Profile.tsx:694 | → 작품 올리기 |

### 8-4. 브랜드

| 현재 사용 | 위치 | 권장 |
|-----------|------|------|
| `artier` (소문자) | Header.tsx:44 | → **Artier** |
| `Artier` (대문자) | Events.tsx:86, constants.ts | **Artier** (정규) |

### 8-5. 그룹명

| 현재 사용 | 위치 | 권장 |
|-----------|------|------|
| `클래스 / 동호회명` | Upload.tsx:531 | → 그룹명 |
| `그룹명` | Profile.tsx, data.ts | **그룹명** (정규) |

### 8-6. LABELS 상수 사용 현황

| 상수 | 정의 위치 | 사용 위치 |
|------|----------|----------|
| `LABELS.SERVICE_NAME` | constants.ts | AdminLayout.tsx만 |
| `LABELS.NAV_ADMIN` | constants.ts | AdminLayout.tsx만 |
| 그 외 모든 LABELS | constants.ts | **어디에서도 사용 안 됨** |

---

## 9. P0 / P1 우선순위

### P0 — 런칭 전 필수 (Blocking)

| # | 항목 | 근거 파일 | 이유 |
|---|------|----------|------|
| 1 | **실제 인증 시스템** | `src/app/store.ts:294-331` | boolean 토글로는 프로덕션 불가. 카카오/구글 OAuth 필수 (USER-001) |
| 2 | **백엔드 API + DB** | 전체 — fetch/axios 호출 0건 | 모든 데이터 localStorage. 다중 사용자/디바이스 지원 불가 |
| 3 | **이미지 스토리지** | `src/app/imageUrls.ts` | Unsplash URL만 사용. 실제 업로드 이미지 저장소 없음 |
| 4 | **이용약관/개인정보처리방침** | Footer 없음, Layout.tsx | PRD §7 법적 요구. 런칭 전 필수 |
| 5 | **Admin 접근 제어** | `src/app/routes.ts:31-37` | URL 직접 입력 시 누구나 접근 가능 |
| 6 | **이벤트 참여자 관리** | 구현 증거 없음 | MKT-001/002 PRD 명시. 런칭 이벤트 운영 불가 |
| 7 | **GA4 이벤트 추적** | 구현 증거 없음 | PRD §7 KPI 측정 불가 |

### P1 — 런칭 직후 또는 품질 개선

| # | 항목 | 근거 파일 | 이유 |
|---|------|----------|------|
| 8 | **용어 정규화 적용** | `src/app/admin/constants.ts` | "작업자/작가/공동 작업자/여러 작업자" 4종 혼재 |
| 9 | **이벤트 상세 페이지** | `/events/:id` 미존재 | PRD IA 명시 |
| 10 | **온보딩 플로우** | 구현 증거 없음 | USER-001 요구 |
| 11 | **404 폴백 페이지** | `src/app/routes.ts` 와일드카드 없음 | UX 기본 |
| 12 | **Footer 컴포넌트** | `src/app/Layout.tsx` | 약관, 개인정보, 사이트맵 링크 배치 |
| 13 | **팔로우 기능 실동작** | `src/app/pages/Profile.tsx` | UI 토글만 — 저장/카운트 미반영 |
| 14 | **Task/Board/WBS** | 구현 증거 없음 | Notion PM 요구. 인앱 vs Notion 연동 결정 필요 |
| 15 | **`/`와 `/browse` 중복 해소** | `src/app/routes.ts:14-15` | SEO/분석 불리 |

---

## 부록: 파일 구조 참조

```
src/app/
├── App.tsx                          # RouterProvider
├── Layout.tsx                       # Header + Outlet (Footer 없음)
├── routes.ts                        # 라우트 정의 (11개)
├── data.ts                          # Artist, Work 인터페이스 + mock 데이터
├── groupData.ts                     # Group, WorkOwner + 그룹 mock 데이터
├── store.ts                         # 5개 스토어 (work, draft, profile, interaction, auth)
├── imageUrls.ts                     # Unsplash URL 매핑
├── utils/
│   ├── imageHelper.ts
│   └── colorPalette.ts
├── store/
│   └── pinCommentStore.ts           # 핀 코멘트 스토어
├── pages/
│   ├── Browse.tsx                   # 메인 피드
│   ├── Upload.tsx                   # 작품 업로드
│   ├── Profile.tsx                  # 프로필
│   └── Events.tsx                   # 이벤트
├── components/
│   ├── Header.tsx                   # GNB
│   ├── WorkCard.tsx                 # 작품 카드
│   ├── WorkDetailModal.tsx          # 작품 상세 모달
│   ├── LoginPromptModal.tsx         # 로그인 유도
│   ├── work/
│   │   ├── TimelapsePlayer.tsx
│   │   ├── PinCommentLayer.tsx
│   │   └── ColorPaletteSuggestion.tsx
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   └── ui/                          # Radix UI 44개 컴포넌트
└── admin/
    ├── constants.ts                 # LABELS, 상태 상수, 색상 매핑
    ├── types.ts                     # UnresolvedIssue, ChecklistItem, PartnerArtist
    ├── seedData.ts                  # 시드 데이터
    ├── adminStore.ts                # 관리자 스토어 (3개)
    ├── AdminLayout.tsx              # 사이드바 레이아웃
    ├── AdminDashboard.tsx           # 운영 대시보드
    ├── UnresolvedIssues.tsx         # 미결 이슈
    ├── LaunchChecklist.tsx          # 런칭 체크리스트
    └── PartnerArtists.tsx           # 파트너 작가 관리
```
