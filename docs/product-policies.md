# Artier (SuperGallery Phase 1) — 제품·운영 정책 & PM·개발 전달 가이드

> **통합 문서**  
> - **§1 ~ §15**: `src/app/` 기준 **동작·규칙·수치**  
> - **§16**: 레퍼런스 구현 후 PM이 개발자에게 **수정 의견을 넘길 때** 쓰는 **첨부 번들·템플릿·IMPLEMENTATION_DELTA 색인**  
>
> **정본(명세 대비 차이·체크리스트)**: [`IMPLEMENTATION_DELTA.md`](../IMPLEMENTATION_DELTA.md), 레퍼런스 원문 수정 지침: [`REFERENCE_DELTA.md`](../REFERENCE_DELTA.md).  
> **갱신**: 2026-04-16 — 코드 직접 대조 · PM 전달 가이드 통합.

---

## 1. 범위

- **Phase 1**은 **클라이언트·localStorage 중심**입니다. OAuth·이메일/SMS 실발송·실DB·서버 검수 큐는 연동 전제(Phase 2·인프라)로, 대부분 **목업·로그·스토어**로 동작합니다.
- `reference/` 원문과의 화면·기능 연결 차이는 `IMPLEMENTATION_DELTA.md` **§8.7** 표와 `REFERENCE_DELTA.md`를 따릅니다.

---

## 2. 전시 URL (`/exhibitions/:id`)

라우트: [`ExhibitionRoute.tsx`](../src/app/pages/ExhibitionRoute.tsx).

| 경로/쿼리 | 동작 |
|-----------|------|
| `id`가 **큐레이션 목업 ID** (`isCuratedExhibitionId`) | [`ExhibitionDetail`](../src/app/pages/ExhibitionDetail.tsx) 전용 페이지 |
| `?from=work` | [`ExhibitionWorkShareLanding`](../src/app/pages/ExhibitionWorkShareLanding.tsx) — 작품 한 점 강조 |
| `?from=invite` **또는** `?from=credited` | 동일 컴포넌트 [`ExhibitionInviteLanding`](../src/app/pages/ExhibitionInviteLanding.tsx). `from` 값에 따라 UI 변형(`share` vs `credited`). 비회원 작가용 초대 문자 링크는 업로드 시 `?from=credited`로 생성 |
| (위에 해당 없음) | [`Browse`](../src/app/pages/Browse.tsx) + 작품 모달 딥링크 |

- 전시 단위 공유 기본 URL 예: 작품 상세 모달에서 `.../exhibitions/{workId}?from=invite` ([`WorkDetailModal.tsx`](../src/app/components/WorkDetailModal.tsx)).
- **한 링크에 여러 전시를 묶지 않음** — 같은 전시 맥락의 작품만 [`collectExhibitionWorks`](../src/app/pages/ExhibitionInviteLanding.tsx)로 묶습니다. 시드 작품은 검수 상태와 무관 포함, 나머지는 공개 피드에 보이는 작품만.

---

## 3. 그룹 전시 — 그룹명·체크리스트

