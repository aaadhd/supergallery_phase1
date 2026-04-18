# CURRENT_SPEC.md — Artier (SuperGallery Phase 1) 역설계 명세

> 이 문서는 실제 코드 기반으로 역추적한 서비스 명세이다. 추측 없이 코드에 존재하는 것만 기술한다.
> 최종 갱신: 2026-04-19

---

## 1. 서비스 요약

**Artier**는 시니어/중장년 순수미술 작가를 위한 웹 기반 디지털 갤러리 플랫폼이다.

핵심 기능:
- 개인(혼자 올리기) 또는 그룹(함께 올리기) 전시를 만들어 작품 이미지를 업로드
- 강사가 수강생 작품을 대리 전시할 수 있음
- 작품 둘러보기(피드), 좋아요/저장/팔로우 인터랙션
- 비회원 작가에게 카카오 알림톡/이메일 초대 (검수 승인 후 발송) → 가입 시 자동 매칭
- 운영팀 어드민 콘솔(검수, 큐레이션, 신고 처리, 배너 관리 등)
- 전역 에러 경계(ErrorBoundary)로 렌더 에러 시 폴백 UI
- 계정 정지 전역 가드 (정지 상태면 어떤 페이지에서든 강제 로그아웃)

Phase 1은 프론트 + 백엔드 + 인프라를 포함하여 시장 출시까지의 전체 범위이다. 현재 프론트엔드는 클라이언트 전용이며 모든 데이터는 localStorage/sessionStorage에 저장된다. OAuth, SMS, 이메일 발송은 모의(mock) 수준이다.

기술 스택: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Radix UI + react-router v7

---

## 2. 라우트 전체 목록

### 2.1 메인 라우트 (Layout: Header + Footer)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `Browse` | 홈 피드 (둘러보기) |
| `/browse` | → `/` 리다이렉트 | |
| `/upload` | `Upload` | 작품 업로드 (Footer 숨김) |
| `/profile` | `Profile` | 내 프로필 |
| `/profile/:id` | `Profile` | 타인 프로필 |
| `/me` | `Profile` | 내 프로필 별칭 |
| `/me/edit` | → `/settings` 리다이렉트 | |
| `/exhibitions/:id` | `ExhibitionRoute` | 전시 상세 (쿼리 파라미터로 분기) |
| `/works/:id` | → `/exhibitions/:id` 리다이렉트 | 레거시 호환 |
| `/events` | `Events` | 이벤트 목록 |
| `/events/:id` | `EventDetail` | 이벤트 상세 |
| `/search` | `Search` | 검색 |
| `/notifications` | `Notifications` | 알림 |
| `/settings` | `Settings` | 설정 |
| `/settings/notifications` | → `/settings#notifications` 리다이렉트 | |
| `/points` | → `/` 리다이렉트 | 레거시 |
| `/about` | `About` | 소개 |
| `/faq` | `Faq` | FAQ |
| `/contact` | `Contact` | 문의하기 |
| `/notices` | `Notices` | 공지사항 목록 |
| `/notices/:id` | `NoticeDetail` | 공지사항 상세 |
| `/terms` | `Terms` | 이용약관 |
| `/privacy` | `Privacy` | 개인정보처리방침 |
| `/500` | `ServerError` | 서버 에러 페이지 |
| `/demo` | `FlowDemoTools` | PM 데모 맵 |
| `/demo/reference` | `DemoReferenceToolkit` | 검수 툴킷 |
| `*` | `NotFound` | 404 |

### 2.2 인증/온보딩 라우트 (Layout 없음)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/login` | `Login` | 로그인 |
| `/signup` | `Signup` | 회원가입 |
| `/onboarding` | `Onboarding` | 가입 후 프로필 설정 |
| `/reset-password` | `PasswordReset` | 비밀번호 재설정 |
| `/maintenance` | `Maintenance` | 점검 페이지 |

### 2.3 어드민 라우트 (`/admin` 하위, AdminLayout + 사이드바)

