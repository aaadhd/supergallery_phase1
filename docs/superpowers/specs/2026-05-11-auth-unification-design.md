# 인증 통합 설계 — 매직링크 스마트 라우팅 + 소셜 계정 연결

**날짜**: 2026-05-11  
**대상 파일**: `src/app/pages/Signup.tsx`, `src/app/components/AuthSheet.tsx`  
**승인**: 브레인스토밍 세션에서 사용자 확인 완료

---

## 배경

현재 인증 구조의 문제:

| 위치 | 문제 |
|---|---|
| `Signup.tsx` step 1 | 이미 가입된 이메일을 에러로 차단 → 이메일 매직링크로 로그인 불가 |
| `AuthSheet.tsx` | 소셜 제공자별 플래그만 체크 → 같은 이메일로 다른 소셜 제공자 가입 시 중복 계정 생성 |

---

## 제품 정책 결정

1. **계정 식별자는 이메일.** 같은 이메일 = 같은 계정 (제공자 무관).
2. **카카오 이메일 없는 경우** (전화번호만 가입 또는 공유 허가 미동의): 독립 계정으로 처리. Phase 1에서 연결 불가.
3. **알림 채널**: Phase 1은 인앱 알림만. 전화번호가 없거나 공유 미허가인 카카오 사용자는 인앱 알림 전용. 이후 전화번호 입력 유도로 카카오 알림톡 확장.
4. **온보딩 스킵**: 기존 계정으로 다른 제공자 로그인 시 온보딩 미진입 (이미 완료된 상태).

---

## Part 1: 매직링크 스마트 라우팅

### 변경 전 (현행)
```
이메일 입력 → isEmailRegistered 체크
  → 이미 가입: ❌ 에러 "이미 가입된 이메일이에요. 로그인해 주세요."
  → 미가입: 매직링크 발송 (intent: 'signup')
```

### 변경 후
```
이메일 입력 → 무조건 매직링크 발송
  → isEmailRegistered(email) = true  → intent: 'login'  → 링크 클릭 → 홈
  → isEmailRegistered(email) = false → intent: 'signup' → 링크 클릭 → step 2 → 온보딩
```

### 변경 파일: `Signup.tsx` step 1

`sendMagicLink()` 함수 내:
- `isEmailRegistered` 에러 차단 로직 제거
- 이메일 등록 여부에 따라 intent 분기:
  ```ts
  const intent = isEmailRegistered(email.trim()) ? 'login' : 'signup';
  issueMagicLink({ email: email.trim(), intent });
  await requestEmailMagicLink({ email: email.trim(), intent });
  ```
- 발송 완료 배너 문구: intent 무관하게 동일 ("이메일을 확인해주세요")
  - 이미 가입자인지 신규인지 사용자에게 노출하지 않음 (보안·UX 일관성)

### 변경 없는 것

- `AuthVerify.tsx` — 이미 `intent: 'login'` / `'signup'` 분기 완비. 수정 불필요.
- `Login.tsx` (`/login?mode=email`) — 기존 이메일 로그인 경로 유지 (뒤로가기 등 잔여 진입점 보존).

---

## Part 2: 소셜 + 매직링크 이메일 기반 계정 연결

### 변경 전 (현행)
```
소셜 버튼 클릭
  → artier_social_signed_up__${provider} 있음: 기존 로그인
  → 없음: 신규 가입 (SocialSignupModal)
```

### 변경 후
```
소셜 버튼 클릭 → 제공자 프로필 이메일 확인
  ① artier_social_signed_up__${provider} 있음
      → 기존 로그인 (현행 유지)
  ② ①에 해당 없음 + 이메일 있음 + isEmailRegistered(email) = true
      → 이메일로 이미 가입된 계정 → 기존 로그인
      → artier_social_signed_up__${provider} 플래그 후설정
  ③ ①②에 해당 없음 (신규 이메일 or 이메일 없음)
      → 신규 가입 → SocialSignupModal → /onboarding
```

### 변경 파일: `AuthSheet.tsx`

