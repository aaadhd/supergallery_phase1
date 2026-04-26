# Artier (SuperGallery Phase 1)

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
- Phase 2 백엔드 ERD 설계 시 `Work` → `Exhibition` 리네이밍 검토 권장.

## 스펙 문서
- **기획 단일 소스**: `_planning/` — 정책(`Policy_v1.md`)·사용자 PRD(`PRD_User_v1.md`)·어드민 PRD(`PRD_Admin_v1.md`)·화면 목록(`IA_ScreenList_v1.md`)·카피 가이드(`Copy_v1.md`). 시스템 아키텍처·데이터 모델·디자인 토큰은 본 폴더가 정의하지 않으며, 코드(스토어·엔티티)와 디자인 자산이 단일 소스다.
- 전시명·작품명·그룹명 글자 상한: **`TITLE_FIELD_MAX_LEN`** (`src/app/utils/workDisplay.ts`, 현재 **20**).
- 작품 톤 배경 묻어나는 효과: **원본 이미지를 blur + scale + opacity로 깔아** 순수 CSS로 구현 (`WorkDetailModal.tsx`·`Upload.tsx`의 BluredArtworkBg 컴포넌트). dominant-color 추출 알고리즘 불필요.

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

### 2) 문서 버전 표기 (push 단위)

각 `_planning/*.md` 말미에 `## 문서 이력` 테이블이 있으며 규칙은 다음과 같다.

- **Push 이후 그 문서의 첫 수정** → 새 버전 행 1개 추가 (그 시점 변경 요약)
- **같은 push 사이클 내 추가 수정** → 같은 행의 "변경 내용"에 **텍스트만 append**, 버전 숫자는 유지
- **Push 시점** → 현재 최신 행이 인계된 상태. 별도 작업 없음
- **다음 push 이후 첫 수정 시점** → 다음 버전으로 새 행 1개 추가, 이후 규칙 반복

판별 기준: `git log origin/main -1 -- _planning/<파일>.md` 이후 로컬 커밋에 해당 파일이 이미 등장했으면 "행 추가됨" 상태이며 같은 행에 append, 아니면 새 행 추가.

### 3) 금지

- Push 대기 상태에서 **한 파일에 여러 버전 행 추가** (v1.9 + v2.0 같이)
- 문서 수정 없이 코드만 수정한 PR / 코드 수정 없이 문서만 수정한 PR (정책·버그픽스 제외)
- `_planning/*.md` 문서 내부에 **개발 코드 경로·라인 넘버 참조** (문서 단독 재현성 보장). 계약 이름(스토어·컴포넌트)은 허용.

## 주요 파일

### 페이지
- `src/app/pages/Upload.tsx` — 작품 업로드 전체 플로우
- `src/app/pages/ExhibitionDetail.tsx` — 전시 상세
- `src/app/pages/ExhibitionRoute.tsx` — `?from=invite` 분기 처리
- `src/app/pages/ExhibitionInviteLanding.tsx` — 전시 초대장 오픈 화면 (2026-04-13 신설)
- `src/app/pages/ExhibitionWorkShareLanding.tsx` — `?from=work` 작품 공유 랜딩
- `src/app/pages/Profile.tsx` — 강사 표시 자동 파생 (`instructorVisible`)
- `src/app/pages/Search.tsx` — 검색 (계정별/게스트 키; 로그인 시 guest 히스토리 병합)
- `src/app/pages/FlowDemoTools.tsx` — `/demo` PM 데모 맵
- `src/app/pages/DemoReferenceToolkit.tsx` — `/demo/reference` 검수 툴킷

