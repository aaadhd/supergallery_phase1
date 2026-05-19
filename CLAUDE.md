# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Proud Gallery (SuperGallery Phase 1)

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드 → dist/
npm run preview      # 빌드 결과물 로컬 미리보기
npm run gallery:manifest  # public/images 변경 후 로컬 갤러리 매니페스트 재생성
npm run ui:add       # shadcn/ui 컴포넌트 추가
```

테스트 프레임워크 미설정. TypeScript 타입 검사만: `npx tsc --noEmit`

## 프로젝트 개요
시니어/중장년 순수미술 작가를 위한 웹 기반 디지털 갤러리 플랫폼.
개인 작품 업로드 및 그룹 전시(동호회·클래스·친구) 기능 제공.

> Phase 1 기획 문서는 **`_planning/`** 단일 소스이며, 구현은 현재 `src/app/` 코드를 기준으로 한다. 완성도를 퍼센트로 표기하지 않는다.

### 용어 주의 (코드 ↔ 한국어)

코드 타입 이름과 실제 뜻이 어긋나는 지점이 있으므로 읽기 전 확인:

- **`Work` 타입 (data.ts)** = 한국어 **"전시(Exhibition)"** 컨테이너. 1~10장의 이미지·`exhibitionName`·`primaryExhibitionType`·`groupName` 등 전시 단위 메타를 모두 담는다. 업로드 한 번 = `Work` 하나.
- **한국어 "작품"** (개별 이미지 1장) = 코드상 **별도 엔티티가 없고** `Work` 안의 `image[i]` + `imagePieceTitles[i]` + `imageArtists[i]` 배열 요소로 존재.
- 따라서 좋아요·저장·Pick·신고·뱃지는 모두 `Work`(=전시) 단위 스칼라. 이미지별 인터랙션 필드는 구조적으로 존재하지 않음.
- URL은 이미 `/exhibitions/:workId`로 "exhibition" 용어를 쓰고 있어 일관성 있음. 타입 이름만 과거 명이 남은 상태.
- 백엔드 ERD 설계 시 `Work` → `Exhibition` 리네이밍 검토 권장.

## 스펙 문서
- **기획 단일 소스**: `_planning/` — 정책(`Policy_v1.md`)·사용자 PRD(`PRD_User_v1.md`)·어드민 PRD(`PRD_Admin_v1.md`)·화면 목록(`IA_ScreenList_v1.md`)·카피 가이드(`Copy_v1.md`). **화면·AC·플로우의 SSoT는 PRD**, **정책·수치 캐노니컬은 Policy**. 시스템 아키텍처·데이터 모델·디자인 토큰은 코드(스토어·엔티티)와 디자인 자산이 단일 소스.
- 전시명·작품명·그룹명 글자 상한: **`TITLE_FIELD_MAX_LEN`** (`src/app/utils/workDisplay.ts`, 현재 **20**).
- 작품 톤 배경 묻어나는 효과: **원본 이미지를 blur + scale + opacity로 깔아** 순수 CSS로 구현 (`WorkDetailModal.tsx`·`Upload.tsx`의 BluredArtworkBg 컴포넌트). dominant-color 추출 알고리즘 불필요.

## 문서 작업 시작 전 확인 (필수)

PM 결정이 영향을 받는 작업(카피 작성·정책 정정·기획 변경·핸드오프 문서 수정 등)을 시작하기 전 **`_planning/README.md`를 먼저 읽는다.** 기획 문서 규약·용어 사전·충돌 방지 구조·**문서 갱신 규칙**(화면 스펙 HTML 동기화·**`_planning` 내 마크다운 상호 정합**) 등 세부 규칙은 README에만 정리되어 있으며, 본 파일은 요약·코드 인덱스 역할만 한다. README에 없는 예외를 임의로 두지 말 것.

확인 우선순위(README 본문에 상세):
1. **「용어 사전」**
2. **「기획 문서 목록」+「충돌 방지 구조」**

문서 작업 결과가 README 표준에 어긋난 표현을 포함하면 **그 자체로 결함**으로 간주한다.

## 문서 동기화·버전 규칙

### 1) 코드 ↔ 플래닝 동시 갱신 (필수)

- 코드 변경이 스펙(정책·화면·컴포넌트·카피·엔티티)에 영향이 있으면 **해당 `_planning/*.md` 문서를 같은 작업 범위에서 반드시 함께 업데이트**한다.
- 반대로 스펙만 바뀌고 구현이 따라오지 않는 상태도 동일 규칙의 위반. 스펙-구현은 단일 푸시 단위로 일치시킨다.
- 영향 매핑 가이드:
  - 정책·수치·규칙·런칭 전 미해결 항목·연쇄 정리 → `Policy_v1.md`
  - 화면·경로·ID → `IA_ScreenList_v1.md`
  - 사용자 기능·AC → `PRD_User_v1.md` · 어드민 기능 → `PRD_Admin_v1.md`
  - UX 문구·i18n 키 → `Copy_v1.md`
  - 엔티티·스토어·컴포넌트 계약·환경 플래그·시각 토큰 등 기술/디자인 자산 — `_planning` 외부에서 관리(코드·디자인 도구가 단일 소스). 변경 시 영향이 정책·요구사항·화면 카드에 미치면 그쪽 문서만 갱신한다.
  - `_planning/_screen_specs/ProudGallery_Screen_Spec_v1.html` 동기화 트리거·작업 단위는 **`_planning/README.md` 「문서 갱신 규칙」·「화면 스펙 HTML 동기화 의무」**를 따른다(본 파일에 중복 서술 없음).
  - 기획 문서만 수정할 때도 **주제별로 연관 파일을 한 작업 범위에서 묶는다**. 번들 체크리스트는 **`_planning/README.md` 「주제별 연쇄 갱신 번들」** (신고·초대·검수·가입·문의·용어 등).

### 2) 문서 버전 표기 (push 단위)

**푸시 전에는 버전 번호를 올리지 않는다·푸시 후에만 올린다**는 원칙과 표 헤더 동기는 **`_planning/README.md` 「푸시 경계와 버전 번호」**가 단일 소스다.

각 `_planning/*.md` 말미에 `## 문서 이력` 테이블이 있으며, **파일별로** 다음을 적용한다.

- **Push 이후 그 문서의 첫 수정** → 새 버전 행 1개 추가 (그 시점 변경 요약)
- **같은 push 사이클 내 추가 수정** → 같은 행의 "변경 내용"에 **텍스트만 append**, 버전 숫자는 유지
- **Push 시점** → 현재 최신 행이 인계된 상태. 별도 작업 없음
- **다음 push 이후 첫 수정 시점** → 다음 버전으로 새 행 1개 추가, 이후 규칙 반복

판별 기준: `git log origin/main -1 -- _planning/<파일>.md` 이후 로컬 커밋에 해당 파일이 이미 등장했으면 "행 추가됨" 상태이며 같은 행에 append, 아니면 새 행 추가.

### 3) 금지

- Push 대기 상태에서 **한 파일에 여러 버전 행 추가** (v1.9 + v2.0 같이)
- 문서 수정 없이 코드만 수정한 PR / 코드 수정 없이 문서만 수정한 PR (정책·버그픽스 제외)
- `_planning/*.md` 문서 내부에 **개발 코드 경로·라인 넘버 참조** (문서 단독 재현성 보장). 계약 이름(스토어·컴포넌트)은 허용.

## 아키텍처

### 앱 셸 계층

```
src/main.tsx
  └─ App.tsx          ThemeProvider · I18nProvider · ConfirmDialogRoot · Toaster
     └─ AppRootShell  페이지 전환 fade(150ms) · QaScreenShortcuts 플로팅 버튼
        └─ Layout     Header · Footer · 계정 정지 가드 · 페이지 타이틀 동기화
           └─ pages/  Browse, Upload, Profile, ...
        └─ (Layout 밖) /onboarding · /login · /signup · /auth/verify · /maintenance
        └─ /admin/*   AdminLayout · AdminDashboard · ...
```

경로 alias: `@` → `src/` (`vite.config.ts`).

### 상태 관리 패턴

`store.ts`의 스토어들은 Zustand/Redux 없이 클로저 + 구독자 배열로 구현된다. 상태 변경 시 두 채널로 알린다:

1. **내부 구독자**: `listeners.forEach(l => l())` — 같은 탭 내 React 훅
2. **커스텀 이벤트**: `window.dispatchEvent(new Event('artier-*'))` — 다른 스토어·컴포넌트 크로스 탭

주요 이벤트: `artier-works-changed` · `artier-curation-changed` · `artier-events-changed` · `artier-locale`

### 이미지 이중 저장소

업로드된 이미지는 용량에 따라 자동 분리된다(`utils/workMediaIdb.ts`):

- **소형**: `Work.image[]`에 data URL 직접 저장 (localStorage)
- **대형** (data:/blob: 또는 120KB 초과): IndexedDB `artier_work_media` → `blobs` 스토어로 offload. `localStorage`의 `Work.image[]`에는 `__artier_media__|<workId>|<slot>` 포인터만 남음.

이미지를 렌더링할 때 `imageUrls[i] || work.image[i]` 패턴으로 IDB에서 hydrate된 URL을 우선 사용한다.

## 주요 파일

### 페이지
- `src/app/pages/Upload.tsx` — 작품 업로드 전체 플로우
- `src/app/pages/ExhibitionRoute.tsx` — `?invite=<token>` (비회원 초대 토큰) → ExhibitionInviteLanding · `?from=work` (레거시 작품 공유) → ExhibitionWorkShareLanding · 그 외 → Browse + 작품 모달 자동 오픈
- `src/app/pages/ExhibitionInviteLanding.tsx` — 전시 초대장 오픈 화면
- `src/app/pages/ExhibitionWorkShareLanding.tsx` — `?from=work` 작품 공유 랜딩
- `src/app/pages/Profile.tsx` — 프로필 홈·탭
- `src/app/pages/Search.tsx` — 검색 (계정별/게스트 키; 로그인 시 guest 히스토리 병합)
- `src/app/pages/FlowDemoTools.tsx` — `/demo` PM 데모 맵
- `src/app/pages/DemoReferenceToolkit.tsx` — `/demo/reference` 검수 툴킷

### 컴포넌트
- `src/app/components/ConfirmDialog.tsx` — 커스텀 확인 다이얼로그 (Radix AlertDialog 기반, Promise API)
- `src/app/components/WorkDetailModal.tsx` — 일반 공유 URL에 `?from=invite` 흔적 부여 (라우팅상 Browse fallthrough라 작동은 모달 오픈으로 동일. 비회원 초대 토큰 모델은 별도 `InviteShareButton`이 `?invite=<token>` 생성)
- `src/app/components/PointsBootstrap.tsx` — 부트스트랩 포인트 동기화 + 레거시 localStorage 키 정리
- `src/app/components/WorksStorageSync.tsx` — works 스토리지 버전 동기화
- `src/app/components/work/CopyrightProtectedImage.tsx` — 우클릭/드래그 차단 이미지 컴포넌트
- `src/app/components/SocialSignupModal.tsx` — 소셜 첫 가입 시 약관 동의 + 닉네임 입력
- `src/app/components/QaScreenShortcuts.tsx` — QA/검수용 바로가기 플로팅 버튼 (DEV 또는 `VITE_FOOTER_QA_LINKS` 활성 시)
- `src/app/components/RequiredMark.tsx` — 필수 입력 표시 (빨간 별 + sr-only 라벨)

### 유틸 / Store
- `src/app/store.ts` — `WORKS_STORAGE_VERSION` 스토리지 버전 관리 (현재 값 `local-gallery-v21`, 키 `artier_works_version`). `workStore`·`draftStore`·`profileStore`·`connectMemberToSlot`(가입자가 본인 작품 카드 클릭 시 `'non-member'` → `'member'` 승격, race 차단) 등 핵심 스토어·함수가 본 파일 안에 함께 정의됨.
- `src/app/utils/inviteTokenStore.ts` — 비회원 초대 토큰 스토어. `issueInviteToken`(전시 발행 직후, status `'inactive'`) · `activateInviteToken`(검수 승인) · `deactivateInviteToken`(검수 반려·대기 회귀) · `revokeInviteToken`(전시 삭제·만료, 영구 무효) · `getInviteToken` lazy 만료 평가. 90일 TTL.
- `src/app/utils/adminGate.ts` — 운영팀 역할 토글
- `src/app/utils/feedOrdering.ts` — 둘러보기 피드 랭킹
- `src/app/utils/feedVisibility.ts` — 피드 공개 여부 필터
- `src/app/utils/bannerStore.ts` — 배너 관리 (DnD 적용됨)
- `src/app/utils/pushDemoNotification.ts` — 알림 데모 푸시
- `src/app/utils/reviewLabels.ts` — 검수 사유 4분류
- `src/app/utils/analytics.ts` — GA4 스캐폴딩
- `src/app/utils/registeredAccounts.ts` — 가입 이메일·전화 중복 검사 레지스트리
- `src/app/utils/groupNameRegistry.ts` — 그룹명 자동완성(내 최근·작품 기반). 중복 허용, 정규화·캐논 맵 없음.
- `src/app/utils/imageHelper.ts` — 이미지 리사이즈·유틸
- `src/app/utils/searchRank.ts` — 검색 결과 랭킹
- `src/app/utils/pointsBackground.ts` — 포인트 적립/회수 (`pointsRecallIfQuickDelete`, `addDemoPp`)

## 코딩 규칙

### 필수
- **다국어**: `useI18n()`의 `t()` 사용. 문자열 하드코딩 금지.
  - **locale 반응성**: `getStoredLocale()` 스냅샷 함수를 렌더 시점에 직접 호출하지 말 것.
    반드시 `useI18n()`의 `locale`·`t`를 사용해 런타임 언어 전환 시 리렌더가 트리거되게 할 것.
- **상태관리**: `workStore`, `draftStore` 사용
- **스타일**: Tailwind CSS + shadcn/ui
- **시니어 친화**: 모든 인터랙티브 요소 `min-h-[44px]` 유지
- **확인 다이얼로그**: 브라우저 네이티브 `window.confirm()` **금지**.
  반드시 `openConfirm({ title, description?, destructive? })` (ConfirmDialog) 사용.
  복구 불가 작업은 `destructive: true`로 빨간 버튼 표시.

### 금지
- 스프레드시트형 UI, 다중선택(Shift+Click), Tab 이동 방식
- `window.confirm()`, `window.alert()` 직접 호출
- `dangerouslySetInnerHTML` (XSS — 꼭 필요한 경우 sanitize 후 사용)

### Dead code 금지 (export만 두고 화면 미연결)
다음 이름은 삭제된 컴포넌트다. 재도입 시 PRD Out of Scope 여부를 확인하고 실제 사용 화면도 함께 연결할 것:
- `PinCommentLayer`, `pinCommentStore.ts` — Pin 코멘트
- `TimelapsePlayer` — 타임랩스
- `ColorPaletteSuggestion`, `utils/colorPalette.ts` — 색상 팔레트 추출

### UI 제거, 데이터 필드 잔존
- 댓글 — `Work.comments` 필드는 데이터에 남아 있으나 `feedOrdering.ts`의 `scoreWork()`는 좋아요·저장·팔로우만 반영. `WorkCard` 하단 댓글 숫자 미노출 (Out of Scope).

## 초대 자동 연결 정책

회사가 외부 채널로 발송하지 않는다. 비회원의 전화·이메일은 받지 않는다(이름만). 작가가 직접 친구에게 링크를 보내고, 친구가 가입 후 본인 작품 카드를 명시 클릭하면 자동 연결된다. 작가 승인 게이트·가입자 자가 해제 진입점 없음.

- **토큰 발급**: 검수 통과 시 전시 단위 1개 활성화. 발급은 발행 직후, 활성화는 검수 승인 후. 검수 대기·반려 중에는 비활성(친구 링크 보존, 재승인 시 자동 활성화). 작품 삭제·작가 탈퇴·비회원 자리 0·발급 후 90일 경과 시 영구 만료. 만료는 친구가 클릭하는 시점에 즉석 평가(별도 cron 없음).
- **공유 권한**: 전시 업로더(`work.artistId === currentUser.id`)에게만. 그룹 전시 다른 회원 작가에게 공유 버튼 노출 X.
- **본인 작품 찾기**: 가입자가 토큰으로 진입하면 가입 직후 카드 N개(슬롯 1개여도 동일 형식). 명시 클릭 + 확인 다이얼로그 1회 → 즉시 'member' 승격. 자동 클릭·즉시 자동 연결 옵션 없음. `'unknown'` 슬롯은 카드 미노출. 두 가입자가 같은 슬롯 동시 선택 시 type 가드(`'non-member'`만 승격)로 두 번째는 자동 차단 + 토스트 안내 + 카드 새로고침.
- **알림**: 작가에게 정보용 1건만(닉네임 + 작가가 적어둔 표시명 함께). 별도 액션·거부 진입점 없음.
- **잘못 연결**: 가입자 자가 해제 진입점 X. 가입자가 작가에게 직접 알리고 작가가 마이페이지 슬롯 편집으로 풀기 → 슬롯이 `'unknown'`으로 전환되고 닉네임·아바타 사라짐. 회원 직접 추가 케이스도 동일.
- **타입**: `ImageArtistAssignment.type` = `'member' | 'non-member' | 'unknown'` (`src/app/data.ts`). 슬롯 후보 자격은 `'non-member'`에 한정.
- **Phase 1 한계**: 초대 링크 정보가 회원 본인 기기 안에만 보관(다른 기기에서 친구 가입 시 활성 상태 모름). 검색엔진·SNS 미리보기 차단도 일부 봇은 무시.

## 전시 업로드 자격 (그룹 전시 성립 조건)

**그룹 전시** = 전시에 등장하는 서로 다른 작가(작품 주인) **2명 이상**.
- 게시자 본인 작품 포함 시: 타인 1명 이상이면 성립.
- 게시자 본인 작품 미포함 시: 타인 2명 이상이어야 성립.

- 조건 미충족 시 다음 → 버튼이 비활성화되어 발행 단계 자체에 진입 불가 (별도 에러 다이얼로그 없음).
- 혼자 올리기는 정의상 본인 작품만 포함되므로 별도 검증 없음.

## 환경 변수

업로드 **즉시 승인은 운영 원칙이 아니다** (기본은 `pending` → 검수). 다만 Phase 1은 클라·목업 중심이라, 아래 플래그로만 데모/개발 시 검수를 생략할 수 있다. **실서비스 빌드에서는 `VITE_UPLOAD_AUTO_APPROVE`를 켜지 않는 것이 전제**다.

| 변수 | 동작 | 용도 |
|---|---|---|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 업로드 즉시 `approved` (검수 대기 우회) | 로컬·PM 데모 편의 — **프로덕션 비권장** |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회 | CI / 프리뷰 환경 |

## 신고·모더레이션 정책

Phase 1은 **작품 단위 모더레이션만** 다룬다. 사용자 계정 차원 제재는 Phase 2에서 재설계. 자동 비공개 트리거 없음 — 모든 신고는 운영팀이 ADM-RPT-02에서 직접 판정.

### 신고 처리 액션 (어드민 콘솔 `admin/ReportManagement.tsx`)

| 액션 | 효과 | 비고 |
|---|---|---|
| **삭제** | 작품 신고 한정. `workStore.removeWork`로 영구 삭제 후 `adminStatus: 'deleted'` | `openConfirm`으로 confirm 필요 |
| **기각** | 신고 부당 판정. 운영팀이 비공개 유지 처리했다면 **즉시 복원**(`isHidden: false`) | `adminStatus: 'dismissed'` |
| **비공개 유지** | 작품에 `isHidden: true` 유지 (둘러보기·검색에서 제외, 작가 본인 프로필엔 보임) | `adminStatus: 'hidden'` |
| (목록에서 제거) | 액션 없이 큐에서만 제거 (레거시 호환) | `removeUserReport` |

## 데이터·영속화

### localStorage 키

작품 JSON은 **`artier_works` 단일 키**이며, `artier_works_*` 와일드카드 표기는 사용하지 않는다.

- **핵심 앱 상태 (`store.ts`)**: `artier_works_version`, `artier_works`, `artier_drafts`, `artier_profile`, `artier_interactions`, `artier_auth`, `artier_follows`, `artier_account_suspension`, `artier_withdrawn_artists`, `artier_demo_last_withdraw_reason`
- **작품·피드·알림**: `artier_curation_v2`, `artier_feed_seen_work_ids`, `artier_notifications`, `artier_notification_settings`
- **배너·이벤트·어드민**: `artier_admin_banners_v3`, `artier_managed_contests_v1`, `artier_event_subscriptions`, `artier_admin_members_v1`, `artier_picks_v1`, `artier_admin_audit_log_v1` (운영자 감사 로그 — 런칭 전 백엔드 이관 후 서버 테이블로 재출발)
- **약관·동의**: `artier_tos_consent_v1` (마지막으로 동의한 약관 버전 문자열. CM-TOS 모달 동의 기록)
- **초대·포인트·신고·기타**: `artier_invite_tokens_v1` (전시 단위 1개, 90일 TTL), `artier_points_ledger`, `artier_points_state`, `artier_work_publish_times`, `artier_artist_follower_delta`, `artier_reports`, `artier_report_hidden_v2`, `artier_report_signatures_v1`, `artier_reported_works`, `artier_reported_artists`, `artier_social_signed_up__<provider>` (kakao/google/apple), `artier_pending_signup_nickname`·`artier_pending_signup_email`·`artier_pending_social_signup` (Signup/소셜 가입 → Onboarding 프리필 핸드오프, 온보딩 종료 시 정리), `artier_registered_emails_v1`·`artier_registered_phones_v1` (중복 가입 차단, `utils/registeredAccounts.ts`), `artier_last_group_name`, `artier_my_group_names`, `artier_inquiries`
- **UX·데모**: `artier_locale`, `artier_font_scale`, `artier_onboarding_done`, `artier_splash_seen`, `artier_mock_jwt_session`, `artier_admin_session_v1` (`adminGate`), `artier_recent_searches__guest`, `artier_recent_searches__<slug>` (`Search.tsx`)
- **sessionStorage** (별도): 접두 `artier_scroll_` + 논리 키 — 스크롤 복원 (`src/app/utils/scrollRestore.ts`). `artier_pending_invite_token` — 초대 링크 랜딩 → 가입 → 온보딩 "본인 작품 찾기" 핸드오프 (가입 종료 시 정리).
- **Deprecated (부팅 시 제거)**: `artier_managed_events_v4` (→ `artier_managed_contests_v1`·`artier_picks_v1` 분리 이관), `artier_admin_picks_v1` (→ `artier_picks_v1`), `artier_event_subscription` (→ `artier_notification_settings`의 `eventAlerts`), `artier_instructor_public_ids`, `artier_pin_comments`, `artier_upload_guide_seen`, `artier_group_canonical_map`, `artier_signup_region`, `artier_pending_signup_realname`, `artier_pending_sms_invite`, `artier_pending_signup_phone`, `artier_invite_messaging_log`, `artier_invite_match_log`, `artier_invite_decline_log`, `artier_admin_issues`, `artier_admin_checklist` — `PointsBootstrap` 마운트 시 `LEGACY_STORAGE_KEYS`로 일괄 정리. sessionStorage `artier_pending_invite_claims`·`artier_geo_demo_cache` — `LEGACY_SESSION_KEYS`로 동일 시점 정리.

### 기타
- **버전 관리**: `WORKS_STORAGE_VERSION` (`local-gallery-v21`) 변경 시 works 데이터 자동 재시드
- **이벤트 데이터**: `eventsStore.ts` 단일 소스 + `artier_managed_contests_v1` 영속화. 이벤트·공지 메일 구독은 `eventSubscriptionStore.ts` + `artier_event_subscriptions`.
- **포인트 회수**: 업로드 후 24시간 이내 삭제 시 AP -20 (`pointsBackground.ts`)

## 외부 연동 미완 (런칭 전 백엔드 연동 후)
소셜 OAuth(카카오/구글/애플), 이메일 발송, Supabase 실서버.
모두 모의(localStorage 로그) 수준이며 PM 데모 목적상 의도적 유보.

비회원 SMS·카카오 알림톡 발송은 폐기(회사가 외부 채널 발송 안 함). OG 동적 생성은 Phase 2 이관.

## 우선 보완 항목 (런칭 전)
**남은 대표 과제**: 실 OAuth·이메일/SMS 발송·프로덕션 BaaS, 약관 법무 확정, 파비콘/manifest. 세부 항목은 `_planning/Policy_v1.md` §31 참조.
