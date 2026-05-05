# 사용자 문의 원고 (USR-INF-07)

**작성**: 기획 · **독자**: 개발(구현·QA)

문의하기 화면(`/contact`, USR-INF-07)에만 해당한다. **문구 의미·카테고리·정책 연결**만 적는다. 레이아웃, 상태 관리, 검증 순서, 에러 처리 등 **구현 세부는 이 문서에 적지 않으며** PRD·Copy와 팀 판단에 따른다.

> **단일 소스 안내**
> - 화면에 찍히는 문자열(i18n)은 [Copy_v1.md](./Copy_v1.md) 문의 영역이 단일 소스다.
> - 본 문서의 한글·영문 원고는 Copy와 **같은 의미**를 유지해야 하며, 문자열 수정 시 Copy를 먼저 바꾼 뒤 본 문서를 같은 작업 범위에서 맞춘다.
> - 카테고리 **8종**은 [PRD_User USR-INF-07](PRD_User_v1.md)·[Policy §30](./Policy_v1.md#policy-30)·[Policy §33](./Policy_v1.md#policy-33) 정합. 특히 "개인정보 열람·정정·삭제 요청"은 법령 권리 행사 채널이므로 운영팀 SLA가 별도 적용. "닉네임 변경 신청"은 [Policy §4.4](./Policy_v1.md#policy-4-4)·USR-INF-07 AC-06·07과 연동.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 일반 문의 SLA | **영업일 5일** 이내 응답 | [Policy §30.0](./Policy_v1.md#policy-30-0) |
| 개인정보 권리 행사 SLA | 접수 5영업일 + 처리 30일 (1회 연장) | [Policy §30.3](./Policy_v1.md#policy-30-3) |
| 첨부 파일 | 최대 3개, 각 5MB 이하 | 운영 보안 정책 |
| 본인 확인 | 로그인 상태는 세션 1차 확인. 비로그인·탈퇴자는 가입 이메일에서 회신 | [Policy §30.4](./Policy_v1.md#policy-30-4) |

---

## 1) 화면 구조 (USR-INF-07)

```
─────────────────────────────────────────────
  문의하기 / Contact us
  궁금한 점이 있으시면 아래 양식으로 보내주세요.
  먼저 [FAQ]를 확인해 보시면 빠르게 답을 찾을 수 있어요.

  [이름]                  [이메일]
  [문의 유형 ▼]           (8개 카테고리)
  [문의 내용 textarea]    {n}/1,000 글자
  [📎 파일 첨부]          최대 3개, 각 5MB 이하
  영업일 5일 안에 답변 드릴게요.
  [문의 보내기]
─────────────────────────────────────────────
```

---

## 2) 한국어 원고

아래 문구는 [Copy_v1.md](./Copy_v1.md) 문의 영역과 동일 의미로 맞춘다.

### 2.1 제목·리드

**제목**
> 문의하기

**리드** — 아래 문단에서 **FAQ**는 `/faq`로 가는 인라인 링크다.
> 궁금한 점이 있으시면 아래 양식으로 보내주세요. 먼저 **FAQ**를 확인해 보시면 빠르게 답을 찾을 수 있어요.

### 2.2 입력 필드

| 필드 | 라벨 | 플레이스홀더 |
|---|---|---|
| 이름 | 이름 | 이름을 입력하세요 |
| 이메일 | 이메일 | 답변 받을 이메일 |
| 문의 유형 | 문의 유형 | 문의 유형을 선택하세요 |
| 문의 내용 | 문의 내용 | 문의 내용을 자세히 적어주세요 |
| 글자 수 | — | `{n}/1,000` |

### 2.3 카테고리 8종

| # | 라벨 | 처리 기한·연결 |
|---|---|---|
| 1 | 계정 관련 | 영업일 5일 이내 응답 (Policy §30.0) |
| 2 | **닉네임 변경 신청** | 영업일 5일 이내 응답 (Policy §30.0). 본인 확인·희망 닉네임·변경 사유는 PRD USR-INF-07 AC-06·07 |
| 3 | 업로드/전시 관련 | 영업일 5일 이내 응답 (Policy §30.0) |
| 4 | 신고/저작권 관련 | [Policy §22.2](./Policy_v1.md#policy-22-2) 영업일 24시간 (위급) |
| 5 | **개인정보 열람·정정·삭제 요청** | [Policy §30.3](./Policy_v1.md#policy-30-3) 접수 영업일 5일 + 처리 30일 |
| 6 | 제안/피드백 | 영업일 5일 이내 응답 (Policy §30.0) |
| 7 | 오류 제보 | 영업일 5일 이내 응답 (재현 자료 첨부 권장) |
| 8 | 기타 | 영업일 5일 이내 응답 |

### 2.4 첨부·안내·제출

- **첨부 라벨**: 파일 첨부
- **첨부 안내**: 최대 3개, 각 5MB 이하
- **첨부 오류**: 파일 크기는 5MB 이하만 가능해요.
- **답변 기한 안내**: 영업일 5일 안에 답변 드릴게요.
- **제출 버튼**: 문의 보내기 / 전송 중...

### 2.5 토스트

- **필수 누락**: 모든 필수 항목을 입력해 주세요.
- **성공**: 문의가 접수되었어요. 빠른 시일 내에 답변 드릴게요.

---

## 3) English copy

### 3.1 Title & lead

**Title**
> Contact us

**Lead** (`FAQ` links to `/faq`)
> If you have questions, send them using the form below. Check the **FAQ** first for faster answers.

### 3.2 Input fields

| Field | Label | Placeholder |
|---|---|---|
| Name | Name | Your name |
| Email | Email | Email for replies |
| Topic | Topic | Select a topic |
| Message | Message | Describe your inquiry |
| Char count | — | `{n}/1,000` |

### 3.3 Categories (8)

| # | Label | SLA / Linked policy |
|---|---|---|
| 1 | Account | 5 business days (Policy §30.0) |
| 2 | **Nickname change request** | 5 business days (Policy §30.0). Identity check · proposed nickname · reason per PRD USR-INF-07 AC-06·07 |
| 3 | Upload / exhibition | 5 business days (Policy §30.0) |
| 4 | Report / copyright | [Policy §22.2](./Policy_v1.md#policy-22-2) 24 business hours (urgent) |
| 5 | **Personal data access / correction / deletion** | [Policy §30.3](./Policy_v1.md#policy-30-3) 5 business days + 30 days resolve |
| 6 | Feedback | 5 business days (Policy §30.0) |
| 7 | Bug report | 5 business days (Policy §30.0) (please attach repro) |
| 8 | Other | 5 business days (Policy §30.0) |

### 3.4 Attachments, response time, submit

- **Attachments label**: Attachments
- **Attach hint**: Max 3 files, 5MB each
- **File error**: File size must be 5MB or less.
- **Response notice**: We will respond within 5 business days.
- **Submit**: Send message / Sending...

### 3.5 Toasts

- **Missing fields**: Please fill in all required fields.
- **Success**: Thanks — we received your message and will reply soon.

---

## 4) 문자열 출처·문서 범위

**실제 i18n 원본**은 [Copy_v1.md](./Copy_v1.md) 문의 영역 한 곳이다. 코드에는 그걸 쓰면 된다. 본 문서 §2·§3은 기획이 의미를 고정해 두는 참고용 원고이며, 카테고리 순서·라벨 의미는 §2.3·§3.3과 Copy가 어긋나면 안 된다. 문구 변경 시 [README](README.md)의 카피 번들 규약대로 Copy를 먼저 수정한다.

### 4.1 USR-INF-07에서 다루는 것

문의 화면의 제목·리드·필드·카테고리 8종·첨부·SLA 안내·버튼·토스트 등 **이 화면에만 쓰는 문구 의미**까지가 기획이 여기서 고정하는 범위다.

### 4.2 이 문서에 없는 화면

문의(USR-INF-07)가 아니다. 명세는 전부 PRD에 있다.

| 화면 | 볼 곳 |
|---|---|
| 설정 USR-STG-01 | [PRD_User_v1.md](./PRD_User_v1.md) §15 |
| 프로필 편집 USR-PRF-02 | [PRD_User_v1.md](./PRD_User_v1.md) §6.2 |

---

## 5) 구현 체크

- [ ] 카테고리 8종 모두 반영 (2번 "닉네임 변경 신청"은 PRD AC-06·07 · 5번 "개인정보 열람·정정·삭제 요청"은 §30 권리 행사 채널)
- [ ] 첨부 안내 문구 노출 (최대 3개, 각 5MB)
- [ ] 글자 수 카운터 1,000자 상한
- [ ] FAQ 인라인 링크 경로 /faq 이동
- [ ] 답변 SLA 안내 노출 (일반 카테고리 영업일 5일 일률 적용, Policy §30.0)
- [ ] 카테고리별 어드민 라우팅 (개인정보 카테고리는 [ADM-INQ-01](./PRD_Admin_v1.md#adm-inq-01--문의함) 개인정보 우선 큐로 분류)
- [ ] ko/en 양측 동일 카테고리 수·동일 SLA 안내 일관성

---

## 6) 법무·운영 검토 연결

- 카테고리 2 "닉네임 변경 신청" — [Policy §4.4](./Policy_v1.md#policy-4-4)·[PRD USR-INF-07](PRD_User_v1.md) AC-06·07(본인 확인·희망 닉네임·사유)과 정합.
- 카테고리 5 "개인정보 열람·정정·삭제 요청" — [Policy §30](./Policy_v1.md#policy-30) 권리 행사 채널의 단일 진입점. 운영팀 본인 확인 절차([Policy §30.4](./Policy_v1.md#policy-30-4))와 정합 필수. 변호사 검토는 [Handoff_LegalReview_Checklist §3 LP-7](./Handoff_LegalReview_Checklist_v1.md#lp-7-데이터-내보내기삭제-요청-개인정보보호법gdpr) 참조.
- 어드민 측 처리 화면 — [ADM-INQ-01](./PRD_Admin_v1.md#adm-inq-01--문의함) 문의함 + [Policy §22.7](./Policy_v1.md#policy-22-7) 감사 로그 기록
- 신고·저작권 카테고리는 위급 상황 가능 → 처리 시한이 다른 카테고리보다 짧음 ([Policy §22.2](./Policy_v1.md#policy-22-2))

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록·체크 위주에서 ko/en 전문 게재로 확장. 카테고리 7종을 SLA·연결 정책과 함께 매핑 (특히 4번 개인정보 요청 §30 정합). 설정·프로필 영역은 별도 위임 명시. 법무·운영 검토 연결 신설. 문서명도 "사용자 문의 원고"로 단순화(설정·프로필은 본 문서 범위 밖). **8종 정합** — PRD USR-INF-07과 동일 순서로 "닉네임 변경 신청" 행 추가, 영문 §3.3·와이어·체크리스트·법무 절 갱신. §4를 Copy 단일 소스 원칙으로 재작성(i18n 키 나열 제거 — 중복·독자 무익). §4.1·4.2 교차 참조는 마크다운 링크 형식 유지. **독자=개발·작성=기획** 명시, 구현 세부는 문서 밖. §2·§3 `(문의 카피 키)` 플레이스홀더 전부 제거. §4.2 설정·프로필은 표로만 PRD §15·§6.2 안내. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Policy §30]: Policy_v1.md#policy-30
[Policy §33]: Policy_v1.md#policy-33
[Policy §4.4]: Policy_v1.md#policy-4-4
[Policy §30.0]: Policy_v1.md#policy-30-0
[Policy §30.3]: Policy_v1.md#policy-30-3
[Policy §30.4]: Policy_v1.md#policy-30-4
[Policy §22.2]: Policy_v1.md#policy-22-2
[PRD_User_v1.md]: PRD_User_v1.md
[ADM-INQ-01]: PRD_Admin_v1.md#adm-inq-01--문의함
[Handoff_LegalReview_Checklist §3 LP-7]: Handoff_LegalReview_Checklist_v1.md#lp-7-데이터-내보내기삭제-요청-개인정보보호법gdpr
[Policy §22.7]: Policy_v1.md#policy-22-7
