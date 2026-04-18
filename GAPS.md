# GAPS.md — Artier Phase 1 전수 감사 결과

> 코드 기반 전수 조사로 발견된 모든 빈틈. 추측 없이 실제 코드에서 확인된 것만 기재.
> 생성일: 2026-04-18

---

## 1. 모순/충돌 (내부 정합성 깨짐)

> 한 곳에서는 A인데, 다른 곳에서는 B로 동작하는 것들.
> ✅ 표시는 이번 세션에서 수정 완료된 항목.

### 1-1. ✅ 좋아요/저장 숫자가 인터랙션에 연동 안 됨
- **파일:** `src/app/store.ts:472-498`
- **현재:** `toggleLike`/`toggleSave`가 `userInteractionStore` 배열만 업데이트하고, `Work.likes`/`Work.saves` 숫자 필드는 변경하지 않았음
- **빵꾸:** 피드 정렬(`feedOrdering.ts`)이 `Work.likes`/`Work.saves`를 기반으로 스코어링하므로, 사용자 인터랙션이 피드 순서에 전혀 반영되지 않음
- **상태:** ✅ 수정 완료 (`fix/main-flow-consistency` 브랜치)

### 1-2. ✅ isHidden 작품이 타인 프로필/직접 URL에서 노출
- **파일:** `src/app/pages/Profile.tsx:199-214`, `src/app/components/WorkDetailModal.tsx:108`
- **현재:** Browse/Search는 `isHidden` 필터링하지만, Profile(타인 보기)과 WorkDetailModal(직접 URL)은 필터 없음
- **빵꾸:** 어드민이 신고 처리로 비공개 처리한 작품이 프로필 방문이나 직접 URL로 여전히 보임
- **상태:** ✅ 수정 완료

### 1-3. ✅ 작품 삭제 시 알림/신고/픽 참조 잔존
- **파일:** `src/app/store.ts:185-193`
- **현재:** `removeWork()`가 interactions, curation은 정리하지만 notifications, reports, picks는 안 함
- **빵꾸:** 알림에서 삭제된 작품 클릭 시 404
- **상태:** ✅ 수정 완료

### 1-4. ✅ 이벤트 중복 참여 차단 미구현
- **파일:** `src/app/pages/Upload.tsx:757-764`
- **현재:** CURRENT_SPEC에 "동일 이벤트 중복 참여 불가"라고 명시했지만, `linkedEventId` 중복 검증 없음
- **상태:** ✅ 수정 완료

### 1-5. ✅ 회원 탈퇴 시 전체 팔로워 델타 삭제
- **파일:** `src/app/utils/artistFollowDelta.ts:35-37`, `src/app/store.ts:686`
- **현재:** `clearFollowerDeltas()`가 모든 작가의 팔로워 변동 기록을 삭제
- **빵꾸:** 한 명이 탈퇴하면 모든 작가의 팔로워 표시가 원래 시드값으로 리셋
- **상태:** ✅ 수정 완료

### 1-6. ✅ 수정 발행 후 초안 미정리
- **파일:** `src/app/pages/Upload.tsx:757-813`
- **현재:** 초안에서 발행하거나 기존 작품을 수정 발행해도 draft가 `artier_drafts`에 남음
- **상태:** ✅ 수정 완료

### 1-7. ✅ Notifications 페이지 인증 체크 없음
- **파일:** `src/app/pages/Notifications.tsx:179`
- **현재:** 비로그인 상태에서 `/notifications` 직접 접근 가능
- **상태:** ✅ 수정 완료

### 1-8. ✅ Profile 하드코딩 20 vs TITLE_FIELD_MAX_LEN
- **파일:** `src/app/pages/Profile.tsx:426-459`
- **현재:** 상수를 import하면서도 닉네임/헤드라인 입력에 `20`을 하드코딩
- **상태:** ✅ 수정 완료

### 1-9. ✅ CLAUDE.md 버전/CURRENT_SPEC 배너 수 문서 불일치
- **파일:** `CLAUDE.md`, `CURRENT_SPEC.md`
- **현재:** 코드는 `v13`/배너 5개인데 문서는 `v11`/8개
- **상태:** ✅ 수정 완료

### 1-10. 공유 랜딩에서 pending 작품이 외부에 노출
- **파일:** `src/app/pages/ExhibitionInviteLanding.tsx:30-48`, `ExhibitionWorkShareLanding.tsx`
- **현재:** Browse/Search는 `feedReviewStatus !== 'approved'` 필터링하지만, 초대/공유 랜딩은 필터 없음
- **빵꾸:** 검수 대기 작품이 공유 URL로 외부에 노출됨
- **판단:** 기획 판단 필요 — 초대 링크는 pending도 보여주는 것이 의도인지