접근 조건: `canAccessAdminRoutes(isLoggedIn)` — Operator 역할 필요 (또는 `VITE_ADMIN_OPEN=true`)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/admin` | `AdminDashboard` | 대시보드 |
| `/admin/issues` | `UnresolvedIssues` | 미결 이슈 |
| `/admin/checklist` | `LaunchChecklist` | 런칭 체크리스트 |
| `/admin/partners` | `PartnerArtists` | 파트너 작가 |
| `/admin/events` | `EventParticipants` | 이벤트 참여자 |
| `/admin/content-review` | `ContentReview` | 콘텐츠 검수 |
| `/admin/works` | `WorkManagement` | 작품 관리 |
| `/admin/picks` | `PickManagement` | 에디터스 픽 |
| `/admin/curation` | `CurationManagement` | 큐레이션 |
| `/admin/banners` | `BannerManagement` | 배너 관리 |
| `/admin/managed-events` | `EventManagement` | 이벤트 관리 |
| `/admin/reports` | `ReportManagement` | 신고 처리 |
| `/admin/members` | `MemberManagement` | 회원 관리 |

### 2.4 `/exhibitions/:id` 쿼리 파라미터 분기 (ExhibitionRoute)

| 쿼리 | 컴포넌트 | 설명 |
|------|----------|------|
| `?from=invite` | `ExhibitionInviteLanding` | 초대장 랜딩 |
| `?from=credited` | `ExhibitionInviteLanding` | 비회원 작가 크레딧 랜딩 |
| `?from=work` | `ExhibitionWorkShareLanding` | 작품 공유 랜딩 |
| (큐레이션 전시) | `ExhibitionDetail` | 큐레이션 전시 상세 |
| (기본) | `Browse` (피드 모달) | 일반 작품 상세 |

---

## 3. 화면별 기능 상세

### 3.1 Browse (홈 피드) — `/`

**할 수 있는 것:**
- 배너 캐러셀 보기 (어드민 배너 또는 이벤트, 자동 회전)
- 탭 전환: 전체 / 혼자 올리기 / 함께 올리기
- 작품 카드 클릭 → 상세 모달 (좌우 네비게이션)
- 좋아요, 저장, 팔로우, 신고 (로그인 필요)
- 무한 스크롤 (24개씩 페이지네이션)

**규칙:**
- 피드 정렬: Pick → 최신 → 팔로우 가중치 (feedOrdering.ts 알고리즘)
- `feedReviewStatus === 'approved'`인 작품만 노출
- `isHidden === true`인 작품은 피드/검색에서 제외 (본인 프로필에서만 보임)
- 이미 본 작품(`artier_feed_seen_work_ids`)은 각 버킷 하단으로 밀림

### 3.2 Upload (작품 올리기) — `/upload`

**할 수 있는 것:**
- 업로드 유형 선택: 혼자 올리기 / 함께 올리기
  - 함께 올리기 선택 시: 역할 선택 모달 (참가자 / 강사) → 즉시 업로드 화면 진입
  - 업로드 화면 상단에 역할 뱃지(그룹 전시 / 그룹 전시(강사)) 표시
- 이미지 1~10장 추가 (드래그앤드롭 정렬, @dnd-kit)
- 커스텀 커버 이미지 별도 지정 (전시의 첫 장 표지로 표시)
- 이미지별 작가 지정: 회원(검색) 또는 비회원(이름+전화번호)
- 전시명, 그룹명, 작품명 입력 (각 20자 이내)
- 역할이 강사일 때: 작가 선택 리스트에서 본인 제외, 본인이 지정된 슬롯은 자동 초기화
- 이벤트 연결 (동일 이벤트 중복 참여 차단)
- 수동 초안 저장 / 초안에서 복원 (자동 저장 없음)
- 기존 작품 수정 (삭제된 작품 수정 시 에러 토스트 + 리다이렉트)
- 진입 시 기존 초안이 있으면 "이어서 작업" 토스트
- 카메라로 촬영한 이미지 추가 시 인라인 안내 배너 (업로드 차단)

**전시 완료 후:**
- 전시 완료 확인 화면 표시 ("전시가 등록되었습니다" + 검수 대기 안내)
- "내 전시 보기" / "둘러보기" CTA 제공
- 비회원 초대가 있는 경우 "검수 승인 후 초대 발송" 안내

**규칙:**
- 전시명 필수 (빈 값으로 전시 불가)
- 이미지 최소 해상도: 짧은 변 800px (WebP 변환)
- 최대 10장
- 카메라 EXIF 감지 시 업로드 차단 (파일 magic bytes로 JPEG 판별, 확장자 우회 불가)
- 비속어 필터 적용 (47개 금칙어, 필드별 에러 메시지)
- 작가 미지정 에러: 몇 번째 이미지인지 특정하여 안내
- **참가자 역할 (함께 올리기)**: 본인 작품 최소 1점 포함 필수
- **강사 역할 (함께 올리기)**: 본인 작품 포함 금지 (작가 리스트에서 본인 제외, 본인 슬롯 자동 초기화)
- 원작 확인 체크 미완료 시: "원작 확인을 체크해 주세요" 힌트 + 전시하기 버튼 비활성
- 미저장 이탈 방지 (경고 시 "초안 저장" 안내 포함)
- 기본 상태: `feedReviewStatus: 'pending'`
- 비회원 초대는 검수 승인 시점에 발송 (업로드 시 즉시 발송하지 않음)
- 전시 시 AP +20 (첫 업로드는 +100), 같은 작품 중복 적립 방지
- 24시간 이내 삭제 시 AP -20 회수 (잔액 음수 방지)
- 작품 ID는 `crypto.randomUUID()` 사용 (충돌 방지)
- 딥링크(`?draft=`, `?event=`) 쿼리 파라미터가 로그인 리다이렉트에서 보존됨

### 3.3 Profile (프로필) — `/profile`, `/profile/:id`, `/me`

**공통 기능**
- 프로필 편집: 소개글, 바이오(200자), 지역, 관심사, 외부 링크 (연필 아이콘 버튼)
- 프로필 사진 변경 (눈에 띄는 카메라 아이콘)
- 팔로워/팔로잉 모달 (전체 목록)
- 팔로우/언팔로우 (자기 자신·탈퇴 작가 불가)
- 탈퇴 작가 프로필: "작가 미상" 표시, 모든 인터랙션 차단
- 강사 배지 자동 노출 (본인 업로드 중 `isInstructorUpload === true`가 1건이라도 있을 때)

**탭 구성 (본인/타인 공통)**: `exhibition`
**탭 구성 (본인만)**: `exhibition / works / likes / saved / drafts` (+강사면 `student-works`)

#### 3.3.1 전시 탭 (`exhibition`)

**데이터 구성** — 전시(Work 컨테이너) 단위
- 본인이 올린 전시 (`artistId === 본인 && !isInstructorUpload`)
- **참여 작가로 연결된 전시**: 다른 사람이 올린 그룹 전시에 `imageArtists[i].memberId === 본인`으로 등록된 전시도 함께 표시
- 수강생 대리 업로드 전시(`isInstructorUpload === true`)는 여기서 제외됨 (수강생 작품 탭으로 분리)
- 타인 프로필에서 볼 때는 승인 완료(`feedReviewStatus === 'approved'`) + 공개(`!isHidden`) 전시만 노출

**필터·뷰**
- 전체 / 혼자 / 함께 (`primaryExhibitionType` 기준, 레거시 fallback 포함) + 각 개수 표시
- 본인 프로필: "내가 올린 전시만" 체크박스 — 참여 작가로만 연결된 전시 숨김
- 전시 단위 카드: 썸네일 + 전시명 + 그룹명(그룹 전시) 또는 작가명(혼자 전시)
- 이미지 개수 배지 (다장 전시)

**수정·삭제 권한**
- **본인이 직접 올린 전시만** 우상단 점점점 메뉴 노출 (`artistId === 본인 || authorId === 본인`)
- 참여 작가로만 연결된 전시는 메뉴 없음 → 수정·삭제 불가. 업로더를 통해 수정 안내(가이드 문구에 명시).

**점점점 메뉴 구성**
- **전시 수정** (Tag 아이콘) → `/upload?edit={workId}` 이동
- **삭제** (Trash 아이콘, destructive 스타일, 빨간 텍스트)

**전시 수정 동작**
- 기존 전시 정보 전부 업로드 화면에 프리필 (유형·전시명·이미지·작가 지정·커버·원작 체크·강사 역할·이벤트 연결 등)
- 버튼 라벨이 "전시하기" → "수정 저장"으로 바뀌고 상단에 "수정 중" 뱃지 표시
- 삭제된 전시를 `/upload?edit=...`로 진입하면 에러 토스트 "수정하려는 작품을 찾을 수 없습니다" + `/upload`로 리다이렉트
- 저장 시 → `workStore.updateWork`로 덮어쓰기
  - **`feedReviewStatus`는 항상 `pending`으로 재설정** (auto-approve 모드 제외) — 즉 승인 상태였던 전시도 수정하면 다시 검수 대기로 돌아감
  - `rejectionReason`은 새 Work 객체에 포함되지 않아 자연스럽게 제거
  - AP 적립 없음 (신규 발행만 AP +20/100, 수정은 적립 없음)
  - 이벤트 중복 참여 검증은 수정 모드에선 스킵
  - 비회원 초대 발송(검수 승인 시점)도 수정 모드에선 스킵
- 성공 토스트 "작품이 수정되었어요" → 이벤트 연결이면 해당 이벤트 상세로, 아니면 `/me?tab=exhibition`로 이동

**전시 삭제 동작**
- 확인 다이얼로그: 제목에 전시명, 설명에 "이 작품은 영구적으로 삭제되며 되돌릴 수 없습니다"
- **보류된 비회원 초대가 있으면 추가 경고**: "초대된 비회원이 있습니다. 삭제하면 초대가 무효화됩니다"
- 확인 시 `workStore.removeWork(id)` — 24시간 내 삭제면 AP -20 회수(잔액 음수 방지)
- 연쇄 정리: 이 전시를 참조하는 interactions(좋아요·저장), 알림, 신고, Pick·Curation 참조도 함께 제거
- 토스트: "작품이 삭제되었어요"

**검수 상태 배지 (본인에게만 좌하단 노출)**
- `pending` → "확인 중" 배지 (muted 배경, 보더)
- `rejected` → "게시 불가" 배지 (빨간 배경, 화살표 아이콘 → 클릭 가능 표시)
- `approved`는 배지 없음

**반려 전시 진입 동작**
- 본인이 rejected 전시 썸네일을 클릭하면 상세 모달 대신 **반려 사유 모달** 오픈
  - 모달 내용: "게시 불가 안내" 제목 + 반려 사유(저품질/스팸/부적절/저작권 중 1종) + "수정 후 재업로드하면 재심사를 받을 수 있습니다"
  - `[닫기]` / `[수정하기]` 버튼 — "수정하기" 클릭 시 `/upload?edit=`로 이동
- 참여 작가로만 연결된 rejected 전시는 애초에 타인 프로필에서도 안 보이므로 해당 없음

#### 3.3.2 내 작품 탭 (`works`) — 본인만

전시 안의 **개별 이미지(작품 1장) 단위**로 평탄화한 그리드. "내가 그린 그림을 한 장씩 훑어보기 + 작품명만 빠르게 수정" 용도.

**데이터 구성**
- 소스: 본인 `artistWorks`(내가 올린 전시 + 참여 작가 연결 전시) + 태그된 작품(`coOwners`로 본인이 등록된 남의 전시)
- 각 전시를 이미지 단위로 평탄화:
  - `imageArtists` 있으면 → `memberId === 본인`인 인덱스만
  - `imageArtists`에 매칭 없고 `artistId === 본인`이면 전 이미지
  - `imageArtists`가 없고 내 전시면 전 이미지
- 결과: **"내가 그린 이미지"만** 모인 그리드. 남이 올린 그룹 전시 속 내 그림도 포함됨.

**뷰 구성**
- 이미지 단위 썸네일 그리드
- 카드 하단:
  - "작품명" 배지 + 작품명 (+ 연필 아이콘 affordance, 이 영역 클릭 시 편집 모달)
  - "전시명" 배지 + 전시명 (클릭 시 해당 이미지 뷰어로 진입)
- 점점점 메뉴 없음. 편집은 **작품명 직접 탭**으로 진입 (시니어 친화)

**작품명 변경 동작 (인라인 진입)**
- 작품명 텍스트·연필 아이콘 영역을 탭 → 중앙 모달, 현재 이름 프리필(무제면 빈 값), 자동 포커스
- 입력 중 카운터 `n/20` 실시간 표시. 20자 초과 입력 차단. Enter 키 저장.
- 빈 문자열·공백만 저장 시 에러 토스트 "작품명을 입력해 주세요"
- 저장 시 `workStore.updateWork(workId, { imagePieceTitles: 해당 인덱스만 수정한 새 배열 })`
  - 전시 객체 자체(전시명·커버·검수 상태 등)는 건드리지 않음. 해당 이미지 제목만.
  - **승인 완료 전시의 이미지 제목을 바꿔도 재검수 대상이 되지 않음** (전시 수정과 달리 `feedReviewStatus`는 리셋 안 됨)
- 남이 올린 전시에 들어간 내 그림도 이 탭에서 이름 변경 가능 (전시 수정 권한과 별개)
- 성공 토스트 "작품명이 저장되었어요"
- 모달 외부 클릭 시 저장 없이 닫힘

**이미지 썸네일 클릭 → 내 작품 전용 뷰어**
- 전시 상세 모달(WorkDetailModal)과는 별개의 가벼운 뷰어
- ← → 화살표 키로 내 이미지들 사이만 탐색 (전시 경계 없이 평탄 리스트)
- Escape로 닫기

**개별 이미지 검수 상태 배지**
- 소속 전시의 `feedReviewStatus`를 그대로 표시
- `pending` → "확인 중" (muted), `rejected` → "수정 필요" (빨간)
- 같은 전시의 이미지들은 모두 같은 상태 배지를 갖게 됨 (전시 단위 상태이므로)

**알려진 한계 — 동일 이미지 중복 표시**
- 같은 이미지를 여러 전시에 업로드한 경우(예: 개인전·그룹전에 동시 출품), 이 탭에서 전시 수만큼 중복 표시됨
- 작품명·소속 전시가 전시별로 다를 수 있어 URL 기준으로 합쳐 보여주면 정보 손실이 생기므로 현재는 **중복 표시 유지**
- Phase 2에서 실제 사용자 피드백 바탕으로 그룹화 UI(예: "N개 전시에 포함" 배지 + 전시 목록 펼침) 재검토 예정

#### 3.3.3 수강생 작품 탭 (`student-works`) — 강사일 때만

**노출 조건**
- 자동 파생: 본인 업로드 중 `isInstructorUpload === true`가 1건 이상일 때
- 수동 토글 없음. 전부 삭제되면 탭 자동 제거.

**데이터**
- `isInstructorUpload === true` && `artistId === 본인` && `groupName` 있음 && 그룹 전시 && 다른 수강생 작가 크레딧 있음

**뷰 구성**
- 전시 단위 카드 (수강생 작품 모음 그룹 전시)
- 카드 하단: 전시명 + 그룹명 + 크레딧된 수강생 이름 목록 (참여 작가 라벨)
- 다장 전시면 이미지 개수 배지 (좌상단)

**점점점 메뉴 구성** (본인 프로필에서만)
- **전시 수정** → `/upload?edit={workId}` (강사 역할로 자동 프리필, 본인 슬롯 없음)
- **삭제** (destructive) — 전시 탭과 동일한 확인·영구 삭제 동작 (보류 초대 경고 없음, 수강생 전시 특성상 비회원 초대는 다른 경로)

**검수 상태 배지**
- 전시 탭과 동일 (`pending`/`rejected`/없음)
- 반려 시 클릭해서 사유 모달 진입

#### 3.3.4 좋아요·저장 탭

- **좋아요** (`likes`): 내가 좋아요한 타인 전시만 모아봄 (본인 작품 제외). 전시 단위 카드 (썸네일·전시명·작가명).
- **저장** (`saved`): 내가 저장한 타인 전시만 모아봄 (동일 구조).
- 카드 클릭 → 전시 상세 모달 (`WorkDetailModal`).
- 해제: 상세 모달에서 좋아요·저장 토글 해제 (이 탭에 별도 해제 버튼 없음).

#### 3.3.5 초안 탭 (`drafts`) — 본인만

- 업로드 대기 중인 수동 저장 초안 목록 (`draftStore`).
- 카드: 초안 대표 이미지 + 제목 + 마지막 수정 시각.
- 카드 클릭 → `/upload?draft={id}`로 "이어서 작업".
- 우상단 점점점 메뉴: **삭제**만 제공.
  - 확인 다이얼로그: "이 초안을 삭제할까요?" + "이 초안은 영구적으로 삭제되며 되돌릴 수 없습니다"
  - 확인 시 `draftStore.deleteDraft(id)`
  - 토스트: "초안이 삭제되었어요"
- 자동 저장은 없으므로 사용자가 명시적으로 저장한 초안만 여기 나타남.

**탭 공통 규칙**
- `pending`/`rejected` 상태 전시는 소유자 외에게 비노출
- `isHidden` 전시는 타인 프로필에서 비노출 (본인만 볼 수 있음)
- 탈퇴 작가는 전체 인터랙션 차단
- 전시 탭·수강생 작품 탭의 점점점 메뉴는 `min-h-[44px] min-w-[44px]` 터치 타겟 준수

### 3.4 ExhibitionDetail (큐레이션 전시 상세) — `/exhibitions/:id`

**할 수 있는 것:**
- 전시 커버, 제목, 설명, 기간, 참여 작가 보기
- 좋아요, 저장
- 공유 (네이티브 공유 또는 클립보드)
- 전시 내 작품 그리드 탐색
- 관련 전시 보기

### 3.5 ExhibitionInviteLanding (초대장 랜딩) — `/exhibitions/:id?from=invite`

**할 수 있는 것:**
- 전시 초대 페이지 보기 (커버, 제목, 참여 작가)
- 작품 그리드 탐색
- 공유
- 비로그인 시 가입 유도 (전화번호/이름 프리필)

### 3.6 ExhibitionWorkShareLanding (작품 공유 랜딩) — `/exhibitions/:id?from=work`

**할 수 있는 것:**
- 단일 작품 공유 페이지 보기
- "앱에서 열기" → 상세 모달
- 공유

### 3.7 Events (이벤트 목록) — `/events`

**할 수 있는 것:**
- 활성/예정/종료 이벤트 목록 보기
- 히어로 캐러셀 (활성 이벤트, 5초 자동 회전)
- 이벤트 알림 구독 (이메일 모달)
- 참여하기 → 업로드 페이지 (이벤트 연결)

**규칙:**
- 상태: active/scheduled/ended (날짜 기반 자동 판정)
- 동일 이벤트 중복 참여 불가

### 3.8 EventDetail (이벤트 상세) — `/events/:id`

**할 수 있는 것:**
- 이벤트 배너, 기간, 대상, 설명 보기
- 참여하기 (업로드 + 이벤트 ID 연결)

**규칙:**
- 종료된 이벤트: 버튼 비활성화
- 중복 참여 차단

### 3.9 Search (검색) — `/search`

**할 수 있는 것:**
- 실시간 검색 (제목, 전시명, 그룹명, 작가명)
- 자동완성 (최대 8개)
- 최근 검색어 (최대 10개, 개별/전체 삭제)
- 통합 상위 매치: 작가 1명 + 작품 2개
- 작가/작품 결과 그리드

**규칙:**
- 로그인 사용자: 닉네임별 검색 기록 (`artier_recent_searches__<slug>`)
- 게스트: 공용 키 (`artier_recent_searches__guest`)
- 로그인 시 게스트 기록 → 계정 기록으로 병합
- 검색 스코어링 (searchRank.ts): 제목 +10, 작가명 +8, 전시명 +8, 그룹명 +7, 설명 +3, 태그 +4 (starts-with 보너스 각각 추가)

### 3.10 Login (로그인) — `/login`

**할 수 있는 것:**
- 소셜 로그인: 카카오 / 구글 / 애플 (언어에 따라 순서 변경)
- 이메일 로그인 (접기/펼치기)
- 비밀번호 재설정 링크

**규칙:**
- 만 14세 이상 고지
- 정지 계정: 사유 + 이의제기 링크 표시 후 차단
- 소셜 최초 가입 → SocialSignupModal (안내 문구 + 약관 동의 + 닉네임) → 온보딩
- 이미 로그인 상태면 홈으로 자동 리다이렉트
- redirect 파라미터는 내부 경로(`/`로 시작)만 허용 (외부 URL 차단)

### 3.11 Signup (회원가입) — `/signup`

**할 수 있는 것:**
- 3단계: 이메일/비밀번호 → 닉네임/생년월일 → 약관 동의
- 진행 표시바 (1/3, 2/3, 3/3)

**규칙:**
- 이메일: 유효 형식 + 미등록 확인 (registeredAccounts.ts)
- 비밀번호: 8자 이상 + 영문 1자 이상 + 숫자 1자 이상
- 닉네임: 2~20자, 비속어 불가
- 생년월일: 유효 날짜, 만 14세 이상 필수 (ageCheck.ts, `MIN_AGE=14`)
- 전체동의 체크박스 (마케팅 이메일/푸시 포함)

### 3.12 Onboarding (온보딩) — `/onboarding`

**할 수 있는 것:**
- Step 0: 환영 + 시작
- Step 1: 프로필 설정 (실명, 닉네임, 전화번호, 이메일, 프로필 이미지)
- Step 2: 완료 + 첫 업로드 유도

**규칙:**
- 실명: 2~20자, 비속어 불가 (초대/소셜 가입 시 필수)
- 닉네임: 비속어 불가
- 전화번호: 10자리 이상
- 이메일: 유효 형식 + 중복 불가 (prefill과 동일하면 허용)
- 프로필 이미지: 5MB 이하
- SMS 초대 가입 시 `artier_pending_sms_invite` 플래그 → 자동 매칭 시도
- 이름 불일치 시 sessionStorage `artier_pending_invite_claims`에 저장 → PendingInviteClaimGate 모달
- Step 1 완료 시 AP +30

### 3.13 Notifications (알림) — `/notifications`

**할 수 있는 것:**
- 전체 알림 보기 (90일 보관, 최대 200개)
- 필터: 읽음/안읽음, 유형별 (좋아요/팔로우/픽/시스템/이벤트)
- 개별 또는 전체 읽음 처리
- 개별 삭제 (X 버튼) + 읽은 알림 일괄 삭제
- 알림 클릭 → 원본으로 이동 (작품, 작가, 이벤트)
- 로그인 필수 (비로그인 시 로그인 페이지로 리다이렉트)

### 3.14 Settings (설정) — `/settings`

**할 수 있는 것:**
- 계정 ID/이메일 확인
- 글꼴 크기 조절: 작게/보통/크게
- 알림 설정 토글: 좋아요, 팔로우, 그룹 초대, 팔로잉 신작, 주간 테마, 마케팅
- 비밀번호 변경 (이메일 로그인 사용자만; 소셜 사용자는 버튼 비활성 + 상시 안내)
- 로그아웃
- 회원 탈퇴 (비밀번호 + 탈퇴 사유 필수, 위험 스타일 버튼 + 경고 문구)

**규칙:**
- 탈퇴 사유: 이용 빈도 낮음 / 타 서비스 이용 / 개인정보 우려 / 이용 불편 / 기타
- 탈퇴 시 작가명 → "작가 미상", 작품은 유지, 인터랙션 차단

### 3.15 Points (포인트) — `/points` → `/` 리다이렉트

Phase 1에서 포인트는 프론트에 미노출. 백그라운드 적립만 동작하며, 어드민에서만 확인 가능.

### 3.16 Contact (문의하기) — `/contact`

**할 수 있는 것:**
- 문의 제출: 이름, 이메일, 카테고리, 내용 (1000자)
- 첨부 파일 (5MB/개, 최대 3개: 이미지/PDF/문서)

**규칙:**
- 카테고리: 계정/업로드/신고/제안/버그/기타

### 3.17 어드민 화면들

#### AdminDashboard (`/admin`)
- 미결 이슈 수, 체크리스트 진행률, 파트너 현황, 작품 수 확인
- 차단 요소(블로커) 알림

#### ContentReview (`/admin/content-review`)
- 작품 승인(`approved`) / 반려(`rejected`, 사유 4종 선택)
- 필터: 상태별, 기간별
- 반려 사유: `low_quality`, `spam`, `inappropriate`, `copyright`
- 승인 시: 보류된 비회원 초대 자동 발송 + 팔로워 신작 알림 생성

#### PickManagement (`/admin/picks`) — Artier's Pick
- Artier's Pick 선정 (최대 10개, 주 단위 교체)
- 추가/제거, 히스토리 보기
- Pick 선정 시 `pick: true`, `pickBadge: true` 동시 부여
- 해제 시 `pick: false`로 전환, `pickBadge`는 영구 유지 (한 번 받은 이력 배지)

#### CurationManagement (`/admin/curation`) — 기획전
- 기획전 설정 (제목, 부제, 포함 전시 ID)
  - 여러 전시를 주제·맥락으로 엮는 공개 컬렉션. 그룹전·작가전·특집전 포괄.
  - 배지 부여 없음 (노출용)
- 추천 작가 토글 (피드 `featured` 버킷 부스트)

#### BannerManagement (`/admin/banners`)
- 배너 CRUD (최대 5개)
- 드래그앤드롭 순서 변경
- 기간 만료 시 자동 비활성화
- 시작일 > 종료일 날짜 순서 검증

#### EventManagement (`/admin/managed-events`)
- 이벤트 CRUD
- 상태 자동 계산 (날짜 기반) + 수동 오버라이드
- 작품 공개 토글 (`worksPublic`)
- 시작일 > 종료일 날짜 순서 검증
- 이벤트 삭제 시 연결 작품의 `linkedEventId` 자동 정리

#### ReportManagement (`/admin/reports`)
- 4가지 처리: 삭제 / 경고 / 기각 / 비공개
- 경고 3회 → 자동 7일 정지
- 기각(허위 신고) 3회 → 신고자 7일 차단

#### MemberManagement (`/admin/members`)
- 정지 4단계: 주의 / 7일 / 30일 / 영구
- 전체 사용자에게 적용 (경고/허위신고 3회 자동 정지도 전체 적용)

#### WorkManagement (`/admin/works`)
- 작품 공개/비공개 토글 (`isHidden`)
- 작품 삭제

#### PartnerArtists (`/admin/partners`)
- 단계 관리: 후보 → 연락 완료 → 온보딩 중 → 활성 → 비활성
- 제출 상태: 미제출 / 제출 완료 / 검토 중 / 승인 / 반려
- 목표: 파트너 50명, 작품 800~1,000점

#### LaunchChecklist (`/admin/checklist`)
- 17항목, 5카테고리 (QA/법무/콘텐츠/운영/마케팅)
- 상태: 시작 전 / 진행 중 / 완료 / 차단됨
- 기한 초과 시 빨간 강조

#### UnresolvedIssues (`/admin/issues`)
- 이슈 상태: 미결 / 진행 중 / 해결됨 / 보류
- 우선순위: 긴급 / 높음 / 보통 / 낮음

#### EventParticipants (`/admin/events`)
- 이벤트별 참여자 현황
- 시드 데이터 + 실제 업로드(`linkedEventId`) 병합

---

## 4. 사용자 플로우

### 4.1 신규 가입 플로우
```
Login → 소셜(카카오/구글/애플) 또는 이메일 가입
  → Signup (3단계: 이메일/비번 → 닉네임/생년월일 → 약관)
  → Onboarding (프로필 설정: 실명, 닉네임, 전화번호, 이메일, 프로필 이미지)
  → Browse (홈)
