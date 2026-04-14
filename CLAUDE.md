# Artier (SuperGallery Phase 1)

## 프로젝트 개요
시니어/중장년 순수미술 작가를 위한 웹 기반 디지털 갤러리 플랫폼.
개인 작품 업로드 및 그룹 전시(동호회·클래스·친구) 기능 제공.

> 구현 완성도: reference 명세 기준 약 97~100% (Phase 1 범위).
> 상세 현황은 `IMPLEMENTATION_DELTA.md` 참조.

## 스펙 문서
- 작품 올리기 전체 스펙: `docs/upload-spec.md`
- 작품 주조색 자동 배경: `docs/dominant-color-spec.md` (구현 완료)
- 구현 델타 보고서: `IMPLEMENTATION_DELTA.md`

## 주요 파일

### 페이지
- `src/app/pages/Upload.tsx` — 작품 업로드 전체 플로우
- `src/app/pages/ExhibitionDetail.tsx` — 전시 상세
- `src/app/pages/ExhibitionRoute.tsx` — `?from=invite` 분기 처리
- `src/app/pages/ExhibitionInviteLanding.tsx` — 전시 초대장 오픈 화면 (2026-04-13 신설)
- `src/app/pages/Profile.tsx` — 강사 표시 자동 파생 (`instructorVisible`)
- `src/app/pages/Search.tsx` — 검색 (계정별/게스트 키 분리, 마이그레이션 TODO)
- `src/app/pages/FlowDemoTools.tsx` — `/demo` PM 데모 맵
- `src/app/pages/DemoReferenceToolkit.tsx` — `/demo/reference` 검수 툴킷

### 컴포넌트
- `src/app/components/ConfirmDialog.tsx` — 커스텀 확인 다이얼로그 (Radix AlertDialog 기반, Promise API)
- `src/app/components/WorkCard.tsx` — 좋아요·저장 상태 아이콘 (숫자 미노출)
- `src/app/components/WorkDetailModal.tsx` — 공유 URL에 `?from=invite` 자동 부여
- `src/app/components/PointsBootstrap.tsx` — 부트스트랩 포인트 동기화
- `src/app/components/WorksStorageSync.tsx` — works 스토리지 버전 동기화
- `src/app/components/work/PinCommentLayer.tsx` — Phase 2 선행 구현
- `src/app/components/work/TimelapsePlayer.tsx` — Phase 2 선행 구현 (UI만)
- `src/app/components/work/ColorPaletteSuggestion.tsx` — 주조색 추출 + 배경 적용

### 유틸 / Store
- `src/app/store.ts` — `WORKS_STORAGE_VERSION` 스토리지 버전 관리 (현재 v6)
- `src/app/store/workStore.ts`, `draftStore.ts` — 작품/초안 상태
- `src/app/store/pinCommentStore.ts` — Pin 코멘트 (localStorage `artier_pin_comments`)
- `src/app/utils/colorPalette.ts` — 주조색 추출 알고리즘
- `src/app/utils/inviteMessaging.ts` — 초대 발송 (5% 랜덤 실패 시뮬, `artier_invite_messaging_log`)
- `src/app/utils/adminGate.ts` — 운영팀 역할 토글
- `src/app/utils/feedOrdering.ts` — 둘러보기 피드 랭킹
- `src/app/utils/bannerStore.ts` — 배너 관리 (드래그 순서 변경 미구현)
- `src/app/utils/pushDemoNotification.ts` — 알림 데모 푸시
- `src/app/utils/reviewLabels.ts` — 검수 사유 4분류
- `src/app/utils/analytics.ts` — GA4 스캐폴딩
- `src/app/utils/pointsBackground.ts` — 포인트 적립/회수 (`pointsRecallIfQuickDelete`, `addDemoPp`)

> ⚠️ **삭제됨**: `src/app/utils/instructorPublic.ts` (2026-04-13). 강사 여부는 더 이상 별도 플래그가 아니라 업로드 이력에서 자동 파생 — 아래 "강사 표시 정책" 참조.

## 코딩 규칙

