# 인증 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매직링크 이메일 입력이 가입/로그인을 자동 판별하고, 소셜 로그인이 같은 이메일의 기존 계정을 인식해 연결한다.

**Architecture:** `Signup.tsx` step 1에서 `isEmailRegistered` 체크를 에러 차단에서 intent 분기로 전환. `AuthSheet.tsx`에서 소셜 로그인 시 이메일 레지스트리를 추가 확인해 크로스 제공자 계정 연결을 처리. `SocialSignupModal.tsx`의 mock 프로필 데이터를 export해 AuthSheet에서 공유.

**Tech Stack:** React 18, TypeScript, `src/app/utils/registeredAccounts.ts` (`isEmailRegistered`, `registerAccount`), `src/app/utils/magicLinkStore.ts` (`issueMagicLink`)

---

## 배경 지식

### 현재 인증 플로우 (변경 전)
```
매직링크: /signup step1 → isEmailRegistered 체크 → 이미 가입 시 에러 차단
소셜:     AuthSheet → artier_social_signed_up__${provider} 플래그만 체크 → 없으면 항상 신규 가입
```

### 변경 후
```
매직링크: /signup step1 → 이메일 형식만 검증 → 무조건 링크 발송
          → isEmailRegistered = true  : intent 'login'  → 링크 클릭 → 홈
          → isEmailRegistered = false : intent 'signup' → 링크 클릭 → step2 → 온보딩

소셜:     AuthSheet → ① provider 플래그 → ② 이메일 레지스트리 → ③ 신규 가입
          소셜 신규 가입 완료 시 → registerAccount(email) 호출 (매직링크 연결용)
```

### 핵심 파일
- `src/app/components/SocialSignupModal.tsx` — MOCK_SOCIAL_PROFILE export (Task 1)
- `src/app/components/AuthSheet.tsx` — 크로스 제공자 계정 연결 (Task 2)
- `src/app/pages/Signup.tsx` — 매직링크 smart routing (Task 3)

### 알아야 할 패턴
- `isEmailRegistered(email)` — `src/app/utils/registeredAccounts.ts`. 이메일 소문자 정규화 후 localStorage 레지스트리 조회.
- `registerAccount(email, phone)` — 레지스트리에 이메일 등록. phone은 빈 문자열 허용.
- `issueMagicLink({ email, intent })` — `src/app/utils/magicLinkStore.ts`. intent: `'signup'` | `'login'`.
- `AuthVerify.tsx` — `/auth/verify?token=...`. intent에 따라 `/signup?step=2`(signup) 또는 홈(login)으로 라우팅. **변경 없음.**
- TypeScript 검증: `npx tsc --noEmit`

---

## 파일 구조

| 파일 | 변경 규모 |
|---|---|
| `src/app/components/SocialSignupModal.tsx` | MOCK_SOCIAL_PROFILE에 `export` 추가 |
| `src/app/components/AuthSheet.tsx` | import 추가, handleSocialLogin + completeFirstSocialSignup 수정 |
| `src/app/pages/Signup.tsx` | emailOk · emailError · sendMagicLink 수정 |

---

## Task 1: SocialSignupModal.tsx — MOCK_SOCIAL_PROFILE export

**Files:**
- Modify: `src/app/components/SocialSignupModal.tsx`

### 배경
`MOCK_SOCIAL_PROFILE`이 현재 파일 내부에만 정의되어 있음. Task 2에서 AuthSheet가 제공자별 이메일을 읽어야 하므로 export 필요.

- [ ] **Step 1: MOCK_SOCIAL_PROFILE에 export 추가**

파일 상단에서 아래 라인을 찾아 `export const`로 변경한다.

```ts
// 변경 전
const MOCK_SOCIAL_PROFILE: Record<SocialProvider, { ... }> = {

// 변경 후
export const MOCK_SOCIAL_PROFILE: Record<SocialProvider, { email: string; name: string; avatar: string; birthYear?: string; birthMonth?: string; birthDay?: string }> = {
```