- 업로드 타입이 **그룹**이면 **그룹명 필수** (강사 여부와 무관). 발행·미리보기 차단 시 그룹명 누락 검사 ([`Upload.tsx`](../src/app/pages/Upload.tsx) `publishChecklist`, `groupName` 항목).
- 체크리스트 **순서**(코드 주석과 동일): 전시 제목 → (그룹일 때) 그룹명 → 이미지 1장 이상 → (그룹일 때) **모든 이미지에 작가 지정**(회원 또는 비회원 이름+전화).
- 그룹명은 발행 시 **정규화·캐논 맵** 적용 가능 (`resolveCanonicalGroupName` 등 — 그룹명 레지스트리 유틸).
- 전시명/그룹명 등 **비속어 필터**(`containsProfanity`) 적용.
- **이미지 장수·파일 형식·해상도 등**은 [§14.1](#141-업로드--이미지--파일) 참고.

---

## 4. 비회원 SMS 초대·가입 매칭

### 4.1 모의 발송

- [`inviteMessaging.ts`](../src/app/utils/inviteMessaging.ts) `sendInviteToNonMember`: 실제 게이트웨이 없음. `artier_invite_messaging_log`에 기록, 한국 번호는 채널을 알림톡 우선으로 표기, **5% 랜덤 실패** 시뮬 가능. 중복은 `(phone, workId)` 성공 건 기준 방지.
- 로그 상한 **300건**(`MAX_LOG`). 발행 직후, 작품에 저장되는 `imageArtists` 중 비회원 항목의 **전화번호는 제거(스크럽)** — 발송에만 쓰이고 영속 데이터에는 남기지 않음 (`scrubbedImageArtists`).

### 4.2 가입 후 매칭 `matchSmsInviteOnSignup`

- 초대 로그 중 **`success: true`인 항목만** 대상.
- 전화번호 정규화 후 일치 시, 초대 시점 **`displayName`과 온보딩에서 입력한 실명(`realName`) 문자열이 trim 후 동일**하면 매칭 → `artier_invite_match_log` 기록(상한 **200건**) + 해당 `workId`에서 동일 표시명의 **비회원 슬롯을 회원 슬롯으로 교체** (`promoteNonMemberSlot` → `workStore.updateWork`).
- 전화는 맞고 이름이 다르면 **`blocked_name_mismatch`** 로그만 — 작품 데이터는 변경하지 않음.
- 전화만으로 자동 연결하지 않음.

### 4.3 초대 유입 온보딩

- 전시 랜딩 **가입** 링크: `/signup?invited=1` 진입 시 `artier_pending_sms_invite === '1'` 설정 ([`ExhibitionInviteLanding.tsx`](../src/app/pages/ExhibitionInviteLanding.tsx)).
- [`Onboarding.tsx`](../src/app/pages/Onboarding.tsx): 플래그가 있으면 **실명·전화 필수** 검증. 온보딩 완료 시 **전화와 실명이 모두 있을 때만** `matchSmsInviteOnSignup` 호출. 완료 후 플래그 제거.
- 매칭 성공 시 토스트(현재 구현은 한국어 고정 문자열 — i18n 개선은 별도 과제).

---

## 5. 강사 표시

- **`UserProfile.isInstructor` 없음.** 프로필의 강사·수강생 작품 탭 노출 등은 `workStore` 작품 중  
  `artistId === 프로필 주인 && isInstructorUpload === true` 인 작품 존재 여부로 파생 ([`Profile.tsx`](../src/app/pages/Profile.tsx) `instructorVisible`).
- **단일 진입점**: 그룹 업로드 세부정보에서 「강사(대리) 업로드」 체크 → 해당 작품에 `isInstructorUpload` 저장.

---

## 6. 검수·자동 승인·어드민 우회

| 환경 변수 | 동작 |
|-----------|------|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 신규 발행 작품의 검수 상태를 즉시 `approved`로 두는 **개발·데모 전용**. 프로덕션에서는 비활성이 전제. |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회(CI/프리뷰). |

- 미리보기용 `previewWork`는 검수 상태가 **항상 통과**로 두는 경로가 있어, 실제 발행 `newWork`와 구분됨 ([`Upload.tsx`](../src/app/pages/Upload.tsx) — `IMPLEMENTATION_DELTA` §3.5).
- **공개 피드 편입**: [`isWorkVisibleOnPublicFeed`](../src/app/utils/feedVisibility.ts) — `feedReviewStatus`가 `pending`·`rejected`면 비노출. 둘러보기에서는 추가로 `isHidden`·운영 숨김 ID 제외 ([`Browse.tsx`](../src/app/pages/Browse.tsx)).

---

## 7. 포인트

- [`pointsBackground.ts`](../src/app/utils/pointsBackground.ts): 업로드 후 **24시간 이내 삭제** 시 업로드 관련 AP 회수(`pointsRecallIfQuickDelete` 등). 데모 PP 적립 등 개발용 경로 포함.
- **적립·상한·원장 길이**는 [§14.6](#146-포인트-ap--원장) 참고.

---

## 8. 신고·제재 (클라이언트 스토어)

- **어드민 신고** ([`ReportManagement.tsx`](../src/app/admin/ReportManagement.tsx)): 삭제 / 경고 / 기각 / 비공개 등. 기각 시 신고자 허위 신고 누적, 경고 시 대상 작가 경고 누적 — [`sanctionStore.ts`](../src/app/utils/sanctionStore.ts) (누적 3회 시 7일 정지·차단 등 자동 승격 로직).
- **회원 정지** ([`MemberManagement.tsx`](../src/app/admin/MemberManagement.tsx)): 단계 선택(주의 / 7일 / 30일 / 영구). 데모 계정(시드 첫 작가)에 한해 글로벌 정지·로그아웃까지 연동.
- 영속 키 예: `artier_warning_counter_v1`, `artier_false_report_counter_v1` 등. **실제 운영 SLA·서버 제재 DB**는 Phase 2 이후 이관 전제.

---

## 9. 피드·카드·삭제된 선행 UI

- **피드 순위** ([`feedOrdering.ts`](../src/app/utils/feedOrdering.ts)): 버킷(Pick → 테마 → 추천 작가 → 신규 → 일반) + 좋아요·저장·**팔로우** 가중. **댓글 수는 랭킹에 사용하지 않음**(PRD Out of Scope 반영, 코드 주석 참고).
- **같은 작품은 한 버킷만** 선점(Pick → 테마 → … 순).
- **신규(14일)** 버킷: `uploadedAt` 기준 14일 이내 작품 ([`isRecentUpload`](../src/app/utils/feedOrdering.ts)).
- **점수 가중(버킷 내 정렬에 사용)**: 좋아요 ×2 + 저장 ×3 + (로그인 시) 팔로우 중인 작가 작품 **+8**, 그 위에 약한 랜덤 노이즈.
- **WorkCard**: 좋아요·저장 **숫자 미노출**, 상태 아이콘 위주.
- Pin 코멘트·타임랩스·주조색 추출 등 **미사용 선행 코드는 제거됨** (`IMPLEMENTATION_DELTA` §2.1). Phase 2에서 필요 시 신규 구현.

---

## 10. 이벤트·배너·큐레이션·Pick

- **이벤트**: [`eventStore.ts`](../src/app/utils/eventStore.ts) 단일 소스 + `artier_managed_events_v1` 영속화.
- **피드 큐레이션**: [`curationStore.ts`](../src/app/utils/curationStore.ts), 어드민 `/admin/curation`.
- **배너**: [`bannerStore.ts`](../src/app/utils/bannerStore.ts) + [`BannerManagement.tsx`](../src/app/admin/BannerManagement.tsx) — **드래그 순서(@dnd-kit)** 로 `order` 반영.
- **Artier's Pick 어드민** ([`PickManagement.tsx`](../src/app/admin/PickManagement.tsx)): 목록 **최대 10건**(`MAX_PICKS`), 동일 `id` 중복 추가 불가. 카탈로그는 **목업**(`catalogMock`). 화면 문구 **「매주 월요일 자정(KST) 자동 초기화」**는 안내용이며 **실제 스케줄러·자동 비우기 코드는 없음**. PRD의 **「동일 작가 20일 이내 중복 선정 제외」**는 **미구현**(운영 수동 전제).
- **피드 상단 Pick 배지**: 실제 노출은 작품의 `pick` / `editorsPick` 플래그 및 시드 데이터에 의존 — 어드민 Pick 목록과 **완전 연동되지는 않음**.

---

## 11. 소셜 첫 가입

- [`SocialSignupModal.tsx`](../src/app/components/SocialSignupModal.tsx): 첫 소셜 가입 시 약관·닉네임 등 처리. 재방문 즉시 로그인용 `artier_social_signed_up__<provider>` 키 정책은 `IMPLEMENTATION_DELTA` 및 회원 플로우 절 참고.
- 닉네임 **2~20자**, 입력 `maxLength=20`, 필수 약관(이용·개인정보·연령) 체크 후 완료 가능.

---

## 12. 데이터·스토리지 (요지)

- 작품 본문은 **`artier_works` 단일 키**(와일드카드 `artier_works_*` 표기 아님).
- 스키마 버전: `WORKS_STORAGE_VERSION` / `artier_works_version` — 현재 `local-gallery-v10` ([`store.ts`](../src/app/store.ts)).
- 초대·매칭 로그: `artier_invite_messaging_log`, `artier_invite_match_log`.
- 부팅 시 제거하는 레거시 키 등은 [`PointsBootstrap`](../src/app/components/PointsBootstrap.tsx) `LEGACY_STORAGE_KEYS` 참고.

---

## 13. 업로드·접근

- 업로드 페이지는 **비로그인 시** `/login?redirect=/upload` 로 보냄 (URL 직접 진입 방지).
- **외부 파일을 커스텀 커버로 쓰지 않음** — 대표 이미지는 업로드한 작품 내 선택 (`customCoverUrl`은 썸네일·OG용 분리 필드).

---

## 14. 세부 숫자·검증·한도 (코드 기준)

PRD 일부 문서는 **이미지 20장** 등과 다를 수 있음. **구현 확정값은 아래**이며, 명세 대비 요약은 `IMPLEMENTATION_DELTA.md` 표 A1 등을 따름.

### 14.1 업로드 — 이미지·파일

| 항목 | 값·규칙 | 근거 |
|------|---------|------|
| 전시당 이미지 장수 | **최대 10장** (`maxAdd = 10 - contents.length`, UI `n/10`) | [`Upload.tsx`](../src/app/pages/Upload.tsx) |
| 파일당 크기 | **10MB 초과 차단** | 동일 |
| 허용 MIME | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | `handleFileSelect` / `handleReplaceImage` |
| 파일 선택 accept | `.jpg,.jpeg,.png,.webp,.gif` | `<input type="file" accept=…>` |
| 단변 최소 해상도 | **800px** (`MIN_SHORT_SIDE = 800`) | 이미지 로드 후 짧은 변 기준 검사 |
| 카메라 촬영 차단 | JPEG EXIF의 Make/Model이 유효하면 업로드 **거부** (스캔 실패·비JPEG는 허용 흐름) | [`cameraExifBlock.ts`](../src/app/utils/cameraExifBlock.ts) |
| 전시 제목 | **최대 20자** (`maxLength` + 발행 시 `slice(0, 20)`) | [`Upload.tsx`](../src/app/pages/Upload.tsx) |
| 장별 작품 제목 | **최대 120자** | 동일 |
| 콘텐츠 블록 세로 간격 | **10px 고정** (`CONTENT_SPACING`) | 동일 |
| 작가 검색 자동완성 | 검색 결과 **최대 10명** 슬라이스 | 회원 작가 지정 UI |
| 비회원 전화 | 숫자만 **10자리 미만**이면 SMS 보내기 버튼 비활성 등 | 동일 |
| 발행 시 태그 | 현재 빈 배열 `tags: []` 고정 | 동일 |
| 그룹 전시·비강사·실질 작가 1명 이하 | **개인 전시로 전환**할지 `openConfirm`으로 제안. 확인 시 `solo`로 전환·그룹명·이미지별 작가 지정 초기화 후 토스트 | 동일 |

### 14.2 비속어 필터 적용 위치

[`profanityFilter.ts`](../src/app/utils/profanityFilter.ts) `containsProfanity` 사용처 예:

- **업로드**: 전시명·그룹명(발행 직전 차단).
- **가입**: 닉네임.
- **프로필 편집**: 표시명(닉네임)·한 줄 소개·자기소개 + **작품(장) 제목** 수정 시.

### 14.3 가입·이메일 ([`Signup.tsx`](../src/app/pages/Signup.tsx))

| 항목 | 규칙 |
|------|------|
| 이메일 형식 | `^[^\s@]+@[^\s@]+\.[^\s@]+$` 수준의 단순 검증 |
| 비밀번호 | **8자 이상**, **영문 + 숫자** 각 1자 이상 ([`passwordPolicy.ts`](../src/app/utils/passwordPolicy.ts)) |
| 닉네임 | **2~20자** + 비속어 불가 |
| 만 나이 | **만 14세 이상** (`meetsMinAge`, 생년월일 유효일 검증 `isValidDate`) | [`ageCheck.ts`](../src/app/utils/ageCheck.ts) `MIN_AGE = 14` |
| 약관 | 이용약관·개인정보 **필수** 동의(마케팅 이메일/푸시는 별도 체크 UI 존재) |

### 14.4 온보딩 ([`Onboarding.tsx`](../src/app/pages/Onboarding.tsx))

| 항목 | 규칙 |
|------|------|
| 닉네임 | **2~20자** |
| 실명 | 비어 있으면 OK(일반); **초대 플로우**에선 필수 |
| 전화 | 비어 있으면 OK(일반); 초대 플로우에선 필수. 입력 시 숫자 **10자리 미만**이면 오류 |
| SMS 매칭 호출 | **실명·전화가 둘 다 채워진 경우에만** |

### 14.5 프로필 편집 ([`Profile.tsx`](../src/app/pages/Profile.tsx))

| 항목 | 규칙 |
|------|------|
| 표시명(닉네임) | **maxLength 20** |
| 한 줄 소개(headline) | **maxLength 20** |
| 자기소개(bio) | textarea **글자 상한 미설정**(저장 시 비속어만 검사) |
| 장별 제목(편집 모달) | **maxLength 120** |
| 외부 링크 | 플랫폼 **고정 행** 편집기, 키가 알려진 플랫폼만 저장·표시 ([`ExternalLinksEditor.tsx`](../src/app/components/ExternalLinksEditor.tsx)) |

### 14.6 포인트 AP·원장 ([`pointsBackground.ts`](../src/app/utils/pointsBackground.ts))

| 이벤트 | AP | 비고 |
|--------|-----|------|
| 회원가입 완료 | **+50** | 계정당 1회(`signupApDone`) |
| 온보딩 Step1 완료 | **+30** | 1회(`onboardingApDone`) |
| **첫** 작품 발행 | **+100** | `firstUploadDone` |
| 이후 작품 발행 | **+20** | **같은 날짜(UTC 일 단위) 최대 2회**까지 업로드 AP 지급 |
| 같은 달 발행 **4번째** | **+50** | `upload_month_4` |
| 그룹전시 **강사 업로드**로 생성·발행 | **+30** | 월·강사 조합당 1회 `group_create` |
| 그룹전시 **비강사 참여** 발행 | **+15** | 월별 **최대 5회**까지 `group_participate` |
| 팔로워 **10 / 50 / 100** 달성 | **+30 / +100 / +200** | 작가별 마일스톤 1회성 |
| 일일 둘러보기 방문 | **+5** | **일 1회**(`dailyBrowseStreak` 날짜 키) |
| 발행 후 **24h 이내** 해당 작품 삭제 | **-20** | `pointsRecallIfQuickDelete` |
| 포인트 원장 로컬 보관 | 최대 **500건** | 오래된 항목 `slice` |

데모 전용 **PP** 잔액: `artier_pp_balance`, `addDemoPp` 등(개발 편의).

### 14.7 알림 ([`Notifications.tsx`](../src/app/pages/Notifications.tsx), [`pushDemoNotification.ts`](../src/app/utils/pushDemoNotification.ts))

| 항목 | 값 |
|------|-----|
| 최대 보관 개수 | **200건** (`MAX_NOTIFICATIONS`) |
| 보관 기간 | **90일** (`NOTIF_RETENTION_MS = 90 * 86400000`) — 초과분은 정규화 시 제거 |
| 타입 | `like` / `follow` / `pick` / `system` / `event` 등 |

### 14.8 검색 ([`Search.tsx`](../src/app/pages/Search.tsx))

| 항목 | 값 |
|------|-----|
| 최근 검색어 저장 개수 | **10개** (`MAX_RECENT`) |
| 스토리지 키 | 로그인: `artier_recent_searches__<slug>` (slug는 닉·이름 기반, **최대 64자** 치환), 비로그인: `artier_recent_searches__guest` |
| 트렌딩 표시 | 검색어 없을 때 **최대 8개** 슬라이스 등 UI 제한 |

### 14.9 검수 반려 사유 분류

[`reviewLabels.ts`](../src/app/utils/reviewLabels.ts) — **4종**: `low_quality` / `spam` / `inappropriate` / `copyright` (어드민 검수·알림 카피와 매핑).

### 14.10 UI·접근성(코딩 규칙)

- 주요 인터랙티브 컨트롤 **최소 높이 44px** (`min-h-[44px]` 등) — 시니어 터치 타깃 (`CLAUDE.md`).
- 확인은 **`openConfirm` + ConfirmDialog** — `window.confirm` / `window.alert` 사용 안 함.

### 14.11 이미지·레이아웃 기타

- 기본 이미지: [`ImageWithFallback`](../src/app/components/figma/ImageWithFallback.tsx)에 `loading="lazy"`, `decoding="async"` 기본(히어로 등은 호출부에서 `eager` 가능).
- **글자 크기**: 설정에서 **작게 / 보통 / 크게** 3단 — [`fontScale.ts`](../src/app/utils/fontScale.ts).

---

## 15. 관련 파일 (진입점)

| 주제 | 파일 |
|------|------|
| 전시 라우트 | `src/app/pages/ExhibitionRoute.tsx` |
| 초대·비회원 알림 랜딩 | `src/app/pages/ExhibitionInviteLanding.tsx` |
| 작품 단위 공유 랜딩 | `src/app/pages/ExhibitionWorkShareLanding.tsx` |
| 업로드·발행 조건 | `src/app/pages/Upload.tsx` |
| SMS·매칭 | `src/app/utils/inviteMessaging.ts` |
| 온보딩·매칭 호출 | `src/app/pages/Onboarding.tsx` |
| 강사 파생 | `src/app/pages/Profile.tsx` |
| 공유 URL 생성 | `src/app/components/WorkDetailModal.tsx` |
| 신고·제재 | `src/app/admin/ReportManagement.tsx`, `src/app/admin/MemberManagement.tsx`, `src/app/utils/sanctionStore.ts` |
| 소셜 첫 가입 | `src/app/components/SocialSignupModal.tsx` |
| 비밀번호·나이·비속어 | `src/app/utils/passwordPolicy.ts`, `ageCheck.ts`, `profanityFilter.ts` |
| 카메라 차단 | `src/app/utils/cameraExifBlock.ts` |
| 피드 노출 | `src/app/utils/feedVisibility.ts`, `src/app/pages/Browse.tsx` |
| 피드 순위 | `src/app/utils/feedOrdering.ts` |
| 포인트 | `src/app/utils/pointsBackground.ts` |
| 알림 | `src/app/pages/Notifications.tsx` |
| 검색 | `src/app/pages/Search.tsx` |
| Pick 어드민 | `src/app/admin/PickManagement.tsx` |

---

## 16. PM → 개발자 수정 의견 전달

레퍼런스(`reference/`)를 기준으로 구현한 뒤, PM이 **우선순위 있는 수정 요청**을 전달할 때 쓰는 절입니다.  
`IMPLEMENTATION_DELTA.md`만 던지지 말고, **아래 번들 + 짧은 본문(또는 §16.4 템플릿)** 을 함께 쓰는 것을 권장합니다.

### 16.1 한 줄 원칙

| 하지 말 것 | 대신 |
|------------|------|
| 델타 문서만 공유하고 “확인 부탁” | **이번 라운드에서 바꿀 항목만** 표로 적고, 델타는 **근거 링크**로 첨부 |
| 길게 인용만 나열 | **P0 / P1**와 **완료 정의(acceptance)** 를 각 항목에 붙임 |
| “레퍼런스대로”만 말하기 | 레퍼런스와 구현이 다르면 **어느 쪽을 따를지**(제품 확정)를 한 줄로 명시 |

### 16.2 권장 첨부 번들

| 순서 | 자료 | 역할 |
|------|------|------|
| ① (필수) | **§16.4 템플릿을 채운 “수정 요청서”** (스레드 본문 또는 별도 MD) | 개발자가 **먼저 읽을 1페이지** |
| ② (강력 권장) | [`IMPLEMENTATION_DELTA.md`](../IMPLEMENTATION_DELTA.md) | 명세 대비 구현 차이·§7 한계·§9 런칭 항목의 **정본** |
| ③ (숫자·규칙 논의 시) | **본 문서 §1~§15** (특히 **§14** 세부 한도) | 코드 기준 수치·정책 |
| ④ (PRD 톤 동기화 시) | [`reference/SuperGallery_Phase 1 PRD_v 1.4 — 구현 반영 초안.md`](../reference/SuperGallery_Phase%201%20PRD_v%201.4%20—%20구현%20반영%20초안.md) | v1.3과 구현의 중간 정리 |
| ⑤ (레퍼런스 원문 고칠 때) | [`REFERENCE_DELTA.md`](../REFERENCE_DELTA.md) | Notion/MD **원문 수정 지침** (217개 색인) |

**최소 세트:** ① + ②. “왜 이렇게 됐는지” 설명이 필요하면 ②의 해당 §만 링크하면 된다.

### 16.3 `IMPLEMENTATION_DELTA.md` 빠른 색인 (근거 달 때)

| 읽을 내용 | 절 |
|-----------|-----|
| 외부 연동이 아직 모의인 이유 | **§7** 명세 미달 / 한계 |
| 명세와 **다르게** 구현된 것 | **§8** |
| 레퍼런스 **화면·기능** 원문 고칠 때 표 | **§8.7** |
| 실서비스에 빠진 **법·운영** 과제 | **§9**, **§9-A** (L1~L19) |
| 런칭 관점 블로커·개선 | **§12** |
| SMS·비회원 매칭 정책 | **§12-A** |
| 코드 품질·잔여 정리 | **§11** |
| TOP 우선순위 과제 이력 | 헤더·**§9** TOP 8 표 |

항목을 적을 때 예: *“피드 기준은 §8.6·§9.8과 동일하게 유지해 주세요”* 처럼 **절 번호**를 적으면 검색이 빠르다.

### 16.4 수정 요청서 템플릿 (복사해서 사용)

```markdown
## 배경 (2~3줄)
- 기준 문서: reference / PRD v1.3 / …
- 이번 목표: (예: 검수 플로우 문구만 맞추기 / Pick 상한 정책 확정 등)

## 이번 라운드 범위
- 포함: …
- 제외 (Phase 2 또는 운영에서 처리): …

## 수정 요청 목록

| # | 요청 요약 | 기대 동작 (완료 정의) | 우선순위 | 근거 (IMPLEMENTATION_DELTA / 기타) |
|---|-----------|----------------------|----------|-------------------------------------|
| 1 | | | P0 / P1 | §… |
| 2 | | | | |

## 제품 결정 (레퍼런스와 다를 때만)
- (예: “이미지 장수는 레퍼런스 20장이 아니라 **구현 확정 10장**을 따른다” — 본 문서 §14.1)

## 첨부
- [ ] IMPLEMENTATION_DELTA.md (저장소 루트)
- [ ] docs/product-policies.md — 정책(§1~§15)·본 절(§16) 포함된 **통합 문서**
- [ ] 스크린샷 / 플로우 링크 (해당 시)

## 질문 (개발자에게 확인이 필요할 때)
- …
```

### 16.5 짧은 전달 예시 (슬랙/메일)

**제목:** `[Artier] 수정 요청 — {날짜} 라운드`

**본문 예시:**

> 안녕하세요. 레퍼런스 기준 구현 감사합니다.  
> 이번에 맞추고 싶은 건 **아래 표 #1~#3**입니다 (P0부터).  
> 배경·수치 근거는 **`IMPLEMENTATION_DELTA.md` §8.7**, **`docs/product-policies.md` §14** 를 봐 주시면 됩니다.  
> 전체 델타를 **다 고치라는 뜻은 아니고**, 표에 없는 건 이번 스코프에서 제외입니다.

### 16.6 자주 하는 오해 정리

| 오해 | 실제 |
|------|------|
| “델타에 ❌ 있으면 전부 버그” | §7·§9는 **의도적 미구현·런칭 전 과제**가 많음. 표와 헤더를 구분할 것. |
| “REFERENCE_DELTA만 보면 된다” | REFERENCE는 **원문 수정**용. **동작 변경 요청**은 `IMPLEMENTATION_DELTA`·본 문서(§1~§15)가 맞음. |
| “구현이 레퍼런스와 다르면 무조건 개발 잘못” | `IMPLEMENTATION_DELTA` **표 A1** 등 **제품이 의도적으로 바꾼 것**도 있음 — PM이 **정본**을 정해야 함. |

### 16.7 관련 링크

| 문서 | 경로 |
|------|------|
| 구현 델타 | [`../IMPLEMENTATION_DELTA.md`](../IMPLEMENTATION_DELTA.md) |
| 레퍼런스 원문 델타 | [`../REFERENCE_DELTA.md`](../REFERENCE_DELTA.md) |
| 레퍼런스 인덱스 | [`../delta.md`](../delta.md) |

---

*§1~§15는 제품·운영 논의용 요약이며, 약관·개인정보·법무 최종 확정은 `IMPLEMENTATION_DELTA.md` §9·§9-A 및 별도 검토를 따른다. §16은 전달 방식 보강용이며, 법무·계약 문구는 별도 검토를 따른다.*
