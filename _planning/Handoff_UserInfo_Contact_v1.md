# 사용자 문의 원고 v2 (개발·운영·법무 전달용)

`USR-INF-07` 문의하기 화면(`/contact`)의 양식·카테고리·안내 문구 전문.

> **단일 소스 안내**
> - 코드(i18n) 단일 소스: [`Copy_v1.md`](Copy_v1.md) `contact.*` 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다.
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.
> - 카테고리 7종은 [Policy §30](Policy_v1.md#30-개인정보-열람정정삭제-요청-정책)·[§33](Policy_v1.md#33-작품-단위-운영팀-문의-정책) 정합. 특히 "개인정보 열람·정정·삭제 요청"은 법령 권리 행사 채널이므로 운영팀 SLA가 별도 적용.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 일반 문의 SLA | **3영업일** 이내 답변 | 운영 원칙 |
| 개인정보 권리 행사 SLA | 접수 5영업일 + 처리 30일 (1회 연장) | [Policy §30.3](Policy_v1.md#303-처리-기한-sla) |
| 첨부 파일 | 최대 3개, 각 5MB 이하 | 운영 보안 정책 |
| 본인 확인 | 로그인 상태는 세션 1차 확인. 비로그인·탈퇴자는 가입 이메일에서 회신 | [Policy §30.4](Policy_v1.md#304-본인-확인) |

---

## 1) 화면 구조 (USR-INF-07)

```
─────────────────────────────────────────────
  문의하기 / Contact us
  궁금한 점이 있으시면 아래 양식으로 보내주세요.
  먼저 [FAQ]를 확인해 보시면 빠르게 답을 찾을 수 있습니다.

  [이름]                  [이메일]
  [문의 유형 ▼]           (7개 카테고리)
  [문의 내용 textarea]    {n}/1,000 글자
  [📎 파일 첨부]          최대 3개, 각 5MB 이하
  3영업일 이내에 답변 드리겠습니다.
  [문의 보내기]
─────────────────────────────────────────────
```

---

## 2) 한국어 원고

### 2.1 제목·리드

**제목** (`contact.title`)
> 문의하기

**리드 (`contact.leadBeforeFaq` + `[FAQ]` 링크 + `contact.leadAfterFaq`)**
> 궁금한 점이 있으시면 아래 양식으로 보내주세요. 먼저 **FAQ**를 확인해 보시면 빠르게 답을 찾을 수 있습니다.

→ "FAQ" 부분이 `/faq`로 이동하는 인라인 링크.

### 2.2 입력 필드

| 필드 | 라벨 (`contact.*`) | 플레이스홀더 |
|---|---|---|
| 이름 | 이름 | 이름을 입력하세요 |
| 이메일 | 이메일 | 답변 받을 이메일 |
| 문의 유형 | 문의 유형 | 문의 유형을 선택하세요 |
| 문의 내용 | 문의 내용 | 문의 내용을 자세히 적어주세요 |
| 글자 수 | — | `{n}/1,000` |

### 2.3 카테고리 7종

| # | 라벨 | 처리 기한·연결 |
|---|---|---|
| 1 | 계정 관련 | 일반 SLA 3영업일 |
| 2 | 업로드/전시 관련 | 일반 SLA 3영업일 |
| 3 | 신고/저작권 관련 | [Policy §22.2](Policy_v1.md#222-신고-sla) 영업일 24시간 (위급) |
| 4 | **개인정보 열람·정정·삭제 요청** | [Policy §30.3](Policy_v1.md#303-처리-기한-sla) 접수 5영업일 + 처리 30일 |
| 5 | 제안/피드백 | 일반 SLA 3영업일 |
| 6 | 오류 제보 | 일반 SLA 3영업일 (재현 자료 첨부 권장) |
| 7 | 기타 | 일반 SLA 3영업일 |

### 2.4 첨부·안내·제출

- **첨부 라벨**: 파일 첨부 (`contact.attachments`)
- **첨부 안내**: 최대 3개, 각 5MB 이하 (`contact.attachHint`)
- **첨부 오류**: 파일 크기는 5MB 이하만 가능합니다. (`contact.fileTooLarge`)
- **답변 기한 안내**: 3영업일 이내에 답변 드리겠습니다. (`contact.autoResponse`)
- **제출 버튼**: 문의 보내기 / 전송 중... (`contact.submit` / `contact.submitting`)

### 2.5 토스트

- **필수 누락 토스트**: 모든 필수 항목을 입력해 주세요. (`contact.toastRequired`)
- **성공 토스트**: 문의가 접수되었어요. 빠른 시일 내에 답변 드릴게요. (`contact.toastSuccess`)

---

## 3) English copy

### 3.1 Title & lead

**Title** (`contact.title`)
> Contact us

**Lead** (`contact.leadBeforeFaq` + `[FAQ]` link + `contact.leadAfterFaq`)
> If you have questions, send them using the form below. Check the **FAQ** first for faster answers.

### 3.2 Input fields

| Field | Label | Placeholder |
|---|---|---|
| Name | Name | Your name |
| Email | Email | Email for replies |
| Topic | Topic | Select a topic |
| Message | Message | Describe your inquiry |
| Char count | — | `{n}/1,000` |

### 3.3 Categories (7)

| # | Label | SLA / Linked policy |
|---|---|---|
| 1 | Account | General 3 business days |
| 2 | Upload / exhibition | General 3 business days |
| 3 | Report / copyright | [Policy §22.2](Policy_v1.md#222-신고-sla) 24 business hours (urgent) |
| 4 | **Personal data access / correction / deletion** | [Policy §30.3](Policy_v1.md#303-처리-기한-sla) 5 business days + 30 days resolve |
| 5 | Feedback | General 3 business days |
| 6 | Bug report | General 3 business days (please attach repro) |
| 7 | Other | General 3 business days |

### 3.4 Attachments, response time, submit

- **Attachments label**: Attachments (`contact.attachments`)
- **Attach hint**: Max 3 files, 5MB each (`contact.attachHint`)
- **File error**: File size must be 5MB or less. (`contact.fileTooLarge`)
- **Response notice**: We will respond within 3 business days. (`contact.autoResponse`)
- **Submit**: Send message / Sending... (`contact.submit` / `contact.submitting`)

### 3.5 Toasts

- **Missing fields**: Please fill in all required fields. (`contact.toastRequired`)
- **Success**: Thanks — we received your message and will reply soon. (`contact.toastSuccess`)

---

## 4) 적용 키 일람 (코드 동기화 매핑)

### 4.1 본 문서 적용 (USR-INF-07)
- 제목·리드: `contact.title`, `contact.leadBeforeFaq`, `contact.leadAfterFaq`
- 필드 라벨: `contact.name`, `contact.email`, `contact.category`, `contact.message`
- 플레이스홀더: `contact.placeholderName`, `contact.placeholderEmail`, `contact.categoryPlaceholder`, `contact.placeholderMessage`
- 카테고리 7종: `contact.categoryAccount`, `categoryUpload`, `categoryReport`, `categoryPrivacy`, `categorySuggestion`, `categoryBug`, `categoryOther`
- 첨부: `contact.attachments`, `contact.attachHint`, `contact.fileTooLarge`
- 안내·버튼: `contact.autoResponse`, `contact.submit`, `contact.submitting`
- 토스트: `contact.toastRequired`, `contact.toastSuccess`
- 글자 수: `contact.charCount`

### 4.2 본 문서가 다루지 않는 영역 (별도 Handoff·Copy 위임)
- **설정 화면 (USR-STG-01)** — `settings.*` 키. 라벨 위주로 분산 → Copy_v1.md + PRD_User v1 §15 참조
- **프로필 편집 (USR-PRF-02)** — `profile.*`·`profile.edit*` 키. 화면별 라벨이라 화면 단위 PRD에서 다룸 → PRD_User v1 §6.2 참조

---

## 5) 구현 체크

- [ ] 카테고리 7종 모두 반영 (4번 "개인정보 열람·정정·삭제 요청"은 §30 권리 행사 채널)
- [ ] 첨부 안내 문구 노출 (최대 3개, 각 5MB)
- [ ] 글자 수 카운터 1,000자 상한
- [ ] FAQ 인라인 링크 `/faq` 이동
- [ ] 답변 SLA 안내 노출 (Phase 1은 일반 3영업일 일률 적용)
- [ ] 카테고리별 어드민 라우팅 (개인정보 카테고리는 ADM-INQ-01 개인정보 우선 큐로 분류, [PRD_Admin §3.13](PRD_Admin_v1.md))
- [ ] ko/en 양측 동일 카테고리 수·동일 SLA 안내 일관성

---

## 6) 법무·운영 검토 연결

- 카테고리 4 "개인정보 열람·정정·삭제 요청" — [Policy §30](Policy_v1.md#30-개인정보-열람정정삭제-요청-정책) 권리 행사 채널의 단일 진입점. 운영팀 본인 확인 절차([Policy §30.4](Policy_v1.md#304-본인-확인))와 정합 필수. 변호사 검토는 [Handoff_LegalReview_Checklist_v1.md §3 LP-7·LP-8](Handoff_LegalReview_Checklist_v1.md) 참조.
- 어드민 측 처리 화면 — [PRD_Admin §3.13 ADM-INQ-01](PRD_Admin_v1.md) 문의함 + [Policy §22.7](Policy_v1.md#227-운영자-감사-로그-원칙) 감사 로그 기록
- 신고·저작권 카테고리는 위급 상황 가능 → 처리 시한이 다른 카테고리보다 짧음 ([Policy §22.2](Policy_v1.md#222-신고-sla))

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록·체크 위주에서 ko/en 전문 게재로 확장. 카테고리 7종을 SLA·연결 정책과 함께 매핑 (특히 4번 개인정보 요청 §30 정합). 설정·프로필 영역은 별도 위임 명시. 법무·운영 검토 연결 신설. 문서명도 "사용자 문의 원고"로 단순화(설정·프로필은 본 문서 범위 밖). |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