```
- 소셜 최초 가입: SocialSignupModal (약관 동의 + 닉네임) → Onboarding
- 가입 완료 시 AP +50, 온보딩 Step 1 완료 시 AP +30

### 4.2 SMS 초대 → 가입 플로우
```
비회원이 초대 링크 클릭 → ExhibitionInviteLanding
  → 가입 유도 (전화번호/이름 프리필)
  → Signup → Onboarding (프리필)
  → matchSmsInviteOnSignup() 실행
    → 전화번호+이름 일치: 작품에 자동 연결
    → 전화번호 일치+이름 불일치: PendingInviteClaimGate 모달 (수락/거부/나중에)
```

### 4.3 작품 업로드 플로우
```
Upload 진입 (기존 초안 감지 시 "이어서 작업" 토스트)
  → 유형 선택 (혼자 올리기 / 함께 올리기)
    → 함께 올리기: 역할 선택 모달 (참가자 / 강사)
  → 이미지 추가 (1~10장, 800px+, EXIF 차단)
  → 이미지별 작가 지정 (회원 검색 또는 비회원 이름+전화번호)
  → 세부정보: 전시명(필수), 그룹명, 작품명, 커버 이미지, 원작 확인, 이벤트 연결
  → 전시하기
    → feedReviewStatus: 'pending' (검수 대기)
    → 전시 완료 확인 화면 표시
    → AP +20 (첫 업로드 +100)
  → 비회원 초대는 검수 승인 시점에 발송 (업로드 시 발송하지 않음)
