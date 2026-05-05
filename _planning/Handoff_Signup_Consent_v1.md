# 가입/약관 동의 원고

**작성**: 기획 · **독자**: 개발(구현·QA)

이메일 가입(`USR-AUT-05` Step 3)과 소셜 최초 가입 모달(`USR-AUT-06`) 약관 동의 문구 전문이다. 체크박스 UX·모달 크기 등은 PRD·구현 판단에 따른다.

> **단일 소스**
> - 화면 문자열은 [Copy_v1.md](./Copy_v1.md) 가입·소셜 가입·로그인 영역이 단일 소스다.
> - 수정 시 Copy를 먼저 갱신하고 본 문서를 같은 작업 범위에서 맞춘다.
> - 약관·개인정보처리방침 **전문**은 [Handoff_Terms_v1.md](./Handoff_Terms_v1.md) · [Handoff_Privacy_v1.md](./Handoff_Privacy_v1.md) 참조.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 필수 동의 | 이용약관 + 개인정보 수집·이용 + 만 14세 이상 자기 명시 | [Policy §2.2](./Policy_v1.md#2-2-만-14세-검증) |
| 선택 동의 | 마케팅 정보 수신 (단일 항목, 기본 OFF) | [Policy §1](./Policy_v1.md#1-알림-채널-정책)·[§21.1 L-4](./Policy_v1.md#21-1-검토-필요-문서-4종) |
| 발송 채널 | 사용자 보유 식별자 자동 라우팅 (이메일·알림톡·SMS) | [Policy §1.1](./Policy_v1.md#1-1-채널-라우팅) |
| 만 14세 미만 차단 | 시스템 차단 + 약관 자기 명시 + 거짓 입력 책임 + 사후 신고 4단 가드 | [Policy §2.2](./Policy_v1.md#2-2-만-14세-검증) |
| 이메일·소셜 동일 구성 | 두 흐름 모두 4종 동의 동일 적용 | [Policy §2.1](./Policy_v1.md#2-1-가입-옵션과-필수-수집-정보-region-분기-폐기) |

---

## 1) 이메일 가입 Step 3 (USR-AUT-05)

### 1.1 한국어 원고

**섹션 헤더**: 약관 동의

**전체 동의 항목**: 전체 동의

**필수 동의 항목 3종** (체크 안 하면 가입 완료 불가):

- [필수] 이용약관 동의
- [필수] 개인정보 수집·이용 동의
- [필수] 만 14세 이상이에요

**만 14세 안내 문구**

> Artier는 만 14세 미만 회원 가입을 받지 않아요. (관련 법령 등 준수)

**선택 동의 항목** (기본 OFF):

- [선택] 마케팅 정보 수신 동의

**선택 동의 보조 설명**

> 이메일·알림톡·문자 중 보유한 채널로 보내드려요.

### 1.2 English copy

**Section header**: Terms & consent

**Agree all toggle**: Agree to all

**Required (3)** — must check all to complete signup:

- [Required] Terms of service
- [Required] Privacy policy
- [Required] I am 14 years or older

**Age restriction notice**

> Artier does not allow accounts for users under 14 (in compliance with related regulations).

**Optional** (default OFF):

- [Optional] Receive marketing messages

**Optional hint**

> We'll use whichever channel you have — email, KakaoTalk, or SMS.

### 1.3 화면 동작

- 필수 3종 미체크 시 "가입하기" CTA disabled
- 약관·개인정보 텍스트 옆 "보기" 버튼 → 각각 경로 /terms, 경로 /privacy 이동
- 동의값 저장 시 필수/선택 분리하여 기록
- 회원가입 완료 시점에 동의 이력 + 시각 + IP 보관 (런칭 전 백엔드 연동 후 영속화)

---

## 2) 소셜 최초 가입 모달 (USR-AUT-06)

소셜 로그인(카카오·구글·애플) 첫 가입 시 노출되는 모달. 닉네임 입력 + 약관 동의를 한 번에 받는다.

### 2.1 한국어 원고

**제목**

> {provider} 계정으로 가입

`{provider}` 자리에는 카카오·구글·Apple 표기만 들어간다([Copy_v1.md](./Copy_v1.md) 소셜 가입 문구).

**가이드**

> {provider} 계정이 확인되었어요. 닉네임을 입력하고 약관에 동의하면 가입이 완료돼요.

**닉네임 입력**

- 라벨: 닉네임
- 플레이스홀더: 예) 카테, 봄날의 화가
- 보조 설명: 2~20자. 가입 후 프로필에서 변경할 수 있어요.

**전체 동의**: 전체 동의 (선택 항목 포함)

**필수 동의 3종**:

- [필수] 이용약관 동의
- [필수] 개인정보 수집·이용 동의
- [필수] 만 14세 이상이에요

**선택 동의** (기본 OFF):

- [선택] 마케팅 정보 수신 동의
- 보조 설명: 이메일·알림톡·문자 중 보유한 채널로 보내드려요.

**버튼**:

- 가입 완료 — 필수 3종 체크 + 닉네임 유효 시 활성화
- 닫기 — 가입 취소 (소셜 로그인 동의는 별도 처리)

### 2.2 English copy

**Title**

> Sign up with {provider}

`{provider}` is replaced with Kakao / Google / Apple brand strings from [Copy_v1.md](./Copy_v1.md).

**Guide**

> Your {provider} account has been verified. Enter a nickname and agree to the terms to complete signup.

**Nickname field**

- Label: Nickname
- Placeholder: e.g. Carte, Spring Painter
- Hint: 2–20 characters. You can change this later in your profile.

**Agree all**: Agree to all (including optional)

**Required (3)**:

- [Required] Agree to Terms of Service
- [Required] Agree to Privacy Policy
- [Required] I am 14 years or older

**Optional** (default OFF):

- [Optional] Agree to receive marketing
- Hint: We'll use whichever channel you have — email, KakaoTalk, or SMS.

**Buttons**:

- Sign up — enabled when 3 required checks + valid nickname
- Close — cancel signup (social login consent handled separately)

### 2.3 화면 동작

- 닉네임 글자 수 카운터 노출 (온보딩과 동일 패턴)
- 닉네임 prefill — 소셜 응답에서 받은 표시명을 자동 채움 (사용자 수정 가능)
- 약관·개인정보 텍스트 옆 "보기" 버튼 → 각각 경로 /terms, 경로 /privacy 이동
- 가입 완료 후 온보딩(USR-AUT-09 환영 → USR-AUT-09b → USR-AUT-10 프로필 입력)으로 이동 — 닉네임은 prefill 상태로 이어지며 "닉네임은 방금 적은 그대로 채워뒀어요" 안내 노출

---

## 3) 만 14세 미만 차단 안내 (로그인·가입 화면 공통)

**위치**: USR-AUT-02 시트 하단 / USR-AUT-05 약관 폼 상단 / USR-AUT-06 모달 상단

**한국어**

> 만 14세 미만은 가입·이용할 수 없어요.

**English**

> Users under 14 cannot sign up or use this service.

→ 시스템 차단(생년월일 검증)과 별개로 시각 안내 1줄을 항상 노출하여 4단 가드 중 두 번째(약관 자기 명시) 인지 강화.

---

## 4) 문자열 출처

모든 UI 문구는 [Copy_v1.md](./Copy_v1.md) 가입·소셜 가입·로그인 영역을 따른다. 본 문서는 prose 참고용이며 i18n 키 목록은 적지 않는다.

---

## 5) 구현 체크

- [ ] 필수 동의 3종(이용약관·개인정보·14세 자기명시) 모두 체크해야 가입 CTA 활성화
- [ ] 선택 동의 마케팅 기본값 OFF 확인
- [ ] 약관·개인정보 "보기" 링크 동작 확인 (경로 /terms, 경로 /privacy)
- [ ] 동의값 저장 시 필수/선택 분리 + 시각·IP 함께 (백엔드 연동 후)
- [ ] 14세 미만 시스템 차단(생년월일 검증) + 안내 문구 동시 노출
- [ ] 이메일·소셜 양쪽에 동일한 4종 동의 구성 (동일 톤·동일 항목 수)
- [ ] 마케팅 동의 보조 설명에 채널 자동 라우팅 명시 ([Policy §1.1](./Policy_v1.md#1-1-채널-라우팅) 정합)
- [ ] ko/en 양측 동일 항목 수·동일 표현 일관성

---

## 6) 법무 검토 연결

본 가입 동의 구성은 [Handoff_LegalReview_Checklist_v1.md](./Handoff_LegalReview_Checklist_v1.md) §3 LP-1(만 14세 차단)·LP-9(마케팅 동의 로그) 검토 포인트와 직결된다. 변호사 검토 시 본 문서를 약관·처리방침과 함께 동봉.

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록 + 체크 위주에서 이메일 가입 + 소셜 가입 모달 두 흐름 ko/en 전문 게재로 확장. 14세 미만 차단 안내·동의 정책 매트릭스·법무 검토 연결 신설. 핸드오프 보조본 성격 명시. 단일 소스 안내 문구 정리(중복 '키' 오타 제거). **후속** — 독자=개발·작성=기획 명시, `(카피 키)` 플레이스홀더 제거·§「적용 키」→「문자열 출처」, `{provider}` 안내를 자연어로 정리. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Handoff_Terms_v1.md]: Handoff_Terms_v1.md
[Handoff_Privacy_v1.md]: Handoff_Privacy_v1.md
[Policy §2.2]: Policy_v1.md#2-2-만-14세-검증
[Policy §1]: Policy_v1.md#1-알림-채널-정책
[§21.1 L-4]: Policy_v1.md#21-1-검토-필요-문서-4종
[Policy §1.1]: Policy_v1.md#1-1-채널-라우팅
[Policy §2.1]: Policy_v1.md#2-1-가입-옵션과-필수-수집-정보-region-분기-폐기
[Handoff_LegalReview_Checklist_v1.md]: Handoff_LegalReview_Checklist_v1.md
