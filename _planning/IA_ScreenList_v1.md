# Artier — IA & 화면 목록 v1.0

> **v1.0 변경 요약 (2026-04-19)**:
> - 최초 작성. 기존 `CURRENT_SPEC.md §2·§3` 라우트·화면 정보를 단일 소스로 재구조화.
> - README.md 화면 ID 체계(`USR-<영역>-<번호>` / `ADM-<영역>-<번호>`) 전면 채택.

**작성일**: 2026-04-19
**버전**: v1.0
**근거**: `CURRENT_SPEC.md v2026-04-19`, `src/app/` 역공학
**상위 참조**: [README.md](README.md) (문서 규약·ID 체계)
**본 문서의 목적**: Artier 서비스의 모든 화면을 단일 번호 체계로 정리. 이후 `PRD_User_v1.md` · `PRD_Admin_v1.md`는 이 목록에 등장하는 화면 ID만 사용한다.

---

## 0. 문서 읽는 법

### 0.1 대상 플랫폼

Artier Phase 1은 **웹 단일 플랫폼**이다. 네이티브 앱 래퍼 없음.

- **사용자 앱**: 모바일 우선(375px 기준) · 데스크톱 반응형. 루트 `/` 트리.
- **운영 어드민**: 데스크톱 우선(1280px 기준). `/admin` 하위.
- **인증·온보딩**: 독립 레이아웃(헤더·푸터 없음). `/login`·`/signup`·`/onboarding` 등.

### 0.2 다국어 전제

UI 기본 언어는 한국어(KO)이며 영어(EN) 전환 지원. 모든 문자열은 `useI18n()` 경유.
한국 사용자는 전화번호 `+82`로 판별하여 SMS·카카오 알림톡 대상. 그 외 지역은 이메일 중심.

### 0.3 이 문서의 범위

- 화면 ID 체계 정의 (§1)
- 사용자 앱 모든 화면 (§2)
- 운영 어드민 모든 화면 (§3)
- 공통 팝업·다이얼로그 (§4)
- Phase 1 · Phase 2 우선순위 (§5)
- 해소된 결정 · 열린 항목 (§6)

---

## 1. 화면 ID 체계

### 1.1 트랙 접두어

| 접두어 | 트랙 | 대상 사용자 |
|---|---|---|
| **USR-** | 사용자 앱 | 시니어·중장년 작가, 감상자 |
| **ADM-** | 운영 어드민 | 운영팀(Operator 권한) |

Phase 1은 이 2트랙 구조만 다룬다. Phase 2에서 외부 주최자·파트너 작가 포털 등이 추가되면 새 접두어(`PTN-`·`EVT-` 등)를 신설한다.

### 1.2 사용자 앱 섹션 코드 (USR-)

| 코드 | 영역 | 포함 기능 |
|---|---|---|
| **AUT** | 인증·온보딩 | 스플래시, 로그인, 가입, 온보딩, 비밀번호 재설정, 정지 안내 |
| **BRW** | 둘러보기 | 홈 피드, 탭(전체/혼자/함께), 배너 캐러셀, 무한 스크롤 |
| **EXH** | 전시·작품 상세 | 전시 상세 모달, 큐레이션 전시, 초대장·공유 랜딩 |
| **UPL** | 업로드 | 업로드 유형 선택, 이미지·작가·메타 입력, 전시 완료 확인 |
| **PRF** | 프로필 | 본인/타인 프로필, 6개 탭(전시/내 작품/좋아요/저장/초안/수강생작품) |
| **EVT** | 이벤트 | 이벤트 목록, 이벤트 상세, 이메일 구독 |
| **SRC** | 검색 | 실시간 검색, 자동완성, 최근 검색어 |
| **NTF** | 알림 | 알림 센터, 필터, 읽음/삭제 |
| **STG** | 설정 | 계정·알림·글꼴·비밀번호 변경·탈퇴 |
| **INF** | 공지·약관·문의 | 소개, FAQ, 공지, 약관, 개인정보처리방침, 문의 |

### 1.3 운영 어드민 섹션 코드 (ADM-)

| 코드 | 영역 | 포함 기능 |
|---|---|---|
| **DSH** | 대시보드 | 블로커 요약, 체크리스트·이슈·파트너·작품 수 지표 |
| **REV** | 콘텐츠 검수 | 작품 `pending` → `approved`/`rejected` 판정, 반려 사유 4종 |
| **PCK** | Pick 관리 | Artier's Pick 선정(최대 10개, 주 단위 교체), 이력 배지 영구화 |
| **CUR** | 기획전 관리 | 여러 전시를 주제로 엮는 공개 컬렉션 + 추천 작가 토글 |
| **BNR** | 배너 관리 | 홈 히어로 배너 CRUD(최대 5개), DnD 순서, 기간 자동 만료 |
| **EVT** | 이벤트 관리 | 이벤트 CRUD, 상태 자동·수동, 참여자 현황 |
| **RPT** | 신고 처리 | 신고 큐, 4액션(삭제/경고/기각/비공개) |
| **MBR** | 회원 관리 | 정지 4단계(주의/7일/30일/영구), 자동 승격 |
| **WRK** | 작품 관리 | 공개·비공개 토글, 직접 삭제 |
| **PTN** | 파트너 작가 | 파트너 5단계(후보→활성), 제출 상태 추적 |
| **CKL** | 런칭 체크리스트 | 17항목 5카테고리, 상태·기한 관리 |
| **ISU** | 미결 이슈 | 이슈 큐, 우선순위 4단계 |

### 1.4 화면 카드 포맷

각 화면은 아래 정보를 담는다. 상세 UI·수용 기준은 `PRD_User_v1.md` / `PRD_Admin_v1.md`로 이관되며, 본 문서는 **무엇이 있는지**만 정의한다.

```
### [ID] · [화면 이름]
- 경로: [URL 또는 진입 동선]
- 컴포넌트: [src/app/... 경로]
- 구성: [이 화면이 포함하는 주요 UI 블록]
- 연결: [이동 가능한 다음 화면 또는 모달 ID]
- 엔티티·정책: [관련 데이터 모델 / Policy 섹션 / SystemArch 섹션]
- 우선순위: [P0 / P1 / P2]
```