```

### 4.4 작품 둘러보기 → 인터랙션 플로우
```
Browse (홈) → 작품 카드 클릭 → WorkDetailModal
  → 좋아요 / 저장 / 팔로우 / 공유 / 신고
  → 좌우 화살표로 피드 내 이동
```
- 비로그인 시 인터랙션 클릭 → LoginPromptModal
- 탈퇴 작가 작품: 인터랙션 전체 차단 (좋아요/저장/팔로우/신고)
- 비공개(isHidden) 작품: 소유자 외 접근 시 미표시
- 공유: 단일 "공유하기" 버튼 (모바일: 네이티브 Share API, PC: 클립보드 복사). 멘트+링크 함께 전달
- 좋아요/저장 시 `Work.likes`/`Work.saves` 숫자도 동기화 (피드 정렬 반영)
- 커스텀 커버 이미지가 설정된 전시: 상세 모달 첫 페이지에 블랙 배경 + 전시명 라벨로 커버 슬라이드 표시 (작가 오버레이 없음, 이미지 번호 카운트에서 제외)

### 4.5 신고 → 처리 플로우
```
사용자: WorkDetailModal → 신고 (ReportModal)
  → reportsStore에 저장 (1인 1대상 1회 제한)
  → 신고자에게 해당 작품/작가 숨김 처리

