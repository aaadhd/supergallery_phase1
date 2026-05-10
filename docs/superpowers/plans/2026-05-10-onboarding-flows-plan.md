# 온보딩 플로우 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signup/Onboarding 역할 분리, 토큰 클레임 스텝 명시화, 완료 화면 서비스 메시지 강화.

**Architecture:** Signup(인증+법적동의) → Onboarding(닉네임+사진 → [클레임] → 완료) 로 역할을 명확히 나눈다. 소셜과 매직링크 양쪽 모두 같은 Onboarding으로 합류한다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, lucide-react, `useSyncExternalStore` 패턴, `useI18n()` i18n hook

---

## 배경 지식 (구현 전 반드시 읽기)

### 현재 플로우 (변경 전)
```
매직링크: /signup step1(이메일) → step2(닉네임+생년월일) → step3(약관) → /onboarding
소셜:     AuthSheet → SocialSignupModal(닉네임+약관) → /onboarding

Onboarding: step0(환영 splash) → step1(닉네임+사진 OR 클레임 플래그) → step2(완료)
```

### 변경 후 목표 플로우
```
매직링크: /signup step1(이메일) → step2(생년월일+약관 통합) → /onboarding
소셜:     AuthSheet → SocialSignupModal(생년월일+약관) → /onboarding
          (닉네임은 MOCK_SOCIAL_PROFILE.name → artier_pending_signup_nickname으로 자동 핸드오프)

Onboarding 일반:  step0(닉네임+사진) → step1(완료)          TOTAL_STEPS=2
Onboarding 토큰:  step0(닉네임+사진) → step1(클레임) → step2(완료)  TOTAL_STEPS=3
```

### 핵심 파일 위치
- `src/app/i18n/messages.ts` — KO(~line 592) + EN(~line 1873) 두 곳 수정
- `src/app/pages/Signup.tsx` — step2+step3 통합
- `src/app/components/SocialSignupModal.tsx` — 닉네임 제거, 생년월일 추가
- `src/app/components/AuthSheet.tsx` — `completeFirstSocialSignup` 관련 (닉네임 핸드오프 유지)
- `src/app/pages/Onboarding.tsx` — 구조 전면 개편
- `src/app/pages/ExhibitionInviteLanding.tsx` — 로그인 회원 분기 추가

### 알아야 할 패턴
- `useI18n()`의 `t(key)` — 하드코딩 한국어 문자열 금지, 반드시 i18n 키 사용
- `isValidDate`, `meetsMinAge` — `src/app/utils/ageCheck.ts` 에 있는 생년월일 검증 유틸
- `artier_pending_invite_token` — sessionStorage 키, 초대 토큰 핸드오프
- `artier_pending_signup_nickname` — localStorage 키, 소셜 닉네임 프리필 핸드오프
- `getInviteToken(tokenStr)` — `src/app/utils/inviteTokenStore.ts`
- `buildClaimableSlots(work, t)` — Onboarding.tsx 안에 정의된 함수
- TypeScript 검증: `npx tsc --noEmit`

---

## 파일 구조

| 파일 | 변경 규모 |
|---|---|
| `src/app/i18n/messages.ts` | 기존 키 수정 + 신규 키 추가 (KO·EN 양쪽) |
| `src/app/pages/Signup.tsx` | step3 블록 제거, step2에 약관 병합, 닉네임 state 제거 |
| `src/app/components/SocialSignupModal.tsx` | 닉네임 Input 제거, 생년월일 UI 추가 |
| `src/app/pages/Onboarding.tsx` | TOTAL_STEPS 동적화, splash 제거, 클레임 스텝 구조화, 완료 화면 개선 |
| `src/app/pages/ExhibitionInviteLanding.tsx` | 로그인 상태 분기 섹션 추가 |

---

## Task 1: i18n 키 업데이트 (messages.ts)

**Files:**
- Modify: `src/app/i18n/messages.ts`

### KO 로케일 (~line 592)

- [ ] **Step 1: 기존 온보딩 키 수정**

`messages.ts` KO 섹션에서 아래 라인을 찾아 값을 교체한다.