- [ ] **Step 2: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/components/SocialSignupModal.tsx
git commit -m "feat: MOCK_SOCIAL_PROFILE export — AuthSheet 크로스 제공자 연결용"
```

---

## Task 2: AuthSheet.tsx — 크로스 제공자 이메일 계정 연결

**Files:**
- Modify: `src/app/components/AuthSheet.tsx`

### 배경
현재 `handleSocialLogin`은 `artier_social_signed_up__${provider}` 플래그만 체크. 같은 이메일로 다른 소셜 제공자나 매직링크로 이미 가입한 경우를 감지하지 못함. `completeFirstSocialSignup`도 `registerAccount`를 호출하지 않아 소셜 신규 가입 후 매직링크 로그인 연결이 안 됨.

- [ ] **Step 1: import 추가**

파일 상단에 아래 import 추가. 기존 import 목록 뒤에 붙인다.

```ts
import { MOCK_SOCIAL_PROFILE } from './SocialSignupModal';
import { isEmailRegistered, registerAccount } from '../utils/registeredAccounts';
```

- [ ] **Step 2: handleSocialLogin 수정**

현재 코드:
```ts
const handleSocialLogin = (provider: SocialProvider) => {
  const alreadySignedUp = localStorage.getItem(`artier_social_signed_up__${provider}`) === '1';
  if (alreadySignedUp) {
    completeReturningSocialLogin(provider);
  } else {
    setPendingSocial(provider);
  }
};
```

변경 후:
```ts
const handleSocialLogin = (provider: SocialProvider) => {
  // ① 동일 제공자 기존 플래그 체크 (현행 유지)
  const alreadySignedUp = localStorage.getItem(`artier_social_signed_up__${provider}`) === '1';
  if (alreadySignedUp) {
    completeReturningSocialLogin(provider);
    return;
  }
  // ② 이메일 기반 크로스 제공자 기존 계정 감지
  const profile = MOCK_SOCIAL_PROFILE[provider];
  if (profile.email && isEmailRegistered(profile.email)) {
    // 다른 제공자(또는 매직링크)로 이미 가입된 계정 → 로그인 처리
    localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
    completeReturningSocialLogin(provider);
    return;
  }
  // ③ 신규 가입
  setPendingSocial(provider);
};
```

- [ ] **Step 3: completeFirstSocialSignup 수정**

현재 코드:
```ts
const completeFirstSocialSignup = (provider: SocialProvider, nickname: string, email: string) => {
  authStore.login();
  persistMockSession(`oauth-${provider}-demo`);
  localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
  localStorage.setItem('artier_pending_signup_nickname', nickname);
  localStorage.setItem('artier_pending_social_signup', provider);
  if (email) localStorage.setItem('artier_pending_signup_email', email);
  onOpenChange(false);
  navigate('/onboarding', { replace: true });
};
```

변경 후 (이메일 레지스트리 등록 추가):
```ts
const completeFirstSocialSignup = (provider: SocialProvider, nickname: string, email: string) => {
  authStore.login();
  persistMockSession(`oauth-${provider}-demo`);
  localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
  localStorage.setItem('artier_pending_signup_nickname', nickname);
  localStorage.setItem('artier_pending_social_signup', provider);
  if (email) {
    localStorage.setItem('artier_pending_signup_email', email);
    registerAccount(email, '');  // 이메일 레지스트리 등록 → 이후 매직링크 로그인 연결 가능
  }
  onOpenChange(false);
  navigate('/onboarding', { replace: true });
};
```

- [ ] **Step 4: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/app/components/AuthSheet.tsx
git commit -m "feat: 소셜 로그인 이메일 기반 크로스 제공자 계정 연결"
```

---

## Task 3: Signup.tsx — 매직링크 스마트 라우팅

**Files:**
- Modify: `src/app/pages/Signup.tsx`

### 배경
현재 `emailOk`와 `emailError`가 `isEmailRegistered`로 이미 가입된 이메일을 에러 차단함. 이를 제거하고 `sendMagicLink` 내에서 가입 여부에 따라 intent를 분기한다.

현재 관련 코드 위치:
- `emailError` — 약 line 90
- `emailOk` — 약 line 112
- `sendMagicLink` — 약 line 116

- [ ] **Step 1: emailError에서 isEmailRegistered 분기 제거**

