# 가입/약관 동의 원고 v2 (개발·법무 전달용)

이메일 가입(`USR-AUT-03 Step 3`)과 소셜 최초 가입 모달(`USR-AUT-05` SocialSignupModal)에서 노출하는 약관 동의 문구 전문.

> **단일 소스 안내**
> - 코드(i18n) 단일 소스: [`Copy_v1.md`](Copy_v1.md) `signup.*` · `socialSignup.*` · `login.ageNotice` 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다.
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.
> - 약관·개인정보처리방침 본문은 별도 [`Handoff_Terms_v1.md`](Handoff_Terms_v1.md) · [`Handoff_Privacy_v1.md`](Handoff_Privacy_v1.md) 참조.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 필수 동의 | 이용약관 + 개인정보 수집·이용 + 만 14세 이상 자기 명시 | [Policy §2.2](Policy_v1.md#22-만-14세-검증) |
| 선택 동의 | 마케팅 정보 수신 (단일 항목, 기본 OFF) | [Policy §1](Policy_v1.md#1-알림-채널-정책)·[§21.1 L-4](Policy_v1.md#211-검토-필요-문서-4종) |
| 발송 채널 | 사용자 보유 식별자 자동 라우팅 (이메일·알림톡·SMS) | [Policy §1.1](Policy_v1.md#11-채널-라우팅) |
| 만 14세 미만 차단 | 시스템 차단 + 약관 자기 명시 + 거짓 입력 책임 + 사후 신고 4단 가드 | [Policy §2.2](Policy_v1.md#22-만-14세-검증) |
| 이메일·소셜 동일 구성 | 두 흐름 모두 4종 동의 동일 적용 | [Policy v2.13 (K)](Policy_v1.md#문서-이력) |

---

## 1) 이메일 가입 Step 3 (USR-AUT-05)

### 1.1 한국어 원고

**섹션 헤더**: 약관 동의 (`signup.agreeSection`)

**전체 동의 항목**: 전체 동의 (`signup.agreeAll`)

**필수 동의 항목 3종** (체크 안 하면 가입 완료 불가):
- [필수] 이용약관 동의 (`signup.agreeTerms`)
- [필수] 개인정보 수집·이용 동의 (`signup.agreePrivacy`)
- [필수] 만 14세 이상이에요 (`signup.agreeAge`)

**만 14세 안내 문구** (`signup.ageRestrictionLead`)
> Artier는 만 14세 미만 회원 가입을 받지 않습니다. (전자상거래 등에서의 소비자보호에 관한 법률 등 준수)

**선택 동의 항목** (기본 OFF):
- [선택] 마케팅 정보 수신 동의 (`signup.agreeMarketing`)

**선택 동의 보조 설명** (`signup.agreeMarketingHint`)
> 이메일·알림톡·문자 중 보유한 채널로 보내드려요.

### 1.2 English copy

**Section header**: Terms & consent (`signup.agreeSection`)

**Agree all toggle**: Agree to all (`signup.agreeAll`)

**Required (3)** — must check all to complete signup:
- [Required] Terms of service (`signup.agreeTerms`)
- [Required] Privacy policy (`signup.agreePrivacy`)
- [Required] I am 14 years or older (`signup.agreeAge`)

**Age restriction notice** (`signup.ageRestrictionLead`)
> Artier does not allow accounts for users under 14 (consumer protection and related regulations).

**Optional** (default OFF):
- [Optional] Receive marketing messages (`signup.agreeMarketing`)

**Optional hint** (`signup.agreeMarketingHint`)
> We'll use whichever channel you have — email, KakaoTalk, or SMS.

### 1.3 화면 동작

- 필수 3종 미체크 시 "가입하기" CTA disabled
- 약관·개인정보 텍스트 옆 "보기" 버튼 → 각각 `/terms`, `/privacy` 이동
- 동의값 저장 시 필수/선택 분리하여 기록
- 회원가입 완료 시점에 동의 이력 + 시각 + IP 보관 (런칭 전 백엔드 연동 후 영속화)

---

## 2) 소셜 최초 가입 모달 (USR-AUT-05, SocialSignupModal)

소셜 로그인(카카오·구글·애플) 첫 가입 시 노출되는 모달. 닉네임 입력 + 약관 동의를 한 번에 받는다.

### 2.1 한국어 원고

**제목** (`socialSignup.title`)
> {provider} 계정으로 가입

`{provider}` placeholder는 `socialSignup.provider_kakao`(카카오) / `socialSignup.provider_google`(구글) / `socialSignup.provider_apple`(Apple)로 치환.

**가이드** (`socialSignup.guide`)
> {provider} 계정이 확인되었어요. 닉네임을 입력하고 약관에 동의하면 가입이 완료됩니다.

**닉네임 입력**
- 라벨: 닉네임 (`socialSignup.nicknameLabel`)
- 플레이스홀더: 예) 카테, 봄날의 화가 (`socialSignup.nicknamePlaceholder`)
- 보조 설명: 2~20자. 가입 후 프로필에서 변경할 수 있어요. (`socialSignup.nicknameHint`)

**전체 동의**: 전체 동의 (선택 항목 포함) (`socialSignup.agreeAll`)

**필수 동의 3종**:
- [필수] 이용약관 동의 (`socialSignup.termsTerms`)
- [필수] 개인정보 수집·이용 동의 (`socialSignup.termsPrivacy`)
- [필수] 만 14세 이상이에요 (`socialSignup.termsAge`)

**선택 동의** (기본 OFF):
- [선택] 마케팅 정보 수신 동의 (`socialSignup.termsMarketing`)
- 보조 설명: 이메일·알림톡·문자 중 보유한 채널로 보내드려요. (`socialSignup.termsMarketingHint`)

**버튼**:
- 가입 완료 (`socialSignup.submit`) — 필수 3종 체크 + 닉네임 유효 시 활성화
- 닫기 (`socialSignup.close`) — 가입 취소 (소셜 OAuth 동의는 별도 처리)

### 2.2 English copy

**Title** (`socialSignup.title`)
> Sign up with {provider}

`{provider}` is replaced by `socialSignup.provider_kakao`(Kakao) / `socialSignup.provider_google`(Google) / `socialSignup.provider_apple`(Apple).

**Guide** (`socialSignup.guide`)
> Your {provider} account has been verified. Enter a nickname and agree to the terms to complete signup.

**Nickname field**
- Label: Nickname (`socialSignup.nicknameLabel`)
- Placeholder: e.g. Carte, Spring Painter (`socialSignup.nicknamePlaceholder`)
- Hint: 2–20 characters. You can change this later in your profile. (`socialSignup.nicknameHint`)

**Agree all**: Agree to all (including optional) (`socialSignup.agreeAll`)

**Required (3)**:
- [Required] Agree to Terms of Service (`socialSignup.termsTerms`)
- [Required] Agree to Privacy Policy (`socialSignup.termsPrivacy`)
- [Required] I am 14 years or older (`socialSignup.termsAge`)

**Optional** (default OFF):
- [Optional] Agree to receive marketing (`socialSignup.termsMarketing`)
- Hint: We'll use whichever channel you have — email, KakaoTalk, or SMS. (`socialSignup.termsMarketingHint`)

**Buttons**:
- Sign up (`socialSignup.submit`) — enabled when 3 required checks + valid nickname
- Close (`socialSignup.close`) — cancel signup (social OAuth consent handled separately)

### 2.3 화면 동작

- 닉네임 글자 수 카운터 노출 (온보딩과 동일 패턴, [Policy v2.13 (J)](Policy_v1.md#문서-이력))
- 닉네임 prefill — 소셜 응답에서 받은 표시명을 자동 채움 (사용자 수정 가능)
- 약관·개인정보 텍스트 옆 "보기" 버튼 → 각각 `/terms`, `/privacy` 이동
- 가입 완료 후 온보딩(USR-AUT-06)으로 이동 — 닉네임은 prefill 상태로 이어지며 "닉네임은 방금 적은 그대로 채워뒀어요" 안내 노출

---

## 3) 만 14세 미만 차단 안내 (로그인·가입 화면 공통)

**위치**: USR-AUT-02 시트 하단 / USR-AUT-05 폼 상단

**한국어** (`login.ageNotice`)
> 만 14세 미만은 가입·이용할 수 없습니다.

**English** (`login.ageNotice`)
> Users under 14 cannot sign up or use this service.

→ 시스템 차단(생년월일 검증)과 별개로 시각 안내 1줄을 항상 노출하여 4단 가드 중 두 번째(약관 자기 명시) 인지 강화.

---

## 4) 적용 키 일람 (코드 동기화 매핑)

### 4.1 이메일 가입 Step 3
- 섹션·전체: `signup.agreeSection`, `signup.agreeAll`
- 필수: `signup.agreeTerms`, `signup.agreePrivacy`, `signup.agreeAge`
- 14세 안내: `signup.ageRestrictionLead`
- 선택: `signup.agreeMarketing`, `signup.agreeMarketingHint`
- 태그: `signup.requiredTag`(`[필수]`), `signup.optionalTag`(`[선택]`)
- 보기 버튼: `signup.view`

### 4.2 소셜 가입 모달
- 헤더·가이드: `socialSignup.title`, `socialSignup.guide`
- 제공자: `socialSignup.provider_kakao` / `provider_google` / `provider_apple`
- 닉네임: `socialSignup.nicknameLabel`, `nicknamePlaceholder`, `nicknameHint`
- 동의: `socialSignup.agreeAll`, `termsTerms`, `termsPrivacy`, `termsAge`, `termsMarketing`, `termsMarketingHint`
- 버튼: `socialSignup.submit`, `socialSignup.close`

### 4.3 14세 안내
- `login.ageNotice`

---

## 5) 구현 체크

- [ ] 필수 동의 3종(이용약관·개인정보·14세 자기명시) 모두 체크해야 가입 CTA 활성화
- [ ] 선택 동의 마케팅 기본값 OFF 확인
- [ ] 약관·개인정보 "보기" 링크 동작 확인 (`/terms`, `/privacy`)
- [ ] 동의값 저장 시 필수/선택 분리 + 시각·IP 함께 (백엔드 연동 후)
- [ ] 14세 미만 시스템 차단(생년월일 검증) + 안내 문구 동시 노출
- [ ] 이메일·소셜 양쪽에 동일한 4종 동의 구성 (동일 톤·동일 항목 수)
- [ ] 마케팅 동의 보조 설명에 채널 자동 라우팅 명시 ([Policy §1.1](Policy_v1.md#11-채널-라우팅) 정합)
- [ ] ko/en 양측 동일 항목 수·동일 표현 일관성

---

## 6) 법무 검토 연결

본 가입 동의 구성은 [Handoff_LegalReview_Checklist_v1.md](Handoff_LegalReview_Checklist_v1.md) §3 LP-1(만 14세 차단)·LP-9(마케팅 동의 로그) 검토 포인트와 직결된다. 변호사 검토 시 본 문서를 약관·처리방침과 함께 동봉.

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록 + 체크 위주에서 이메일 가입 + 소셜 가입 모달 두 흐름 ko/en 전문 게재로 확장. 14세 미만 차단 안내·동의 정책 매트릭스·법무 검토 연결 신설. 핸드오프 보조본 성격 명시. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