### 컴포넌트
- `src/app/components/ConfirmDialog.tsx` — 커스텀 확인 다이얼로그 (Radix AlertDialog 기반, Promise API)
- `src/app/components/WorkDetailModal.tsx` — 공유 URL에 `?from=invite` 자동 부여
- `src/app/components/PointsBootstrap.tsx` — 부트스트랩 포인트 동기화
- `src/app/components/WorksStorageSync.tsx` — works 스토리지 버전 동기화
- `src/app/components/work/CopyrightProtectedImage.tsx` — 우클릭/드래그 차단 이미지 컴포넌트
- `src/app/components/SocialSignupModal.tsx` — 소셜 첫 가입 시 약관 동의 + 닉네임 입력 (SCR-AUTH-03)
- `src/app/components/QaScreenShortcuts.tsx` — QA/검수용 바로가기 플로팅 버튼 (DEV 또는 `VITE_FOOTER_QA_LINKS` 활성 시)
- `src/app/components/RequiredMark.tsx` — 필수 입력 표시 (빨간 별 + sr-only 라벨)

### 유틸 / Store
- `src/app/store.ts` — `WORKS_STORAGE_VERSION` 스토리지 버전 관리 (현재 값 `local-gallery-v16`, 키 `artier_works_version`)
- `src/app/store/workStore.ts`, `draftStore.ts` — 작품/초안 상태
- `src/app/utils/inviteTokenStore.ts` — 비회원 초대 토큰 스토어 (Policy §3 v2.14). `issueInviteToken`(전시 발행 직후, status `'inactive'`) · `activateInviteToken`(검수 승인) · `deactivateInviteToken`(검수 반려·대기 회귀) · `revokeInviteToken`(전시 삭제·만료, 영구 무효) · `getInviteToken` lazy 만료 평가 · `connectMemberToSlot`(가입자가 본인 작품 카드 클릭 시 type 가드로 `'non-member'` → `'member'` 승격, 동시 선택 race 차단). 90일 TTL.
- `src/app/utils/sanctionStore.ts` — (Phase 2 준비용) 경고·허위신고 카운터 + 정지 단계. Phase 1 정책(§12.3)상 호출부 없음. Phase 2 사용자 제재 재설계 시 활용.
- `src/app/utils/adminGate.ts` — 운영팀 역할 토글
- `src/app/utils/feedOrdering.ts` — 둘러보기 피드 랭킹
- `src/app/utils/feedVisibility.ts` — 피드 공개 여부 필터
- `src/app/utils/bannerStore.ts` — 배너 관리 (DnD 적용됨)
- `src/app/utils/pushDemoNotification.ts` — 알림 데모 푸시
- `src/app/utils/reviewLabels.ts` — 검수 사유 4분류
- `src/app/utils/analytics.ts` — GA4 스캐폴딩
- `src/app/utils/registeredAccounts.ts` — 가입 이메일·전화 중복 검사 레지스트리
- `src/app/utils/groupNameRegistry.ts` — 그룹명 자동완성(내 최근·작품 기반). 중복 허용 정책(2026-04-17)으로 정규화·캐논 맵 제거됨
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
  복구 불가 작업은 `destructive: true`로 빨간 버튼 표시.

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
- 댓글 — `WorkCard` 하단 숫자 미노출. `Work.comments` 필드는 데이터에 남아 있으나 **`feedOrdering.ts`의 `scoreWork()`는 좋아요·저장·팔로우만 반영**하고 댓글 가중치는 사용하지 않음

### WorkCard 표시 규칙
- 카드 하단에 **좋아요·저장 상태 아이콘만** 노출 (숫자 비노출)
- 댓글 숫자는 PRD §2.2 Out of Scope 적용으로 제거됨

## 초대 자동 연결 정책 (Policy §3 · v2.14 토큰 + 가입자 본인 선택)

회사가 외부 채널로 발송하지 않는다. 비회원의 전화·이메일은 받지 않는다(이름만). 작가가 직접 친구에게 링크를 보내고, 친구가 가입 후 본인 작품 카드를 명시 클릭하면 자동 연결된다. 작가 승인 게이트·가입자 자가 해제 진입점 모두 폐기.