`handleSocialLogin(provider)` 함수 수정:
```ts
const handleSocialLogin = (provider: SocialProvider) => {
  const alreadySignedUp = localStorage.getItem(`artier_social_signed_up__${provider}`) === '1';
  if (alreadySignedUp) {
    completeReturningSocialLogin(provider);
    return;
  }
  // 이메일 기반 기존 계정 감지
  const profile = MOCK_SOCIAL_PROFILE[provider];
  if (profile.email && isEmailRegistered(profile.email)) {
    // 다른 제공자로 이미 가입된 계정 → 로그인 처리 + 플래그 설정
    localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
    completeReturningSocialLogin(provider);
    return;
  }
  // 신규 가입
  setPendingSocial(provider);
};
```

### 소셜 가입 완료 시 이메일 등록

`completeFirstSocialSignup()` 내 `registerAccount` 호출 추가:
```ts
const completeFirstSocialSignup = (provider, nickname, email) => {
  authStore.login();
  persistMockSession(`oauth-${provider}-demo`);
  localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
  localStorage.setItem('artier_pending_signup_nickname', nickname);
  localStorage.setItem('artier_pending_social_signup', provider);
  if (email) {
    localStorage.setItem('artier_pending_signup_email', email);
    registerAccount(email, '');  // ← 신규 추가: 이메일 레지스트리 등록
  }
  navigate('/onboarding', { replace: true });
};
```

(현재 `registerAccount`는 `Onboarding.finishOnboarding`에서만 호출됨. 소셜 가입 시에도 등록해야 매직링크 로그인 연결 가능.)

### `MOCK_SOCIAL_PROFILE` 공유 처리

현재 `MOCK_SOCIAL_PROFILE`은 `SocialSignupModal.tsx` 안에 정의되어 있음.
`AuthSheet.tsx`에서 이메일 체크 시 이 데이터가 필요하므로 export 처리:

```ts
// SocialSignupModal.tsx
export const MOCK_SOCIAL_PROFILE: Record<...> = { ... };
```

```ts
// AuthSheet.tsx
import { MOCK_SOCIAL_PROFILE } from './SocialSignupModal';
import { isEmailRegistered, registerAccount } from '../utils/registeredAccounts';
```

---

## 카카오 이메일 없는 경우 처리

MOCK_SOCIAL_PROFILE에서 카카오 이메일이 없거나 공백인 경우:
- `profile.email` 없음 → ②번 조건 불충족 → ③ 신규 가입 경로
- 독립 계정으로 처리, 별도 연결 없음
- Phase 1에서는 이 계정에 인앱 알림만 발송

---

## 충돌 분석 (온보딩 재설계와의 관계)

| 온보딩 재설계 변경 | 인증 통합 변경 | 충돌 여부 |
|---|---|---|
| `Signup.tsx` step 2 (생년월일+약관) | `Signup.tsx` step 1 (이메일 intent 분기) | ✅ 없음 — 다른 step |
| `SocialSignupModal.tsx` (생년월일 추가) | `AuthSheet.tsx` (이메일 체크 추가) | ✅ 없음 — 소셜 모달은 신규 가입에만 노출 |
| `ExhibitionInviteLanding.tsx` (기존 회원 안내) | 소셜 기존 계정 감지 → 로그인 | ✅ 의도된 동작 — §3.2a 정합 |

---

## AC

### 매직링크
- AC-01: 미가입 이메일 → 매직링크 발송 (intent: 'signup') → 링크 클릭 → `/signup?step=2` → 온보딩
- AC-02: 이미 가입된 이메일 → 매직링크 발송 (intent: 'login') → 링크 클릭 → 홈 (온보딩 미진입)
- AC-03: 발송 완료 배너는 두 경우 동일 문구 노출 (이메일만 확인하면 됨)
- AC-04: `AuthVerify.tsx` 변경 없음 — 기존 분기 로직 그대로

### 소셜 계정 연결
- AC-05: 같은 이메일로 다른 소셜 제공자 로그인 시 → 동일 계정 로그인 (신규 가입 아님)
- AC-06: 동일 제공자 재로그인 → 기존 플래그 체크 로직 유지 (현행 동작 보존)
- AC-07: 소셜 신규 가입 완료 시 이메일이 있으면 `registerAccount` 호출 → 이후 매직링크 로그인 연결 가능
- AC-08: 카카오 이메일 없는 경우 → 계정 연결 없이 신규 독립 계정으로 처리
- AC-09: 소셜 로그인으로 기존 계정 감지 시 → `artier_social_signed_up__${provider}` 플래그 후설정