현재:
```ts
const emailError = touched('email')
  ? !emailValid(email)
    ? t('signup.errEmail')
    : isEmailRegistered(email)
      ? t('signup.errEmailRegistered')
      : ''
  : '';
```

변경 후:
```ts
const emailError = touched('email') && !emailValid(email) ? t('signup.errEmail') : '';
```

- [ ] **Step 2: emailOk에서 isEmailRegistered 조건 제거**

현재:
```ts
const emailOk = emailValid(email) && !isEmailRegistered(email);
```

변경 후:
```ts
const emailOk = emailValid(email);
```

- [ ] **Step 3: sendMagicLink에 intent 분기 추가**

현재 `sendMagicLink` 함수 내 `issueMagicLink` / `requestEmailMagicLink` 호출:
```ts
issueMagicLink({ email: email.trim(), intent: 'signup' });
try { localStorage.setItem('artier_pending_signup_email', email.trim()); } catch { /* ignore */ }
await requestEmailMagicLink({ email: email.trim(), intent: 'signup' });
```

변경 후:
```ts
const intent = isEmailRegistered(email.trim()) ? 'login' : 'signup';
issueMagicLink({ email: email.trim(), intent });
try { localStorage.setItem('artier_pending_signup_email', email.trim()); } catch { /* ignore */ }
await requestEmailMagicLink({ email: email.trim(), intent });
```

- [ ] **Step 4: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/app/pages/Signup.tsx
git commit -m "feat: 매직링크 스마트 라우팅 — 기존 이메일 시 로그인 링크 자동 발송"
```

---

## 부수 효과 (별도 작업 불필요)

- `t('signup.errEmailRegistered')` i18n 키 — Task 3 완료 후 미참조 상태가 됨. messages.ts와 Copy_v1.md에 잔존하는 dead key. 삭제는 선택사항(무해).
- `Login.tsx` (`/login?mode=email`) — 기존 이메일 전용 로그인 경로 유지. 변경 없음.

---

## 검증 방법

### 매직링크 스마트 라우팅

**신규 이메일 테스트:**
1. QA 도구 "소셜 가입 기록 초기화" 클릭 (깨끗한 상태)
2. `/signup` → 새 이메일 (예: `new@example.com`) 입력
3. "인증 메일 보내기" → 에러 없이 발송 완료 배너 표시 확인
4. DEV "데모: 받은 링크 열기" → `/signup?step=2` 이동 확인 (온보딩 진입)

**기존 이메일 테스트 (이미 가입된):**
1. `/signup` → 이미 가입된 이메일 입력 (예: `test@example.com` — QA로 로그인 상태 설정 후 `artier_registered_emails_v1`에 있는 이메일 사용)
2. "인증 메일 보내기" → 에러 없이 발송 완료 배너 표시 확인
3. DEV "데모: 받은 링크 열기" → 홈(`/`)으로 이동 확인 (온보딩 미진입)

### 크로스 제공자 계정 연결

**준비:** 카카오로 신규 가입 후 소셜 가입 기록 초기화 (제공자 플래그만 제거, 이메일 레지스트리는 유지)

테스트:
1. QA 도구 "소셜 가입 기록 초기화" → `/login`으로 이동
2. 카카오 버튼 클릭 → SocialSignupModal이 열리지 않고 직접 로그인 확인
   - `artier_social_signed_up__kakao` 없음 → 이메일 레지스트리에 `demo@kakao.com` 있음 → 로그인 처리

**새 소셜 제공자 연결 테스트:**
1. QA "소셜 가입 기록 초기화" → 구글 버튼 클릭 → SocialSignupModal (생년월일+약관) → 가입 완료
2. QA "소셜 가입 기록 초기화" → 카카오 버튼 클릭
   - 카카오 `MOCK_SOCIAL_PROFILE.email = 'demo@kakao.com'` ≠ 구글 `'demo@gmail.com'` → 각각 독립 계정 (이메일 다르므로 연결 안 됨 — 정상)
3. QA "소셜 가입 기록 초기화" → 구글 버튼 다시 클릭
   - `artier_social_signed_up__google` 없음 → `demo@gmail.com` 이메일 레지스트리 조회 → 있음 → 로그인 처리 (SocialSignupModal 미노출) ← **크로스 제공자 연결 핵심 테스트**