### 1-11. 계정 정지가 로그인 시점에만 체크됨
- **파일:** `src/app/pages/Login.tsx:52-65`
- **현재:** `Login.tsx`에서만 `accountSuspensionStore.get().active` 체크. 이미 로그인된 세션에서는 미체크
- **빵꾸:** 어드민이 계정을 정지해도 이미 로그인된 사용자는 계속 활동 가능
- **판단:** 추가 구현 필요 — 전역 가드 또는 주기적 체크

### 1-12. 소셜 가입 시 만 14세 연령 검증 없음
- **파일:** `src/app/components/SocialSignupModal.tsx`, `src/app/pages/Onboarding.tsx`
- **현재:** 이메일 가입은 `meetsMinAge()` 검증(`Signup.tsx:86`), 소셜 가입은 생년월일 입력 자체가 없음
- **빵꾸:** 한국 정보통신망법 만 14세 규정 위반 가능성
- **판단:** 기획 판단 필요 — 소셜 가입에도 생년월일 수집할지, OAuth 제공자의 연령 정보를 신뢰할지

### 1-13. 삭제 후 피드백 토스트가 제각각
- **파일:** `src/app/pages/Profile.tsx:904-910` (토스트 없음) vs `src/app/admin/BannerManagement.tsx:114` (토스트 있음)
- **현재:** 사용자 작품/초안 삭제는 성공 토스트 없음. 어드민 배너/이벤트/작품 삭제는 토스트 있음
- **빵꾸:** 사용자가 직접 하는 가장 중요한 삭제에 피드백 없음
- **판단:** 추가 구현 필요

### 1-14. 탈퇴 작가 작품이 피드에 계속 노출되고 인터랙션도 가능
- **파일:** `src/app/pages/Browse.tsx:278`, `src/app/store.ts:584-605`
- **현재:** `performAccountWithdrawal()`이 작품을 익명화하지만 삭제하지 않음. 피드 필터에 `withdrawnArtistStore.isWithdrawn()` 체크 없음. 팔로우 토글에도 탈퇴 체크 없음
- **빵꾸:** "삭제된 사용자"의 작품에 좋아요/팔로우 가능
- **판단:** 기획 판단 필요 — 탈퇴 작품을 피드에서 제거할지, 유지하되 인터랙션 차단할지

### 1-15. 네이밍 혼재: Work/Exhibition/전시/작품
- **파일:** `src/app/data.ts` (Work 타입), `src/app/routes.ts` (/exhibitions/ URL), `src/app/i18n/messages.ts` ("작품이 등록되었습니다" 토스트)
- **현재:** 코드 타입은 `Work`, URL은 `exhibitions`, UI 버튼은 "전시하기", 토스트는 "작품이 등록"
- **빵꾸:** 동일 엔티티가 4가지 이름으로 혼용. 새 개발자 합류 시 혼란
- **판단:** 추가 구현 필요 — `Work` → `Exhibition` 리네이밍 또는 용어 사전 확정

### 1-16. "저장" vs "컬렉션" 혼용
- **파일:** `src/app/i18n/messages.ts:728` ("저장"), `messages.ts:516` ("컬렉션"), `messages.ts:318` ("작품 컬렉션")
- **현재:** 같은 북마크 기능을 "저장", "컬렉션" 두 단어로 부름
- **판단:** 기획 판단 필요 — 용어 통일

### 1-17. pick vs editorsPick vs curation vs featured 4중 명칭
- **파일:** `src/app/data.ts:47-48` (`pick`, `editorsPick`), `src/app/routes.ts:105-106` (`/picks`, `/curation`)
- **현재:** 두 불리언 필드 + 두 어드민 페이지 + 피드 정렬 4카테고리
- **빵꾸:** "운영팀 추천" 하나의 개념이 4갈래로 분산
- **판단:** 추가 구현 필요 — 개념 정리 후 통합

---

## 2. 반쪽짜리 기능 (시작만 있고 끝이 없는 것)

### 2-1. 알림: 읽음 처리만 있고 삭제 없음
- **파일:** `src/app/pages/Notifications.tsx:224-228`
- **현재:** `markAsRead()`, `markAllRead()` 존재. 개별/전체 삭제 없음
- **빵꾸:** 200개 상한에 90일 보관인데 정리 수단 없음
- **판단:** 추가 구현 필요