운영팀: /admin/reports
  → 삭제: 작품 영구 삭제 (알림/신고/픽 참조도 연쇄 정리)
  → 경고: 대상 작가 경고 +1 (3회 → 전체 사용자 자동 7일 정지)
  → 기각: 신고자 허위 신고 +1 (3회 → 전체 사용자 7일 차단)
  → 비공개: 작품 isHidden (피드/검색/타인 프로필 제외, 본인만 보임)
```

### 4.6 검수 플로우
```
업로드 → feedReviewStatus: 'pending'
  → 운영팀 /admin/content-review
    → 승인: 'approved' → 피드 노출 + 작가 알림 + 팔로워 신작 알림 + 보류 초대 발송
    → 반려: 'rejected' + 사유 → 작가에게 사유 포함 알림
```

### 4.7 회원 탈퇴 플로우
```
Settings → 회원 탈퇴 (경고 문구 + 위험 스타일 버튼)
  → 비밀번호 확인 + 탈퇴 사유 선택
  → 작가명 → "작가 미상", 작품 유지, 인터랙션 차단
  → 해당 작가의 팔로워 델타만 삭제 (타 작가 보존)
  → 로그아웃
```

---

## 5. 코드에 박힌 정책/규칙

### 5.1 가입/인증

| 규칙 | 값 | 위치 |
|------|-----|------|
| 최소 연령 | 만 14세 | `ageCheck.ts` (`MIN_AGE=14`) |
| 비밀번호 최소 길이 | 8자 | `passwordPolicy.ts` |
| 비밀번호 구성 | 영문 1자 + 숫자 1자 이상 | `passwordPolicy.ts` |
| 닉네임 길이 | 2~20자 | `Signup.tsx` |
| 이메일/전화번호 중복 | 차단 | `registeredAccounts.ts` |

### 5.2 업로드/작품

| 규칙 | 값 | 위치 |
|------|-----|------|
| 이미지 수 | 1~10장 | `Upload.tsx` |
| 이미지 최소 해상도 | 짧은 변 800px | `Upload.tsx` |
| 제목/전시명/그룹명/작품명 최대 길이 | 20자 | `workDisplay.ts` (`TITLE_FIELD_MAX_LEN=20`) |
| 카메라 사진 차단 | JPEG EXIF Make/Model 감지 시 | `cameraExifBlock.ts` |
| 비속어 필터 | 47개 금칙어 (한/영) | `profanityFilter.ts` |
| 참가자 역할 (함께 올리기) | 본인 작품 최소 1점 포함 필수 | `Upload.tsx` |
| 강사 역할 (함께 올리기) | 본인 작품 포함 금지 | `Upload.tsx` |
| 역할 선택 시점 | 함께 올리기 선택 직후 모달 (Step 0) | `Upload.tsx` |
| 커스텀 커버 이미지 노출 | 전시 상세 첫 장 표지 (+ 피드 썸네일) | `WorkDetailModal.tsx`, `imageHelper.ts` |
| 기본 검수 상태 | `pending` | `Upload.tsx` |
| 업로드 자동 승인 | `VITE_UPLOAD_AUTO_APPROVE=true` 시 | 환경변수 |

### 5.3 피드 정렬 (feedOrdering.ts)

**작품 점수 공식:**
```
base = log1p(likes) * 2.2 + log1p(saves) * 3.2
following_bonus = 3.5 (팔로우 중이면)
total = base + following_bonus
```

**소스별 부스트:**

| 소스 | 부스트 | 노이즈 범위 |
|------|--------|------------|
| Pick (에디터스 픽) | +14 | ±5 |
| Theme (주간 테마) | +8 | ±6 |
| Featured (추천 작가) | +6 | ±6.5 |
| Personalized (팔로잉) | +7 | ±7.5 |
| Recent (14일 이내) | +3 | ±7.5 |
| Rest (일반) | +0 | ±10 |

**인터리빙 패턴:** pick → rest → theme → rest → personalized → rest → featured → rest → recent → rest (최대 2사이클)

**Pick 상한:** 최대 10개

### 5.4 검색 스코어링 (searchRank.ts)

| 필드 | 포함 시 | starts-with 보너스 |
|------|---------|-------------------|
| 제목 | +10 | +6 |
| 작가명 | +8 | +4 |
| 전시명 | +8 | +4 |
| 그룹명 | +7 | — |
| 설명 | +3 | — |
| 태그 | +4 | — |

### 5.5 피드 공개 (feedVisibility.ts)

- `feedReviewStatus === 'approved'`인 작품만 공개 피드/검색에 노출
- `pending`, `rejected`는 비노출
- 상태 미설정 시 기본 노출

### 5.6 포인트 (AP) 정책 (pointsBackground.ts)

| 이벤트 | AP | 조건 |
|--------|-----|------|
| 가입 완료 | +50 | 1회 |
| 온보딩 Step 1 | +30 | 1회 |
| 일일 둘러보기 | +5 | 일 1회 (사용자 로컬 시간대 자정 기준) |
| 첫 업로드 | +100 | 1회 |
| 일반 업로드 | +20 | 일 2회 상한, 첫 업로드 당일 제외 |
| 월 4회 업로드 | +50 | 월별 |
| 그룹 전시 개설 | +30 | 월 1회 (강사) |
| 그룹 참여 | +15 | 월 5회 상한 |
| 팔로워 10명 | +30 | 1회 |
| 팔로워 50명 | +100 | 1회 |
| 팔로워 100명 | +200 | 1회 |
| 24시간 내 삭제 | -20 | 회수 |

- 포인트 원장: 최대 500건 (`artier_points_ledger`)

### 5.7 신고/제재 정책 (sanctionStore.ts)

| 규칙 | 값 |
|------|-----|
| 경고 3회 누적 | → 자동 7일 정지 |
| 허위 신고 3회 누적 | → 신고자 7일 차단 |
| 신고 중복 | 동일 (신고자, 대상유형, 대상ID) 조합 1회 제한 |
| 정지 단계 | warning / days7 / days30 / permanent |

### 5.8 초대 (inviteMessaging.ts)

| 규칙 | 값 |
|------|-----|
| 발송 시점 | 업로드 시 즉시가 아닌, 검수 승인 시점에 발송 |
| 채널 판정 | 한국 번호(+82, 01x) → 카카오 알림톡(SMS 폴백); 해외 → 이메일 |
| 전화번호 검증 | 숫자 7자리 이상 필수 |
| 가입 번호 체크 | 이미 가입된 전화번호에는 초대 발송 차단 |
| 중복 발송 | 동일 (전화번호 해시 + workId) 차단 |
| 전화번호 마스킹 | 초대 로그에 전화번호 마스킹 저장 (010-****-5678) |
| 매칭 로그 | 최대 200건 |
| 초대 로그 | 최대 300건 |

### 5.9 배너 (bannerStore.ts)

| 규칙 | 값 |
|------|-----|
| 최대 배너 수 | 5개 |
| 기간 만료 | endAt 이후 자동 비활성화 |

### 5.10 그룹명 (groupNameRegistry.ts)

| 규칙 | 값 |
|------|-----|
| 중복 허용 | 예 (2026-04-17부터) |
| 히스토리 상한 | 50개 |
| 자동완성 (빈 쿼리) | 30개 |
| 자동완성 (쿼리 있음) | 20개 |

### 5.11 어드민 접근 (adminGate.ts)

| 규칙 | 값 |
|------|-----|
| 역할 | Guest / Creator / Instructor / Operator |
| 어드민 접근 | Operator + 로그인 필수 |
| 환경변수 우회 | `VITE_ADMIN_OPEN=true` |

### 5.12 기타

| 규칙 | 값 | 위치 |
|------|-----|------|
| 시니어 친화 터치 | 모든 인터랙티브 요소 `min-h-[44px]` | 전역 |
| 알림 보관 | 90일, 최대 200개 | `Notifications.tsx` |
| 최근 검색어 | 최대 10개 | `Search.tsx` |
| 검색어 최대 길이 | 100자 | `Search.tsx` |
| 문의 첨부 파일 | 5MB/개, 최대 3개 | `Contact.tsx` |
| 문의 내용 | 1000자 | `Contact.tsx` |
| 쿠키 동의 | `artier_cookie_consent` | `CookieConsent.tsx` |
| 다국어 | 한국어(ko) / 영어(en) | `i18n/` |
| 글꼴 크기 | 3단계 (small/medium/large) | `fontScale.ts` |

---

## 6. 데이터 저장 구조 (localStorage)

Phase 1은 백엔드가 없으므로 모든 데이터가 localStorage(일부 sessionStorage)에 저장된다. 아래는 실제 코드에서 사용하는 키 전체 목록이다.

### 6.1 핵심 앱 상태

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_works_version` | `string` | 스토리지 버전 (현재 `local-gallery-v13`) |
| `artier_works` | `Work[]` JSON | 전체 작품(전시) 데이터 |
| `artier_drafts` | `Draft[]` JSON | 업로드 초안 |
| `artier_profile` | `UserProfile` JSON | 사용자 프로필 |
| `artier_auth` | `boolean` JSON | 로그인 상태 |
| `artier_interactions` | `{liked: string[], saved: string[]}` JSON | 좋아요/저장 목록 |
| `artier_follows` | `string[]` JSON | 팔로잉 작가 ID 목록 |
| `artier_account_suspension` | `AccountSuspension` JSON | 정지 상태 |
| `artier_withdrawn_artists` | `string[]` JSON | 탈퇴 작가 ID |
| `artier_demo_last_withdraw_reason` | `string` | 최근 탈퇴 사유 |