### 필수
- **다국어**: `useI18n()`의 `t()` 사용. 문자열 하드코딩 금지.
  - **locale 반응성**: `getStoredLocale()` 스냅샷 함수를 렌더 시점에 직접 호출하지 말 것.
    반드시 `useI18n()`의 `locale`·`t`를 사용해 런타임 언어 전환 시 리렌더가 트리거되게 할 것
    (구 `ContentReview.tsx` 패턴은 안티패턴 — IMPLEMENTATION_DELTA §11.5 참조).
- **상태관리**: `workStore`, `draftStore` 사용
- **스타일**: Tailwind CSS + shadcn/ui
- **시니어 친화**: 모든 인터랙티브 요소 `min-h-[44px]` 유지
- **확인 다이얼로그**: 브라우저 네이티브 `window.confirm()` **금지**.
  반드시 `openConfirm({ title, description?, destructive? })` (ConfirmDialog) 사용.
  파괴적 작업은 `destructive: true`로 빨간 버튼 표시.

### 금지
- 스프레드시트형 UI, 다중선택(Shift+Click), Tab 이동 방식
- `window.confirm()`, `window.alert()` 직접 호출
- `dangerouslySetInnerHTML` (XSS — 꼭 필요한 경우 sanitize 후 사용)
- `UserProfile.isInstructor` 필드 재도입 (삭제됨, 자동 파생으로 통합)
- `instructorPublic.ts` 재생성 (삭제됨)
- 강사 여부를 위한 별도 프로필 토글 UI 추가
- `localStorage` 키 `artier_instructor_public_ids` 재기록 (deprecated)

### Phase 2 선행 구현 (주의)
다음 3개 항목은 PRD §2.2 Out of Scope이지만 **선제 구현되어 코드에 존재** (IMPLEMENTATION_DELTA §2.1).
신규 진입 시 활성화 여부 확인 필요:
- Pin 코멘트 (`PinCommentLayer`)
- 타임랩스 (`TimelapsePlayer` — 영상 소스 미연결)
- 색상 팔레트 추출 (`ColorPaletteSuggestion` — Phase 1 활성)

### PRD §2.2 적용으로 UI 제거됨, 데이터 필드만 잔존
다음 항목은 위와 다른 범주 — **한때 구현되었다가 PRD Out of Scope에 맞춰 UI를 제거**한 흔적.
관련 필드/계산 로직이 아직 코드에 남아 있으니 건드릴 때 주의:
- 댓글 — `WorkCard` 하단 숫자 노출 제거 (IMPLEMENTATION_DELTA §10.2),
  `feedOrdering.ts` 가중치 계산식에 `comments` 항이 남아있으나 데이터 필드가 항상 0 (§8.6)

### WorkCard 표시 규칙
- 카드 하단에 **좋아요·저장 상태 아이콘만** 노출 (숫자 비노출)
- 댓글 숫자는 PRD §2.2 Out of Scope 적용으로 제거됨

## 강사 표시 정책 (2026-04-13 단일화)

> IMPLEMENTATION_DELTA §3.3 / §10.4 참조

- 강사 여부는 **업로드 이력에서 자동 파생**되는 단일 소스 정책
- `instructorVisible = works.some(w => w.artistId === me.id && w.isInstructorUpload === true)`
- **단일 진입점**: 함께 올리기 → 세부정보 모달 → "저는 강사예요" 체크박스
- 한 작품이라도 `isInstructorUpload === true`로 발행되면 → 프로필에 "수강생 작품" 탭 자동 노출
- 모든 해당 작품 삭제 시 → 자동 비노출

### 금지
- `UserProfile.isInstructor` 필드 부활 (삭제됨)
- 프로필 편집 화면에 "강사 토글" 추가 (UX 단순화 + 상태 불일치 차단 목적)
- `instructorPublic.ts` 재생성
- i18n 키 `profile.instructorToggle`, `profile.instructorHelp` 부활 (삭제됨)

## 환경 변수

| 변수 | 동작 | 용도 |
|---|---|---|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 업로드 즉시 `approved` 상태 (검수 24h 우회) | 개발/데모 편의 |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회 | CI / 프리뷰 환경 |

## 데이터·영속화