### 2-2. 신고: 제출만 있고 내 신고 내역/철회 없음
- **파일:** `src/app/components/ReportModal.tsx:74-112`
- **현재:** `appendUserReport()` 제출만 가능. 사용자 본인의 신고 목록 조회/철회 불가
- **빵꾸:** 기각 3회 = 7일 차단인데, 본인 신고 이력 확인 불가
- **판단:** 추가 구현 필요

### 2-3. 이벤트 알림 구독: 등록만 있고 해지/조회 없음
- **파일:** `src/app/pages/Events.tsx:48-64`
- **현재:** 이메일 구독 추가만 가능. 해지/내 구독 목록 없음
- **빵꾸:** GDPR/개인정보보호법상 구독 해지 수단 필수
- **판단:** 추가 구현 필요 (법적)

### 2-4. 문의: 제출만 있고 내역 확인 없음
- **파일:** `src/app/pages/Contact.tsx:42-73`
- **현재:** `artier_inquiries`에 저장 후 토스트만. 상태 확인/후속 메시지 불가
- **판단:** 추가 구현 필요

### 2-5. 계정 정지: 어드민 이력 관리 없음, 사용자 이의제기 없음
- **파일:** `src/app/admin/MemberManagement.tsx:99-125`
- **현재:** 현재 상태만 표시. 과거 정지 이력/사유 이력 없음. 사용자 이의제기는 Contact 안내뿐
- **판단:** 추가 구현 필요

### 2-6. 검수 승인/반려 시 자동 알림 없음
- **파일:** `src/app/admin/ContentReview.tsx:64-91`
- **현재:** 어드민이 `pushDemoNotification` 수동 호출. 상태 변경 시 자동 알림 발행 없음
- **빵꾸:** 어드민이 알림 보내기를 잊으면 작가는 영원히 모름
- **판단:** 추가 구현 필요

### 2-7. 팔로워에게 신작 알림 없음
- **파일:** 알림 설정에 "팔로잉 작가 신작" 토글 있음 (`Settings.tsx:279`), 하지만 작품 발행 시 팔로워에게 알림 생성하는 코드 없음
- **빵꾸:** 팔로우의 핵심 가치(신작 알림)가 미구현
- **판단:** 추가 구현 필요

### 2-8. 포인트 페이지 접근 경로 없음
- **파일:** `src/app/routes.ts:75` (`/points` → `/` 리다이렉트), 헤더/설정에 링크 없음
- **현재:** `Points.tsx` 컴포넌트 존재하지만 어디에서도 접근 불가. 포인트 적립 토스트만 뜸
- **판단:** 추가 구현 필요 — 설정 또는 프로필에 링크 추가

### 2-9. 이벤트 참여 후 제출 상태 확인 불가
- **파일:** `src/app/pages/EventDetail.tsx:32-46`, `src/app/pages/Profile.tsx`
- **현재:** 이벤트 연결 업로드 완료 후 제출 상태(검수 대기/승인/반려) 확인 화면 없음
- **판단:** 추가 구현 필요

### 2-10. 둘러보기에 사용자 정렬 옵션 없음
- **파일:** `src/app/pages/Browse.tsx`
- **현재:** 피드 정렬은 `feedOrdering.ts` 알고리즘 전용. 최신순/좋아요순/저장순 사용자 선택 불가
- **판단:** 기획 판단 필요 — 알고리즘 전용이 의도인지

### 2-11. 어드민 콘텐츠 검수: 일괄 처리 없음
- **파일:** `src/app/admin/ContentReview.tsx:64-91`
- **현재:** 단건 승인/반려만 가능. 체크박스 다중선택 + 일괄 처리 없음
- **빵꾸:** 파트너 50명, 목표 800~1,000점에서 단건 처리는 운영 병목
- **판단:** 추가 구현 필요

### 2-12. 팔로워/팔로잉 목록이 5명 샘플만
- **파일:** `src/app/pages/Profile.tsx:1479-1480`
- **현재:** `.slice(0, 5)`, `.slice(2, 6)` 하드코딩. 전체 목록 페이지네이션 없음
- **판단:** 추가 구현 필요

### 2-13. 모바일 이미지 스와이프 없음
- **파일:** `src/app/components/WorkDetailModal.tsx:829-843`
- **현재:** 데스크탑 좌우 화살표는 있지만 `hidden sm:flex`. 모바일 스와이프 제스처 미구현
- **빵꾸:** 시니어 타깃 + 이미지 10장 가능. 모바일에서 다중 이미지 탐색 불가
- **판단:** 추가 구현 필요