### 6.2 피드/큐레이션/알림

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_curation_v1` | `{theme: ThemeExhibition|null, featuredArtistIds: string[]}` JSON | 큐레이션 상태 |
| `artier_feed_seen_work_ids` | `string[]` | 이미 본 작품 ID |
| `artier_notifications` | 알림 배열 JSON | 알림 목록 |
| `artier_notification_settings` | 설정 객체 JSON | 알림 설정 |

### 6.3 초대/매칭

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_invite_messaging_log` | `InviteLogEntry[]` JSON (max 300) | 초대 발송 기록 |
| `artier_invite_match_log` | `MatchResult[]` JSON (max 200) | 가입 매칭 기록 |
| `artier_pending_sms_invite` | `'1'` | SMS 초대 가입 중 플래그 |

### 6.4 포인트

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_points_ledger` | `PointLedgerEntry[]` JSON (max 500) | AP 거래 원장 |
| `artier_points_state` | `PointsState` JSON | 포인트 적립 상태 추적 |
| `artier_work_publish_times` | `Record<workId, ISO>` JSON | 업로드 시각 (24시간 삭제 회수용) |
| `artier_pp_balance` | `string` (숫자) | PP 잔액 |

### 6.5 신고/제재

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_reports` | `StoredUserReport[]` JSON | 신고 큐 |
| `artier_report_signatures_v1` | 서명 배열 JSON | 중복 신고 방지 |
| `artier_report_hidden_v2` | `Record<reporterKey, {works, artists}>` JSON | 신고자별 숨김 목록 |
| `artier_warning_counter_v1` | `Record<artistId, number>` JSON | 경고 카운터 |
| `artier_false_report_counter_v1` | `Record<reporterId, number>` JSON | 허위 신고 카운터 |

