# 개발자 인수인계 문서 — Artier (SuperGallery Phase 1)

> **이 문서를 읽는 당신에게**
>
> 이 프로젝트는 `reference/` 폴더에 있는 **217개 마크다운 명세**를 기준으로 처음 만들어졌습니다.
> 이후 PM이 바이브코딩으로 다양한 수정을 진행했기 때문에, **reference 원문과 현재 코드가 다른 부분이 많습니다.**
>
> 또한 서버·인증·외부 API 연동은 PM이 직접 구현할 수 없었기 때문에,
> **UI만 있고 실제로는 동작하지 않는 목업(mock)** 상태인 기능들이 있습니다.
>
> 이 문서는 그 현황을 정리한 것입니다.

---

## 목차

1. [reference와 달라진 것](#1-reference와-달라진-것)
2. [목업 — UI만 있고 실제 동작 안 하는 것](#2-목업--ui만-있고-실제-동작-안-하는-것)
3. [현재 코드 기준 확정 수치](#3-현재-코드-기준-확정-수치)
4. [파일 위치 가이드](#4-파일-위치-가이드)
5. [런칭 전 반드시 해야 할 것](#5-런칭-전-반드시-해야-할-것)

---

## 1. reference와 달라진 것

reference 명세 기준으로 개발했지만, 이후 바이브코딩 과정에서 **PM 판단으로 변경한 항목**들입니다.
현재 코드가 정본이고, reference 원문은 추후 업데이트가 필요합니다.

### 1.1 UX·플로우

| 뭘 바꿨나 | reference는 | 지금 코드는 | 왜 바꿨나 |
|---|---|---|---|
| **전시 제목** | 기존 전시명 드롭다운 자동완성 | 직접 입력만, 20자 제한 | 시니어 사용자에겐 단순 입력이 나음 |
| **이미지 장수** | 최대 20장 | **최대 10장** | 시니어에게 20장은 부담 |
| **강사 표시** | 프로필에 "강사 토글" ON/OFF | 작품 올릴 때 "강사로 올리기" 체크하면 자동 표시. 별도 토글 없음 | 토글을 따로 관리 안 해도 됨 |
| **WorkCard 숫자** | 좋아요·댓글 숫자 노출 | 숫자 없이 아이콘만 (댓글 기능 자체가 Phase 1 범위 밖) | PRD에서 댓글 제외함 |
| **전시 공유 URL** | `/exhibitions/:id` 단일 진입 | `?from=invite` / `?from=work` / `?from=credited` 쿼리 분기 | 초대장·작품 공유·참여 작가별 다른 랜딩 필요 |
| **확인 다이얼로그** | 브라우저 기본 confirm | 앱 내 ConfirmDialog 컴포넌트 사용 | 시각 일관성 |
| **온보딩 실명·전화** | 선택 입력 | **모든 경로에서 필수** (이메일은 소셜 가입자만 필수) | 회원 정보 일관성 + SMS 초대 매칭 |
| **로그인 유도** | 액션마다 모달 | 세션당 1회만 모달, 이후는 토스트 | 반복 모달이 거슬림 |
| **업로드 후 이동** | 작품 상세로 이동 | 내 프로필 전시 탭으로 이동 | 검수 대기 배너 보여주려고 |
| **작품 썸네일** | object-cover (잘림) | **object-contain** (원본 비율 유지) | 미술 작품이라 잘리면 안 됨 |
| **비회원 초대 발송** | 바로 발송 | 발행 직전 confirm 모달로 실명 정확성 경고 + 수신자 목록 표시 | 별명·호칭 입력 시 가입 후 자동 매칭 실패 방지 |
| **SMS 매칭 실패 회복** | 없음 | 가입 시 전화는 맞고 이름만 다르면 홈 진입 시 본인 확인 모달 (수락/신고/보류) | 이름 불일치로 연결 실패한 작품을 본인 확인 후 수동 연결 |

### 1.2 정책·수치

| 뭘 바꿨나 | reference는 | 지금 코드는 |
|---|---|---|
| **피드 랭킹** | 좋아요·저장·댓글 | 좋아요 ×2 + 저장 ×3 + 팔로우 +8 (댓글 제외) |
| **Pick 목록** | 상한 없음 | 최대 10건 |
| **이미지 최소 해상도** | 없음 | 단변 800px 이상 |
| **카메라 촬영 차단** | 없음 | JPEG EXIF에 카메라 정보 있으면 업로드 거부 (직접 찍은 사진 차단) |
| **신고 처리** | 단순 "처리" | 4종 액션 (삭제 / 경고 / 기각 / 비공개) + 허위 신고 3회 시 차단 |
| **정지 단계** | 없음 | 4단계 (주의 / 7일 / 30일 / 영구) |
| **중복 가입** | 없음 | 이메일·전화번호 중복 시 가입 차단 |

### 1.3 데이터 저장 방식

reference에서는 서버 DB를 전제로 하지만, **현재는 전부 브라우저 localStorage**입니다.

| 데이터 | reference 기준 | 현재 |
|---|---|---|
| 작품 데이터 | 서버 DB | `localStorage` → `artier_works` 키 |
| 검색 히스토리 | 서버 저장 | `localStorage` (계정별 키) |
| 배너·이벤트·큐레이션 | 서버 어드민 | `localStorage` (각각 `artier_admin_banners_v1` 등) |
| 비회원 전화번호 | 작품에 저장 | 발행 시 **스크럽(제거)** — 이름만 남김 |

---

## 2. 목업 — UI만 있고 실제 동작 안 하는 것

**서버·인증·외부 API를 모르기 때문에 UI와 로컬 시뮬레이션만 만들어 놓은 것들입니다.**
실서비스로 가려면 아래 항목들을 실제 연동해야 합니다.

### 2.1 반드시 실연동 필요

| 기능 | 현재 상태 | 실제로 필요한 것 |
|---|---|---|
| **소셜 로그인** (카카오·구글·애플) | 버튼 누르면 바로 로그인된 것처럼 처리 | OAuth 실연동 |
| **이메일 로그인** | 어떤 이메일이든 즉시 로그인 | 이메일 소유권 인증 (인증 메일 발송) |
| **이메일 발송** (10종 템플릿) | 템플릿 HTML만 있음, 실제 발송 안 됨 | SES / SendGrid 등 연동 |
| **SMS / 카카오 알림톡** | 콘솔 로그만 기록 (5% 확률로 실패 시뮬) | 실제 SMS 게이트웨이 연동 |
| **DB 서버** | localStorage | Supabase 등 실서버 |
| **OG 이미지** | 정적 메타태그만 | 동적 OG 이미지 생성 (SSR 필요) |
| **푸시 알림** | 로컬 시뮬레이션 | 명세상 "Phase 1 푸시 없음" — Phase 2 과제 |

### 2.2 PM 데모용 화면 (배포 전 제거 또는 숨기기)

| 경로 | 용도 | 처리 |
|---|---|---|
| `/demo` | 전체 플로우 맵 + 알림 시뮬레이션 | 배포 전 제거 권장 |
| `/demo/reference` | JWT·GeoIP·이메일 템플릿 미리보기 | 배포 전 제거 권장 |
| `/points` | AP/PP 포인트 잔액·원장 UI | Phase 2에서 정식 공개 |
| QA 바로가기 (플로팅 버튼) | 화면 바로가기 테스트용 | `VITE_FOOTER_QA_LINKS=false`로 숨김 |

### 2.3 구현했지만 실동작은 Phase 2

| 기능 | 현재 | Phase 2에서 |
|---|---|---|
| Pick 자동 초기화 | "매주 월요일 자정" 안내 텍스트만 | 서버 스케줄러로 실제 초기화 |
| Pick 20일 중복 제한 | 미구현 (운영 수동) | 서버에서 자동 검증 |
| 포인트 만료 배치 | 시뮬 로그만 | 서버 cron |
| 신고 SLA 자동화 | 타임스탬프만 저장 | 서버 알림·에스컬레이션 |
| 법정 대리인 동의 | 만 14세 미만 차단으로 대체 | 실제 동의 플로우 |
| 데이터 내보내기·삭제 | 없음 | 개인정보보호법 대응 필수 |

---

## 3. 현재 코드 기준 확정 수치

reference 문서와 다를 수 있으니, **이 표를 기준으로** 보세요.

### 3.1 업로드

| 항목 | 값 |
|---|---|
| 전시당 이미지 | 최대 **10장** |
| 파일 크기 | 10MB 초과 차단 |
| 허용 포맷 | JPEG, PNG, WebP, GIF |
| 최소 해상도 | 단변 **800px** |
| 카메라 원본 | EXIF에 카메라 정보 있으면 거부 |
| 전시 제목 | 최대 **20자** |
| 그룹명 | 최대 **20자** · 그룹 업로드 시 필수 |
| 작품 제목 | 최대 20자 |

### 3.2 가입·온보딩

| 항목 | 값 |
|---|---|
| 비밀번호 | 8자 이상 + 영문·숫자 각 1자 |
| 닉네임 | 2~20자, 비속어 불가 |
| 나이 제한 | 만 14세 이상 |
| 실명·전화 | **모든 경로에서 필수** |
| 이메일 | 소셜 첫 가입자만 온보딩에서 필수 (이메일 가입자는 가입 폼에서 수집) |
| 중복 가입 | 이메일·전화 중복 시 차단 |

**온보딩 prefill (가입 경로에서 이미 받은 정보는 자동 채움, 사용자가 수정 가능):**

| 가입 경로 | prefill되는 필드 | 저장 키 |
|---|---|---|
| 이메일 가입 (`Signup.tsx`) | 이메일 | `artier_pending_signup_email` |
| 소셜 첫 가입 (`SocialSignupModal`) | 닉네임 + provider 이메일 | `artier_pending_signup_nickname`, `artier_pending_signup_email`, `artier_pending_social_signup` |
| SMS 초대 링크 (`ExhibitionInviteLanding`) | 초대받은 전화·표시명 | `artier_pending_signup_phone`, `artier_pending_signup_realname`, `artier_pending_sms_invite` |

온보딩 종료 시 모든 `artier_pending_*` 플래그 일괄 정리. 실명·전화는 prefill이 있어도 사용자가 수정 가능(오타 수정 등).

### 3.3 포인트 (AP)

| 이벤트 | AP |
|---|---|
| 회원가입 | +50 |
| 온보딩 완료 | +30 |
| 첫 작품 발행 | +100 |
| 이후 작품 발행 | +20 (하루 2회까지) |
| 같은 달 4번째 발행 | +50 |
| 그룹전시 강사 업로드 | +30 (월·강사 조합당 1회) |
| 그룹전시 비강사 참여 | +15 (월 5회까지) |
| 팔로워 10/50/100명 | +30 / +100 / +200 |
| 일일 둘러보기 | +5 |
| 24시간 내 삭제 | **-20** (회수) |

### 3.4 피드 (둘러보기)

- 버킷 순서: **Pick → 테마전 → 추천 작가 → 신규(14일) → 일반**
- 같은 작품은 하나의 버킷에만 노출
- 점수: 좋아요 ×2 + 저장 ×3 + 팔로우 중 작가 +8
- 비공개·검수 대기·반려 작품은 피드에서 제외

### 3.5 기타

| 항목 | 값 |
|---|---|
| 알림 보관 | 200건 / 90일 |
| 검색 히스토리 | 계정당 10개 |
| 비속어 검사 위치 | 전시명, 그룹명, 닉네임, 프로필 편집 |
| 최소 터치 영역 | 44px |
| 글자 크기 옵션 | 작게 / 보통 / 크게 (3단) |

---

## 4. 파일 위치 가이드

### 4.1 주요 화면

| 화면 | 파일 |
|---|---|
| 둘러보기 피드 | `src/app/pages/Browse.tsx` |
| 업로드 | `src/app/pages/Upload.tsx` |
| 프로필 | `src/app/pages/Profile.tsx` |
| 검색 | `src/app/pages/Search.tsx` |
| 가입 | `src/app/pages/Signup.tsx` |
| 로그인 | `src/app/pages/Login.tsx` |
| 온보딩 | `src/app/pages/Onboarding.tsx` |
| 전시 상세 | `src/app/pages/ExhibitionDetail.tsx` |
| 전시 초대 랜딩 | `src/app/pages/ExhibitionInviteLanding.tsx` |
| 전시 작품 공유 랜딩 | `src/app/pages/ExhibitionWorkShareLanding.tsx` |
| 전시 라우트 분기 | `src/app/pages/ExhibitionRoute.tsx` |
| 이벤트 | `src/app/pages/Events.tsx` |

### 4.2 어드민

| 화면 | 파일 |
|---|---|
| 대시보드 | `src/app/admin/AdminDashboard.tsx` |
| 콘텐츠 검수 | `src/app/admin/ContentReview.tsx` |
| 작품 관리 | `src/app/admin/WorkManagement.tsx` |
| 신고 관리 | `src/app/admin/ReportManagement.tsx` |
| 회원 관리 | `src/app/admin/MemberManagement.tsx` |
| Pick 관리 | `src/app/admin/PickManagement.tsx` |
| 배너 관리 | `src/app/admin/BannerManagement.tsx` |
| 이벤트 관리 | `src/app/admin/EventManagement.tsx` |
| 큐레이션 관리 | `src/app/admin/CurationManagement.tsx` |

### 4.3 핵심 유틸

| 역할 | 파일 |
|---|---|
| 작품 데이터 + 스토리지 버전 | `src/app/store.ts` (현재 `local-gallery-v11`) |
| 피드 랭킹 | `src/app/utils/feedOrdering.ts` |
| 피드 공개 필터 | `src/app/utils/feedVisibility.ts` |
| 검색 랭킹 | `src/app/utils/searchRank.ts` |
| SMS 초대·자동 매칭 | `src/app/utils/inviteMessaging.ts` |
| 포인트 적립·회수 | `src/app/utils/pointsBackground.ts` |
| 경고·정지 처리 | `src/app/utils/sanctionStore.ts` |
| 비속어 필터 | `src/app/utils/profanityFilter.ts` |
| 카메라 EXIF 차단 | `src/app/utils/cameraExifBlock.ts` |
| 이미지 리사이즈·WebP 변환 | `src/app/utils/imageHelper.ts`, `imageToWebp.ts` |
| 그룹명 자동완성 | `src/app/utils/groupNameRegistry.ts` |
| 배너 순서 (DnD) | `src/app/utils/bannerStore.ts` |
| 중복 가입 검사 | `src/app/utils/registeredAccounts.ts` |
| 나이 검사 | `src/app/utils/ageCheck.ts` |
| 다국어 (한/영) | `src/app/i18n/messages.ts` |

### 4.4 localStorage 키 목록

| 분류 | 키 |
|---|---|
| **작품** | `artier_works`, `artier_works_version`, `artier_drafts` |
| **사용자** | `artier_profile`, `artier_auth`, `artier_follows`, `artier_interactions` |
| **가입** | `artier_registered_emails_v1`, `artier_registered_phones_v1`, `artier_pending_sms_invite`, `artier_pending_signup_nickname`, `artier_pending_signup_email`, `artier_pending_signup_phone`, `artier_pending_signup_realname`, `artier_pending_social_signup` |
| **어드민** | `artier_admin_banners_v1`, `artier_managed_events_v1`, `artier_curation_v1`, `artier_admin_picks_v1` |
| **제재** | `artier_warning_counter_v1`, `artier_false_report_counter_v1`, `artier_reports`, `artier_account_suspension` |
| **포인트** | `artier_points_ledger`, `artier_pp_balance` |
| **초대** | `artier_invite_messaging_log`, `artier_invite_match_log` |
| **sessionStorage** | `artier_pending_invite_claims` (가입 시 이름 불일치로 차단된 초대 — 홈 진입 시 본인 확인 모달에서 소비) |

---

## 5. 런칭 전 반드시 해야 할 것

### 5.1 서버 연동 (목업 → 실제)

- [ ] Supabase 또는 DB 서버 연결 — localStorage → 실제 DB로 이관
- [ ] 소셜 로그인 OAuth 연동 (카카오·구글·애플)
- [ ] 이메일 소유권 인증 구현
- [ ] 이메일 발송 연동 (10종 템플릿은 이미 있음)
- [ ] SMS / 카카오 알림톡 게이트웨이 연동
- [ ] OG 이미지 동적 생성 (SSR)

### 5.2 법무 필수

- [ ] 개인정보처리방침 최종 확정 (현재 초안 상태)
- [ ] 이용약관 법무 검토 (현재 5개 조문 초안)
- [ ] 데이터 내보내기·삭제 요청 기능 구현 (개인정보보호법)
- [ ] DPO(개인정보보호 책임자) 공개

### 5.3 배포 전 정리

- [ ] `/demo`, `/demo/reference` 경로 제거 또는 비활성화
- [ ] `VITE_FOOTER_QA_LINKS=false` 확인 (또는 제거)
- [ ] `VITE_UPLOAD_AUTO_APPROVE` 환경변수 제거 (검수 우회 방지)

---

## 관련 문서

| 문서 | 보는 때 |
|---|---|
| `reference/` 폴더 (217개 md) | 원래 기획 명세 원문이 필요할 때 |
| `IMPLEMENTATION_DELTA.md` | reference와 코드 차이의 상세 근거가 궁금할 때 |
| `REFERENCE_DELTA.md` | reference 파일 하나하나 어디가 달라졌는지 볼 때 |
| `docs/upload_spec.md` | 업로드 기능 상세 스펙 |
| `CLAUDE.md` | AI 코딩 시 컨텍스트 규칙 |