### 2-14. ErrorBoundary 정의만 있고 사용 안 됨
- **파일:** `src/app/components/ErrorBoundary.tsx` (정의), `App.tsx`/`Layout.tsx` (미사용)
- **현재:** 컴포넌트 파일만 있고 어디에서도 wrapping 안 됨
- **빵꾸:** 렌더 에러 시 전체 화면 백지
- **판단:** 추가 구현 필요

---

## 3. 엣지 케이스 구멍

### 3-1. 전시명 빈 채로 발행 가능
- **파일:** `src/app/pages/Upload.tsx:595-619`
- **현재:** UI 블로커(빨간 테두리)만 있고 `handlePublish`에 빈 전시명 검증 없음
- **빵꾸:** 전시명 없이 발행 가능
- **판단:** 추가 구현 필요

### 3-2. EXIF 카메라 차단 우회 가능 (파일 리네임)
- **파일:** `src/app/utils/cameraExifBlock.ts:115`
- **현재:** `file.type`과 확장자로만 JPEG 판정. `.jpg` → `.png` 리네임하면 `image/png`으로 인식
- **빵꾸:** 카메라 사진 차단 정책 우회 가능
- **판단:** 추가 구현 필요 — magic bytes 기반 판정

### 3-3. 로그인 redirect에 외부 URL 허용
- **파일:** `src/app/pages/Login.tsx:19, 75`
- **현재:** `searchParams.get('redirect')` 미검증, `navigate(redirectTo)` 직접 호출
- **빵꾸:** `/login?redirect=https://evil.com` → 로그인 후 외부 사이트 이동. 피싱 가능
- **판단:** 추가 구현 필요 — 내부 경로만 허용하는 화이트리스트

### 3-4. 온보딩 프로필 이미지 파일 크기 무제한
- **파일:** `src/app/pages/Onboarding.tsx:161-170`
- **현재:** `file.type.startsWith('image/')` 체크만. 파일 크기 제한 없음
- **빵꾸:** 50MB 이미지 → `readAsDataURL`로 메모리에 올림 → 브라우저 멈춤
- **판단:** 추가 구현 필요

### 3-5. 프로필 바이오 글자수 무제한
- **파일:** `src/app/pages/Profile.tsx:470-476`
- **현재:** `textarea`에 `maxLength` 없음. 닉네임(20자), 헤드라인(20자)은 제한 있음
- **빵꾸:** 바이오에 수천 자 입력 가능. 프로필 카드 레이아웃 깨짐
- **판단:** 추가 구현 필요

### 3-6. 검색 input maxLength 없음
- **파일:** `src/app/pages/Search.tsx:198`
- **현재:** input에 `maxLength` 없음
- **빵꾸:** 1000자+ 붙여넣기 가능. 성능 저하
- **판단:** 추가 구현 필요

### 3-7. 비밀번호 재설정 — 미등록 이메일도 "발송 완료" 표시
- **파일:** `src/app/pages/PasswordReset.tsx:31-39`
- **현재:** 이메일 형식만 체크, 등록 여부 미확인. 미등록 이메일도 성공 화면
- **빵꾸:** 사용자 혼란 (이메일이 안 오는데 "발송됨"이라 표시)
- **판단:** 기획 판단 필요 — 보안상 의도적으로 "등록 여부 노출 안 함"일 수도 있음

### 3-8. 삭제된 작품 수정 모드 진입 시 에러 없음
- **파일:** `src/app/pages/Upload.tsx:461-462`
- **현재:** `/upload?edit=삭제된ID` → `work = workStore.getWork(editId)` → `if (!work) return;` → 빈 양식
- **빵꾸:** 에러 토스트/리다이렉트 없이 조용히 빈 화면
- **판단:** 추가 구현 필요

### 3-9. 이미 로그인된 상태에서 `/login` 접근해도 리다이렉트 안 함
- **파일:** `src/app/pages/Login.tsx:29-40`
- **현재:** 로그인 상태 체크 없이 로그인 폼 표시
- **빵꾸:** 이미 로그인된 사용자가 다시 로그인 가능
- **판단:** 추가 구현 필요

### 3-10. 초대 전화번호 형식 검증 없음
- **파일:** `src/app/utils/inviteMessaging.ts:31-40, 94-123`
- **현재:** 채널 판정(한국/해외)만 하고 유효성 미체크. "abc" 같은 문자열도 수용
- **판단:** 추가 구현 필요