- **토큰 발급**: 검수 통과 시 전시 단위 1개 활성화. 발급은 발행 직후, 활성화는 검수 승인 후. 검수 대기·반려 중에는 비활성(친구 링크 보존, 재승인 시 자동 활성화). 작품 삭제·작가 탈퇴·비회원 자리 0·발급 후 90일 경과 시 영구 만료. 만료는 친구가 클릭하는 시점에 즉석 평가(별도 cron 없음, 매직 링크와 동일 패턴).
- **공유 권한**: 전시 업로더(`work.artistId === currentUser.id`)에게만. 그룹 전시 다른 회원 작가에게 공유 버튼 노출 X.
- **본인 작품 찾기**: 가입자가 토큰으로 진입하면 가입 직후 카드 N개(슬롯 1개여도 동일 형식). 명시 클릭 + 확인 다이얼로그 1회 → 즉시 'member' 승격. 자동 클릭·즉시 자동 연결 옵션 없음. `'unknown'` 슬롯은 카드 미노출. 두 가입자가 같은 슬롯 동시 선택 시 type 가드(`'non-member'`만 승격)로 두 번째는 자동 차단 + 토스트 안내 + 카드 새로고침.
- **알림**: 작가에게 정보용 1건만(닉네임 + 작가가 적어둔 표시명 함께). 별도 액션·거부 진입점 없음.
- **잘못 연결**: 가입자 자가 해제 진입점 X. 가입자가 작가에게 직접 알리고 작가가 마이페이지 슬롯 편집으로 풀기 → 슬롯이 `'unknown'`으로 전환되고 닉네임·아바타 사라짐. 회원 직접 추가 케이스도 동일.
- **타입**: `ImageArtistAssignment.type` = `'member' | 'non-member' | 'unknown'` (`src/app/data.ts`). 슬롯 후보 자격은 `'non-member'`에 한정.
- **Phase 1 한계**: 초대 링크 정보가 회원 본인 기기 안에만 보관(다른 기기에서 친구 가입 시 활성 상태 모름). 검색엔진·SNS 미리보기 차단도 일부 봇은 무시. 백엔드(서버 사이드 렌더링·중앙 토큰 저장소) 도입 시 정합 — Policy §31 N-15.
- **제거됨**: 전화·이메일 매칭 기반 자동 연결, 본인 확인 yes/no 단계, 매칭 후보 무작위 3장 표본, 마이페이지 사후 보강 배너, 가입자 자가 disavow 진입점(piece 카드 "본인 작품 아님" 액션), ADM-RPT-01 "초대 매칭 거부" 카테고리, 발신자 양방향 알림 매트릭스(정보용 1건만 유지).

## 강사 표시 정책 (2026-04-13 단일화)

- 강사 여부는 **업로드 이력에서 자동 파생**되는 단일 소스 정책
- `Profile.tsx`: `workStore`에서 구독한 `storeWorks`로 `instructorVisible = storeWorks.some((w) => w.artistId === profileArtist.id && w.isInstructorUpload === true)` (`useMemo`, 의존성 `[storeWorks, profileArtist.id]`)
- **단일 진입점**: 함께 올리기 → 세부정보 모달 → "저는 강사예요" 체크박스
- 한 작품이라도 `isInstructorUpload === true`로 발행되면 → 프로필에 "수강생 작품" 탭 자동 노출
- 모든 해당 작품 삭제 시 → 자동 비노출

### 전시 업로드 자격 (본인 작품 포함 규칙)

누구나 **자기 작품이 포함된 전시**만 개설할 수 있다. 강사 예외만이 본인 작품 없이 전시 개설 가능(수강생 작품 전용 전시).