### localStorage 키
- 활성: `artier_works_*`, `artier_notifications`, `artier_pin_comments`,
  `artier_invite_messaging_log`, `artier_admin_banners_v1`, `artier_works_version`,
  `artier_recent_searches__<slug>`, `artier_recent_searches__guest`
- **Deprecated (마이그레이션 대상)**: `artier_instructor_public_ids`
  - 강사 토글 단일화(§10.4) 이후 아무 코드도 읽지 않음
  - 이전에 강사 토글을 켰던 브라우저에 잔류 → `PointsBootstrap` / `WorksStorageSync` 부트스트랩 시점에
    `localStorage.removeItem('artier_instructor_public_ids')` 1회 실행 권장

### 기타
- **버전 관리**: `WORKS_STORAGE_VERSION` 변경 시 works 데이터 자동 재시드
- **이벤트 데이터**: 현재 3곳 분산 (`Events.tsx`, `EventDetail.tsx`, `admin/EventManagement.tsx`).
  단일 `eventStore`로 통합 + localStorage 영속화 작업 예정 (TOP 우선순위, IMPLEMENTATION_DELTA §8.5·§9.7 참조).
- **포인트 회수**: 업로드 후 24시간 이내 삭제 시 AP -20 (`pointsBackground.ts:pointsRecallIfQuickDelete`)
- **강사 표시**: 별도 저장소 없음. 매번 `works`에서 파생 계산 (단일 소스)

## 알려진 잔여 이슈 (Technical Polish)

> IMPLEMENTATION_DELTA §11 — 기능 동작에는 영향 없으나 정리 권장 항목.

| # | 항목 | 위치 | 영향도 | 작업량 |
|---|---|---|---|---|
| 11.1 | Orphan localStorage 정리 (`artier_instructor_public_ids`) | `PointsBootstrap` / `WorksStorageSync` | Low | 5분 |
| 11.2 | 어드민 작품 삭제 목업 → 실 store 연결 | `admin/WorkManagement.tsx:60` | Medium | — |
| 11.3 | 검색 히스토리 guest → 로그인 마이그레이션 | `Search.tsx` | Low UX | 15~30분 |
| 11.4 | ExhibitionInviteLanding seed 필터 (pending/rejected 빈 그리드) | `ExhibitionInviteLanding.tsx` `collectExhibitionWorks` | Low | 15~30분 |
| 11.5 | ContentReview 모달 locale 비반응성 | `admin/ContentReview.tsx` | Very Low | 5분 |
| 11.6 | 배너 드래그앤드롭 순서 변경 | `bannerStore.ts`, `admin/BannerManagement.tsx` | Medium | — |

### 빠른 정리 권장 (5분 내)
- **11.1**: bootstrap 컴포넌트에 1줄 추가 (orphan 키 제거)
- **11.5**: `useI18n()` 기반으로 ContentReview 모달 재작성

### 중간 작업 (15~30분)
- **11.3**: `recentSearchStorageKey()` 변경 effect에서 guest 키 → 계정 키 머지 후 guest 키 삭제
- **11.4**: `collectExhibitionWorks`에서 seed는 `isWorkVisibleOnPublicFeed` 필터 무시하고 항상 포함, 또는 "검수 중 — 공개 전" 상태 배지 노출

## 외부 연동 미완 (Phase 2 예정)
소셜 OAuth(카카오/구글/애플), 이메일 발송, SMS/카카오 알림톡, Supabase 실서버, OG 이미지 동적 생성.
모두 모의(localStorage 로그) 수준이며 PM 데모 목적상 의도적 유보.

## 우선 보완 항목 (배포 전)
1. 이벤트 메뉴 단일 store 통합 + CRUD 실동작 + 영속화
2. 만 14세 미만 가입 차단 (생년월일 입력·검증)
3. 비속어 필터 (닉네임·그룹명·전시명·태그)
4. 피드 큐레이션 레이어 (이번 주 테마전 + 작가 추천)
5. 팔로우 신호 가중치 (`feedOrdering.ts`)

상세는 `IMPLEMENTATION_DELTA.md` §9, §10, §11 참조.