```ts
// line 595 — 변경
'onboarding.nicknameTitle': 'Proud Gallery에서 어떻게 불리고 싶으세요?',
// line 596 — 변경
'onboarding.nicknameLead': '작품을 올리거나 감상할 때 이 이름으로 표시돼요',
// line 611 — 변경
'onboarding.doneWelcome': '{name}님, 반가워요!',
// line 612 — 변경
'onboarding.uploadFirst': '작품 올려보기 →',
```

- [ ] **Step 2: 신규 온보딩 완료 화면 키 추가**

`onboarding.browseStart` 키 바로 뒤에 추가한다.

```ts
'onboarding.doneTagline': '그림을 올려 나만의 전시를 열거나,\n마음에 드는 작품을 저장해두세요',
'onboarding.feature1': '그림 한 점이 나만의 전시가 돼요',
'onboarding.feature2': '마음에 든 작품을 모아둘 수 있어요',
'onboarding.feature3': '작가와 감상자가 함께하는 갤러리예요',
```

- [ ] **Step 3: 클레임 서브텍스트 키 추가**

`claim.findMyWorksWarning` 키 바로 뒤에 추가한다.

```ts
'claim.findMyWorksSub': '{inviterName} 작가님이 초대해 주셨어요. 내 작품을 골라 전시에 이름을 올려보세요',
```

- [ ] **Step 4: 초대 기존 회원 안내 키 추가**

`invite.tokenExpired` 키 바로 뒤에 추가한다.

```ts
'invite.memberNotice': 'Proud Gallery에 가입된 회원입니다.\n전시 게시자에게 요청해서 작품을 연결하세요.',
'invite.memberViewCta': '전시 보기',
```

- [ ] **Step 5: SocialSignupModal 생년월일 키 추가**

`socialSignup.guide` 값을 수정하고 생년월일 라벨 키를 추가한다.

```ts
// socialSignup.guide 값 변경 (닉네임 안내 문구 제거)
'socialSignup.guide': '{provider} 계정이 확인되었어요. 생년월일을 입력하고 약관에 동의하면 가입이 완료돼요.',
// socialSignup.termsAge 바로 뒤에 추가
'socialSignup.birthLabel': '생년월일',
```

### EN 로케일 (~line 1873)

- [ ] **Step 6: EN 키 동일하게 반영**

KO와 동일한 키를 EN 섹션에서도 찾아 수정·추가한다.

```ts
// 수정
'onboarding.nicknameTitle': 'What would you like to be called on Proud Gallery?',
'onboarding.nicknameLead': 'This name appears when you upload work or browse.',
'onboarding.doneWelcome': 'Welcome, {name}!',
'onboarding.uploadFirst': 'Upload my work →',
// 추가 (onboarding.browseStart 뒤)
'onboarding.doneTagline': 'Open your own exhibition,\nor save work you love.',
'onboarding.feature1': 'One piece becomes your own exhibition',
'onboarding.feature2': 'Save and collect work you love',
'onboarding.feature3': 'A gallery for artists and art lovers',
// 추가 (claim.findMyWorksWarning 뒤)
'claim.findMyWorksSub': '{inviterName} invited you. Pick your piece and add your name to the exhibition.',
// 추가 (invite.tokenExpired 뒤)
'invite.memberNotice': 'You already have a Proud Gallery account.\nAsk the exhibition owner to add your work.',
'invite.memberViewCta': 'View exhibition',
// 수정
'socialSignup.guide': 'Your {provider} account has been verified. Enter your date of birth and agree to the terms to complete signup.',
'socialSignup.birthLabel': 'Date of birth',
```

- [ ] **Step 7: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/app/i18n/messages.ts
git commit -m "feat: 온보딩 i18n 키 업데이트 — 완료 화면·클레임·소셜 생년월일"
```

---

## Task 2: Signup.tsx — step 2+3 통합, 닉네임 제거

**Files:**
- Modify: `src/app/pages/Signup.tsx`

### 배경
현재 step2 = 닉네임+생년월일, step3 = 약관. 변경 후 step2 = 생년월일+약관(통합), step3 제거.
닉네임 관련 state·validation·JSX 전체 제거.

- [ ] **Step 1: 닉네임 관련 state와 파생값 제거**

아래 라인들을 파일에서 제거한다 (참고용 현행 코드):

```ts
// 제거할 state
const [nickname, setNickname] = useState('');
// 제거할 파생값
const nicknameTrim = nickname.trim();
const nicknameLengthOk = nicknameTrim.length >= 2 && nicknameTrim.length <= 20;
const nicknameClean = !containsProfanity(nicknameTrim);
const nicknameError = touched('nickname') && !nicknameLengthOk
  ? t('signup.errNickname')
  : touched('nickname') && !nicknameClean
    ? t('signup.errProfanity')
    : '';