- **강사 OFF** → 그룹 전시에 본인 작품 최소 1점 포함 **필수**. 위반 시 발행 차단(`upload.errMustIncludeSelf`). 검증 위치: [Upload.tsx](src/app/pages/Upload.tsx)의 발행 핸들러, `errMissingArtist` 검증 직후.
- **강사 ON** → 본인 작품 포함 **금지**. 작가 선택 리스트에서 본인 필터링(`Upload.tsx`의 그룹 작가 후보 빌드 영역), 강사 ON 전환 시 본인 지정된 슬롯 자동 초기화(`Upload.tsx`의 `isInstructor` 변경 useEffect).
- 혼자 올리기는 정의상 본인 작품만 포함되므로 별도 검증 없음.

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

## 신고·모더레이션 정책 (2026-04-20 Phase 1 단순화)

Phase 1은 **작품 단위 모더레이션만** 다룬다. 사용자 계정 차원 제재(주의·시한부 정지·영구 정지·경고 카운터·허위 신고 카운터)는 **Phase 2**에서 재설계. Policy §12.3.

### 신고 처리 액션 (어드민 콘솔 `admin/ReportManagement.tsx`)

3가지 액션 + 1가지 리스트 정리 옵션:

| 액션 | 효과 | 비고 |
|---|---|---|
| **삭제** | 작품 신고 한정. `workStore.removeWork`로 영구 삭제 후 `adminStatus: 'deleted'` | `openConfirm`으로 confirm 필요 |
| **기각** | 신고 부당 판정. 자동 비공개 상태였다면 **즉시 복원**(`isHidden: false`) | `adminStatus: 'dismissed'` |
| **비공개 유지** | 작품에 `isHidden: true` 유지 (둘러보기·검색에서 제외, 작가 본인 프로필엔 보임) | `adminStatus: 'hidden'` |
| (목록에서 제거) | 액션 없이 큐에서만 제거 (레거시 호환) | `removeUserReport` |

### 2회 자동 비공개 (Phase 1 핵심)

- 같은 전시에 **2번째 신고가 접수되는 순간** 즉시 `isHidden: true` + `adminStatus: 'hidden'` 전환. 작가에게 시스템 알림 1건.
- 운영팀이 위 3액션 중 하나로 확정. 기각 판정 시 복원.
- 트리거 위치: `reportsStore.appendUserReport` (신고 저장 직후 동일 `workId` 카운트 체크).

### 폐기된 것 (2026-04-20 기준)

- `sanctionStore.addWarning` / `addFalseReport` 호출부 — 제거됨(스토어 자체는 Phase 2 준비용으로 남음)
- `accountSuspensionStore` 호출부 — 제거됨(데모용 Login.tsx 쿼리 플래그만 남음)
- `ADM-MBR-03` 정지 모달 UI — Phase 2 이관
- 경고·자동 승격·이의제기 SLA 관련 모든 로직

## 데이터·영속화

### localStorage 키

작품 JSON은 **`artier_works` 단일 키**이며, `artier_works_*` 와일드카드 표기는 사용하지 않는다.

