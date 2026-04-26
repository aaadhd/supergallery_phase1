# 가입/약관 동의 원고 v1 (개발 전달용)

가입 동의 원문은 `Copy_v1.md` 단일 소스를 사용한다.

---

## 1) 이메일 가입 Step 3 (USR-AUT-05)

- 정책
  - 필수 동의 2종 미체크 시 가입 완료 불가
  - 선택 동의 기본값 OFF
  - 만 14세 미만 가입 차단 정책 별도 적용

- 링크
  - 이용약관: `/terms`
  - 개인정보처리방침: `/privacy`

---

## 2) 소셜 최초 가입 모달 (USR-AUT-06) 적용 키

- `socialSignup.title`
- `socialSignup.guide`
- `socialSignup.provider_kakao`
- `socialSignup.provider_google`
- `socialSignup.provider_apple`
- `socialSignup.nicknameLabel`
- `socialSignup.nicknamePlaceholder`
- `socialSignup.nicknameHint`
- `socialSignup.agreeAll`
- `socialSignup.termsTerms`
- `socialSignup.termsPrivacy`
- `socialSignup.termsAge`
- `socialSignup.termsMarketing`
- `socialSignup.termsMarketingHint`
- `socialSignup.submit`
- `socialSignup.close`

---

## 3) 구현 체크

- [ ] 필수 동의 미체크 시 CTA disabled
- [ ] 약관/개인정보 링크 이동 가능
- [ ] 동의값 저장(필수/선택 분리)