### 1.5 우선순위 플래그

| 플래그 | 의미 |
|---|---|
| **P0** | 런칭 필수. 이 화면 없이 서비스가 동작하지 않음. |
| **P1** | 런칭 권장. 런칭 후 1~3개월 내 도입. |
| **P2** | 로드맵. Phase 2 이후. |

---

## 2. Track 1 — 사용자 앱 (USR)

### 2.1 USR-AUT · 인증·온보딩

#### USR-AUT-01 · 스플래시
- 경로: 앱 진입(세션·부트스트랩 체크 중) → 이 화면
- 컴포넌트: [`src/app/components/SplashScreen.tsx`](src/app/components/SplashScreen.tsx)
- 구성: 로고, 페이드 인/아웃, `artier_splash_seen` 플래그로 첫 진입만 표시
- 연결: `/` (USR-BRW-01) 또는 로그인 세션 없음 시 `/login` (USR-AUT-02)
- 엔티티·정책: 없음(로컬 상태만)
- 우선순위: **P0**

#### USR-AUT-02 · 로그인
- 경로: `/login`
- 컴포넌트: [`src/app/pages/Login.tsx`](src/app/pages/Login.tsx)
- 구성: 소셜 로그인 3종(카카오/구글/애플, 언어별 순서 변경), 이메일 로그인(접기·펼치기), 비밀번호 재설정 링크, 만 14세 이상 고지
- 연결: USR-AUT-05(소셜 최초 가입) · USR-AUT-06(온보딩) · USR-AUT-04(비밀번호 재설정) · USR-AUT-07(정지 계정) · `redirect` 파라미터(내부 경로만)
- 엔티티·정책: `auth` · [Policy §2 가입/인증](Policy_v1.md#2-가입인증-정책)
- 우선순위: **P0**
- 비고: 정지 계정 감지 시 사유·이의제기 링크 표시 후 차단. `redirect`는 `/`로 시작하는 내부 경로만 허용.

#### USR-AUT-03 · 회원가입
- 경로: `/signup`
- 컴포넌트: [`src/app/pages/Signup.tsx`](src/app/pages/Signup.tsx)
- 구성: 3단계(이메일·비밀번호 → 닉네임·생년월일 → 약관 동의), 진행 표시바(1/3, 2/3, 3/3)
- 연결: USR-AUT-06(온보딩)
- 엔티티·정책: `UserProfile` · [Policy §2](Policy_v1.md#2-가입인증-정책)
- 우선순위: **P0**
- 비고: 비밀번호 8자+영문+숫자, 닉네임 2~20자 비속어 필터, 생년월일 만 14세 이상(`MIN_AGE=14`).

#### USR-AUT-04 · 비밀번호 재설정
- 경로: `/reset-password`
- 컴포넌트: [`src/app/pages/PasswordReset.tsx`](src/app/pages/PasswordReset.tsx)
- 구성: 이메일 입력 → 재설정 링크 발송(Phase 1 모의)
- 연결: USR-AUT-02
- 엔티티·정책: `auth`
- 우선순위: **P0**

#### USR-AUT-05 · 소셜 최초 가입 모달
- 경로: USR-AUT-02 → 소셜 인증 성공 + 기가입자 아님
- 컴포넌트: [`src/app/components/SocialSignupModal.tsx`](src/app/components/SocialSignupModal.tsx)
- 구성: 안내 문구, 약관 동의(전체/선택), 닉네임 입력
- 연결: USR-AUT-06
- 엔티티·정책: `artier_social_signed_up__<provider>` (kakao/google/apple)
- 우선순위: **P0**

#### USR-AUT-06 · 온보딩
- 경로: `/onboarding`
- 컴포넌트: [`src/app/pages/Onboarding.tsx`](src/app/pages/Onboarding.tsx)
- 구성: 3 Step(환영 → 프로필 설정(실명·닉네임·전화·이메일·프로필 이미지) → 완료). SMS 초대 가입 시 이름 자동 매칭 시도.
- 연결: USR-BRW-01(`/`), PendingInviteClaimGate 모달(이름 불일치 초대 재확인, §4)
- 엔티티·정책: `UserProfile` · [Policy §3 비가입자 초대](Policy_v1.md#3-비가입자-초대-정책)
- 우선순위: **P0**
- 비고: Step 1 완료 시 AP +30. `artier_pending_sms_invite` 플래그 소비.

#### USR-AUT-07 · 계정 정지 안내
- 경로: USR-AUT-02 → 정지 계정 감지
- 컴포넌트: `Login.tsx` 내부 분기(전용 라우트 없음)
- 구성: 정지 사유·기간, 이의제기(`USR-INF-07` 문의) 링크, 로그인 차단
- 연결: USR-INF-07
- 엔티티·정책: `accountSuspensionStore` · [Policy §12 신고·제재](Policy_v1.md#12-신고제재-정책)
- 우선순위: **P0**

---

### 2.2 USR-BRW · 둘러보기

#### USR-BRW-01 · 홈 피드
- 경로: `/` (별칭: `/browse` → `/` 리다이렉트)
- 컴포넌트: [`src/app/pages/Browse.tsx`](src/app/pages/Browse.tsx)
- 구성: 배너 캐러셀(어드민 배너 + 활성 이벤트, 자동 회전), 탭(전체/혼자 올리기/함께 올리기), 작품 카드 그리드(24개씩 무한 스크롤)
- 연결: USR-EXH-01(카드 탭 → 상세 모달), USR-PRF-01(작가 프로필), USR-AUT-02(비로그인 인터랙션 시도)
- 엔티티·정책: `Work`, `feedOrdering.ts`, `feedVisibility.ts` · [Policy §15 큐레이션·배지](Policy_v1.md#15-큐레이션배지-정책)
- 우선순위: **P0**
- 비고: `feedReviewStatus === 'approved'`만 노출 · `isHidden === true` 전시는 본인 프로필에서만 보임 · 이미 본 작품은 버킷 하단으로 밀림(`artier_feed_seen_work_ids`).

---

### 2.3 USR-EXH · 전시·작품 상세

#### USR-EXH-01 · 전시 상세 모달
- 경로: USR-BRW-01/USR-PRF-01/USR-SRC-01에서 카드 탭 → 오버레이 모달 · URL: `/exhibitions/:id` (ExhibitionRoute 기본 분기)
- 컴포넌트: [`src/app/components/WorkDetailModal.tsx`](src/app/components/WorkDetailModal.tsx), [`src/app/pages/ExhibitionRoute.tsx`](src/app/pages/ExhibitionRoute.tsx)
- 구성: 이미지 뷰어(좌우 네비), 작품 톤 배경(blur·scale·opacity), 전시명·그룹명·작가·설명, 좋아요/저장/팔로우/신고 액션, 공유(native share 또는 clipboard, `?from=work` 자동 부여)
- 연결: USR-PRF-01, USR-AUT-02, ReportModal(§4)
- 엔티티·정책: `Work`, `Interaction` · [Policy §10 공유](Policy_v1.md#10-공유-정책) · [Policy §11 카메라 사진 차단](Policy_v1.md#11-카메라-사진-차단-정책)
- 우선순위: **P0**
- 비고: 이미지별 인터랙션 없음(좋아요·저장·신고 모두 전시 단위). 우클릭·드래그 차단(`CopyrightProtectedImage`).

#### USR-EXH-02 · 큐레이션 전시 상세
- 경로: `/exhibitions/:id`(ExhibitionRoute 분기, 해당 전시가 운영팀 큐레이션일 때)
- 컴포넌트: [`src/app/pages/ExhibitionDetail.tsx`](src/app/pages/ExhibitionDetail.tsx)
- 구성: 커버, 제목·부제·설명·기간, 참여 작가, 좋아요/저장, 공유, 작품 그리드, 관련 전시
- 연결: USR-EXH-01, USR-PRF-01
- 엔티티·정책: `Curation` · [Policy §15 큐레이션](Policy_v1.md#15-큐레이션배지-정책)
- 우선순위: **P0**

#### USR-EXH-03 · 초대장 랜딩
- 경로: `/exhibitions/:id?from=invite` 또는 `?from=credited`
- 컴포넌트: [`src/app/pages/ExhibitionInviteLanding.tsx`](src/app/pages/ExhibitionInviteLanding.tsx)
- 구성: 초대 전용 레이아웃(커버·제목·참여 작가), 작품 그리드, 공유, 비로그인 시 가입 유도(전화번호·이름 프리필)
- 연결: USR-AUT-03, USR-EXH-01, USR-PRF-01
- 엔티티·정책: `Invite`, `artier_pending_sms_invite` · [Policy §3 비가입자 초대](Policy_v1.md#3-비가입자-초대-정책)
- 우선순위: **P0**

#### USR-EXH-04 · 작품 공유 랜딩
- 경로: `/exhibitions/:id?from=work`
- 컴포넌트: [`src/app/pages/ExhibitionWorkShareLanding.tsx`](src/app/pages/ExhibitionWorkShareLanding.tsx)
- 구성: 공유된 단일 작품 중심 미리보기, "앱에서 열기" CTA → 상세 모달, 공유
- 연결: USR-EXH-01
- 엔티티·정책: `Work`
- 우선순위: **P0**
- 비고: Phase 1은 정적 OG 대체 이미지. 동적 OG 생성은 Phase 2(§6.2 N-9).

---

### 2.4 USR-UPL · 업로드

#### USR-UPL-01 · 업로드 유형 선택
- 경로: 업로드 진입 시 상단 모달 (혼자/함께 중 선택 필수)
- 컴포넌트: [`src/app/pages/Upload.tsx`](src/app/pages/Upload.tsx) 내부 모달
- 구성: "혼자 올리기" / "함께 올리기" 2택 카드. 함께 선택 시 후속 역할 모달(참가자·강사).
- 연결: USR-UPL-02
- 엔티티·정책: `primaryExhibitionType` · [Policy §13 업로드 유형·역할](Policy_v1.md#13-업로드-유형역할-정책)
- 우선순위: **P0**

#### USR-UPL-02 · 업로드 (이미지·작가·메타 입력)
- 경로: `/upload` (딥링크: `?draft=<id>` 초안 복원 · `?event=<id>` 이벤트 연결 · `?edit=<workId>` 전시 수정)
- 컴포넌트: [`src/app/pages/Upload.tsx`](src/app/pages/Upload.tsx)
- 구성: 역할 뱃지(그룹 전시/그룹 전시(강사)), 이미지 1~10장(DnD 정렬, `@dnd-kit/sortable`), 커스텀 커버 별도 지정, 이미지별 작가 지정(회원 검색 or 비회원 이름+전화), 전시명·그룹명·작품명(각 20자), 이벤트 연결, 수동 초안 저장, 원작 확인 체크, 카메라 촬영 감지 배너
- 연결: USR-UPL-03(발행 성공), USR-PRF-01(초안에서 복원 시)
- 엔티티·정책: `Work`, `ImageArtistAssignment`, `Draft` · [Policy §8 초안 저장](Policy_v1.md#8-초안-저장-정책) · [Policy §9 작품명](Policy_v1.md#9-작품명-정책) · [Policy §11 카메라](Policy_v1.md#11-카메라-사진-차단-정책) · [Policy §13 업로드 역할](Policy_v1.md#13-업로드-유형역할-정책) · [Policy §14 커버 이미지](Policy_v1.md#14-커버-이미지-정책)
- 우선순위: **P0**
- 비고: 발행 시 `feedReviewStatus: 'pending'`, 신규 발행은 AP +20(첫 업로드 +100), 24시간 내 삭제 시 AP -20. 기존 전시 `?edit=` 진입은 AP 적립 없음·중복 이벤트 검증 스킵·비회원 초대 미발송.

#### USR-UPL-03 · 전시 완료 확인
- 경로: USR-UPL-02 → 발행 성공
- 컴포넌트: `Upload.tsx` 내부 확인 스크린
- 구성: "전시가 등록되었습니다" 타이틀, 검수 대기 안내, 비회원 초대 대기 안내(있을 때), CTA "내 전시 보기"/"둘러보기"
- 연결: USR-PRF-01 or USR-BRW-01
- 엔티티·정책: `Work.feedReviewStatus = 'pending'`
- 우선순위: **P0**

---

### 2.5 USR-PRF · 프로필

#### USR-PRF-01 · 프로필 홈
- 경로: `/profile`(내 프로필), `/profile/:id`(타인), `/me`(내 프로필 별칭), `/me/edit` → `/settings` 리다이렉트
- 컴포넌트: [`src/app/pages/Profile.tsx`](src/app/pages/Profile.tsx)
- 구성: 프로필 헤더(사진·이름·소개·바이오·지역·관심사·외부링크·강사 배지 자동), 편집 버튼(연필 아이콘·카메라 아이콘), 팔로워·팔로잉 모달 진입, 탭 그룹:
  - **공통(본인/타인)**: `exhibition` (전시)
  - **본인만**: `works` (내 작품), `likes` (좋아요), `saved` (저장), `drafts` (초안)
  - **강사일 때만**: `student-works` (수강생 작품)
- 연결: USR-UPL-02(`?edit=` 전시 수정), USR-EXH-01(카드 탭), USR-AUT-02
- 엔티티·정책: `UserProfile`, `Work`, `Draft`, `Follow`, `Interaction` · [Policy §4 탈퇴 작가](Policy_v1.md#4-탈퇴-작가-정책) · [Policy §13.3 강사 표시 파생](Policy_v1.md#13-업로드-유형역할-정책) · [SystemArch §7.2 업로드 플로우](SystemArchitecture_v1.md)
- 우선순위: **P0**
- 비고: 탭별 상세 규칙은 `PRD_User_v1.md` 참조. 강사 토글 UI 없음(작품 이력에서 자동 파생).

#### USR-PRF-02 · 프로필 편집 모달
- 경로: USR-PRF-01 헤더의 연필 아이콘
- 컴포넌트: [`src/app/components/ExternalLinksEditor.tsx`](src/app/components/ExternalLinksEditor.tsx) 등 Profile.tsx 내부 모달 컴포넌트
- 구성: 소개글, 바이오(200자), 지역, 관심사, 외부 링크 편집
- 연결: USR-PRF-01
- 엔티티·정책: `UserProfile`
- 우선순위: **P0**

#### USR-PRF-03 · 프로필 사진 모달
- 경로: USR-PRF-01 헤더의 카메라 아이콘
- 컴포넌트: [`src/app/components/ProfileImageModal.tsx`](src/app/components/ProfileImageModal.tsx)
- 구성: 사진 업로드/변경(5MB 이하), 크롭
- 연결: USR-PRF-01
- 엔티티·정책: `UserProfile.profileImage`
- 우선순위: **P0**

#### USR-PRF-04 · 팔로워·팔로잉 모달
- 경로: USR-PRF-01 헤더의 팔로워/팔로잉 숫자 탭
- 컴포넌트: `Profile.tsx` 내부 모달
- 구성: 팔로워/팔로잉 전체 목록, 팔로우/언팔로우 토글
- 연결: USR-PRF-01
- 엔티티·정책: `Follow` · [Policy §4 탈퇴 작가](Policy_v1.md#4-탈퇴-작가-정책)
- 우선순위: **P0**
- 비고: 자기 자신·탈퇴 작가 팔로우 불가.

---

### 2.6 USR-EVT · 이벤트

#### USR-EVT-01 · 이벤트 목록
- 경로: `/events`
- 컴포넌트: [`src/app/pages/Events.tsx`](src/app/pages/Events.tsx)
- 구성: 히어로 캐러셀(활성 이벤트, 5초 자동 회전), 활성/예정/종료 섹션, 이벤트 알림 구독 버튼(→ USR-EVT-03), 참여하기(→ USR-UPL-02 `?event=`)
- 연결: USR-EVT-02, USR-EVT-03, USR-UPL-02
- 엔티티·정책: `ManagedEvent`
- 우선순위: **P0**

#### USR-EVT-02 · 이벤트 상세
- 경로: `/events/:id`
- 컴포넌트: [`src/app/pages/EventDetail.tsx`](src/app/pages/EventDetail.tsx)
- 구성: 이벤트 배너·기간·대상·설명, "참여하기" CTA(종료 시 비활성), `worksPublic === true`일 때 참여 작품 목록
- 연결: USR-UPL-02(`?event=`)
- 엔티티·정책: `ManagedEvent`
- 우선순위: **P0**
- 비고: 동일 이벤트 중복 참여 차단.

#### USR-EVT-03 · 이벤트 알림 구독 모달
- 경로: USR-EVT-01 상단 버튼
- 컴포넌트: `Events.tsx` 내부 모달
- 구성: 이메일 입력, 구독 추가(해지 UI 미구현)
- 연결: USR-EVT-01
- 엔티티·정책: `artier_event_subscriptions`
- 우선순위: **P1**
- 비고: 런칭 전 해지 수단 필수(§6.2 N-5).

---

### 2.7 USR-SRC · 검색

#### USR-SRC-01 · 검색
- 경로: `/search`
- 컴포넌트: [`src/app/pages/Search.tsx`](src/app/pages/Search.tsx)
- 구성: 실시간 검색 입력, 자동완성(최대 8개), 최근 검색어(최대 10개, 개별/전체 삭제), 통합 상위 매치(작가 1명 + 작품 2개), 작가·작품 결과 그리드
- 연결: USR-PRF-01, USR-EXH-01
- 엔티티·정책: `searchRank.ts`, `artier_recent_searches__<slug>`, `artier_recent_searches__guest`
- 우선순위: **P0**
- 비고: 로그인 시 guest 기록 → 계정 기록으로 병합.

---

### 2.8 USR-NTF · 알림

#### USR-NTF-01 · 알림 센터
- 경로: `/notifications` (로그인 필수)
- 컴포넌트: [`src/app/pages/Notifications.tsx`](src/app/pages/Notifications.tsx)
- 구성: 전체 알림 목록(90일, 최대 200개), 필터(읽음/안읽음/유형별), 개별·전체 읽음, 개별 삭제(X), 읽은 알림 일괄 삭제, 알림 탭 시 원본 이동
- 연결: USR-EXH-01, USR-PRF-01, USR-EVT-02, USR-AUT-02(비로그인 리다이렉트)
- 엔티티·정책: `artier_notifications`, `artier_notification_settings`
- 우선순위: **P0**

---

### 2.9 USR-STG · 설정

#### USR-STG-01 · 설정 홈
- 경로: `/settings` (하위 해시 앵커: `#notifications`)
- 컴포넌트: [`src/app/pages/Settings.tsx`](src/app/pages/Settings.tsx)
- 구성: 계정 ID·이메일 확인, 글꼴 크기(작게/보통/크게), 알림 토글 6종(좋아요·팔로우·그룹 초대·팔로잉 신작·주간 테마·마케팅), 비밀번호 변경 진입(이메일 사용자만), 로그아웃, 탈퇴 진입
- 연결: USR-STG-02, USR-STG-03, USR-INF-07
- 엔티티·정책: `UserProfile`, `artier_notification_settings`, `artier_font_scale`
- 우선순위: **P0**

#### USR-STG-02 · 비밀번호 변경 모달
- 경로: USR-STG-01 → 비밀번호 변경 버튼(이메일 사용자만)
- 컴포넌트: `Settings.tsx` 내부 모달
- 구성: 현재 비밀번호, 새 비밀번호, 확인
- 연결: USR-STG-01
- 엔티티·정책: `auth`
- 우선순위: **P0**
- 비고: 소셜 로그인 사용자는 버튼 비활성 + 안내 문구.

#### USR-STG-03 · 탈퇴 모달
- 경로: USR-STG-01 → 탈퇴 버튼
- 컴포넌트: `Settings.tsx` 내부 모달
- 구성: 경고 문구, 비밀번호 확인, 탈퇴 사유 5택(이용 빈도 낮음/타 서비스 이용/개인정보 우려/이용 불편/기타), destructive 스타일 확정 버튼
- 연결: USR-AUT-02(탈퇴 후 로그아웃)
- 엔티티·정책: `withdrawn_artists` · [Policy §4 탈퇴 작가](Policy_v1.md#4-탈퇴-작가-정책)
- 우선순위: **P0**

---

### 2.10 USR-INF · 공지·약관·문의

#### USR-INF-01 · 소개 (About)
- 경로: `/about`
- 컴포넌트: [`src/app/pages/About.tsx`](src/app/pages/About.tsx)
- 구성: 서비스 소개, 미션, 연락처
- 연결: USR-INF-07
- 우선순위: **P0**

#### USR-INF-02 · FAQ
- 경로: `/faq`
- 컴포넌트: [`src/app/pages/Faq.tsx`](src/app/pages/Faq.tsx)
- 구성: FAQ 목록(아코디언)
- 우선순위: **P0**

#### USR-INF-03 · 공지 목록
- 경로: `/notices`
- 컴포넌트: [`src/app/pages/Notices.tsx`](src/app/pages/Notices.tsx)
- 구성: 공지 목록, 제목·날짜
- 연결: USR-INF-04
- 우선순위: **P0**

#### USR-INF-04 · 공지 상세
- 경로: `/notices/:id`
- 컴포넌트: [`src/app/pages/NoticeDetail.tsx`](src/app/pages/NoticeDetail.tsx)
- 구성: 공지 본문, 이전/다음 공지
- 우선순위: **P0**

#### USR-INF-05 · 이용약관
- 경로: `/terms`
- 컴포넌트: [`src/app/pages/Terms.tsx`](src/app/pages/Terms.tsx)
- 우선순위: **P0**
- 비고: 런칭 전 법무 확정 필수(§6.2 N-10).

#### USR-INF-06 · 개인정보처리방침
- 경로: `/privacy`
- 컴포넌트: [`src/app/pages/Privacy.tsx`](src/app/pages/Privacy.tsx)
- 우선순위: **P0**
- 비고: 런칭 전 법무 확정 필수(§6.2 N-10).

#### USR-INF-07 · 문의하기
- 경로: `/contact`
- 컴포넌트: [`src/app/pages/Contact.tsx`](src/app/pages/Contact.tsx)
- 구성: 이름, 이메일, 카테고리(계정/업로드/신고/제안/버그/기타), 내용(1000자), 첨부(5MB/개, 최대 3개 — 이미지/PDF/문서)
- 엔티티·정책: `artier_inquiries`
- 우선순위: **P0**

---

## 3. Track 2 — 운영 어드민 (ADM)

### 3.1 ADM-DSH · 대시보드

#### ADM-DSH-01 · 대시보드
- 경로: `/admin`
- 컴포넌트: [`src/app/admin/AdminDashboard.tsx`](src/app/admin/AdminDashboard.tsx)
- 구성: 블로커(차단 요소) 알림, 미결 이슈 수, 체크리스트 진행률, 파트너 현황 요약, 작품 수 요약
- 연결: ADM-ISU-01, ADM-CKL-01, ADM-PTN-01, ADM-WRK-01
- 우선순위: **P0**
- 비고: 어드민 접근 조건 `canAccessAdminRoutes(isLoggedIn)` — Operator 역할 또는 `VITE_ADMIN_OPEN=true`.

### 3.2 ADM-REV · 콘텐츠 검수

#### ADM-REV-01 · 콘텐츠 검수
- 경로: `/admin/content-review`
- 컴포넌트: [`src/app/admin/ContentReview.tsx`](src/app/admin/ContentReview.tsx)
- 구성: 검수 대기(`pending`) 큐 · 필터(상태·기간) · 작품 미리보기 · 승인/반려 액션 · 반려 사유 4종 선택(`low_quality` / `spam` / `inappropriate` / `copyright`)
- 연결: ADM-WRK-01
- 엔티티·정책: `Work.feedReviewStatus`, `Work.rejectionReason` · [Policy §12 신고·제재](Policy_v1.md#12-신고제재-정책) · `reviewLabels.ts`
- 우선순위: **P0**
- 비고: 승인 시 보류된 비회원 초대 자동 발송 + 팔로워 신작 알림 생성.

### 3.3 ADM-PCK · Pick 관리

#### ADM-PCK-01 · Artier's Pick 관리
- 경로: `/admin/picks`
- 컴포넌트: [`src/app/admin/PickManagement.tsx`](src/app/admin/PickManagement.tsx)
- 구성: Pick 선정(최대 10개, 주 단위 교체), 추가·제거, 히스토리
- 엔티티·정책: `Work.pick`, `Work.pickBadge`, `artier_admin_picks_v1` · [Policy §15 큐레이션·배지](Policy_v1.md#15-큐레이션배지-정책)
- 우선순위: **P0**
- 비고: Pick 선정 시 `pick: true` + `pickBadge: true` 동시 부여. 해제 시 `pick: false`, `pickBadge`는 영구 유지(이력 배지).

### 3.4 ADM-CUR · 기획전 관리

#### ADM-CUR-01 · 기획전 관리
- 경로: `/admin/curation`
- 컴포넌트: [`src/app/admin/CurationManagement.tsx`](src/app/admin/CurationManagement.tsx)
- 구성: 기획전 CRUD(제목·부제·포함 전시 ID 배열), 추천 작가 토글(피드 `featured` 버킷 부스트)
- 연결: USR-EXH-02
- 엔티티·정책: `Curation`, `artier_curation_v1` · [Policy §15](Policy_v1.md#15-큐레이션배지-정책)
- 우선순위: **P0**
- 비고: 기획전에 배지 부여 없음(노출용 컬렉션). 운영팀이 주제·맥락으로 전시를 엮음.

### 3.5 ADM-BNR · 배너 관리

#### ADM-BNR-01 · 배너 관리
- 경로: `/admin/banners`
- 컴포넌트: [`src/app/admin/BannerManagement.tsx`](src/app/admin/BannerManagement.tsx)
- 구성: 배너 CRUD(최대 5개), DnD 순서 변경(`@dnd-kit/sortable`), 기간(시작~종료) 자동 만료, 이미지·링크·기간 입력
- 엔티티·정책: `AdminBanner`, `artier_admin_banners_v1`
- 우선순위: **P0**
- 비고: 시작일 > 종료일 검증. 로컬 자정 기준으로 노출 판정(§5.1 정책 참조).

### 3.6 ADM-EVT · 이벤트 관리

#### ADM-EVT-01 · 이벤트 관리
- 경로: `/admin/managed-events`
- 컴포넌트: [`src/app/admin/EventManagement.tsx`](src/app/admin/EventManagement.tsx)
- 구성: 이벤트 CRUD(제목·배너·대상·기간·설명), 상태 자동 계산(active/scheduled/ended) + 수동 오버라이드, `worksPublic` 토글, 삭제 시 연결 작품의 `linkedEventId` 자동 정리
- 연결: ADM-EVT-02
- 엔티티·정책: `ManagedEvent`, `artier_managed_events_v1`
- 우선순위: **P0**

#### ADM-EVT-02 · 이벤트 참여자 현황
- 경로: `/admin/events`
- 컴포넌트: [`src/app/admin/EventParticipants.tsx`](src/app/admin/EventParticipants.tsx)
- 구성: 이벤트별 참여 작품 목록(시드 + 실제 업로드 병합), 참여자 정보
- 연결: ADM-EVT-01, ADM-WRK-01
- 엔티티·정책: `ManagedEvent.linkedEventId`
- 우선순위: **P1**

### 3.7 ADM-RPT · 신고 처리

#### ADM-RPT-01 · 신고 처리
- 경로: `/admin/reports`
- 컴포넌트: [`src/app/admin/ReportManagement.tsx`](src/app/admin/ReportManagement.tsx)
- 구성: 신고 큐(작품·사용자), 4가지 처리 액션 — **삭제** / **경고** / **기각** / **비공개**, 각 액션에 확인 다이얼로그
- 연결: ADM-MBR-01(경고 3회 자동 정지)
- 엔티티·정책: `StoredUserReport`, `sanctionStore.ts`, `artier_reports`, `artier_warning_counter_v1`, `artier_false_report_counter_v1` · [Policy §12 신고·제재](Policy_v1.md#12-신고제재-정책)
- 우선순위: **P0**
- 비고: 경고 3회 누적 → 대상 작가 7일 자동 정지. 기각(허위) 3회 누적 → 신고자 7일 차단.

### 3.8 ADM-MBR · 회원 관리

#### ADM-MBR-01 · 회원 관리
- 경로: `/admin/members`
- 컴포넌트: [`src/app/admin/MemberManagement.tsx`](src/app/admin/MemberManagement.tsx)
- 구성: 회원 검색·목록, 정지 액션(라디오 4단계: 주의/7일/30일/영구), 정지 사유 입력, 자동 승격 이력 표시
- 엔티티·정책: `accountSuspensionStore`, `SuspensionLevel`, `artier_admin_members_v1` · [Policy §12.3 정지 단계](Policy_v1.md#12-신고제재-정책)
- 우선순위: **P0**
- 비고: 데모 사용자(`artists[0]`)는 전역 적용 + 다음 로그인 시 차단. 기타 목업 회원은 표시만 변경.

### 3.9 ADM-WRK · 작품 관리

#### ADM-WRK-01 · 작품 관리
- 경로: `/admin/works`
- 컴포넌트: [`src/app/admin/WorkManagement.tsx`](src/app/admin/WorkManagement.tsx)
- 구성: 작품 검색·목록, 공개/비공개 토글(`isHidden`), 직접 삭제, 필터(상태·작가·기간)
- 엔티티·정책: `Work`
- 우선순위: **P0**

### 3.10 ADM-PTN · 파트너 작가

#### ADM-PTN-01 · 파트너 작가
- 경로: `/admin/partners`
- 컴포넌트: [`src/app/admin/PartnerArtists.tsx`](src/app/admin/PartnerArtists.tsx)
- 구성: 5단계 상태(후보 → 연락 완료 → 온보딩 중 → 활성 → 비활성), 제출 상태(미제출/제출 완료/검토 중/승인/반려), 목표 지표(파트너 50명 · 작품 800~1,000점)
- 엔티티·정책: `artier_admin_partners`
- 우선순위: **P0**

### 3.11 ADM-CKL · 런칭 체크리스트

#### ADM-CKL-01 · 런칭 체크리스트
- 경로: `/admin/checklist`
- 컴포넌트: [`src/app/admin/LaunchChecklist.tsx`](src/app/admin/LaunchChecklist.tsx)
- 구성: 17항목 5카테고리(QA/법무/콘텐츠/운영/마케팅), 상태(시작 전/진행 중/완료/차단됨), 기한 초과 빨간 강조
- 엔티티·정책: `artier_admin_checklist`
- 우선순위: **P1**

### 3.12 ADM-ISU · 미결 이슈

#### ADM-ISU-01 · 미결 이슈
- 경로: `/admin/issues`
- 컴포넌트: [`src/app/admin/UnresolvedIssues.tsx`](src/app/admin/UnresolvedIssues.tsx)
- 구성: 이슈 큐, 상태(미결/진행 중/해결됨/보류), 우선순위(긴급/높음/보통/낮음), 담당자 지정
- 엔티티·정책: `artier_admin_issues`
- 우선순위: **P1**

---

## 4. 공통 팝업·다이얼로그 (CM)

두 트랙 공통으로 사용되거나 특정 화면에 종속되지 않는 다이얼로그·오버레이.

### CM-01 · 확인 다이얼로그 (ConfirmDialog)
- 컴포넌트: [`src/app/components/ConfirmDialog.tsx`](src/app/components/ConfirmDialog.tsx)
- 호출: `openConfirm({ title, description?, destructive? })` (Radix AlertDialog + Promise API)
- 용도: 삭제·탈퇴 등 **파괴적 액션의 사용자 확인**. `window.confirm()` 대체. destructive=true 시 빨간 확정 버튼.
- 우선순위: **P0**

### CM-02 · 로그인 유도 모달 (LoginPromptModal)
- 컴포넌트: [`src/app/components/LoginPromptModal.tsx`](src/app/components/LoginPromptModal.tsx)
- 호출: 비로그인 상태에서 좋아요·저장·팔로우 등 보호 액션 시도 시
- 동작: "로그인 필요" 안내 → 로그인 버튼 → `/login?redirect=<현재경로>`
- 우선순위: **P0**

### CM-03 · 신고 모달 (ReportModal)
- 컴포넌트: [`src/app/components/ReportModal.tsx`](src/app/components/ReportModal.tsx)
- 호출: USR-EXH-01, USR-PRF-01에서 "신고" 액션
- 구성: 신고 사유 선택(저품질·스팸·부적절·저작권), 상세 텍스트 입력
- 엔티티·정책: `StoredUserReport` · [Policy §12](Policy_v1.md#12-신고제재-정책)
- 우선순위: **P0**

### CM-04 · 초대 본인 확인 게이트 (PendingInviteClaimGate)
- 컴포넌트: [`src/app/components/PendingInviteClaimGate.tsx`](src/app/components/PendingInviteClaimGate.tsx)
- 호출: 가입 직후 자동 매칭에서 이름 불일치로 실패한 초대가 있을 때
- 구성: 초대된 전시 미리보기, 본인 확인 3택(수락 / 거부 / 나중에)
  - 수락 → 수동 매칭 승격(`claimBlockedInvite`)
  - 거부 → 발신 작가에게 경고 +1
- 엔티티·정책: `inviteMessaging.ts`, `artier_pending_invite_claims` (sessionStorage) · [Policy §3](Policy_v1.md#3-비가입자-초대-정책)
- 우선순위: **P0**

### CM-05 · 쿠키 동의 배너 (CookieConsent)
- 컴포넌트: [`src/app/components/CookieConsent.tsx`](src/app/components/CookieConsent.tsx)
- 호출: 신규 방문 시 최초 1회 (`artier_cookie_consent` 미설정)
- 구성: 동의 버튼 + 개인정보처리방침 링크
- 우선순위: **P0**

### CM-06 · 오프라인 배너 (OfflineBanner)
- 컴포넌트: [`src/app/components/OfflineBanner.tsx`](src/app/components/OfflineBanner.tsx)
- 호출: 네트워크 오프라인 감지 시 앱 상단 고정 배너
- 우선순위: **P0**

### CM-07 · 에러 바운더리 (ErrorBoundary)
- 컴포넌트: [`src/app/components/ErrorBoundary.tsx`](src/app/components/ErrorBoundary.tsx)
- 구성: 렌더링 예외 포착 + 재시도 UI. 운영팀 문의 링크.
- 우선순위: **P0**

### CM-08 · 404 / 500 / 점검
- 컴포넌트: [`NotFound.tsx`](src/app/pages/NotFound.tsx), [`ServerError.tsx`](src/app/pages/ServerError.tsx)(`/500`), [`Maintenance.tsx`](src/app/pages/Maintenance.tsx)(`/maintenance`)
- 우선순위: **P0**

### CM-09 · QA 바로가기 (QaScreenShortcuts) — 개발/검수 전용
- 컴포넌트: [`src/app/components/QaScreenShortcuts.tsx`](src/app/components/QaScreenShortcuts.tsx)
- 노출 조건: `import.meta.env.DEV` 또는 `VITE_FOOTER_QA_LINKS=true`
- 구성: 플로팅 버튼 → 주요 화면 바로가기
- 우선순위: **P0** (개발 편의). 런칭 빌드에선 비활성.

### CM-10 · 데모 툴 — 배포 전 제거
- 컴포넌트: [`FlowDemoTools.tsx`](src/app/pages/FlowDemoTools.tsx)(`/demo`), [`DemoReferenceToolkit.tsx`](src/app/pages/DemoReferenceToolkit.tsx)(`/demo/reference`)
- 용도: PM 데모 맵 및 검수 툴킷
- 우선순위: **배포 전 제거 또는 플래그 차단**

---

## 5. 우선순위 요약 (런칭 범위)

### 5.1 P0 — 런칭 필수

**사용자 앱 (USR) — 28개**
- USR-AUT-01~07 (인증 7)
- USR-BRW-01 (둘러보기 1)
- USR-EXH-01~04 (전시·작품 4)
- USR-UPL-01~03 (업로드 3)
- USR-PRF-01~04 (프로필 4)
- USR-EVT-01~02 (이벤트 2) — EVT-03 알림 구독은 P1
- USR-SRC-01 (검색 1)
- USR-NTF-01 (알림 1)
- USR-STG-01~03 (설정 3)
- USR-INF-01~07 (정보·약관 7)

**운영 어드민 (ADM) — 11개**
- ADM-DSH-01, REV-01, PCK-01, CUR-01, BNR-01, EVT-01, RPT-01, MBR-01, WRK-01, PTN-01

**공통 (CM)**
- CM-01~08 전부. CM-09/CM-10은 런칭 빌드에서 차단.

**합계**: 사용자 앱 28 + 어드민 11 + 공통 8 = **47개 화면/다이얼로그**

### 5.2 P1 — 런칭 권장(1~3개월 내)

- USR-EVT-03 이메일 알림 구독(해지 UI 필수 후 정식)
- ADM-EVT-02 이벤트 참여자 현황 심화 지표
- ADM-CKL-01 런칭 체크리스트(내부 도구 — 런칭 직후 폐기 가능)
- ADM-ISU-01 미결 이슈(내부 도구)

### 5.3 P2 — 로드맵(Phase 2 이후)

- 이벤트 선정 시스템 본격 구현(선정작 영구 배지 부여 로직)
- 운영자 내부 컬렉션(비공개 북마크 툴)
- 작품 카테고리 분류(art/fashion/craft/product)
- 동적 OG 이미지 생성
- 어드민 권한 3단계 분리(최고 운영자 / 에디터 / 뷰어)
- 댓글·메시지·그룹 커뮤니티 확장

---

## 6. 해소된 결정 · 열린 항목

### 6.1 해소된 결정

| # | 결정 | 반영 위치 |
|---|---|---|
| B-1 | 화면 ID 체계 `USR-<영역>-<번호>` / `ADM-<영역>-<번호>` 도입 | §1 |
| B-2 | `Work` 타입 = "전시(Exhibition)" 컨테이너, 개별 이미지는 배열 요소 | SystemArch §3 |
| B-3 | 업로드 유형 2종(혼자/함께) + 함께는 역할 2종(참가자/강사) | USR-UPL-01, Policy §13 |
| B-4 | 강사 표시 자동 파생(업로드 이력 기반) — 별도 프로필 토글 없음 | USR-PRF-01, Policy §13.3 |
| B-5 | 큐레이션 4종 분리 — Pick(배지 부여) · 기획전(노출용) · 배너 · 추천 작가 | ADM-PCK-01, ADM-CUR-01, Policy §15 |
| B-6 | 전시 상세 URL 분기(`?from=invite` / `?from=work` / 큐레이션) | USR-EXH-01~04 |
| B-7 | 신고 4액션 + 자동 승격(경고 3회/허위 3회) | ADM-RPT-01, Policy §12 |
| B-8 | Phase 1 포인트 미노출(백그라운드만) | USR-STG `/points` → `/` 리다이렉트 |

### 6.2 아직 열려 있는 항목

상위 아키텍처 문제와 병합해 `SystemArchitecture_v1.md §10`에서 총괄한다. 여기엔 IA 관점에서 결정이 남은 것만 추렸다.

| # | 항목 | 영향 화면 | 결정 필요 시점 |
|---|---|---|---|
| N-1 | 이벤트 선정작 상세 UI(선정 시점 / 영구 배지 표기) | ADM-EVT-01, USR-EVT-02, USR-EXH-01 | Phase 1 후순위 |
| N-5 | 이벤트 이메일 구독 **해지 UI** | USR-EVT-03, USR-STG-01 | **런칭 전 필수** |
| N-7 | 어드민 권한 3단계 분리 시 각 어드민 화면 권한 매트릭스 | ADM-* 전체 | Phase 2 |
| N-9 | OG 이미지 동적 생성 시 공유 랜딩(`USR-EXH-03/04`) 진입 경로 확인 | USR-EXH-03, USR-EXH-04 | Phase 2 |
| N-10 | 약관·개인정보처리방침 법무 확정본 | USR-INF-05, USR-INF-06 | **런칭 전 필수** |

---

## 7. 다음 문서 연결

이 문서(IA)는 **무엇이 있는가**를 정의한다. 각 화면의 구체 동작·수용 기준은 아래 문서에서 다룬다.

| 주제 | 문서 |
|---|---|
| 화면 UI·입력·처리·수용 기준(사용자 앱) | [PRD_User_v1.md](PRD_User_v1.md) |
| 화면 UI·입력·처리·수용 기준(어드민) | [PRD_Admin_v1.md](PRD_Admin_v1.md) |
| 서비스 정책(업로드·신고·탈퇴·포인트·큐레이션 등) | [Policy_v1.md](Policy_v1.md) |
| 컬러·타이포·컴포넌트 토큰 | [DesignSystem_v1.md](DesignSystem_v1.md) |
| 데이터 모델(ERD)·외부 연동·플로우 시퀀스 | [SystemArchitecture_v1.md](SystemArchitecture_v1.md) |

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1.0 | 2026-04-19 | PM × Claude | 최초 작성. `CURRENT_SPEC.md §2·§3` 라우트·화면 정보 + README ID 체계 재구조화. 사용자 앱 28 + 어드민 11 + 공통 8 = 47개 화면 정리. |
