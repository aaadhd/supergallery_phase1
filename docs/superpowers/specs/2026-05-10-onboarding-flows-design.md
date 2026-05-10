# 온보딩 플로우 재설계 (신규 가입 · 초대 토큰)

**날짜**: 2026-05-10  
**대상 파일**: `src/app/pages/Signup.tsx`, `src/app/components/SocialSignupModal.tsx`, `src/app/pages/Onboarding.tsx`, `src/app/pages/ExhibitionInviteLanding.tsx`  
**승인**: 브레인스토밍 세션에서 사용자 확인 완료

---

## 배경

현재 온보딩 구조의 주요 문제:

| 위치 | 문제 |
|---|---|
| `Signup.tsx` | 닉네임을 Signup에서 받고 Onboarding에서 또 보여줌 (이중 수집) |
| `Onboarding.tsx` | 환영 splash(1/3)가 "시작하기" 버튼 하나짜리로 탭 낭비 |
| `Onboarding.tsx` | 토큰 클레임이 `showClaimScreen` 플래그로 step 2/3 안에 숨겨짐 → 프로그레스 바가 실제 화면 수와 불일치 |
| `SocialSignupModal.tsx` | 생년월일 수집 없음 → 소셜 가입자는 나이 확인 미실시 |
| `ExhibitionInviteLanding.tsx` | 로그인된 기존 회원도 항상 신규 가입 CTA만 표시 |

---

## 제품 정책 결정

1. **역할 분리**: Signup = 인증·법적 동의, Onboarding = 프로필 완성
2. **닉네임 이동**: Signup에서 제거 → Onboarding 첫 스텝으로 통합
3. **토큰 클레임 범위 (Phase 1)**: 신규 가입자만. 기존 회원이 초대 링크를 통해 클레임하는 기능은 미구현 — "게시자에게 연락해 추가 요청" 안내로 대체
4. **사용자 유형**: 작가·감상자 온보딩 중 구분 없음. 포용적 카피로 설계 (완료 화면에서 두 CTA 동등 제공)
5. **이메일 중복 체크**: 소셜 로그인 시 프로바이더가 이메일을 제공한 경우에만 실행

---

## 플로우 맵

### Flow 1: 매직링크 신규 가입

```
/signup step 1 : 이메일 입력 → 매직링크 발송
/auth/verify   : 이메일 인증 → 자동 로그인
/signup step 2 : 생년월일 + 약관 (현행 step 2·3 → 1개 화면으로 통합)
→ auth.login() → /onboarding

Onboarding 1/2 : 닉네임 + 프로필 사진
Onboarding 2/2 : 완료
```

### Flow 2: 소셜 신규 가입 (구글·애플·카카오)

```
AuthSheet → 소셜 버튼 → OAuth
→ 신규 감지 (artier_social_signed_up__${provider} 없음)
→ SocialSignupModal : 생년월일(카카오는 프리필 가능) + 약관
→ auth.login() → /onboarding

Onboarding 1/2 : 닉네임(소셜 프로바이더 이름 프리필) + 프로필 사진
Onboarding 2/2 : 완료
```

### Flow 3: 토큰 + 신규 가입 (Flow 1 또는 2 위에 얹힘)

```
ExhibitionInviteLanding
→ sessionStorage 'artier_pending_invite_token' 저장
→ Flow 1 또는 2 그대로 진행
→ /onboarding 진입 시 토큰 감지

Onboarding 1/3 : 닉네임 + 프로필 사진
Onboarding 2/3 : 본인 작품 찾기
Onboarding 3/3 : 완료
```

### Flow 4: 기존 회원 로그인 — 변경 없음

소셜: `artier_social_signed_up__${provider}` 있음 → `completeReturningSocialLogin` → 홈  
매직링크: `/login?mode=email` → 인증 → 홈

### Flow 5: 토큰 + 기존 회원 (로그인 상태에서 초대 링크 클릭)

```
ExhibitionInviteLanding → authStore.isLoggedIn() 감지
→ 기존 회원 안내 표시 + [전시 보기] CTA
   (클레임 UI 미노출)
```

---

## 화면 상세

### 1. Signup step 2 — 생년월일 + 약관 (매직링크)

**현행**: step 2 (닉네임 + 생년월일) + step 3 (약관) = 2개 화면  
**변경**: 닉네임 제거, 생년월일 + 약관 = 1개 화면

필드:
- 생년월일: 연·월·일 (현행 UI 유지)
- 약관: 3필수(이용약관·개인정보·만 14세) + 1선택(마케팅) (현행 유지)

---

### 2. SocialSignupModal — 생년월일 + 약관

**현행**: 약관 + 닉네임  
**변경**: 닉네임 제거, 생년월일 추가

필드:
- 생년월일: 연·월·일. 카카오에서 제공 시 프리필, 사용자가 수정 가능. 구현 시 카카오 API 생년월일 필드명 확인 후 매핑
- 약관: 현행 유지
- 이메일 중복 체크: `isEmailRegistered(email)` — 프로바이더에서 이메일이 넘어온 경우에만 실행, 없으면 skip

---

### 3. Onboarding Step 1 (1/2 또는 1/3) — 닉네임 + 프로필 사진

**현행**: step 0 환영 splash + step 1 닉네임·사진 = 2개  
**변경**: splash 제거, 닉네임·사진 화면이 첫 스텝. 환영 문구를 이 화면 상단에 통합