### 6.6 어드민

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_admin_banners_v1` | `AdminBanner[]` JSON | 배너 목록 |
| `artier_managed_events_v1` | `ManagedEvent[]` JSON | 이벤트 목록 |
| `artier_admin_issues` | 이슈 배열 JSON | 미결 이슈 |
| `artier_admin_checklist` | 체크리스트 배열 JSON | 런칭 체크리스트 |
| `artier_admin_partners` | 파트너 배열 JSON | 파트너 작가 |
| `artier_admin_members_v1` | 멤버 배열 JSON | 회원 관리 |
| `artier_admin_picks_v1` | Pick 배열 JSON | 에디터스 픽 |
| `artier_admin_session_v1` | `'1'` | 운영팀 역할 토글 |
| `artier_event_subscriptions` | 구독 객체 JSON | 이벤트 알림 구독 |

### 6.7 가입/계정

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_registered_emails_v1` | `string[]` JSON | 등록 이메일 레지스트리 |
| `artier_registered_phones_v1` | `string[]` JSON | 등록 전화번호 레지스트리 |
| `artier_social_signed_up__<provider>` | `boolean` JSON | 소셜 가입 여부 (kakao/google/apple) |
| `artier_pending_signup_nickname` | `string` | 가입 프리필: 닉네임 |
| `artier_pending_signup_email` | `string` | 가입 프리필: 이메일 |
| `artier_pending_signup_phone` | `string` | 가입 프리필: 전화번호 |
| `artier_pending_signup_realname` | `string` | 가입 프리필: 실명 |
| `artier_pending_social_signup` | 객체 JSON | 소셜 가입 임시 데이터 |