```

- [ ] **Step 2: profileOk 조건을 생년월일만으로 단순화**

```ts
// 변경 전
const profileOk = nicknameLengthOk && nicknameClean && birthMeetsAge;
// 변경 후
const profileOk = birthMeetsAge;
```

- [ ] **Step 3: handleFinalSubmit에서 닉네임 localStorage 저장 제거**

```ts
// 변경 전
const handleFinalSubmit = (e: FormEvent) => {
  e.preventDefault();
  setSubmitted(true);
  if (!profileOk || !agreementsOk) return;
  try {
    localStorage.setItem('artier_pending_signup_email', email.trim());
    localStorage.setItem('artier_pending_signup_nickname', nicknameTrim);  // ← 이 줄 제거
  } catch { /* ignore */ }
  auth.login();
  persistMockSession(email.trim());
  pointsOnSignupComplete();
  navigate('/onboarding');
};

// 변경 후
const handleFinalSubmit = (e: FormEvent) => {
  e.preventDefault();
  setSubmitted(true);
  if (!profileOk || !agreementsOk) return;
  try {
    localStorage.setItem('artier_pending_signup_email', email.trim());
  } catch { /* ignore */ }
  auth.login();
  persistMockSession(email.trim());
  pointsOnSignupComplete();
  navigate('/onboarding');
};
```

- [ ] **Step 4: step2 JSX — 닉네임 Input 블록 제거, 약관 블록 이동**

`{stepParam === 2 && (...)}` 블록에서:
1. 닉네임 `<div>` 전체 제거
2. "다음" 버튼(`navigate('/signup?step=3')`)을 제거하고, 약관 동의 섹션 + 제출 버튼을 step2 하단에 추가

변경 후 step2 블록의 버튼 영역:

```tsx
{stepParam === 2 && (
  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
    {/* 생년월일 — 현행 그대로 유지 */}
    <div> ... </div>

    {/* 약관 동의 카드 — 기존 step3 JSX 그대로 이동 */}
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* 전체 동의 헤더 */}
      <div role="button" tabIndex={0} onClick={() => toggleMaster()} ... >
        ...
      </div>
      {/* 이용약관, 개인정보, 만 14세, 마케팅 — 기존 step3 내용 그대로 */}
      ...
    </div>

    <p className="text-xs text-muted-foreground leading-relaxed px-1">
      {t('signup.ageRestrictionLead')}
    </p>

    {/* 버튼 */}
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/signup?step=1')}
        className="w-1/3 min-h-[44px] rounded-lg text-sm"
      >
        {t('signup.previous')}
      </Button>
      <Button
        type="submit"
        disabled={!profileOk || !agreementsOk}
        className="flex-1 min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('signup.submit')}
      </Button>
    </div>

    {/* 약관 보기 Dialog — 기존 step3에서 이동 */}
    <Dialog open={!!viewingDoc} onOpenChange={...}>
      ...
    </Dialog>
  </div>
)}
```

- [ ] **Step 5: step3 블록 전체 제거**

`{stepParam === 3 && (...)}` 블록 전체를 파일에서 삭제한다.

- [ ] **Step 6: 진행 표시 텍스트 제거**

step3이 사라지면서 "1/2 · 프로필 정보" / "2/2 · 약관 동의" 텍스트도 불필요해진다.

```tsx
// 변경 전 (제거)
<p className="mt-1.5 text-sm text-muted-foreground">
  {stepParam === 2
    ? `1/2 · ${t('signup.stepProfileLabel')}`
    : `2/2 · ${t('signup.stepTermsLabel')}`}