### 3-11. 이미 가입된 전화번호에도 비회원 초대 발송
- **파일:** `src/app/utils/inviteMessaging.ts:94-123`
- **현재:** `registeredAccounts` 조회 없이 초대 발송
- **빵꾸:** 이미 회원인 사람에게 "비회원 초대" 발송
- **판단:** 추가 구현 필요

### 3-12. 포인트 중복 적립 가능 (같은 workId 2회)
- **파일:** `src/app/utils/pointsBackground.ts:120-176`
- **현재:** `pointsOnWorkPublished()` 호출 시 workId 기준 중복 체크 없음
- **빵꾸:** 같은 작품으로 2번 호출하면 AP 2배 적립
- **판단:** 추가 구현 필요

### 3-13. 포인트 잔액 음수 가능
- **파일:** `src/app/utils/pointsBackground.ts:218, 233-235`
- **현재:** `totalApAccrued`는 `Math.max(0)` 클램프되지만, `getApBalanceFromLedger()` 원장 합산은 음수 가능
- **빵꾸:** AP 30인 사용자가 24시간 내 2개 삭제 → 잔액 -10
- **판단:** 추가 구현 필요

### 3-14. 배너/이벤트 시작일 > 종료일 허용
- **파일:** `src/app/admin/BannerManagement.tsx:118-141`, `src/app/admin/EventManagement.tsx:98-128`
- **현재:** 날짜 순서 검증 없음
- **판단:** 추가 구현 필요

### 3-15. 이벤트 삭제 시 연결 작품 고아됨
- **파일:** `src/app/admin/EventManagement.tsx:86-96`
- **현재:** `eventStore.remove()` 후 `linkedEventId` 가진 작품 정리 없음
- **판단:** 추가 구현 필요

### 3-16. 팔로우 스토어에 self-follow/탈퇴 작가 가드 없음
- **파일:** `src/app/store.ts:584-605`
- **현재:** UI에서만 버튼 숨김. 스토어 레벨에 `self !== id` 체크 없음, `isWithdrawn()` 체크 없음
- **판단:** 추가 구현 필요

### 3-17. 딥링크 → 로그인 리다이렉트 시 쿼리 파라미터 유실
- **파일:** `src/app/pages/Upload.tsx:217`
- **현재:** `/upload?draft=abc` → `/login?redirect=/upload` (draft 파라미터 날아감)
- **빵꾸:** 로그인 후 원래 컨텍스트(초안, 이벤트) 유실
- **판단:** 추가 구현 필요

### 3-18. Onboarding 닉네임/실명에 비속어 필터 미적용
- **파일:** `src/app/pages/Onboarding.tsx`
- **현재:** Signup은 닉네임에 `containsProfanity()` 적용. Onboarding은 닉네임/실명에 미적용
- **판단:** 추가 구현 필요

### 3-19. 경고/허위신고 자동 정지가 데모 사용자에게만 작동
- **파일:** `src/app/utils/sanctionStore.ts:49, 67`
- **현재:** `if (next >= 3 && targetArtistId === artists[0].id)` — artists[0] (카테)에게만 정지 발동
- **빵꾸:** 다른 사용자는 경고 100회 받아도 정지 안 됨
- **판단:** 추가 구현 필요 (Phase 2 백엔드에서 처리 예정이지만, 클라 데모도 일관성 필요)

---

## 4. UX 막히는 지점

### 4-1. 발행 후 확인 페이지 없음
- **파일:** `src/app/pages/Upload.tsx:818-830`
- **현재:** 토스트 5초 + 프로필로 자동 이동. "검수 대기" 시 피드에 안 보여서 "실패한 줄" 알 수 있음
- **빵꾸:** 성공/실패 판단 불가
- **판단:** 추가 구현 필요 — 발행 완료 확인 페이지

### 4-2. 이미지 해상도 에러가 이해 불가
- **파일:** `src/app/pages/Upload.tsx:527-529`
- **현재:** "이미지 단변이 800px 이상이어야 합니다" — "단변"의 뜻을 시니어가 모름
- **판단:** 추가 구현 필요 — 메시지 개선 + 도움말

### 4-3. 모바일 아이콘에 텍스트 라벨 없음
- **파일:** `src/app/components/WorkDetailModal.tsx:846-925`
- **현재:** 모바일 하단 바: 아이콘만, 라벨 없음 (하트, 북마크, 깃발 등)
- **빵꾸:** 시니어가 아이콘 의미 모름
- **판단:** 추가 구현 필요

