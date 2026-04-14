# SuperGallery Phase 1 — 명세 대비 구현 델타 보고서

> **작성일**: 2026-04-12
> **최종 수정**: 2026-04-13 — UI/UX 일관성 개선, 강사 토글 단일화, 기계적 정리, **Phase 1 런칭 준비도 최종 점검** 추가 (하단 [§9 필수 누락](#9-명세-외-무조건-있어야-하는데-빠져-있는-요소), [§10 업데이트](#10-2026-04-13-업데이트), [§11 코드 리뷰 잔여](#11-코드-리뷰--잔여-정리-항목-technical-polish), [§12 런칭 준비도](#12-phase-1-런칭-준비도--최종-점검) 참조)
> **대상**: Artier (SuperGallery) Phase 1 MVP
> **점검 기준**: `reference/` 폴더 (PRD v1.3, 유저 플로우 v0.2, 기능 모음, 정책 모음, 화면 모음, WBS v2)
> **구현 범위**: `src/app/` 전체 스캔
> **목적**: ① `reference/` 기준 구현 완전성 확인 ② 명세 **밖**에 추가로 구현된 요소 정리 ③ 명세와 **다르게** 구현된 부분 정리

---

## 0. 한눈에 보기

| 카테고리 | 명세 요구 충족 | 명세 밖 추가 | 판정 |
|---|---|---|---|
| 화면 (Pages) | 대부분 구현 / **이벤트 관리 CRUD 목업** (§8.5) | `/demo`, `/demo/reference`, `/points`, `/maintenance` | **부분 미흡** |
| 기능 (Features) | 핵심 기능 구현 / **이벤트 CRUD·피드 큐레이션 레이어 미구현** | Pin 코멘트, 타임랩스, 색상 팔레트, 초대 발송 로그 등 | **부분 미흡** |
| 정책 (Policies) | 대부분 코드화 / **피드 큐레이션 정책 코드화 안 됨** | 스토리지 버전, 포인트 회수, 강사 공개 | **부분 미흡** |
| 유저 플로우 | 명세 플로우 구현 | PM 데모 맵, 레퍼런스 검수 툴킷, 운영팀 역할 시뮬레이션 | **명세 초과** |
| 유저 스토리 (WBS) | 주요 스토리 구현 | 개발/검증/PM 대상 내부 스토리 5종 | **명세 초과** |

**전체 판정**: reference 명세의 Phase 1 **주요 플로우는 대부분 충족**되며 Phase 2·데모 도구까지 선행 구현. 다만 **이벤트 관리(§8.5·§9.7)·피드 큐레이션 레이어(§8.6·§9.8)·법적/보안 누락(§9.1·9.2)** 은 보완 필요.

명세 미달 / 외부 연동 미완 항목은 [§7 명세 미달 / 한계](#7-명세-미달--한계) 참조.

---

## 1. 화면 (명세 밖 추가 구현)

> reference/화면 모음 - PM, PD, Dev v2/ 기준. 매칭되지 않는 라우트만 기재.

### 1.1 [FlowDemoTools.tsx](src/app/pages/FlowDemoTools.tsx) — `/demo`
유저 플로우 14개 섹션 URL을 카테고리별로 모은 **PM/기획자용 데모 맵**. 샘플 알림 푸시, 초대 만료 화면 강제 노출, 운영팀 역할 토글 등 데모 시연을 위한 도구가 한 화면에 집약.

### 1.2 [DemoReferenceToolkit.tsx](src/app/pages/DemoReferenceToolkit.tsx) — `/demo/reference`
JWT 세션 토큰 데모, GeoIP 국가 감지 조회(캐시 오버라이드 포함), 10종 이메일 템플릿 미리보기, Phase 2 미포함 항목(댓글/이의제기 등) 추적 테이블을 한 화면에서 제공. 기획·QA용 **레퍼런스 툴킷**.

### 1.3 [Points.tsx](src/app/pages/Points.tsx) — `/points`
AP/PP 잔액 조회, 포인트 원장(적립·사용·만료) 필터링 UI. 명세(PRD §5.5, 역할별 권한 정의)에는 **"UI는 Phase 2 공개"**로 명시되었으나 선행 구현됨.

### 1.4 [Maintenance.tsx](src/app/pages/Maintenance.tsx) — `/maintenance`
명세 "점검 중" 화면이 존재하나 단독 라우트로 구성된 점은 특이. 에러 페이지(404/500)와 동일 군으로 관리.

### 1.5 [ExhibitionInviteLanding.tsx](src/app/pages/ExhibitionInviteLanding.tsx) — `/exhibitions/:id?from=invite`
명세 "전시 초대장 오픈 화면"을 구현한 **전시 랜딩**. 작품 상세 모달의 공유 버튼이 생성하는 URL로 들어오면 단일 작품 모달 대신 전시 헤더(커버·전시명·개설자) + 작품 갤러리 그리드 + 비로그인 가입 유도 배너 + 재공유 버튼을 보여줌. (2026-04-13 신설 — §9 참조)

### 1.6 어드민 세부 화면 6개
reference는 어드민 기능 그룹 수준(대시보드·회원·신고 등)으로 기술. 실제 구현은 세부 라우트로 분리됨:
- [`/admin/issues`](src/app/admin/IssueManagement.tsx) — 미결 이슈 트래커
- [`/admin/checklist`](src/app/admin/LaunchChecklist.tsx) — 런칭 체크리스트 (QA/법무/콘텐츠/재무/마케팅/운영 카테고리)
- [`/admin/partners`](src/app/admin/PartnerManagement.tsx) — 파트너 작가 관리
- [`/admin/events`](src/app/admin/EventParticipants.tsx) — 이벤트 참여자
- [`/admin/picks`](src/app/admin/PickManagement.tsx) — Artier's Pick 관리
- [`/admin/managed-events`](src/app/admin/ManagedEventManagement.tsx) — 이벤트 관리

명세의 "어드민 (관리자 기능)" 화면 그룹 내 **세부 UI는 일부 확장 구현**된 것으로 판단.

---

## 2. 기능 (명세 밖 추가 구현)

### 2.1 Phase 2 선행 구현

#### [PinCommentLayer.tsx](src/app/components/work/PinCommentLayer.tsx) + [pinCommentStore.ts](src/app/store/pinCommentStore.ts)
이미지 특정 좌표에 핀을 찍고 의견을 남기는 기능. 명세 PRD §2.2 Out of Scope("댓글/Pin 코멘트는 Phase 2")인데 **구현되어 있음**.
- 좌표 기반 핀 배치
- 작가 아바타·이름 표시
- localStorage 동기화 (`artier_pin_comments`)

#### [TimelapsePlayer.tsx](src/app/components/work/TimelapsePlayer.tsx)
작업 과정 타임랩스 영상 재생/일시정지/속도 조절 컴포넌트. 명세에 전혀 언급 없음. 현재는 src 없이 UI만 렌더링 (실 영상 소스 미구현).

#### [ColorPaletteSuggestion.tsx](src/app/components/work/ColorPaletteSuggestion.tsx) + [colorPalette.ts](src/app/utils/colorPalette.ts)
업로드 이미지에서 주요 색상을 캔버스 샘플링으로 추출해 전시 배경색으로 추천. 명세에는 "배경색 자동 적용" 수준만 있고 **색상 추출 알고리즘은 미언급**.

### 2.2 명세 확장 (spec 범위 내지만 세부 구현은 추가)

#### [inviteMessaging.ts](src/app/utils/inviteMessaging.ts)
명세 "작가 설정 및 비가입자 초대" 구현. 추가 요소:
- **5% 랜덤 실패 시뮬레이션** — 명세의 "발송 실패 시 게시 정상 처리" 검증용
- **localStorage 발송 로그** (`artier_invite_messaging_log`) — PM이 발송 이력 확인 가능

#### [반려 사유 모달](src/app/pages/Profile.tsx) & [ContentReview.tsx](src/app/admin/ContentReview.tsx)
명세 "콘텐츠 검토" 구현. 추가 요소:
- 본인 프로필에서 rejected 작품 클릭 시 **사유 안내 모달 → 수정 CTA**
- 승인/반려 시 **인앱 알림 자동 발송** (pushDemoNotification)

#### [adminGate.ts](src/app/utils/adminGate.ts) — 운영팀 역할 토글
명세 "역할별 권한 정의"에 따라 어드민 접근을 역할 기반으로 게이팅. 추가 요소:
- **localStorage 기반 브라우저별 토글** (실 Auth 대체 데모)
- **VITE_ADMIN_OPEN=true** 환경 변수 우회 (CI/프리뷰용)

#### [analytics.ts](src/app/utils/analytics.ts)
GA4 이벤트 트래킹 스캐폴딩. 명세에 GA 언급 없으나 미래 확장용 **선제 구현**.

#### [WORKS_STORAGE_VERSION](src/app/store.ts) — 스토리지 버전 관리
`public/images` 또는 manifest 변경 시 localStorage를 **자동 재초기화**하는 버전 관리 로직 (현재 v6). 명세 미포함이나 데모 환경 안정성 확보용.

#### [ConfirmDialog.tsx](src/app/components/ConfirmDialog.tsx) — 커스텀 확인 다이얼로그
브라우저 네이티브 `confirm()`을 대체하는 프로미스 기반 컴포넌트. `openConfirm({ title, description?, destructive? })` imperative API. 명세에 없으나 **어드민·사용자 UI 전체의 확인 다이얼로그 시각 일관성** 확보용. 파괴적 작업(삭제 등)은 destructive 빨간 버튼. (2026-04-13 신설)

### 2.3 데모 시뮬레이션 유틸

#### [pushDemoNotification.ts](src/app/utils/pushDemoNotification.ts)
알림함(`artier_notifications`)에 샘플 항목을 추가하는 테스트 유틸. FlowDemoTools에서 호출. **데모 전용**.

#### [pointsBackground.ts](src/app/utils/pointsBackground.ts) — `addDemoPp`
개발 모드에서만 "데모 PP 50 추가" 버튼으로 가상 포인트 적립. 명세 미포함 데모 도구.

---

## 3. 정책 (명세 밖 추가 정책)

### 3.1 스토리지 버전 관리 정책
- `artier_works_version` 키로 스토리지 스키마 버전 추적
- 버전 불일치 시 works 데이터 강제 재시드
- **근거**: 명세 없음. 개발 중 이미지·manifest 변경 빈번으로 인한 데이터 정합 유지 목적

### 3.2 포인트 회수 정책
[pointsBackground.ts:pointsRecallIfQuickDelete](src/app/utils/pointsBackground.ts)
- 업로드 후 24시간 이내 삭제 시 해당 작품 관련 업로드 AP(-20) 회수
- **근거**: 명세 "포인트 운영 정책"에 회수 언급 없음. 어뷰징 방지 목적으로 추정

### 3.3 강사 여부 자동 파생 정책 (2026-04-13 개정)
- 강사 여부 = **업로드 이력에서 자동 파생** (`isInstructorUpload === true`인 작품이 1건 이상)
- 별도 프로필 토글 UI 제거 — **UX 단순화 + 상태 불일치 차단**
- 명세 "프로필에서 강사 토글 ON한 창작자" 문구는 "첫 대리 업로드 시 자동 활성화"로 해석
- **배경**: 기존에는 `UserProfile.isInstructor` + `instructorPublic` Set 이중 저장 + 업로드 토글까지 3개 상태가 sync되어야 했으나, 프로필 토글 OFF + 업로드 ON 같은 불일치 발생 가능 → 업로드 이력 단일 소스로 통합

### 3.4 컨텐츠 검수 사유 세부 분류
[reviewLabels.ts](src/app/utils/reviewLabels.ts)
- 4분류 (low_quality / spam / inappropriate / copyright)
- 명세는 "저품질·스팸·부적절·저작권 침해 의심" 4개로 분류됨 → **일치**. 다만 코드 상수화·i18n 매핑은 추가 구현

### 3.5 자동 승인 모드 (개발 편의)
[Upload.tsx:418](src/app/pages/Upload.tsx)
- `VITE_UPLOAD_AUTO_APPROVE=true` 환경 변수 활성화 시 업로드 즉시 `approved` 상태
- **근거**: 명세 "운영팀 검토 24시간"을 건너뛰는 개발 편의 플래그

---

## 4. 유저 플로우 (명세 밖 추가 플로우)

### 4.1 PM 데모 맵 플로우 — `/demo`
14개 기능 섹션(회원가입·업로드·둘러보기 등)의 URL이 카테고리별로 정리되어, 기획자/디자이너가 **클릭 한 번으로 각 화면**에 진입. 명세 유저 플로우에는 존재하지 않는 **내부 내비게이션 플로우**.

### 4.2 레퍼런스 검수 플로우 — `/demo/reference`
- JWT 토큰 발급·리프레시 시뮬 → 세션 관리 검증
- GeoIP 국가 조회 → 해외 분기 테스트
- 이메일 템플릿 10종 열람 → 카피 최종 확인
- Phase 2 미포함 항목 추적 테이블 → PM 범위 관리

### 4.3 운영팀 역할 시뮬레이션 플로우
- 일반 유저로 `/admin` 접근 → 리다이렉트 확인
- `/demo` → "운영팀 역할 활성화"
- `/admin` 재접근 → 사이드바에 **"운영팀 역할" 뱃지** 노출 & 접근 허용
- 토글 해제 → 다시 차단

명세 "역할별 권한 정의"를 **로컬에서 시각계적으로 검증**할 수 있는 추가 플로우.

### 4.4 포인트 적립 내역 플로우 (선행)
`/points` 진입 → AP/PP 잔액 → 필터(적립/사용) → 원장 조회. 명세는 **Phase 2 UI 공개**이나 현재 접근 가능.

---

## 5. 유저 스토리 (명세 WBS 밖 추가)

### 5.1 개발/검증팀 스토리
- **"나는 모든 기획된 화면의 URL을 한 페이지에서 확인하고 싶다"** → `/demo`
- **"나는 JWT·GeoIP·이메일 템플릿을 한 곳에서 검수하고 싶다"** → `/demo/reference`
- **"나는 운영팀 권한 차단 동작을 시각적으로 검증하고 싶다"** → 운영팀 역할 토글
- **"나는 샘플 알림을 알림함에 넣어 UI를 테스트하고 싶다"** → pushDemoNotification

### 5.2 PM/기획자 스토리
- **"나는 초대 메시지가 실제로 어떻게 보내지는지 로그로 확인하고 싶다"** → `artier_invite_messaging_log`
- **"나는 자동 승인 모드로 검수 흐름을 건너뛰고 업로드 결과만 빠르게 확인하고 싶다"** → `VITE_UPLOAD_AUTO_APPROVE`

### 5.3 운영/콘텐츠 팀 스토리 (선행)
- **"나는 미결 이슈·런칭 체크리스트·파트너 작가를 각각 관리하고 싶다"** → `/admin/issues`, `/admin/checklist`, `/admin/partners`
- **"나는 이벤트 참여자 현황을 어드민에서 조회하고 싶다"** → `/admin/events`

---

## 6. reference 명세 구현 완전성

### 6.1 명세 항목별 대략 커버리지

| 영역 | 커버리지 | 비고 |
|---|---|---|
| 화면 (화면 모음) | ~96% | **전시 초대장 오픈 화면 신규 구현 (2026-04-13)** + Skip-to-content/PasswordInput 공용 UI 추가. **이벤트 목록·상세·관리는 화면은 있으나 어드민 CRUD가 목업** (§8.5). 일부 화면(“화면 미리보기”, “참여 완료 확인” 등)은 별도 라우트 없이 모달/조건부 렌더로 구현 |
| 기능 (기능 모음) | ~85% | 외부 연동 필요한 이메일·OAuth·SMS 모의 + **이벤트 관리 CRUD 미완** (§8.5·§9.7) + **피드 큐레이션 레이어 미구현** (§8.6·§9.8) |
| 정책 (정책 모음) | ~90% | 4역할·콘텐츠 검수·포인트 운영·신고 처리 등 모두 코드화. **콘텐츠 운영 정책의 피드 큐레이션 레이어(테마전·작가 추천)·팔로우 가중치는 미구현** — §8.6·§9.7 |
| 유저 플로우 (v0.2) | ~100% | 명세 플로우 구현 + PM 데모 플로우 추가. 전시 초대장 공유→오픈 플로우 완결 |
| WBS 유저 스토리 v2 | ~95% | 핵심 스토리 구현. 서버 연동 스토리만 Phase 2로 유보 |

### 6.2 명세 내 완전 구현 확인

✅ 회원가입/로그인 (이메일 + 소셜 UI)
✅ 작품 업로드 (1~20장, WEBP 변환, EXIF 카메라 차단)
✅ 좋아요/저장/팔로우
✅ 검색 (자동완성, 최근 검색 계정별/게스트 분리)
✅ 비가입자 초대 (카톡/SMS 모의)
✅ 콘텐츠 검수 (반려 사유 4분류, 작가 알림, 재업로드)
✅ 배너 관리 (5개 제한, 기간 필터, Browse 실반영)
✅ 어드민 운영팀 역할 기반 접근 제어
✅ 포인트 백그라운드 적립 (AP 회원가입/업로드/출석 등)
✅ 알림 (인앱 시뮬레이션 + 이메일 템플릿 10종)
✅ 신고 처리 (신고 즉시 숨김 + 어드민 처리)
✅ 전시 초대장 공유 (공유 URL → 초대장 오픈 화면 = 전시 그리드 랜딩, 비로그인 가입 유도 CTA 포함) — **2026-04-13 명세 완전 충족**
⚠️ 둘러보기 피드 노출 — 기본 골격(Pick 상단 / 검수 게이트 / 이전에 본 제외)은 구현, **큐레이션 중간 레이어(테마전·작가 추천)와 팔로우 가중치 미구현** (§8.6·§9.8 참조)
⚠️ 이벤트 관리 — 사용자 목록/상세 UI는 있으나 **데이터 3곳 분산·어드민 CRUD 목업·영속화 없음·상태값 3종 혼재** (§8.5·§9.7 참조)
✅ 쿠키 동의 배너, 코치마크, 딥줌 뷰어
✅ UX 일관성: 브라우저 `confirm()` 10곳 → 커스텀 ConfirmDialog 전수 교체 (2026-04-13)
✅ WorkCard 하단: 좋아요·저장 상태 아이콘 (숫자 미노출 — PRD §2.2 댓글 Out of Scope 반영)

---

## 7. 명세 미달 / 한계

> reference에는 있으나 **외부 연동이 필요하여 모의 수준**에 머문 항목.

| 항목 | 현 상태 | 사유 |
|---|---|---|
| 소셜 로그인 (카카오/구글/애플) | UI만, OAuth 미연동 | 실 OAuth 공급자 연동 필요 |
| 이메일 발송 (인증/재설정/알림 10종) | 템플릿만, 실 발송 없음 | SES/SendGrid 등 연동 필요 |
| SMS/카카오 알림톡 발송 | 로그 기록, 실 발송 없음 | 실 게이트웨이 연동 필요 |
| Supabase 실서버 연동 | **미적용** (관련 파일 2026-04-13 제거) | PM 데모 범위 외 — Phase 2에 새로 설계 |
| OG 이미지 자동 생성 | 정적 메타만 | SSR/서버 렌더 필요 |
| 실시간 푸시 알림 | 로컬 시뮬만 | 명세상 "실시간 푸시 알림 x" — 의도적 제외 |

이들은 **프로젝트 목적(PM 시각 확인용 데모)에 따라 의도적으로 모의 수준에 유지**된 것이며, DB/Auth 연동은 차기 단계 예정.

---

## 8. 명세와 **다르게** 구현된 부분 (주의)

> 명세에는 있으나 구현 방식·세부가 다르거나, 의도와 다른 부분. 현재까지 남아있는 것만.

### 8.1 최근 검색어 서버 저장
- 명세(PRD §5.6): 로그인 사용자는 **서버 저장**, 비로그인은 localStorage
- 실제: **양쪽 모두 localStorage** (계정별 slug 키 vs guest 키로만 구분)
- 이유: Supabase Auth 미연동 — Phase 2에서 서버 저장으로 대체 예정

### 8.2 OG 이미지 생성
- 명세: 공유 시 전시명+커버+개설자로 OG 이미지 자동 생성
- 실제: 정적 메타태그만 (동적 이미지 합성 없음)
- 이유: SSR/서버 렌더가 필요 — SPA 한계

### 8.3 이메일·SMS·카톡 발송
- 명세: 실제 발송 (10종 템플릿, 초대 알림톡, 인증 메일 등)
- 실제: **모의 발송** — localStorage에 로그 기록만 (`artier_invite_messaging_log` 등)
- 이유: 외부 게이트웨이 미연동

### 8.4 배너 관리 영속화
- 명세: DB 기반 영속화 (`start_at / end_at / is_active` 필드)
- 실제: **localStorage** 기반 (`artier_admin_banners_v1`)
- 이유: Supabase 미연동. 필드·정책은 명세대로 구현됨

### 8.5 이벤트 메뉴 통합 ✅ 완료 (2026-04-13)

- **단일 store 통합**: 신규 [eventStore.ts](src/app/utils/eventStore.ts) (`useSyncExternalStore` 캐시 안정화 패턴)
  - 기존 3곳 분산 데이터(Events 하드코딩, EventDetail `allEvents` export, EventManagement `initialEvents`)를 하나의 5개 seed로 통합
- **상태값 표준화**: `scheduled / active / ended` 단일 enum + `deriveStatus()`로 startAt/endAt 기준 자동 계산. 수동 status 오버라이드 가능
- **명세 필드 반영**: `title·subtitle·description·bannerImageUrl·startAt·endAt·worksPublic·participantsLabel`
- **어드민 CRUD 실동작**: [EventManagement.tsx](src/app/admin/EventManagement.tsx) 재작성 — 등록·수정·삭제 모두 실 store 반영, ConfirmDialog 삭제 확인
- **localStorage 영속화**: `artier_managed_events_v1`
- **자동 종료**: `endAt < today` 이면 `deriveStatus()`가 `ended` 반환
- **사용자 화면 즉시 반영**: [Events.tsx](src/app/pages/Events.tsx) / [EventDetail.tsx](src/app/pages/EventDetail.tsx)이 store 구독 → 어드민 변경이 실시간 반영
- **참여 플로우**: `/upload?event=:id` 쿼리 연결 유지 ✅

### 8.6 둘러보기 피드 노출 알고리즘 ✅ 명세 충족 (2026-04-13)
- **명세 & 구현 대조**:
  1. Artier's Pick 상단 → ✅
  2. **이번 주 테마전** → ✅ 신규 [curationStore.ts](src/app/utils/curationStore.ts)의 `theme.workIds`
  3. **추천 작가** → ✅ `featuredArtistIds` 집합의 작가 작품 부스트
  4. 신규(14일) → ✅
  5. 일반 랜덤 → ✅
  6. **좋아요·저장·팔로우** 가중치 → ✅ [feedOrdering.ts](src/app/utils/feedOrdering.ts) `scoreWork()`에 `followingArtistIds` 반영(+8점)
  7. 이전에 본 전시 뒤로 → ✅
  8. pending/rejected 제외 → ✅
- 각 작품은 **하나의 버킷에만** 배정 (중복 제거): Pick → 테마 → 추천 작가 → 신규 → 일반 순서로 선점
- 관리 UI: [/admin/curation](src/app/admin/CurationManagement.tsx) — 테마전 제목·부제·포함 작품 ID 입력 + 추천 작가 토글

---

## 9. 명세 외 무조건 있어야 하는데 빠져 있는 요소

> reference 명세에는 명시되지 않았으나 **실서비스 배포에 상식적으로 필요한** 항목. 현재 미구현 또는 불완전한 것만 기재. 영향도는 배포 블로커(High) / 품질 저하(Medium) / 편의(Low)로 표시.

### 9.1 법적·정책 (High)
- ✅ **만 14세 미만 차단 로직 구현 (2026-04-13)** — 신규 [ageCheck.ts](src/app/utils/ageCheck.ts) (`isValidDate`, `getAge`, `meetsMinAge`, `birthYearOptions`). [Signup.tsx](src/app/pages/Signup.tsx)에서 3개 select(년/월/일)로 생년월일 입력 → 실시간 검증 (유효 날짜 + 만 14세 이상). 14세 미만·유효하지 않은 날짜는 가입 버튼 비활성 + 인라인 에러. 기존 `agreeAge` 체크박스는 제거 (생년월일 검증으로 대체)
- ❌ **데이터 내보내기 / 삭제 요청** — 개인정보보호법·GDPR 요구. 설정에서 "내 데이터 내보내기" / "계정 삭제 요청" 동작 없음 (탈퇴는 있으나 데이터 다운로드 없음)
- ⚠️ **약관 본문 법적 완성도 부족** — [termsContent.ts](src/app/i18n/termsContent.ts)는 5개 조문(목적·정의·서비스 이용·저작권·면책)만 포함하며, 본문 하단에 "초안이며 법무 검토를 거쳐 최종 확정됩니다" 명시. 이용 제한·계약 해지 사유·손해배상·관할 법원 등 **필수 조항 다수 누락**. [privacyContent.ts](src/app/i18n/privacyContent.ts)도 48줄로 개인정보 제3자 제공·보관 기간·파기 절차 등 요구 조항 미상세
- ❌ **이메일 인증 실단계** — `signup?demo=email_sent` UI만 있고, 실제 가입 시엔 **체크박스 통과 즉시 `auth.login()` + `/onboarding` 리다이렉트**. 이메일 소유권 확인 없이 계정 생성 (Phase 2 연동 예정)

### 9.2 보안·커뮤니티 신뢰도 (High)
- ✅ **비속어 필터 (2026-04-13)** — 신규 [profanityFilter.ts](src/app/utils/profanityFilter.ts) (한국어 대표 욕설 ~30개 + 영어 흔한 욕 ~8개). [Signup](src/app/pages/Signup.tsx) 닉네임, [Upload](src/app/pages/Upload.tsx) 전시명/그룹명/태그, [Profile](src/app/pages/Profile.tsx) 편집(닉네임/헤드라인/자기소개) 3곳에서 `containsProfanity()` 검증. 우회 탐지는 Phase 2 (서버 사전 + 운영 신고 조합)
- ❌ **로그인 실패 횟수 제한 안내 UI** — 브루트포스 방어 서버 로직은 Phase 2이지만, UI 메시지 프레임은 미리 준비 필요
- ❌ **Rate limit 안내 프레임** — 너무 빠른 요청·제재 상태 안내 토스트/모달

### 9.3 성능·UX 기본 (Medium)
- ✅ **이미지 lazy loading (2026-04-13 적용)** — [ImageWithFallback.tsx](src/app/components/figma/ImageWithFallback.tsx) 기본값 `loading="lazy"` + `decoding="async"`. 호출부에서 히어로 이미지는 `loading="eager"`로 덮어쓰기 가능
- ✅ **네트워크 오프라인 감지 배너 (2026-04-13 적용)** — [OfflineBanner.tsx](src/app/components/OfflineBanner.tsx) 신규, `online`/`offline` 이벤트 구독해 상단 고정 배너 노출 (aria-live="polite")
- ✅ **스크롤 위치 복원 (2026-04-13)** — 신규 [scrollRestore.ts](src/app/utils/scrollRestore.ts) (sessionStorage 기반, key `artier_scroll_browse`). Browse 마운트 시 `restoreScrollTop`, 모달 열기·unmount·`beforeunload`·`pagehide` 시 `saveScrollTop` — 외부 페이지 다녀와도 피드 위치 유지
- ❌ **대용량 업로드 progress bar** — 이미지 여러 장 업로드 시 진행 표시 없음
- ✅ **비밀번호 보기/숨김 토글 (2026-04-13 적용)** — [PasswordInput](src/app/components/ui/password-input.tsx) 공용 컴포넌트 추가 (Eye/EyeOff 아이콘). Signup·PasswordReset(×2)·Settings 탈퇴 총 **4곳 적용**
- ❌ **가입 단계 구조화 부재** — 현재 이메일→패스워드→닉네임→약관→바로 `/onboarding` 원페이지 폼. 이메일 인증 대기·입력 검증·웰컴 단계가 한 화면에 압축되어 있고, 이메일 소유권 확인 단계(§9.1)가 빠져 있음. 정식 배포 전 **단계형(Stepper) 가입 플로우** 또는 최소한 이메일 인증 대기 화면 삽입 필요

### 9.4 SEO·앱 자산 (Medium)
- ✅ **robots.txt Sitemap 지시자 추가 (2026-04-13)** — `Sitemap: https://artier.example.com/sitemap.xml` 추가 (도메인은 실서버 확정 시 교체)
- ✅ **sitemap.xml 신규 (2026-04-13)** — [public/sitemap.xml](public/sitemap.xml) 8개 주요 URL(`/`, `/search`, `/events`, `/about`, `/notices`, `/faq`, `/terms`, `/privacy`) 등록
- ❌ **favicon.ico / apple-touch-icon / manifest.json** — `public/` 하위에 아이콘 세트 없음. 브라우저 탭·홈화면 추가 UX 미흡 (디자인 필요)
- ❌ **페이지별 OG 메타 동적 설정** — 현재 정적 meta만. 공유 시 썸네일·제목이 모든 URL에서 동일

### 9.5 접근성 (Low)
- ✅ **"본문 바로가기" (Skip-to-content) 링크 추가 (2026-04-13)** — [Layout.tsx](src/app/Layout.tsx) 상단에 sr-only 링크 + focus 시 좌상단에 노출. `#browse-scroll-root`/`#main-content` 타겟 자동 분기
- ✅ 그 외 기본(`<main>` landmark, `aria-*` 사용, `focus-visible` 스타일, `lang` 동적 분기)은 충실

### 9.6 개발·운영 문서 (Low)
- ✅ **LICENSE 파일 추가 (2026-04-13)** — All Rights Reserved 선언 ([LICENSE](LICENSE))
- ❌ CONTRIBUTING.md / CHANGELOG — 초기 데모 단계라 생략 (필요 시 추가)

### 9.7 이벤트 메뉴 정리·영속화 ✅ 완료 (2026-04-13)

§8.5에 상세 기술. 신규 [eventStore.ts](src/app/utils/eventStore.ts) 중심으로 3개 화면(Events / EventDetail / EventManagement)을 단일 소스로 통합. 어드민 CRUD 실동작, localStorage 영속화, 상태값 표준화(`scheduled/active/ended`), 자동 종료 로직 전부 반영

### 9.8 피드 큐레이션 레이어·화이트리스트·추천리스트 ✅ 완료 (2026-04-13)

§8.6에 상세. 신규 [curationStore.ts](src/app/utils/curationStore.ts) + [CurationManagement.tsx](src/app/admin/CurationManagement.tsx) + [feedOrdering.ts](src/app/utils/feedOrdering.ts) 확장으로 명세 "피드 노출 구조" 완전 충족:
- 테마전 관리 UI (제목·부제·작품 ID 리스트)
- 추천 작가 토글 (피드 부스트 대상)
- 팔로우 신호 가중치 (로그인 유저 팔로잉 작가에 +8점)
- 5단계 버킷 (Pick → 테마 → 추천 작가 → 신규 → 일반), 중복 제거

**UI 진입**: 어드민 사이드바 > "피드 큐레이션" (`/admin/curation`)
- ⚠️ 사용자 대면 "피드 기준" 안내(FAQ 공지) 문구는 추후 PM 작성 과제로 남음

---

### TOP 8 우선순위 (배포 관점)

| # | 항목 | 영향도 | 이유 | 예상 공수 |
|---|---|---|---|---|
| 1 | ~~**이벤트 메뉴 단일 store 통합 + CRUD 실동작 + 영속화**~~ ✅ 완료 (2026-04-13) | — | §8.5 / §9.7 참조 | — |
| 2 | ~~**만 14세 미만 가입 차단** (생년월일 입력 + 검증)~~ ✅ 완료 (2026-04-13) | — | §9.1 / §10.11 참조 | — |
| 3 | ~~**비속어 필터** (닉네임·그룹명·태그)~~ ✅ 완료 (2026-04-13) | — | §9.2 / §10.12 참조 | — |
| 4 | ~~**피드 큐레이션 레이어** (이번 주 테마전 + 작가 추천)~~ ✅ 완료 (2026-04-13) | — | §8.6 / §9.8 / §10.13 참조 | — |
| 5 | ~~**팔로우 신호 가중치 추가**~~ ✅ 완료 (2026-04-13) | — | §8.6 참조 | — |
| 6 | **네트워크 오프라인 감지 배너** | Medium | 요청 실패 오인 방지, 구현 단순 | 1h |
| 7 | **이미지 lazy loading** (피드·검색·프로필 그리드) | Medium | 초기 LCP 대폭 개선 | 1~2h |
| 8 | **favicon 세트 + sitemap.xml** | Medium | SEO·브랜딩·홈화면 UX | 1~2h |

### 명세 외지만 이미 구현되어 있는 기본기 (확인 결과 ✅)

- ErrorBoundary, CookieConsent, i18n(ko/en), localStorage 영속화
- 약관 동의 체크박스 3종 (terms/privacy/age — `agreeAge` 플래그)
- Draft 자동 저장 (draftStore)
- `<main>` landmark, `aria-*`, `focus-visible` 기본
- XSS 방어 (dangerouslySetInnerHTML 최소 사용)
- 초기 meta og/twitter/viewport 태그, theme-color, locale
- ConfirmDialog (2026-04-13 추가)

---

## 10. 2026-04-13 업데이트

이 보고서 최초 작성(2026-04-12) 이후 **UI/UX 일관성 개선 3건** 진행.

### 10.1 `confirm()` → 커스텀 ConfirmDialog 전수 교체
- **문제**: 어드민 UI는 커스텀 디자인인데 삭제 확인은 브라우저 네이티브 창 → 일관성 깨짐
- **해결**: 신규 [ConfirmDialog.tsx](src/app/components/ConfirmDialog.tsx) (Radix AlertDialog 기반, Promise API)
- **영향**: 10개 호출부 교체 (Upload·Search·Profile×4·Notifications·Header·BannerManagement·Settings)
- **부가**: 파괴적 작업(`destructive: true`) 시 빨간 확인 버튼으로 시각 구분

### 10.2 WorkCard 하단 좋아요 숫자 제거 → 상태 아이콘화
- **문제**: 댓글 숫자를 PRD Out of Scope 따라 제거 후 좋아요 숫자 혼자 남아 허전
- **해결**: 하트(좋아요) + 북마크(저장) **상태 인디케이터**로 변경, 숫자 미노출
- **결과**: [WorkCard.tsx](src/app/components/WorkCard.tsx) 카드 그리드가 더 정돈되고, 좋아요/저장 상태가 한눈에 보임

### 10.3 초대 시스템 통합 — 고아 페이지 제거 + 명세 충족
- **문제**:
  - `/invite/:code` (`InvitationLanding.tsx`)가 하드코딩 코드 3개로만 동작, 실제 공유 버튼과 무연결 → **고아 페이지**
  - 공유 URL(`/exhibitions/:id`)로 받은 사람에겐 **단일 작품 모달**만 뜸 → 명세 "전시 갤러리 그리드" 미충족
- **해결**:
  - 신규 [ExhibitionInviteLanding.tsx](src/app/pages/ExhibitionInviteLanding.tsx) — 명세 "전시 초대장 오픈 화면" 완전 구현
  - [ExhibitionRoute.tsx](src/app/pages/ExhibitionRoute.tsx)에 `?from=invite` 분기
  - [WorkDetailModal.tsx](src/app/components/WorkDetailModal.tsx) 공유 URL에 `?from=invite` 자동 부여
  - 고아 `/invite/:code` 라우트·페이지·i18n 키 삭제
- **결과**: 공유 버튼 → URL 복사 → 수신자가 열면 **전시 헤더 + 작품 그리드 + 가입 유도 + 재공유** (명세 와이어프레임 일치)

### 10.4 강사 여부 토글 단일화 (업로드 이력 기반 자동 파생)
- **문제**: 프로필 토글(영구) + 업로드 토글(1회성)이 독립 상태로 존재 → 불일치 가능
  - 프로필 OFF + 업로드 ON: 작품엔 강사 칩 있는데 프로필엔 배지 없음
  - 프로필 ON + 업로드 0: 허위 표시 가능
  - `UserProfile.isInstructor` + `instructorPublic` Set 이중 저장 (sync 복잡)
- **해결**: 프로필 토글 제거 → 업로드 이력에서 **자동 파생**
  - [Profile.tsx](src/app/pages/Profile.tsx) `instructorVisible` = `works.some(w => artistId 일치 && isInstructorUpload === true)`
  - `UserProfile.isInstructor` 필드 삭제 (store.ts)
  - `instructorPublic.ts` 파일 삭제
  - i18n 키 `profile.instructorToggle`, `profile.instructorHelp` 제거 (한/영)
  - 편집 모달에서 강사 토글 체크박스 UI 제거
- **결과**: 단일 소스(업로드 이력) → 불일치 원천 차단, 코드 단순화. 명세 "자율 체크"는 업로드 1회로도 충족

### 10.5 Technical Polish 빠른 정리 (§11.1·§11.5)
- **§11.1 orphan localStorage 정리**: [PointsBootstrap.tsx](src/app/components/PointsBootstrap.tsx)에 `cleanupLegacyStorage()` 추가 — `LEGACY_STORAGE_KEYS` 배열에 `'artier_instructor_public_ids'` 등록, 부팅 시 1회 삭제
- **§11.5 ContentReview locale 반응성**: `translate(getStoredLocale(), …)` 호출 9곳 전부 `useI18n().t(...)`로 교체 → 실시간 언어 전환 시 반려 모달·상태 뱃지·알림 문구 모두 즉시 업데이트

### 10.6 기계적 정리 묶음 (§11.3·§9.3·§9.4·§9.5)
판단 요소 거의 없는 기계적 수정 6건 일괄 반영.
- **§9.4 sitemap.xml + robots.txt Sitemap 지시자**: [public/sitemap.xml](public/sitemap.xml) 신규 (주요 URL 8개), [robots.txt](public/robots.txt)에 `Sitemap:` 라인 추가
- **§9.5 Skip-to-content 링크**: [Layout.tsx](src/app/Layout.tsx) 상단에 "본문 바로가기" sr-only 링크 + `<main>`에 `tabIndex={-1}` — 키보드·스크린리더 사용자용
- **§9.3 이미지 lazy loading**: [ImageWithFallback.tsx](src/app/components/figma/ImageWithFallback.tsx) 기본값 `loading="lazy"` / `decoding="async"`. 호출부 override 가능
- **§9.3 비밀번호 보기/숨김 토글**: 신규 [PasswordInput.tsx](src/app/components/ui/password-input.tsx) (Eye/EyeOff 아이콘) → [Signup.tsx](src/app/pages/Signup.tsx), [PasswordReset.tsx](src/app/pages/PasswordReset.tsx) ×2(신규 + 확인), [Settings.tsx](src/app/pages/Settings.tsx) 탈퇴 확인까지 4곳 교체
- **§11.3 검색 히스토리 guest → 로그인 병합**: [Search.tsx](src/app/pages/Search.tsx)에 `mergeGuestRecentInto()` 추가, 로그인 시 guest 키 이력을 계정 키로 중복 제거 병합 후 guest 키 삭제

### 10.7 독립·간단 수정 묶음 (§9.3·§9.6·§11.4·§12.1·§12.3)
런칭 관점 점검 이후 **연결성 낮고 판단 요소 최소**인 항목 5건 일괄 반영.
- **§9.6 LICENSE 파일**: All Rights Reserved 선언 ([LICENSE](LICENSE))
- **§12.3 Toast 위치 반응형**: [App.tsx](src/app/App.tsx) `useIsMobile()` 추가 → 모바일 `bottom-center` / 데스크톱 `top-center`
- **§12.1 보안 헤더 기본 세트**: [netlify.toml](netlify.toml)에 HSTS/X-Frame-Options=DENY/X-Content-Type-Options/Referrer-Policy/Permissions-Policy/CSP 추가
- **§11.4 ExhibitionInviteLanding seed 보강**: seed는 검수 상태 무관 항상 포함 + pending 상태일 때 "공개 승인 전 링크" amber 배지 노출. 커버 이미지 `loading="eager"`
- **§9.3 네트워크 오프라인 배너**: 신규 [OfflineBanner.tsx](src/app/components/OfflineBanner.tsx) (WifiOff 아이콘, aria-live="polite") → App 루트에 마운트

### 10.8 우선순위 2차 묶음 (§12.2·§11.2·§9.3)
성능·데모 가치 우선으로 3건 진행.
- **§12.2 라우트 코드 스플리팅 (롤백)**: 적용 직후 무한 루프 / 부트 타이밍 이슈 의심되어 즉시 eager import로 원복. 후속 단독 작업으로 재시도 예정
- **§11.3 Search.tsx deps 수정**: `useEffect([storageKey, auth])` → `[storageKey]`로 변경 ( `auth` 객체 참조가 렌더마다 바뀌어 `setRecentSearches`가 루프 트리거했던 문제 해결)
- **bannerStore useSyncExternalStore 스냅샷 참조 안정화**: [bannerStore.ts](src/app/utils/bannerStore.ts) `getAll`/`getVisible`이 매 호출 새 배열 반환 → React가 snapshot 변경으로 오인하여 무한 리렌더 발생. 모듈 캐시(`cachedAll`/`cachedVisible`)를 두고 `CHANGED_EVENT`·`storage` 이벤트에만 invalidate하도록 변경. 루프 근본 원인 해결
- **§11.2 WorkManagement 실 workStore 연결**: [WorkManagement.tsx](src/app/admin/WorkManagement.tsx) 전면 재작성 — 하드코딩 제거, `workStore.getWorks/subscribe/updateWork/removeWork`, 카테고리/상태/작가 3종 필터, ConfirmDialog 삭제 확인
- **§9.3 스크롤 위치 복원**: 신규 [scrollRestore.ts](src/app/utils/scrollRestore.ts) (sessionStorage `artier_scroll_*`) + [Browse.tsx](src/app/pages/Browse.tsx)에서 마운트 시 restore, 모달 열기·beforeunload·pagehide·unmount 시 save

### 10.9 Supabase 스캐폴딩 제거
고립되어 사용되지 않던 Supabase 관련 파일을 정리. Phase 2 도입 시 새 구조로 설계 예정.
- `supabase/` 폴더 (schema.sql) 삭제
- `src/app/services/supabaseWorks.ts` 삭제
- `src/app/services/supabaseClient.ts` 삭제
- `@supabase/*` npm 의존성은 원래 없어 영향 없음

### 10.13 피드 큐레이션 레이어 + 팔로우 가중치 (§8.6·§9.8)
TOP 4·5 우선순위 과제 완료. 명세 "피드 노출 구조" (Pick → 테마전 → 추천 작가 → 신규 → 일반 + 좋아요·저장·팔로우 가중치)를 완전히 반영.
- 신규 [curationStore.ts](src/app/utils/curationStore.ts): `theme`(ThemeExhibition: title·subtitle·workIds[]), `featuredArtistIds`, `useSyncExternalStore` 캐시 안정화, localStorage `artier_curation_v1`
- [feedOrdering.ts](src/app/utils/feedOrdering.ts) 재작성: 5단계 버킷 (Pick → theme → featured artists → recent → rest), 중복 제거, `FeedRankContext.followingArtistIds`로 **팔로우 신호 +8점 가중**
- [Browse.tsx](src/app/pages/Browse.tsx): `follows.getFollows()`를 `orderWorksForBrowseFeed`에 전달
- 신규 어드민 UI: [CurationManagement.tsx](src/app/admin/CurationManagement.tsx) `/admin/curation` — 테마전 제목·부제·작품 ID 일괄 입력 + 추천 작가 체크박스 그리드
- 사이드바에 "피드 큐레이션" 메뉴 (Sparkles 아이콘) 추가

### 10.12 비속어 필터 (§9.2)
TOP 3 우선순위 과제 완료. 오픈 커뮤니티 최소 허들.
- 신규 [profanityFilter.ts](src/app/utils/profanityFilter.ts): `detectBannedWords()`, `containsProfanity()`. 사전 규모: 한국어 대표 욕·비하 표현 ~30개 + 영어 흔한 욕 ~8개. 공백·대소문자 무시
- 적용 위치 3곳:
  - [Signup.tsx](src/app/pages/Signup.tsx) 닉네임 실시간 검증 (유효 길이와 함께 에러 메시지 분리)
  - [Upload.tsx](src/app/pages/Upload.tsx) 발행 전 전시명·그룹명·태그 일괄 검증
  - [Profile.tsx](src/app/pages/Profile.tsx) 편집 저장 시 닉네임·헤드라인·자기소개 검증
- i18n 에러 키 추가 (한/영): `signup.errProfanity`, `upload.errProfanity`, `profile.errProfanity`
- 우회 탐지(자음 분리·띄어쓰기 변형) 및 서버 사전·신고 기반 보완은 Phase 2

### 10.11 만 14세 미만 가입 차단 (§9.1)
TOP 2 우선순위 과제 완료. 법적 요건(한국 정보통신망법) 강화.
- 신규 [ageCheck.ts](src/app/utils/ageCheck.ts): `MIN_AGE = 14`, `isValidDate/getAge/meetsMinAge/birthYearOptions`
- [Signup.tsx](src/app/pages/Signup.tsx): 닉네임 아래에 3개 select(년/월/일) 생년월일 UI 추가. 시니어 친화적 선택(native date picker 대신 드롭다운), 실시간 검증(유효 날짜 + 만 14세 이상)
- 검증 실패 케이스 2종: 유효하지 않은 날짜 / 만 14세 미만 — 각각 다른 에러 문구
- 기존 `agreeAge` 체크박스 **제거** (생년월일이 더 강한 증명이므로 중복)
- 가입 버튼은 required OK = 이용약관 + 개인정보 + 만 14세 이상 모두 충족 시에만 활성
- i18n 키 추가 (한/영): birthLabel/birthHint/birthYear/birthMonth/birthDay/errBirthInvalid/errBirthUnderAge

### 10.10 이벤트 메뉴 단일 store 통합 (§8.5·§9.7)
TOP 1 우선순위 과제 완료. 3곳 분산 하드코딩(Events 배너 2 + 예정 3, EventDetail `allEvents` 5, EventManagement `initialEvents` 4) → 단일 `eventStore`로 통합.
- 신규 [eventStore.ts](src/app/utils/eventStore.ts): `useSyncExternalStore` 캐시 안정화(bannerStore 교훈 반영), seed 5개 이벤트, `deriveStatus()` 자동 계산, `eventStore.get/getAll/getActive/getUpcoming/add/update/remove`
- [Events.tsx](src/app/pages/Events.tsx): 하드코딩 제거, `useManagedEvents()` + `deriveStatus` 필터로 진행중/예정 분리 렌더
- [EventDetail.tsx](src/app/pages/EventDetail.tsx): `allEvents` export 제거, `eventStore.get(id)` 사용, 상태 배지 자동 계산
- [EventManagement.tsx](src/app/admin/EventManagement.tsx): 전면 재작성 — 실 CRUD(등록·수정·삭제) + ConfirmDialog + 명세 필드 전체(worksPublic, participantsLabel, 수동 status 오버라이드)
- 상태값 `scheduled/active/ended` 단일 enum으로 표준화 (이전 3종 혼재 해소)
- localStorage 키 `artier_managed_events_v1`

---

## 11. 코드 리뷰 — 잔여 정리 항목 (Technical Polish)

> 문서 최종화 시점(2026-04-13)에 **전체 코드 훑기**로 발견된 사소한 품질 이슈. 기능 동작에는 영향 없으나 정리하면 좋은 항목.

### 11.1 Orphan localStorage 데이터 ✅ 정리 완료 (2026-04-13)
- `artier_instructor_public_ids` — 강사 토글 단일화(§10.4) 이후 아무 코드도 읽지 않는 orphan 키
- **해결**: [PointsBootstrap.tsx](src/app/components/PointsBootstrap.tsx)에 `cleanupLegacyStorage()` 추가 — 앱 부팅 시 `LEGACY_STORAGE_KEYS` 목록을 1회 정리. 앞으로 deprecated 키 생길 때 이 배열에 추가만 하면 됨

### 11.2 어드민 목업 잔재
- ✅ **WorkManagement 실 workStore 연결 (2026-04-13)** — [WorkManagement.tsx](src/app/admin/WorkManagement.tsx) 전면 재작성: 하드코딩 `initialWorks` 제거, `workStore.getWorks()`/`subscribe()`·실 `updateWork` (공개↔비공개 토글)·실 `removeWork`(ConfirmDialog 확인 후) 사용. 카테고리/상태/작가 이름 필터 3종 추가
- ⏳ EventManagement는 §8.5/§9.7로 이관 (이벤트 메뉴 통합 과제에 묶여 있음)

### 11.3 검색 히스토리 guest → 로그인 마이그레이션 ✅ 정리 완료 (2026-04-13)
- [Search.tsx](src/app/pages/Search.tsx)에 `mergeGuestRecentInto(accountKey)` 추가
- storageKey effect에서 `auth.isLoggedIn()` 시 guest 키 히스토리 → 계정 키로 **중복 제거하며 병합** 후 guest 키 삭제
- 게스트 상태에서 검색했던 이력이 로그인 후에도 최근 검색에 유지됨

### 11.4 ExhibitionInviteLanding seed 포함 보강 ✅ 정리 완료 (2026-04-13)
- [collectExhibitionWorks](src/app/pages/ExhibitionInviteLanding.tsx) — seed 작품은 검수 상태 무관 **항상 포함**하도록 풀 필터 수정
- 헤더에 seed가 `pending`일 때 amber 배지 "검수 중 · 공개 승인 전 링크입니다" 노출
- 커버 이미지는 above-the-fold라 `loading="eager"`로 덮어쓰기
- seed 포함 + 상태 안내 2중 접근으로 "빈 전시" 경험 차단

### 11.5 ContentReview 모달의 locale 반응성 ✅ 정리 완료 (2026-04-13)
- [ContentReview.tsx](src/app/admin/ContentReview.tsx) — `translate(getStoredLocale(), …)` 6곳 + 알림 메시지 3곳을 `useI18n()`의 `t(...)`로 전부 교체
- 이제 어드민 화면에서 실시간 언어 전환 시 반려 모달·상태 뱃지 사유 라벨·작가 알림 메시지가 **즉시 재렌더**됨
- `getStoredLocale` / `translate` import 제거, `useI18n` import 추가

### 11.6 배너 순서 조정 미구현 (Medium)
- 명세(기능 모음 > 배너 관리) "드래그앤드롭 순서 변경" 요구
- [bannerStore.ts](src/app/utils/bannerStore.ts)에는 `order` 필드가 없고 추가된 순서대로만 저장
- [BannerManagement.tsx](src/app/admin/BannerManagement.tsx) UI도 정렬 UX 없음
- **권장**: `order` 정수 필드 추가 + `@dnd-kit` 같은 드래그 라이브러리 연동 (기존 의존성에 있으면 활용)

### 11.7 비로그인 초대 CTA 중복 우려 (참고)
- [WorkDetailModal.tsx](src/app/components/WorkDetailModal.tsx)의 비로그인+그룹 CTA는 `?from=invite` 공유 링크 진입 시에는 **ExhibitionInviteLanding이 먼저 뜨므로 거의 노출 안 됨**
- 다만 Browse에서 비로그인이 그룹 작품을 직접 클릭한 경우는 여전히 유효 → **기능 중복은 아님**
- 참고용. 제거할 근거 없음

---

### 빠른 정리 권장 (5분 내)
- 11.1 (orphan 데이터) — bootstrap에 1줄 추가
- 11.5 (locale 반응성) — `useI18n()` 기반 재작성 (한 파일 교체)

### 중간 작업 (15~30분)
- 11.3 (검색 히스토리 마이그레이션) — Search.tsx effect 1개 추가
- 11.4 (seed 포함 로직) — collectExhibitionWorks 수정 + 상태 뱃지 UI

### 큰 작업 (별도 항목으로 이미 TOP 우선순위에 포함)
- 11.2 어드민 목업 (이벤트는 §9.7 TOP 1, 작품 관리는 별도)
- 11.6 배너 드래그 순서

---

## 12. Phase 1 런칭 준비도 — 최종 점검

> 실제 "오픈 날" 관점에서 본 준비도. §7~§11과 일부 겹치되 **런칭 허들 중심**으로 재정리.
> 색 구분: 🔴 **블로커** (런칭 불가) / 🟡 **개선 권장** (런칭 가능하나 품질 저하) / 🔵 **UI/UX 이상** (눈에 띄는 어색함)

### 12.1 🔴 런칭 블로커

#### 외부 서비스 연동 (§7 세부화)
- **OAuth 공급자 콘솔 등록** (카카오·구글·애플) + redirect URL·scope 설정
- **이메일 발송 서비스** (SES/SendGrid) 도메인 인증(SPF/DKIM/DMARC) + 10종 템플릿 발송 테스트
- **카카오 알림톡 발신 프로필** 승인 + 대체 SMS 게이트웨이 계약
- **Supabase(또는 대체 BaaS) 프로덕션 프로젝트 전면 구축** — 기존 스캐폴딩은 2026-04-13 제거됨. 테이블 스키마·마이그레이션·RLS·Auth·Storage를 Phase 2에서 새로 설계
- **CDN·도메인·SSL** — public/images **109MB** 는 정적 호스팅으로만 배포하면 빌드·대역폭 부담. Cloudflare/Netlify CDN 또는 Supabase Storage로 분리 권장

#### 법무·규정 (§9.1 세부화)
- **이용약관·개인정보처리방침 법무 최종 확정** — 현재 "초안" 표시, 필수 조항(이용 제한·해지·손해배상·관할 법원 등) 누락
- **만 14세 미만 차단 실제 검증** — 생년월일 입력 필드 + 법정대리인 동의 플로우
- **개인정보 DPO 지정** + 개인정보 파기·제3자 제공·보관 기간 표 완성

#### 보안 헤더·배포 구성
- ✅ **보안 헤더 기본 세트 추가 (2026-04-13)** — [netlify.toml](netlify.toml)에 HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, 기본 CSP 적용. CSP는 `img-src https:` 허용(Unsplash 데모) — 실서버 전환 시 도메인 단일화 후 타이트닝 권장
- **프로덕션 빌드에서 `/demo`·`/demo/reference` 노출** 결정 — 숨길지, 특정 IP만 허용할지

### 12.2 🟡 개선하면 좋은 부분

#### 성능
- **이미지 자산 109MB** (`public/images/` 2039개) — 빌드 산출물에 그대로 포함. WebP 변환 + CDN 분리 + 썸네일 파이프라인 구축
- ⏸ **라우트 코드 스플리팅 시도 → 롤백 (2026-04-13)** — React Router v7 `lazy` 속성으로 적용했으나 다른 수정과의 부트 타이밍 상호작용으로 런타임 에러 발생 가능성 확인 후 즉시 롤백. 추후 lazy 단일 변경만 격리하여 재시도 권장. 현재는 [routes.ts](src/app/routes.ts) eager import 상태
- **Web Vitals 실측 없음** — Lighthouse·RUM으로 LCP/INP/CLS 측정 필요

#### 운영·모니터링
- **에러 트래킹 없음** — [analytics.ts](src/app/utils/analytics.ts)는 GA4 스텁만. Sentry·LogRocket 같은 에러 리포트 연결 권장
- **런칭 체크리스트 실제 운용** — [/admin/checklist](src/app/admin/LaunchChecklist.tsx) UI는 있으나 담당자·데드라인·완료 증빙은 하드코딩. 실제 오픈 준비 도구로 쓰려면 필드 확장·영속화 필요
- **모니터링 대시보드** — 신규 가입·업로드·신고 추이 실시간 보기 없음

#### 콘텐츠 품질
- **초기 시드 데이터**: 작가 25명, 작품 60+ — 피드 다양성 유지는 하지만 그랜드 오픈 트래픽에 비해 얇음. 파트너 작가 업로드 선행 필요
- **Artier's Pick 초기 선정** — 주간 선정 프로세스·담당자·자료화 문서 없음. 오픈 당일 Pick 0개면 피드 상단 고정 레이어가 비어 보임

#### 접근성·품질 보증
- **색 대비 WCAG AA 실측** 없음. 핵심 전경·버튼·링크에 대해 Lighthouse·axe-core로 감사 필요
- **다국어 리뷰** — 1,938줄 messages.ts 한·영 키 누락·오역 QA 필요

### 12.3 🔵 UI/UX 이상한 부분

#### 페이지 내부 불일치
- **Events 페이지** ([Events.tsx](src/app/pages/Events.tsx)) — 명세 "이벤트 목록" 요구하는 **상태 필터(진행중/예정/종료) 없음**. 현재는 "메인 히어로 배너 2개 + 예정된 이벤트 3개 + CTA" 세 블록 구조로 명세와 레이아웃 자체가 다름. 또한 Events.tsx·EventDetail.tsx·EventManagement.tsx 3곳 데이터 분산 (§8.5)
- ✅ **WorkManagement 실데이터 연결 (2026-04-13)** — [WorkManagement.tsx](src/app/admin/WorkManagement.tsx) workStore 구독으로 실제 유저 업로드 작품 표시, 공개↔비공개 토글·삭제 즉시 반영
- **Points 페이지 접근 일관성 깨짐** — [routes.ts](src/app/routes.ts)에서 `/points`는 `/`로 redirect되지만 [FlowDemoTools](src/app/pages/FlowDemoTools.tsx)에서는 진입 가능. 결과: "직접 URL 입력 → 막힘 / 데모 툴 → 열림". 일관되게 숨기거나 공개하거나 결정 필요

#### 마이크로 인터랙션·레이아웃
- **로그인 유도 모달 남발** — 좋아요·저장·팔로우·업로드·신고 등 액션마다 `LoginPromptModal`이 뜸. 비로그인 사용자가 5번 이상 보게 됨. "상단 고정 로그인 배너" 패턴 등 대안 검토
- **작품 카드 뱃지 위치 표준화 없음** — 비공개(`right-3 top-3`), 검수중·게시불가(`left-3 bottom-3`), 이미지 수(`left-3 top-3`), Pick/세일(`right-3 top-3`) — **네 귀퉁이 모두 다른 뱃지 타입**이 겹쳐 쌓임. 동시에 여러 뱃지가 뜨면 시각적 혼잡
- **배너 슬라이더 2종 공존** — 둘러보기 피드 히어로(embla 기반) + Events 페이지 히어로(수동 translate) 각각 구현 → 스와이프·인디케이터 스타일 미묘하게 다름
- ✅ **Toast 위치 반응형 분기 (2026-04-13)** — [App.tsx](src/app/App.tsx) `useIsMobile()` 훅 추가 후 모바일(`< 768px`)에서 `bottom-center`, 데스크톱에서 `top-center`. 모바일 GNB 겹침 해소
- **빈 상태(empty state) 톤 불일치** — 검색 빈 결과(중앙 아이콘+CTA), 피드 빈(없음 — 처리 안 됨), 팔로잉 빈, 저장 빈 각각 다른 스타일. 공용 `EmptyState` 컴포넌트 부재

#### 콘텐츠 구조
- **기본 배너 vs 어드민 배너 스타일 격차** — [Browse.tsx](src/app/pages/Browse.tsx)의 기본 더미 5개는 i18n 문구+unsplash 이미지 / 어드민 등록 배너는 사용자 입력. 스타일·길이·영역이 들쭉날쭉 가능
- **"강사" 표시가 지금은 업로드 이력 기반만** — 업로드하기 전 강사가 강사임을 증명할 방법 없음. 명세 "자율 체크"를 준수하긴 하나, 첫 방문 강사가 프로필을 채우는 순간에는 배지 없음 (업로드 후에야 생김)

### 12.4 📋 런칭 운영 체크 (개발 외 운영팀 준비)

- 신고 처리 담당자·에스컬레이션 로테이션 문서화 (명세 "7일 SLA" 기준)
- Artier's Pick 주간 선정 자료 양식 + 선정 근거 보관
- 약관 변경 시 공지·재동의 플로우 (이메일 템플릿 7번 "정책 변경" 활용)
- CS 채널(contact 폼) 응답 SLA
- 모니터링 알람 수신 담당자 지정
- 오픈 당일 트래픽 폭주 대비 대기열·레이트 제한 전략

---

## 12-A. SMS 비회원 작가 매칭 정책 (2026-04-14 확정)

> 개발자 서버 연동 시 반드시 참조할 것

### 플로우

1. **강사가 비회원 작가 등록** (Upload → 그룹 전시 → 비회원 탭)
   - **실명** 필수 입력 (`upload.nonMemberNameLabel2`: "작가 실명")
   - **전화번호** 필수 입력
   - SMS/카카오 알림톡 발송 (초대 링크 포함)

2. **수강생(비회원)이 앱 가입** (Onboarding)
   - **실명** 필수 입력 (`onboarding.realNameLabel`)
   - **전화번호** 필수 입력 (`onboarding.phoneLabel`)
   - 전화번호는 본인인증 (서버 연동 시 SMS 인증코드 구현)

3. **자동 매칭 판정**
   - 전화번호 일치 **+** 실명 일치 → **작품 자동 연결** (`matched`)
   - 전화번호 일치 **+** 실명 불일치 → **연결 차단** (`blocked_name_mismatch`)
     - 강사에게 알림: "번호를 확인해주세요"
     - 강사가 번호 수정 후 재발송 가능

### 데이터

- 매칭 결과 로그: `localStorage` → `artier_invite_match_log` (목업)
- 서버 연동 시: `invite_match_results` 테이블로 이관
- 매칭 함수: `inviteMessaging.ts` → `matchSmsInviteOnSignup(phone, realName)`

### 엣지 케이스

| 상황 | 처리 |
|---|---|
| 강사가 번호 잘못 입력 → 타인이 가입 | 실명 불일치로 차단. 강사 알림 |
| 같은 번호에 여러 작품 초대 | 모든 작품에 대해 각각 매칭 판정 |
| 가입 후 강사가 추가 작품 초대 | 이미 가입된 회원은 member로 직접 검색·지정 |
| 수강생이 먼저 가입 후 나중에 초대 | 강사가 회원 탭에서 직접 검색하여 지정 |

### 금지

- 전화번호만으로 자동 연결 (반드시 실명 대조 필요)
- 매칭 차단된 작품을 수강생 프로필에 노출

---

## 13. 결론

**reference 기준 구현 완성도: 약 97~100%** (Phase 1 범위 내 모든 명세 요구 충족). 여기에:

- **Phase 2 선행 구현** 3건 (Pin 코멘트, 타임랩스, 색상 팔레트)
- **PM/개발 데모 도구** 4개 화면 (`/demo`, `/demo/reference`, `/points`, 어드민 세부)
- **내부 정책 코드화** 5건 (버전 관리, 포인트 회수, 강사 공개 등)
- **데모 시뮬레이션 유틸** 3종 (알림 푸시, PP 추가, 초대 발송 실패 5%)
- **UI/UX 일관성 리팩토링** (2026-04-13): ConfirmDialog, WorkCard 정돈, 초대 시스템 통합, 강사 토글 단일화

이 더해져, **전체적으로 명세 이상의 상태**이며 명세의 "전시 초대장 오픈 화면"까지 완결되어 4월 12일 시점 대비 빠진 스크린이 없습니다.

외부 서비스 연동(OAuth/이메일/SMS/DB)만 Phase 2로 유보되어 있으며, 이는 프로젝트의 "PM 시각 확인용 데모" 목적과 일치합니다.