</p>
// 변경 후: 해당 <p> 태그 삭제
```

- [ ] **Step 7: import 정리**

닉네임에만 쓰인 `User` 아이콘과 `containsProfanity` import 삭제 (다른 곳에서 사용하지 않는 경우에만).

```ts
// 변경 전
import { Mail, User, Calendar } from 'lucide-react';
import { containsProfanity } from '../utils/profanityFilter';
// 변경 후
import { Mail, Calendar } from 'lucide-react';
// containsProfanity — 다른 곳 사용 없으면 제거
```

- [ ] **Step 8: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 9: 커밋**

```bash
git add src/app/pages/Signup.tsx
git commit -m "feat: Signup step2+3 통합 — 닉네임 제거, 생년월일+약관 한 화면"
```

---

## Task 3: SocialSignupModal.tsx — 닉네임 제거, 생년월일 추가

**Files:**
- Modify: `src/app/components/SocialSignupModal.tsx`

### 배경
닉네임 Input을 제거하되, 내부적으로는 `profile.name`을 닉네임으로 사용해 `onComplete(nickname, email)` 시그니처를 유지한다. AuthSheet 변경 불필요.
생년월일은 Signup.tsx의 연·월·일 UI와 동일하게 구현한다.
카카오 mock에 생년월일 추가 (프리필용).

- [ ] **Step 1: MOCK_SOCIAL_PROFILE에 생년월일 추가**

```ts
const MOCK_SOCIAL_PROFILE: Record<SocialProvider, { email: string; name: string; avatar: string; birthYear?: string; birthMonth?: string; birthDay?: string }> = {
  kakao: { email: 'demo@kakao.com', name: '카테', avatar: '🟡', birthYear: '1975', birthMonth: '3', birthDay: '15' },
  google: { email: 'demo@gmail.com', name: 'Carte', avatar: '🅖' },
  apple: { email: 'demo@privaterelay.appleid.com', name: 'Carte', avatar: '🍎' },
};
```

- [ ] **Step 2: 생년월일 state 추가, 닉네임 state 유지**

```ts
// 기존 nickname state 유지 (onComplete 시그니처 호환용, UI만 숨김)
const [nickname, setNickname] = useState('');
// 신규 생년월일 state
const [birthYear, setBirthYear] = useState('');
const [birthMonth, setBirthMonth] = useState('');
const [birthDay, setBirthDay] = useState('');
```

- [ ] **Step 3: useEffect에 생년월일 프리필 추가**

```ts
useEffect(() => {
  if (open && profile) {
    setNickname(profile.name);           // 기존 유지
    setBirthYear(profile.birthYear ?? '');
    setBirthMonth(profile.birthMonth ?? '');
    setBirthDay(profile.birthDay ?? '');
    setAgreeTerms(false);
    setAgreePrivacy(false);
    setAgreeAge(false);
    setAgreeMarketing(false);
  }
}, [open, profile]);
```

- [ ] **Step 4: 생년월일 유효성 파생값 추가**

Signup.tsx에서 사용하는 것과 동일한 유틸 임포트 후 적용.

```ts
import { isValidDate, meetsMinAge } from '../utils/ageCheck';
import { useMemo } from 'react'; // 이미 있으면 중복 추가 불필요

const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