### 4-4. "저는 강사예요" 체크 시 데이터 초기화 경고 없음
- **파일:** `src/app/pages/Upload.tsx:374-389`
- **현재:** 강사 ON 시 본인 지정 슬롯 자동 초기화. 확인 다이얼로그 없음. 토스트만 사후 표시
- **빵꾸:** 되돌릴 수 없는 행동인데 경고 없음
- **판단:** 추가 구현 필요

### 4-5. 작품 삭제 확인에 "영구 삭제" 경고 없음
- **파일:** `src/app/pages/Profile.tsx:904-910`
- **현재:** `destructive: true` 빨간 버튼이지만 "이 작품은 영구 삭제되며 복구할 수 없습니다" 문구 없음
- **판단:** 추가 구현 필요

### 4-6. 첫 방문자에게 서비스 안내 없음
- **파일:** `src/app/pages/Browse.tsx:331-520`
- **현재:** 첫 방문 시 작품 그리드만 바로 표시. "이 서비스가 뭐하는 곳인지" 설명 없음
- **판단:** 기획 판단 필요 — 웰컴 배너 / 온보딩 투어

### 4-7. 문의 제출 후 확인 화면 없음
- **파일:** `src/app/pages/Contact.tsx:42-73`
- **현재:** 폼 클리어 + 토스트 5초. "접수됐나?" 불명확
- **판단:** 추가 구현 필요

### 4-8. 비속어 에러가 어느 필드인지 안 알려줌
- **파일:** `src/app/pages/Upload.tsx:610-613`
- **현재:** "전시명·그룹명·태그에 부적절한 단어가 포함" — 3개 필드 중 어디인지 미지정
- **판단:** 추가 구현 필요

### 4-9. 소셜 로그인 후 추가 모달 설명 부재
- **파일:** `src/app/components/SocialSignupModal.tsx`
- **현재:** 카카오 클릭 → 갑자기 닉네임+약관 모달. 왜 이 모달이 뜨는지 설명 없음
- **판단:** 추가 구현 필요 — "카카오 계정으로 연결 중..." 안내

### 4-10. 생년월일 드롭다운 100년 스크롤
- **파일:** `src/app/pages/Signup.tsx:339-368`
- **현재:** 연/월/일 3개 `<select>`. 1940년부터 스크롤. 시니어에게 고통
- **판단:** 기획 판단 필요 — 네이티브 date picker 전환 또는 연대 퀵 선택

### 4-11. 자동 저장 인디케이터 없음
- **파일:** `src/app/pages/Upload.tsx:866-898`
- **현재:** 30초마다 자동 저장하지만 UI에 "마지막 저장: 30초 전" 표시 없음
- **판단:** 추가 구현 필요

### 4-12. 공유 옵션 3가지 차이 설명 없음
- **파일:** `src/app/components/WorkDetailModal.tsx:765-791`
- **현재:** "초대 카드 복사" / "링크 복사" / "카카오 공유" — 각 옵션의 차이 설명 없음
- **판단:** 추가 구현 필요

### 4-13. 프로필 "전시" 탭과 "작품" 탭 차이 불명
- **파일:** `src/app/pages/Profile.tsx:749-792`
- **현재:** 두 탭 모두 같은 Work 데이터. "전시" = 카드 뷰, "작품" = 이미지별 관리. 설명 없음
- **판단:** 기획 판단 필요 — 탭 병합 또는 설명 추가

### 4-14. 회원 탈퇴 버튼이 도움말 링크처럼 생김
- **파일:** `src/app/pages/Settings.tsx:341-350`
- **현재:** `variant="ghost"`, `text-xs`, `text-muted-foreground`. 계정 삭제인데 회색 밑줄 텍스트
- **판단:** 추가 구현 필요 — 위험 행동 스타일 적용

### 4-15. 소셜 사용자 비밀번호 변경 차단이 토스트만
- **파일:** `src/app/pages/Settings.tsx:317-320`
- **현재:** 버튼 클릭 → `toast.info()` 5초 → 사라짐. 버튼 자체는 활성 상태
- **판단:** 추가 구현 필요 — 버튼 비활성화 + 상시 안내

### 4-16. 글꼴 크기 변경 미리보기 없음
- **파일:** `src/app/pages/Settings.tsx:220-248`
- **현재:** 작게/보통/크게 라디오. 선택 후 적용되지만 미리보기 없음
- **판단:** 추가 구현 필요

### 4-17. 모바일 언어 전환 불가
- **파일:** `src/app/components/Header.tsx:198-218`
- **현재:** 지구본 아이콘이 `hidden sm:flex`. 모바일 하단 네비/설정에 언어 옵션 없음
- **판단:** 추가 구현 필요