- **핵심 앱 상태 (`store.ts`)**: `artier_works_version`, `artier_works`, `artier_drafts`, `artier_profile`, `artier_interactions`, `artier_auth`, `artier_follows`, `artier_account_suspension`, `artier_withdrawn_artists`, `artier_demo_last_withdraw_reason`
- **작품·피드·알림**: `artier_curation_v1`, `artier_feed_seen_work_ids`, `artier_notifications`, `artier_notification_settings`
- **배너·이벤트·어드민**: `artier_admin_banners_v1`, `artier_managed_events_v1`, `artier_event_subscriptions`, `artier_admin_issues`, `artier_admin_checklist`, `artier_admin_members_v1`, `artier_admin_picks_v1`, `artier_admin_audit_log_v1` (운영자 감사 로그 — 런칭 전 백엔드 이관 후 서버 테이블로 재출발)
- **초대·포인트·신고·기타**: `artier_invite_tokens_v1` (Policy §3 v2.14 토큰 스토어 — 전시 단위 1개, 90일 TTL), `artier_points_ledger`, `artier_points_state`, `artier_work_publish_times`, `artier_pp_balance`, `artier_artist_follower_delta`, `artier_reports`, `artier_report_hidden_v2`, `artier_report_signatures_v1`, `artier_reported_works`, `artier_reported_artists` (레거시 신고 키), `artier_warning_counter_v1`, `artier_false_report_counter_v1`, `artier_social_signed_up__<provider>` (kakao/google/apple), `artier_pending_signup_nickname`·`artier_pending_signup_email`·`artier_pending_social_signup` (Signup/소셜 가입 → Onboarding 프리필 핸드오프, 온보딩 종료 시 정리), `artier_registered_emails_v1`·`artier_registered_phones_v1` (가입 완료된 이메일·전화 레지스트리 — 중복 가입 차단, `utils/registeredAccounts.ts`), `artier_last_group_name`, `artier_my_group_names`, `artier_inquiries`
- **UX·데모**: `artier_locale`, `artier_font_scale`, `artier_cookie_consent`, `artier_onboarding_done`, `artier_splash_seen`, `artier_mock_jwt_session`, `artier_geo_demo_cache`, `artier_admin_session_v1` (`adminGate`), `artier_recent_searches__guest`, `artier_recent_searches__<slug>` (`Search.tsx`)
- **sessionStorage** (별도): 접두 `artier_scroll_` + 논리 키 — 스크롤 복원 (`src/app/utils/scrollRestore.ts`)
- **Deprecated (부팅 시 제거)**: `artier_instructor_public_ids` (2026-04-13 강사 단일화), `artier_pin_comments` (2026-04-15 Phase 2 선행 제거), `artier_upload_guide_seen` (2026-04-15), `artier_group_canonical_map` (2026-04-17 그룹명 중복 허용), `artier_signup_region`·`artier_pending_signup_realname` (2026-04-26 region·실명 폐기), `artier_pending_sms_invite`·`artier_pending_signup_phone`·`artier_invite_messaging_log`·`artier_invite_match_log`·`artier_invite_decline_log` (2026-04-27 Policy §3 v2.14 토큰 모델 전환) — `PointsBootstrap` 마운트 시 `LEGACY_STORAGE_KEYS`로 일괄 정리. sessionStorage `artier_pending_invite_claims` (2026-04-19 초대 자동 연결 단순화)·`artier_geo_demo_cache` (2026-04-26)도 `LEGACY_SESSION_KEYS`로 동일 시점 정리

### 기타
- **버전 관리**: `WORKS_STORAGE_VERSION` (`local-gallery-v16`) 변경 시 works 데이터 자동 재시드
- **이벤트 데이터**: `eventStore.ts` 단일 소스 + `artier_managed_events_v1` 영속화
- **포인트 회수**: 업로드 후 24시간 이내 삭제 시 AP -20 (`pointsBackground.ts:pointsRecallIfQuickDelete`)
- **강사 표시**: 별도 저장소 없음. `workStore` 작품 목록에서 파생 (`Profile.tsx`의 `instructorVisible`, 단일 소스)

## 외부 연동 미완 (런칭 전 백엔드 연동 후)
소셜 OAuth(카카오/구글/애플), 이메일 발송, Supabase 실서버.
모두 모의(localStorage 로그) 수준이며 PM 데모 목적상 의도적 유보.

비회원 SMS·카카오 알림톡 발송은 Policy §3 v2.14에서 폐기됨(회사가 외부 채널 발송 안 함). OG 동적 생성은 §31 N-9에서 Phase 2로 강등.

## 우선 보완 항목 (런칭 전)
**남은 대표 과제**: 실 OAuth·이메일/SMS 발송·프로덕션 BaaS, 약관 법무 확정(Policy §31 N-10), 파비콘/manifest. 세부 항목은 `_planning/Policy_v1.md` §31(런칭 전 미해결 항목) 참조.
