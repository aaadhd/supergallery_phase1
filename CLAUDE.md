# Artier (SuperGallery Phase 1)

## 프로젝트 개요
시니어/중장년 순수미술 작가를 위한 웹 기반 디지털 갤러리 플랫폼.
개인 작품 업로드 및 그룹 전시(동호회·클래스·친구) 기능 제공.

> Phase 1 클라이언트 구현·명세 동기화는 **`IMPLEMENTATION_DELTA.md`와 현재 `src/app/` 코드**를 기준으로 한다. 완성도를 퍼센트로 표기하지 않는다.

## 스펙 문서
- 개발자 인수인계 문서 (reference 대비 변경·목업·확정 수치): `product-policies.md`
- 작품 올리기 전체 스펙: `docs/upload_spec.md`
- 전시명·작품명·그룹명 글자 상한: **`TITLE_FIELD_MAX_LEN`** (`src/app/utils/workDisplay.ts`, 현재 **20**). 코드·`docs/`·`product-policies.md` 변경 시 함께 맞출 것.
- 작품 톤 배경 묻어나는 효과: **원본 이미지를 blur + scale + opacity로 깔아** 순수 CSS로 구현 ([WorkDetailModal.tsx:407](src/app/components/WorkDetailModal.tsx#L407), [Upload.tsx:12,1140](src/app/pages/Upload.tsx#L12)). dominant-color 추출 알고리즘 불필요 — 관련 모듈·spec 문서는 2026-04-15 삭제됨
- 구현 델타·레퍼런스 수정 지침: `IMPLEMENTATION_DELTA.md`, `REFERENCE_DELTA.md`

## 주요 파일

### 페이지
- `src/app/pages/Upload.tsx` — 작품 업로드 전체 플로우
- `src/app/pages/ExhibitionDetail.tsx` — 전시 상세
- `src/app/pages/ExhibitionRoute.tsx` — `?from=invite` 분기 처리
- `src/app/pages/ExhibitionInviteLanding.tsx` — 전시 초대장 오픈 화면 (2026-04-13 신설)
- `src/app/pages/ExhibitionWorkShareLanding.tsx` — `?from=work` 작품 공유 랜딩
- `src/app/pages/Profile.tsx` — 강사 표시 자동 파생 (`instructorVisible`)
- `src/app/pages/Search.tsx` — 검색 (계정별/게스트 키; 로그인 시 guest 히스토리 병합 — IMPLEMENTATION_DELTA §11.3)
- `src/app/pages/FlowDemoTools.tsx` — `/demo` PM 데모 맵
- `src/app/pages/DemoReferenceToolkit.tsx` — `/demo/reference` 검수 툴킷

### 컴포넌트
- `src/app/components/ConfirmDialog.tsx` — 커스텀 확인 다이얼로그 (Radix AlertDialog 기반, Promise API)
- `src/app/components/WorkCard.tsx` — 좋아요·저장 상태 아이콘 (숫자 미노출)
- `src/app/components/WorkDetailModal.tsx` — 공유 URL에 `?from=invite` 자동 부여
- `src/app/components/PointsBootstrap.tsx` — 부트스트랩 포인트 동기화
- `src/app/components/WorksStorageSync.tsx` — works 스토리지 버전 동기화
- `src/app/components/work/CopyrightProtectedImage.tsx` — 우클릭/드래그 차단 이미지 컴포넌트
- `src/app/components/SocialSignupModal.tsx` — 소셜 첫 가입 시 약관 동의 + 닉네임 입력 (SCR-AUTH-03)
- `src/app/components/QaScreenShortcuts.tsx` — QA/검수용 바로가기 플로팅 버튼 (DEV 또는 `VITE_FOOTER_QA_LINKS` 활성 시)
- `src/app/components/RequiredMark.tsx` — 필수 입력 표시 (빨간 별 + sr-only 라벨)
- `src/app/components/PendingInviteClaimGate.tsx` — 가입 직후 이름 불일치로 자동 매칭 실패한 초대에 대해 본인 확인 모달 (수락/거부/나중에). 수락 시 수동 승격, 거부 시 발신 작가에게 경고 +1

### 유틸 / Store
- `src/app/store.ts` — `WORKS_STORAGE_VERSION` 스토리지 버전 관리 (현재 값 `local-gallery-v11`, 키 `artier_works_version`)
- `src/app/store/workStore.ts`, `draftStore.ts` — 작품/초안 상태
- `src/app/utils/inviteMessaging.ts` — 초대 발송 (5% 랜덤 실패 시뮬, `artier_invite_messaging_log`) + `matchSmsInviteOnSignup` 가입 시 전화+실명 일치 작품 자동 연결 (이름 불일치는 `blockedList`로 반환 → 본인 확인 후 `claimBlockedInvite`로 수동 승격)
- `src/app/utils/sanctionStore.ts` — 경고·허위신고 카운터 + 정지 단계 (`SuspensionLevel`, `addWarning`, `addFalseReport`, `suspendDemoUser`)
- `src/app/utils/adminGate.ts` — 운영팀 역할 토글
- `src/app/utils/feedOrdering.ts` — 둘러보기 피드 랭킹
- `src/app/utils/feedVisibility.ts` — 피드 공개 여부 필터
- `src/app/utils/bannerStore.ts` — 배너 관리 (DnD 적용됨)
- `src/app/utils/pushDemoNotification.ts` — 알림 데모 푸시
- `src/app/utils/reviewLabels.ts` — 검수 사유 4분류
- `src/app/utils/analytics.ts` — GA4 스캐폴딩
- `src/app/utils/registeredAccounts.ts` — 가입 이메일·전화 중복 검사 레지스트리
- `src/app/utils/groupNameRegistry.ts` — 그룹명 자동완성·정규화·캐논 맵
- `src/app/utils/imageHelper.ts` — 이미지 리사이즈·유틸
- `src/app/utils/searchRank.ts` — 검색 결과 랭킹
- `src/app/utils/pointsBackground.ts` — 포인트 적립/회수 (`pointsRecallIfQuickDelete`, `addDemoPp`)

> ⚠️ **삭제됨**: `src/app/utils/instructorPublic.ts` (2026-04-13). 강사 여부는 더 이상 별도 플래그가 아니라 업로드 이력에서 자동 파생 — 아래 "강사 표시 정책" 참조.

## 코딩 규칙

### 필수
- **다국어**: `useI18n()`의 `t()` 사용. 문자열 하드코딩 금지.
  - **locale 반응성**: `getStoredLocale()` 스냅샷 함수를 렌더 시점에 직접 호출하지 말 것.
    반드시 `useI18n()`의 `locale`·`t`를 사용해 런타임 언어 전환 시 리렌더가 트리거되게 할 것
    (구 `ContentReview.tsx` 패턴은 안티패턴 — §11.5에서 `useI18n()`으로 정리 완료).
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

### Phase 2 선행 구현 (정리됨)
이전엔 PRD §2.2 Out of Scope임에도 코드만 존재하던 3개 컴포넌트가 있었음.
어디에서도 import되지 않는 dead code였기에 모두 삭제됨:
- ~~Pin 코멘트 (`PinCommentLayer`, `pinCommentStore.ts`, `artier_pin_comments` 키)~~
- ~~타임랩스 (`TimelapsePlayer`)~~
- ~~색상 팔레트 추출 (`ColorPaletteSuggestion`, `utils/colorPalette.ts`)~~

→ Phase 2에서 구현할 때 신규로 작성. 위 이름들을 재도입할 때는 PRD §2.2 범위 내인지
확인하고 실제 사용 화면도 같이 연결할 것 (export만 두는 dead code는 금지).

### PRD §2.2 적용으로 UI 제거됨, 데이터 필드만 잔존
다음 항목은 위와 다른 범주 — **한때 구현되었다가 PRD Out of Scope에 맞춰 UI를 제거**한 흔적.
관련 필드/계산 로직이 아직 코드에 남아 있으니 건드릴 때 주의:
- 댓글 — `WorkCard` 하단 숫자 미노출 (IMPLEMENTATION_DELTA §10.2). `Work.comments` 필드는 데이터에 남아 있으나 **`feedOrdering.ts`의 `scoreWork()`는 좋아요·저장·팔로우만 반영**하고 댓글 가중치는 사용하지 않음

### WorkCard 표시 규칙
- 카드 하단에 **좋아요·저장 상태 아이콘만** 노출 (숫자 비노출)
- 댓글 숫자는 PRD §2.2 Out of Scope 적용으로 제거됨

## 강사 표시 정책 (2026-04-13 단일화)

> IMPLEMENTATION_DELTA §3.3 / §10.4 참조

- 강사 여부는 **업로드 이력에서 자동 파생**되는 단일 소스 정책
- `Profile.tsx`: `workStore`에서 구독한 `storeWorks`로 `instructorVisible = storeWorks.some((w) => w.artistId === profileArtist.id && w.isInstructorUpload === true)` (`useMemo`, 의존성 `[storeWorks, profileArtist.id]`)
- **단일 진입점**: 함께 올리기 → 세부정보 모달 → "저는 강사예요" 체크박스
- 한 작품이라도 `isInstructorUpload === true`로 발행되면 → 프로필에 "수강생 작품" 탭 자동 노출
- 모든 해당 작품 삭제 시 → 자동 비노출

### 금지
- `UserProfile.isInstructor` 필드 부활 (삭제됨)
- 프로필 편집 화면에 "강사 토글" 추가 (UX 단순화 + 상태 불일치 차단 목적)
- `instructorPublic.ts` 재생성
- i18n 키 `profile.instructorToggle`, `profile.instructorHelp` 부활 (삭제됨)

## 환경 변수

업로드 **즉시 승인은 운영 원칙이 아니다** (기본은 `pending` → 검수). 다만 Phase 1은 클라·목업 중심이라, 아래 플래그로만 데모/개발 시 검수를 생략할 수 있다. **실서비스 빌드에서는 `VITE_UPLOAD_AUTO_APPROVE`를 켜지 않는 것이 전제**다.

| 변수 | 동작 | 용도 |
|---|---|---|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 업로드 즉시 `approved` (검수 대기 우회) | 로컬·PM 데모 편의 — **프로덕션 비권장** |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회 | CI / 프리뷰 환경 |

## 신고·정지 정책 (2026-04-15 보강)

### 신고 처리 액션 (어드민 콘솔 `admin/ReportManagement.tsx`)
운영팀이 접수된 신고를 처리할 때 4가지 액션 + 1가지 리스트 정리 옵션:

| 액션 | 효과 | 비고 |
|---|---|---|
| **삭제** | 작품 신고 한정. `workStore.removeWork`로 영구 삭제 후 `adminStatus: 'deleted'` | `openConfirm`으로 confirm 필요 |
| **경고** | 신고 대상 작가에게 경고 카운트 +1 (`sanctionStore.addWarning`). 3회 누적 시 7일 정지로 자동 승격 | `adminStatus: 'warned'` |
| **기각** | 신고를 부당으로 판정. 신고자 허위 신고 카운트 +1 (`sanctionStore.addFalseReport`). 3회 누적 시 신고자 7일 차단 | `adminStatus: 'dismissed'` |
| **비공개** | 작품에 `isHidden: true` 적용 (둘러보기·검색에서 제외, 작가 본인 프로필엔 보임) | `adminStatus: 'hidden'` |
| (목록에서 제거) | 액션 없이 큐에서만 제거 (레거시 호환) | `removeUserReport` |

### 정지 단계 (어드민 콘솔 `admin/MemberManagement.tsx`)
4단계 라디오 모달로 선택:
- **주의** (warning): 정지 없이 경고 표시만. 누적 시 정지로 승격
- **7일 정지**: 시한부
- **30일 정지**: 시한부
- **영구 정지**: 무기한

데모 사용자(`artists[0]` = 카테)에 한해 글로벌 `accountSuspensionStore` + `authStore.logout()` 즉시 적용 → 다음 로그인 시 차단. 기타 목업 회원은 표시만 변경.

### 자동 승격 로직 (`utils/sanctionStore.ts`)
- 경고 누적 3회 → 자동 7일 정지
- 허위 신고 누적 3회 → 자동 7일 차단
- 카운트는 `artier_warning_counter_v1` / `artier_false_report_counter_v1` 키로 저장
- 백엔드 연동 시 사용자 sanction history 테이블로 이관, 이 store는 폐기 예정

## 데이터·영속화

### localStorage 키

작품 JSON은 **`artier_works` 단일 키**이며, `artier_works_*` 와일드카드 표기는 사용하지 않는다.

- **핵심 앱 상태 (`store.ts`)**: `artier_works_version`, `artier_works`, `artier_drafts`, `artier_profile`, `artier_interactions`, `artier_auth`, `artier_follows`, `artier_account_suspension`, `artier_withdrawn_artists`, `artier_demo_last_withdraw_reason`
- **작품·피드·알림**: `artier_curation_v1`, `artier_feed_seen_work_ids`, `artier_notifications`, `artier_notification_settings`
- **배너·이벤트·어드민**: `artier_admin_banners_v1`, `artier_managed_events_v1`, `artier_event_subscriptions`, `artier_admin_issues`, `artier_admin_checklist`, `artier_admin_partners`, `artier_admin_members_v1`, `artier_admin_picks_v1`
- **초대·포인트·신고·기타**: `artier_invite_messaging_log`, `artier_invite_match_log`, `artier_points_ledger`, `artier_points_state`, `artier_work_publish_times`, `artier_pp_balance`, `artier_artist_follower_delta`, `artier_reports`, `artier_report_hidden_v2`, `artier_report_signatures_v1`, `artier_reported_works`, `artier_reported_artists` (레거시 신고 키), `artier_warning_counter_v1`, `artier_false_report_counter_v1`, `artier_social_signed_up__<provider>` (kakao/google/apple), `artier_pending_sms_invite` (초대 링크 → 가입 중 플래그, 온보딩 종료 시 정리), `artier_pending_signup_nickname`·`artier_pending_signup_email`·`artier_pending_signup_phone`·`artier_pending_signup_realname`·`artier_pending_social_signup` (Signup/소셜 가입/SMS 초대 → Onboarding 프리필 핸드오프, 온보딩 종료 시 정리), `artier_registered_emails_v1`·`artier_registered_phones_v1` (가입 완료된 이메일·전화 레지스트리 — 중복 가입 차단, `utils/registeredAccounts.ts`), `artier_group_canonical_map`, `artier_last_group_name`, `artier_my_group_names`, `artier_inquiries`
- **UX·데모**: `artier_locale`, `artier_font_scale`, `artier_cookie_consent`, `artier_onboarding_done`, `artier_splash_seen`, `artier_mock_jwt_session`, `artier_geo_demo_cache`, `artier_admin_session_v1` (`adminGate`), `artier_recent_searches__guest`, `artier_recent_searches__<slug>` (`Search.tsx`)
- **sessionStorage** (별도): 접두 `artier_scroll_` + 논리 키 — 스크롤 복원 (`src/app/utils/scrollRestore.ts`); `artier_pending_invite_claims` — 가입 시 이름 불일치로 자동 매칭 실패한 초대 목록, `PendingInviteClaimGate` 모달에서 소비
- **Deprecated (부팅 시 제거)**: `artier_instructor_public_ids` — `PointsBootstrap` 마운트 시 `LEGACY_STORAGE_KEYS`로 제거 (IMPLEMENTATION_DELTA §11.1)

### 기타
- **버전 관리**: `WORKS_STORAGE_VERSION` (`local-gallery-v11`) 변경 시 works 데이터 자동 재시드
- **이벤트 데이터**: `eventStore.ts` 단일 소스 + `artier_managed_events_v1` 영속화 (IMPLEMENTATION_DELTA §8.5·§9.7)
- **포인트 회수**: 업로드 후 24시간 이내 삭제 시 AP -20 (`pointsBackground.ts:pointsRecallIfQuickDelete`)
- **강사 표시**: 별도 저장소 없음. `workStore` 작품 목록에서 파생 (`Profile.tsx`의 `instructorVisible`, 단일 소스)

## 알려진 잔여 이슈 (Technical Polish)

> IMPLEMENTATION_DELTA §11 — 기능 동작에는 영향 없으나 정리 권장 항목.

| # | 항목 | 위치 | 영향도 | 작업량 |
|---|---|---|---|---|
| 11.1 | Orphan localStorage (`artier_instructor_public_ids`) | `PointsBootstrap` | — | ✅ §11.1 완료 |
| 11.2 | 어드민 작품·이벤트 store | `WorkManagement`, `EventManagement` | — | ✅ 실 store 연동됨 |
| 11.3 | 검색 히스토리 guest → 로그인 | `Search.tsx` | — | ✅ §11.3 완료 |
| 11.4 | ExhibitionInviteLanding seed | `ExhibitionInviteLanding.tsx` | — | ✅ §11.4 완료 |
| 11.5 | ContentReview locale | `ContentReview.tsx` | — | ✅ §11.5 완료 |
| 11.6 | 배너 드래그앤드롭 순서 변경 | `bannerStore.ts`, `admin/BannerManagement.tsx` | — | ✅ `@dnd-kit/sortable` 적용 완료 |

### 남은 권장 작업
- 모든 §11 항목 완료됨.

## 외부 연동 미완 (Phase 2 예정)
소셜 OAuth(카카오/구글/애플), 이메일 발송, SMS/카카오 알림톡, Supabase 실서버, OG 이미지 동적 생성.
모두 모의(localStorage 로그) 수준이며 PM 데모 목적상 의도적 유보.

## 우선 보완 항목 (배포 전)
아래 Phase 1 클라 항목은 **완료**됨: 이벤트 단일 store, 만 14세 차단, 비속어 필터, 피드 큐레이션·팔로우 가중치 등 — `IMPLEMENTATION_DELTA.md` §9 TOP 8·§10 참조.

**남은 대표 과제 (런칭·인프라)**: 실 OAuth·이메일/SMS 발송·프로덕션 BaaS, 약관 법무 확정, 파비콘/manifest(§9.4), 배너 순서(§11.6) 등 — §7·§12 참조.