---

## 5. 의심스러운 구현 (왜 이렇게 되어 있는지 불명확)

### 5-1. 스토리지 버전 업 시 사용자 데이터 전멸
- **파일:** `src/app/store.ts:86-105`
- **현재:** `WORKS_STORAGE_VERSION` 변경 시 `saveWorksToStoragePlain(initialWorks)` — 시드 데이터로 덮어씌움. 마이그레이션 없음
- **빵꾸:** 버전 바꾸면 사용자 업로드 전부 삭제
- **판단:** 추가 구현 필요 — 마이그레이션 로직 추가 (CRITICAL)

### 5-2. 스토어 구독 5개 메모리 누수
- **파일:** `src/app/store.ts:442, 514, 556, 616, 676`
- **현재:** `useEffect(() => store.subscribe(...), [])` — subscribe()의 반환값(unsubscribe)을 effect cleanup으로 반환하지 않음
- **빵꾸:** 컴포넌트 마운트/언마운트 반복 시 리스너 무한 누적
- **판단:** 추가 구현 필요 — `return` 추가 (CRITICAL)

### 5-3. UTC 시간으로 "일일" 포인트 계산 — 시간대별 하루 건너뜀
- **파일:** `src/app/utils/pointsBackground.ts:112`
- **현재:** `new Date().toISOString().slice(0, 10)` — UTC 날짜. 한국(UTC+9) 사용자의 밤 11시 접속 + 다음 날 오전 1시 접속 = UTC 같은 날 → 포인트 미적립
- **판단:** 추가 구현 필요 — 로컬 자정 기준 또는 timezone-aware

### 5-4. 배너 날짜도 UTC — 노출 시점 9시간 밀림
- **파일:** `src/app/utils/bannerStore.ts:49`
- **현재:** `now.toISOString().slice(0, 10)` 비교. "4월 18일 시작" 배너가 한국 기준 4월 18일 오전 9시에야 노출
- **판단:** 추가 구현 필요

### 5-5. 작품 ID가 `Date.now()`만으로 생성 — 충돌 위험
- **파일:** `src/app/store.ts` (작품 생성 시)
- **현재:** `user-${Date.now()}`. 같은 밀리초에 두 작품 생성 시 ID 충돌
- **판단:** 추가 구현 필요 — `crypto.randomUUID()` 사용

### 5-6. 초안 자동저장 ID가 상수 `'autosave'` — 멀티탭 충돌
- **파일:** `src/app/pages/Upload.tsx` (자동저장 시)
- **현재:** 자동저장 초안 ID가 항상 `'autosave'`. 탭 2개에서 동시 업로드 시 서로 덮어씀
- **판단:** 추가 구현 필요

### 5-7. localStorage 어드민 한 줄로 권한 탈취
- **파일:** `src/app/utils/adminGate.ts:17-22`
- **현재:** `localStorage.getItem('artier_admin_session_v1') === '1'`
- **빵꾸:** DevTools에서 한 줄 입력으로 어드민 권한 획득. 작품 삭제, 회원 정지 가능
- **판단:** Phase 2 서버사이드 인증 필수. Phase 1에서는 인지만

### 5-8. 전화번호/실명 평문 localStorage 저장
- **파일:** `src/app/utils/inviteMessaging.ts`, `src/app/pages/ExhibitionInviteLanding.tsx:204-207`
- **현재:** `artier_invite_messaging_log`에 전화번호+이름 전체 저장. DevTools로 열람 가능
- **판단:** 기획 판단 필요 — 사용 후 삭제 또는 마스킹

### 5-9. 50개 시드 작품에 6버킷 인터리빙 피드 알고리즘
- **파일:** `src/app/utils/feedOrdering.ts`
- **현재:** 스코어링 → 6버킷 분류 → 랜덤 노이즈 → 인터리빙 패턴 → 이미 본 작품 후순위
- **빵꾸:** localStorage 50개 배열을 섞는 데 이 복잡도가 필요한지 불명
- **판단:** 기획 판단 필요 — Phase 2 서버사이드 전환 시 클라 로직 폐기 예정이라면 과잉

### 5-10. 실제 발송 안 하면서 5% 실패율 + 이름 매칭까지 구현한 초대 시스템
- **파일:** `src/app/utils/inviteMessaging.ts`
- **현재:** SMS/카카오 발송 모의 + 5% 랜덤 실패 + 전화번호+실명 자동 매칭 + 이름 불일치 수동 승격
- **빵꾸:** 실제 발송 안 되는데 매칭/실패/승격 로직 전부 구현
- **판단:** 기획 판단 필요 — Phase 2까지 무의미한 코드인지, 기획 검증 도구로서 가치가 있는지