카피 방향:
```
헤드라인 : "Proud Gallery에서 어떻게 불리고 싶으세요?"
서브텍스트: "작품을 올리거나 감상할 때 이 이름으로 표시돼요"
```

필드:
- 닉네임 (필수, 2–20자): 소셜 프로바이더 이름 프리필 가능, 수정 가능. 비속어 필터 현행 유지
- 프로필 사진 (선택): 현행 유지

---

### 4. Onboarding Step 2 (토큰 전용, 2/3) — 본인 작품 찾기

**현행**: `showClaimScreen` 플래그로 step 1 안에 삽입, 프로그레스 바 2/3 그대로 고정  
**변경**: `currentStep` 명시적 스텝으로 승격. `showClaimScreen` 플래그 방식 제거

카피 방향:
```
헤드라인 : "혹시 이 중에 본인 작품이 있나요?"
서브텍스트: "{inviterName} 작가님이 초대해 주셨어요.
            내 작품을 골라 전시에 이름을 올려보세요"
```
※ inviterName: 토큰의 workId → workStore에서 work.artist.name 조회

동작:
- 카드 클릭 → 확인 다이얼로그 → 클레임 → goNext() → 완료 화면 (claimedTitle 표시)
- "여기 없어요" → goNext() → 완료 화면 (일반)
- claimableSlots 없음(모두 연결됨) → "여기 없어요" 버튼만 표시

토큰 inactive(검수 신청 중) 안내: 현행 유지 (`claim.pendingHeader`)

---

### 5. Onboarding 완료 (2/2 또는 3/3) — 서비스 메시지 메인 무대

**현행**: 축하 비주얼 + "준비됐어요!" + 버튼 2개  
**변경**: 서비스 가치 전달 화면으로 개선

카피 방향:
```
헤드라인    : "{name}님, 반가워요!"

메인 메시지 :
"그림을 올려 나만의 전시를 열거나,
마음에 드는 작품을 저장해두세요"

3가지 포인트 (아이콘 + 텍스트):
🖼  그림 한 점이 나만의 전시가 돼요
💾  마음에 든 작품을 모아둘 수 있어요
👥  작가와 감상자가 함께하는 갤러리예요

CTA:
[갤러리 둘러보기 →]  ← primary (상단, 진한 버튼)
[작품 올려보기 →]    ← secondary (하단, ghost 버튼)
```

토큰 클레임 완료 시 추가 요소:
- 연결 확인 카드: "'{title}'에 연결됐어요" (현행 `claim.doneTitle` / `claim.doneBody` 유지)

---

### 6. ExhibitionInviteLanding — 기존 회원 분기

**현행**: 로그인 상태 무관하게 항상 신규 가입 CTA("지금 가입하고 본인 작품 찾기") 표시  
**변경**: `authStore.isLoggedIn()` 확인 → 기존 회원이면 안내 문구로 대체

안내 문구:
```
"Proud Gallery에 가입된 회원입니다.
전시 게시자에게 요청해서 작품을 연결하세요."
```

CTA: `[전시 보기]` → 해당 전시 상세(`/exhibitions/:workId`)로 이동  
※ 전시 콘텐츠(이미지·설명)는 기존과 동일하게 표시

---

## 변경 파일 목록

| 파일 | 변경 규모 |
|---|---|
| `src/app/pages/Signup.tsx` | step 2 닉네임 제거, step 2+3 통합 → 1개 화면 |
| `src/app/components/SocialSignupModal.tsx` | 닉네임 제거, 생년월일 추가, 이메일 중복 체크 조건부 처리 |
| `src/app/pages/Onboarding.tsx` | TOTAL_STEPS 토큰 여부에 따라 2 또는 3 분기, splash 제거, 클레임 스텝 구조 변경, 완료 화면 개선 |
| `src/app/pages/ExhibitionInviteLanding.tsx` | 로그인 상태 분기 + 기존 회원 안내 추가 |

---

## AC

### 매직링크 신규 가입
- AC-01: Signup step 2에 닉네임 필드 없음
- AC-02: 생년월일 + 약관이 한 화면에 표시됨
- AC-03: Onboarding 첫 화면이 환영 splash 없이 바로 닉네임+사진 폼
- AC-04: 프로그레스 바 1/2 → 2/2

### 소셜 신규 가입
- AC-05: SocialSignupModal에 생년월일 포함, 닉네임 없음
- AC-06: 카카오에서 생년월일 제공 시 프리필, 수정 가능
- AC-07: 소셜 이메일 없는 경우 중복 체크 skip, 가입 정상 진행
- AC-08: 소셜 이메일 있는 경우 중복 체크 실행

### 토큰 + 신규 가입
- AC-09: Onboarding 프로그레스 1/3 → 2/3 → 3/3
- AC-10: 2/3 화면이 `currentStep`으로 명시 처리 (`showClaimScreen` 플래그 방식 제거)
- AC-11: "여기 없어요" → 3/3 완료 정상 진행
- AC-12: claimableSlots 없음 → "여기 없어요" 버튼만, 카드 미표시

### 완료 화면
- AC-13: 3가지 서비스 포인트 노출
- AC-14: primary CTA = "갤러리 둘러보기", secondary = "작품 올려보기"
- AC-15: 클레임 완료 시 연결 확인 카드 표시, 미클레임 시 일반 완료 화면

### 기존 회원 초대 링크
- AC-16: 로그인 상태에서 초대 링크 접근 시 신규 가입 CTA 대신 "가입된 회원" 안내 표시
- AC-17: [전시 보기] CTA → 해당 전시 상세로 이동