### 6.8 UX/기타

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_locale` | `'ko'` / `'en'` | 언어 설정 |
| `artier_font_scale` | 숫자 문자열 | 글꼴 크기 |
| `artier_cookie_consent` | 객체 JSON | 쿠키 동의 |
| `artier_onboarding_done` | `boolean` JSON | 온보딩 완료 여부 |
| `artier_splash_seen` | `boolean` JSON | 스플래시 확인 여부 |
| `artier_mock_jwt_session` | 객체 JSON | 데모 JWT |
| `artier_geo_demo_cache` | 객체 JSON | 지역 데모 캐시 |
| `artier_recent_searches__guest` | `string[]` JSON | 게스트 검색 기록 |
| `artier_recent_searches__<slug>` | `string[]` JSON | 사용자별 검색 기록 |
| `artier_last_group_name` | `string` | 최근 그룹명 |
| `artier_my_group_names` | `string[]` JSON | 그룹명 히스토리 |
| `artier_artist_follower_delta` | `Record<id, number>` JSON | 팔로워 변동 |
| `artier_inquiries` | 문의 배열 JSON | 문의 내역 |

### 6.9 sessionStorage

| 키 | 데이터 | 설명 |
|-----|--------|------|
| `artier_scroll_<key>` | 숫자 | 스크롤 위치 복원 |
| `artier_pending_invite_claims` | `BlockedInvite[]` JSON | 이름 불일치 초대 (본인 확인 대기) |

### 6.10 Deprecated (부팅 시 자동 삭제)

- `artier_instructor_public_ids` (2026-04-13)
- `artier_pin_comments` (2026-04-15)
- `artier_upload_guide_seen` (2026-04-15)
- `artier_group_canonical_map` (2026-04-17)

---

## 7. 핵심 데이터 타입

### Work (전시 단위)
```typescript
{
  id: string
  title: string                          // ≤20자
  image: string | string[]               // 1~10장
  imagePieceTitles?: string[]            // 이미지별 작품명
  imageArtists?: ImageArtistAssignment[] // 이미지별 작가
  artist: Artist                         // 대표 작가
  artistId: string
  authorId?: string                      // 업로더 (작가와 다를 수 있음)
  likes: number
  saves: number
  comments: number
  description?: string
  tags?: string[]
  category?: 'art' | 'fashion' | 'craft' | 'product'
  exhibitionName?: string                // ≤20자
  groupName?: string                     // ≤20자
  primaryExhibitionType?: 'solo' | 'group'
  isInstructorUpload?: boolean
  isHidden?: boolean
  isForSale?: boolean
  feedReviewStatus?: 'pending' | 'approved' | 'rejected'
  rejectionReason?: 'low_quality' | 'spam' | 'inappropriate' | 'copyright'
  uploadedAt?: string                    // ISO 8601
  linkedEventId?: string | number
  pick?: boolean                         // 주간 에디터스 픽
  pickBadge?: boolean                    // Pick 선정 이력 (영구 배지)
  coverImageIndex?: number
  customCoverUrl?: string
}
```

### ImageArtistAssignment
```typescript
{
  type: 'member' | 'non-member'
  memberId?: string
  memberName?: string
  memberAvatar?: string
  displayName?: string    // 비회원 표시명
  phoneNumber?: string    // 비회원 전화번호 (초대용)
}
```

### UserProfile
```typescript
{
  name: string
  nickname: string
  realName?: string
  phone?: string
  email?: string
  headline: string
  bio: string
  location: string
  interests?: string[]
  avatarUrl?: string
  externalLinks?: { label: string; url: string }[]
}
```

### ManagedEvent
```typescript
{
  id: string
  title: string
  subtitle?: string
  description: string
  bannerImageUrl: string
  linkUrl?: string
  startAt: string          // YYYY-MM-DD
  endAt: string            // YYYY-MM-DD
  status?: 'scheduled' | 'active' | 'ended'
  worksPublic: boolean
  participantsLabel?: string
}
```

### AdminBanner
```typescript
{
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  startAt?: string         // ISO date
  endAt?: string           // ISO date
  isActive: boolean
}
```

### StoredUserReport
```typescript
{
  id: string
  targetType: 'work' | 'artist'
  targetId?: string
  targetName: string
  targetArtistId?: string
  reporterId?: string
  reason?: string
  reasonKey?: string
  reasonLabel?: string
  detail: string
  createdAt: string
  adminStatus?: 'pending' | 'resolved' | 'hidden' | 'deleted' | 'warned' | 'dismissed'
}
```

---

## 8. 외부 연동 현황 (Phase 1 = 모의)

| 항목 | 상태 | 비고 |
|------|------|------|
| 소셜 OAuth (카카오/구글/애플) | 모의 | localStorage 기반 시뮬 |
| SMS/카카오 알림톡 | 모의 | `inviteMessaging.ts` 로그만 저장 |
| 이메일 발송 | 모의 | 토스트로 대체 |
| Supabase/BaaS | 미연동 | 전체 localStorage |
| GA4 Analytics | 스캐폴딩 | `gtag()` 호출 구조만 존재 |
| OG 이미지 | 미구현 | SPA 제한 |

---

## 9. 환경변수

| 변수 | 효과 | 용도 |
|------|------|------|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 업로드 즉시 `approved` | 로컬/PM 데모 |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회 | CI/프리뷰 |
| `VITE_FOOTER_QA_LINKS` | QA 바로가기 플로팅 버튼 활성화 | QA/검수 |