### 5-11. 어드민 13페이지 중 ~9개가 시드 데이터 뷰어
- **파일:** `src/app/admin/` 전체
- **현재:** 실제 스토어 변경: ContentReview, PickManagement, BannerManagement, ReportManagement, MemberManagement (5개). 나머지 8개는 시드 데이터 표시만
- **빵꾸:** Phase 2에서 전부 다시 만들어야 하는 목업 대시보드에 과도한 투자
- **판단:** 기획 판단 필요

### 5-12. `Work.comments` 필드 — 시드에 값까지 있는데 미사용
- **파일:** `src/app/data.ts:35`
- **현재:** `comments: number` 필드 + 시드 데이터에 `comments: 89` 등. UI/피드 정렬 어디에도 미노출 (PRD Out of Scope)
- **판단:** 추가 구현 필요 — 필드 제거 또는 시드 값 제거

### 5-13. `Work.category` 필드 — 시드에도 UI에도 없음
- **파일:** `src/app/data.ts:38`
- **현재:** `category?: 'art' | 'fashion' | 'craft' | 'product'`. 시드 전부 `undefined`. Browse에 카테고리 필터 없음
- **판단:** 추가 구현 필요 — 필드 제거 또는 UI 추가

### 5-14. ExhibitionDetail이 목업 3개를 위해 존재
- **파일:** `src/app/pages/ExhibitionDetail.tsx`
- **현재:** `MOCK_EXHIBITION_CONFIG` 3개 하드코딩 전시만 렌더링. 사용자 작품은 전부 WorkDetailModal로 감
- **빵꾸:** 70% 코드가 WorkDetailModal과 중복
- **판단:** 기획 판단 필요 — 큐레이션 전시 기능이 Phase 2에서 확대되는지

### 5-15. Profile "전시" 탭과 "작품" 탭이 같은 데이터의 뷰 방식만 다름
- **파일:** `src/app/pages/Profile.tsx:749-792`
- **현재:** "전시" = 카드 뷰, "작품" = 이미지별 관리. 둘 다 같은 Work 배열 기반
- **판단:** 기획 판단 필요 — 하나의 탭에 뷰 전환으로 통합 가능

### 5-16. localStorage + IndexedDB 이중 저장 (Phase 1에서 불필요)
- **파일:** `src/app/store.ts:107-148`, `src/app/utils/workMediaIdb.ts`
- **현재:** localStorage 초과 시 IDB 오프로드. Phase 1에서 시드 50개 + 소수 업로드로는 초과 가능성 극히 낮음
- **판단:** 기획 판단 필요 — Phase 2 Supabase 전환 시 폐기 예정이라면 과잉 엔지니어링

### 5-17. 어드민 패널 i18n 36개 문자열 누락
- **파일:** `src/app/admin/` 전체 (ReportManagement, CurationManagement, EventManagement, MemberManagement, ContentReview, BannerManagement, PickManagement, WorkManagement)
- **현재:** 토스트, 확인 다이얼로그, 라벨 등 36개 한국어 하드코딩. `t()` 미사용
- **빵꾸:** 영어로 전환해도 어드민은 한국어
- **판단:** 추가 구현 필요

### 5-18. 미사용 npm 패키지 3개
- **파일:** `package.json`
- **현재:** `react-slick`, `react-popper`, `@popperjs/core` — 코드 어디에서도 import 안 됨
- **판단:** 추가 구현 필요 — 제거

### 5-19. config.ts 미사용 내보내기 2개
- **파일:** `src/app/config.ts`
- **현재:** `CONTACT_EMAIL`, `BRAND` — 어디에서도 import 안 됨
- **판단:** 추가 구현 필요 — 사용 또는 제거

---

## 통계 요약

| 카테고리 | 전체 | 수정완료 | 기획 판단 필요 | 추가 구현 필요 |
|----------|------|---------|---------------|---------------|
| 1. 모순/충돌 | 17 | 9 ✅ | 4 | 4 |
| 2. 반쪽짜리 기능 | 14 | 0 | 2 | 12 |
| 3. 엣지 케이스 | 19 | 0 | 2 | 17 |
| 4. UX 막히는 지점 | 17 | 0 | 4 | 13 |
| 5. 의심스러운 구현 | 19 | 0 | 8 | 11 |
| **합계** | **86** | **9** | **20** | **57** |