const birthFilled = birthYear !== '' && birthMonth !== '' && birthDay !== '';
const birthValid = birthFilled && isValidDate(Number(birthYear), Number(birthMonth), Number(birthDay));
const birthMeetsAge = birthValid && meetsMinAge(Number(birthYear), Number(birthMonth), Number(birthDay));
```

- [ ] **Step 5: canSubmit 조건 수정**

```ts
// 변경 전
const canSubmit = allRequired && nickname.trim().length >= 2 && nickname.trim().length <= 20;
// 변경 후
const canSubmit = allRequired && birthMeetsAge;
```

- [ ] **Step 6: 닉네임 Input JSX 제거, 생년월일 UI 추가**

파일에서 닉네임 `<div className="space-y-2">` 블록 전체를 제거하고, 그 자리에 생년월일 UI를 추가한다.

```tsx
{/* 생년월일 */}
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    {t('socialSignup.birthLabel')}
    <span className="ml-1 text-xs font-medium text-red-500">(필수)</span>
  </label>
  <div className="grid grid-cols-3 gap-2">
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="출생 연도"
        value={birthYear}
        onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
        placeholder="1990"
        maxLength={4}
        className="min-h-[44px] w-full rounded-lg border border-border/40 pl-3 pr-8 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none placeholder:text-muted-foreground/50"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">년</span>
    </div>
    <select
      aria-label="출생 월"
      value={birthMonth}
      onChange={(e) => setBirthMonth(e.target.value)}
      className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
    >
      <option value="">월</option>
      {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
    <select
      aria-label="출생 일"
      value={birthDay}
      onChange={(e) => setBirthDay(e.target.value)}
      className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
    >
      <option value="">일</option>
      {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  </div>
  {birthFilled && !birthMeetsAge && (
    <p className="text-sm text-destructive">만 14세 이상만 가입할 수 있어요.</p>
  )}
</div>
```

- [ ] **Step 7: autoFocus 제거**

닉네임 Input이 사라졌으므로, 더 이상 `autoFocus`가 불필요하다. 약관 섹션 상단에 남아 있으면 제거.

- [ ] **Step 8: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 9: 커밋**

```bash
git add src/app/components/SocialSignupModal.tsx
git commit -m "feat: SocialSignupModal 닉네임 제거, 생년월일 추가 (카카오 프리필)"
```

---

## Task 4: Onboarding.tsx — 구조 개선 + 완료 화면

**Files:**
- Modify: `src/app/pages/Onboarding.tsx`

### 배경
가장 큰 변경 파일. 크게 4가지를 한 번에 처리한다:
1. `TOTAL_STEPS` 동적화 (토큰 있으면 3, 없으면 2)
2. step0 환영 splash 제거 → 닉네임+사진이 step0
3. 토큰 클레임을 `showClaimScreen` 플래그 방식 → `currentStep===1` 명시적 스텝으로 전환
4. 완료 화면 — 서비스 메시지 + CTA 순서 변경

### step 매핑 (변경 후)
```
currentStep 0: 닉네임 + 사진 (ALL)
currentStep 1: 클레임(토큰 있을 때) | 완료(일반)
currentStep 2: 완료(토큰 있을 때만)
```

- [ ] **Step 1: 아이콘 import 추가**

완료 화면 feature 포인트에 사용할 아이콘 추가.

```ts
// 변경 전
import { Camera, Palette } from 'lucide-react';
// 변경 후
import { Camera, Palette, Bookmark, Users } from 'lucide-react';
```

- [ ] **Step 2: showClaimScreen state 제거, TOTAL_STEPS 동적화**

```ts
// 제거
const [showClaimScreen, setShowClaimScreen] = useState(false);

// 변경
// const TOTAL_STEPS = 3;  ← 제거
const TOTAL_STEPS = isInviteFlow ? 3 : 2;  // isInviteFlow 선언 이후에 위치
```

`isInviteFlow` 선언은 이미 파일 안에 있다. `TOTAL_STEPS` 상수를 `const TOTAL_STEPS = 3` 에서 `const TOTAL_STEPS = isInviteFlow ? 3 : 2;` 로 교체한다.

- [ ] **Step 3: 토큰 해석 로직을 useEffect(mount)로 이동**

현재 `handleNicknameNext` 안에서 토큰을 평가한다. 이를 mount 시점 useEffect로 이동한다.

```ts
// 신규 추가 — 기존 workStore.subscribe useEffect 위에 삽입
useEffect(() => {
  if (!isInviteFlow) return;
  let tokenStr: string | null = null;
  try { tokenStr = sessionStorage.getItem('artier_pending_invite_token'); } catch { /* ignore */ }
  if (!tokenStr) return;
  const tok = getInviteToken(tokenStr);
  if (tok && (tok.status === 'active' || tok.status === 'inactive')) {
    const work = workStore.getWork(tok.workId);
    if (work) {
      const slots = buildClaimableSlots(work, t);
      setPendingToken(tok);
      setClaimWork(work);
      setClaimableSlots(slots);
    }
  }
}, [isInviteFlow, t]);
```

- [ ] **Step 4: goNext deps 배열 업데이트**

`TOTAL_STEPS`가 상수에서 파생값으로 바뀌었으므로 `goNext`의 deps에 추가한다.

```ts
// 변경 전
const goNext = useCallback(() => {
  setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
}, []);

// 변경 후
const goNext = useCallback(() => {
  setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
}, [TOTAL_STEPS]);
```

- [ ] **Step 4b: 유효하지 않은 토큰일 때 클레임 스텝 자동 skip**

토큰이 sessionStorage에 있었지만 만료·취소 등으로 `pendingToken`이 null인 경우,
step 1에 도착했을 때 자동으로 skip해 완료 화면으로 넘긴다.
mount useEffect 이후, `handleNicknameNext` 선언 위에 추가한다.

```ts
useEffect(() => {
  if (currentStep !== 1 || !isInviteFlow) return;
  if (!pendingToken) goNext();
}, [currentStep, isInviteFlow, pendingToken, goNext]);
```

- [ ] **Step 5: handleNicknameNext 단순화**

토큰 평가 로직을 제거하고 단순 validate + goNext로 만든다.

```ts
// 변경 전 (토큰 평가 로직 포함)
const handleNicknameNext = () => {
  if (!validateNickname()) return;
  pointsOnOnboardingStep1Complete();

  let tokenStr: string | null = null;
  try { tokenStr = sessionStorage.getItem('artier_pending_invite_token'); } catch { /* ignore */ }
  if (tokenStr) {
    const tok = getInviteToken(tokenStr);
    if (tok && (tok.status === 'active' || tok.status === 'inactive')) {
      const work = workStore.getWork(tok.workId);
      if (work) {
        const slots = buildClaimableSlots(work, t);
        if (slots.length > 0) {
          setPendingToken(tok);
          setClaimWork(work);
          setClaimableSlots(slots);
          setShowClaimScreen(true);
          return;
        }
      }
    }
  }
  goNext();
};

// 변경 후
const handleNicknameNext = () => {
  if (!validateNickname()) return;
  pointsOnOnboardingStep1Complete();
  goNext();
};
```

- [ ] **Step 5: handleClaimSlot과 handleClaimSkip에서 showClaimScreen 참조 제거**

```ts
// handleClaimSlot 안에서 제거
setShowClaimScreen(false);  // ← 이 줄 제거

// handleClaimSkip 안에서 제거
setShowClaimScreen(false);  // ← 이 줄 제거
```

- [ ] **Step 6: step 렌더링 재구조화**

현재 step 렌더링 구조를 아래와 같이 전면 교체한다.

```tsx
{/* Step 0: 닉네임 + 사진 (환영 splash 제거, 직접 시작) */}
{currentStep === 0 && (
  <>
    <h2 className="text-lg font-bold text-foreground mb-1">
      {t('onboarding.nicknameTitle')}
    </h2>
    <p className="text-sm text-muted-foreground mb-4">
      {t('onboarding.nicknameLead')}
    </p>

    {/* 프로필 이미지 */}
    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
    <div className="flex items-center gap-4 mb-6">
      <button type="button" onClick={() => fileInputRef.current?.click()} className="group shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30 transition lg:group-hover:border-primary/50">
          {profileImage ? (
            <img src={profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.25} />
          )}
        </div>
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary lg:hover:underline">
        {t('onboarding.uploadPhoto')}
      </button>
    </div>

    {/* 닉네임 */}
    <label className="block text-sm font-medium text-foreground mb-2">
      {t('onboarding.nicknameLabel')}
      <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
    </label>
    <input
      type="text"
      value={nickname}
      onChange={e => { if (e.target.value.length <= 20) { setNickname(e.target.value); setNicknameError(''); } }}
      placeholder={t('onboarding.nicknamePlaceholder')}
      className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-[3px] focus:ring-primary/30 focus:border-primary"
      maxLength={20}
      autoFocus
    />
    <p className="mt-1 text-xs text-muted-foreground">{nickname.trim().length}/20</p>
    {nicknameError ? <p className="mt-1 text-sm text-destructive">{nicknameError}</p> : null}

    <Button
      type="button"
      onClick={handleNicknameNext}
      className="mt-8 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90"
      style={{ backgroundColor: ACCENT }}
    >
      {t('onboarding.next')}
    </Button>
  </>
)}

{/* Step 1 (토큰): 본인 작품 찾기 */}
{currentStep === 1 && isInviteFlow && (
  <>
    <h2 className="text-lg font-bold text-foreground mb-2">
      {t('claim.findMyWorksTitle')}
    </h2>
    {claimWork && (
      <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
        {t('claim.findMyWorksSub').replace('{inviterName}', claimWork.artist?.name || '')}
      </p>
    )}
    {pendingToken?.status === 'inactive' && (
      <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
        {t('claim.pendingHeader')}
      </p>
    )}
    <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground/75 leading-relaxed">
      {t('claim.findMyWorksWarning')}
    </div>

    {claimableSlots.length === 0 ? (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t('claim.alreadyTaken')}
      </p>
    ) : (
      <>
        {claimableSlots.length === 1 && (
          <p className="mb-3 text-sm text-foreground/80 leading-relaxed">
            {t('claim.singleCardSafetyNote')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {claimableSlots.map((slot) => (
            <button
              key={slot.pieceIndex}
              type="button"
              disabled={claimBusy}
              onClick={() => handleClaimSlot(slot)}
              className="group text-left rounded-xl overflow-hidden border border-border lg:hover:border-primary/50 transition disabled:opacity-50"
            >
              <div className="aspect-square bg-muted/30">
                <ImageWithFallback src={slot.imageSrc} alt={slot.pieceTitle} className="h-full w-full object-cover" />
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground truncate">{slot.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{slot.pieceTitle}</p>
                <p className="mt-1 text-xs text-primary font-medium">{t('claim.thisIsMine')}</p>
              </div>
            </button>
          ))}
        </div>
      </>
    )}

    <Button
      variant="ghost"
      type="button"
      onClick={handleClaimSkip}
      disabled={claimBusy}
      className="w-full rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground lg:hover:bg-muted/50"
    >
      {t('claim.notHere')}
    </Button>
  </>
)}

{/* Step 1 (일반) 또는 Step 2 (토큰): 완료 */}
{((currentStep === 1 && !isInviteFlow) || currentStep === 2) && (
  <div className="text-center">
    <div className="relative mx-auto mb-6 h-28 w-28">
      <ConfettiBurst />
    </div>
    <h2 className="text-xl font-bold text-foreground mb-2">
      {t('onboarding.doneWelcome').replace('{name}', nickname.trim())}
    </h2>
    <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line leading-relaxed">
      {t('onboarding.doneTagline')}
    </p>

    {/* 서비스 포인트 3가지 */}
    <div className="mb-8 space-y-3 text-left rounded-xl border border-border/50 bg-muted/30 px-4 py-4">
      <div className="flex items-center gap-3">
        <Palette className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm text-foreground">{t('onboarding.feature1')}</span>
      </div>
      <div className="flex items-center gap-3">
        <Bookmark className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm text-foreground">{t('onboarding.feature2')}</span>
      </div>
      <div className="flex items-center gap-3">
        <Users className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm text-foreground">{t('onboarding.feature3')}</span>
      </div>
    </div>

    {/* 클레임 완료 카드 */}
    {claimedTitle && (
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left">
        <p className="text-sm font-semibold text-foreground mb-1">{t('claim.doneTitle')}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('claim.doneBody').replace('{title}', claimedTitle)}
        </p>
      </div>
    )}

    {/* CTA — 갤러리 둘러보기 primary, 작품 올려보기 secondary */}
    <Button
      type="button"
      onClick={finishOnboarding}
      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90"
      style={{ backgroundColor: ACCENT }}
    >
      {t('onboarding.browseStart')}
    </Button>
    <Button
      variant="ghost"
      type="button"
      onClick={() => { finishOnboarding(); navigate('/upload'); }}
      className="mt-3 w-full text-sm text-muted-foreground lg:hover:text-foreground"
    >
      {t('onboarding.uploadFirst')}
    </Button>
  </div>
)}
```

- [ ] **Step 7: 기존 step0(환영 splash) JSX 블록 제거**

현재 `{currentStep === 0 && (...)}` 블록에 있는 환영 splash (Palette 아이콘 + welcomeTitle + welcomeLead + "시작하기" 버튼) 전체를 삭제한다. 위 step6에서 새 step0 JSX로 대체됐다.

- [ ] **Step 8: 기존 step1·step2 블록 제거**

기존 `{currentStep === 1 && showClaimScreen && ...}`, `{currentStep === 1 && !showClaimScreen && ...}`, `{currentStep === 2 && ...}` 블록을 모두 삭제한다. 위 step6의 새 블록으로 대체됐다.

- [ ] **Step 9: finishOnboarding에서 불필요해진 초대 notice 관련 state 제거**

`inviteNotice`, `socialNotice`, `emailSignupNotice` 관련 조건부 렌더링 블록이 있으면 제거한다.
기존 step1의 notice 배너 (`noticeText` 계산 블록) 전체를 제거한다.

- [ ] **Step 10: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 11: 커밋**

```bash
git add src/app/pages/Onboarding.tsx
git commit -m "feat: Onboarding 재설계 — splash 제거, 토큰 클레임 명시 스텝, 완료 화면 개선"
```

---

## Task 5: ExhibitionInviteLanding.tsx — 기존 회원 분기

**Files:**
- Modify: `src/app/pages/ExhibitionInviteLanding.tsx`

### 배경
현재 비로그인 가입 유도 배너가 `{!auth.isLoggedIn() && (...)}` 조건으로 감싸져 있다.
로그인된 기존 회원이 초대 링크로 들어왔을 때 별도 안내 섹션이 없다.
`isInviteFlow` 변수는 파일 안에서 `!!inviteTokenParam`으로 이미 파생된다. 이를 활용한다.

- [ ] **Step 1: 기존 회원 안내 섹션 추가**

비로그인 배너 `section` 바로 뒤에 아래 JSX를 추가한다.

```tsx
{/* 로그인된 기존 회원 + 초대 링크 진입 */}
{auth.isLoggedIn() && isInviteFlow && (
  <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
    <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8 text-center">
      <p className="text-base text-foreground leading-relaxed mb-6 max-w-xl mx-auto whitespace-pre-line">
        {t('invite.memberNotice')}
      </p>
      <button
        type="button"
        onClick={() => navigate(`/exhibitions/${seed?.id}`)}
        className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold lg:hover:bg-primary/90"
      >
        {t('invite.memberViewCta')}
      </button>
    </div>
  </section>
)}
```

`isInviteFlow`는 파일 안에서 `const isInviteFlow = !!inviteTokenParam && tokenInfo.status !== 'none';` 형태로 확인 후 사용한다 (파일 내 기존 정의 확인).

- [ ] **Step 2: 타입 검증**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/pages/ExhibitionInviteLanding.tsx
git commit -m "feat: ExhibitionInviteLanding 기존 회원 안내 분기 추가"
```

---

## 검증 방법

### 매직링크 신규 가입 확인
1. `/signup` → 이메일 입력 → 링크 발송 → (DEV 버튼으로) 링크 클릭
2. Step 2: 생년월일 + 약관 한 화면 표시. 닉네임 필드 없음 확인
3. 가입 완료 → `/onboarding` 진입
4. Onboarding 첫 화면이 환영 splash 없이 바로 닉네임+사진 폼 확인
5. 프로그레스 바 1/2 → 2/2 확인
6. 완료 화면에 서비스 포인트 3개 + "갤러리 둘러보기"(상단) + "작품 올려보기"(하단) 확인

### 소셜 신규 가입 확인
1. 로그아웃 상태에서 AuthSheet 오픈 → 카카오 버튼 클릭
2. SocialSignupModal: 닉네임 입력 없음, 생년월일(1975/3/15 프리필) + 약관 확인
3. 가입 완료 → Onboarding 닉네임 화면에 "카테" 프리필 확인

### 토큰 신규 가입 확인
1. QA 도구 또는 직접 URL로 초대 링크 오픈 → "지금 가입하고 본인 작품 찾기" 클릭
2. 가입 완료 → Onboarding 프로그레스 1/3 → 2/3 → 3/3 확인
3. 2/3 클레임 화면에 초대한 작가명 서브텍스트 확인

### 기존 회원 초대 링크 확인
1. 로그인 상태에서 초대 링크 URL 직접 접근
2. "Proud Gallery에 가입된 회원입니다." 안내 표시 확인
3. "전시 보기" 클릭 → `/exhibitions/:workId` 이동 확인
