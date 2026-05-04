# 이벤트 응모 동의 원고 v1 (변호사 검토용 초안)

**작성**: PM × Claude · **독자**: 변호사·DPO·개발(QA)

이벤트 응모 화면([USR-UPL-02] `?event=<id>` 진입 분기)에서 사용자에게 노출되는 **응모 동의 항목**의 한국어·영문 본문 단일 소스.

> **이 문서의 성격**
> - 본 원고는 **PM이 정리한 변호사 검토용 초안**이다. 법적 효력을 가지는 확정본이 아니다.
> - 정책 SSoT는 [Policy §15.5]·[Policy §25.2]·[Policy §32.1] #10. 본 문서는 화면 노출 문구·동의 범위·근거의 단일 소스.
> - 변호사 검토 포인트는 [Handoff_LegalReview §3 LP-11] 단일 소스.
> - 사용자 모집 시작 전 법무 확정본 게시 필수([Policy §21.0]).

---

## 1. 정책 결정 요약

| 항목 | 결정 |
|---|---|
| 동의 시점 | **응모 시점** (USR-UPL-02 발행에서 `?event=<id>` 분기) |
| 동의 미체크 시 동작 | **응모 차단** — 발행 검증 단계에서 인라인 에러 토스트, CTA 비활성 |
| 동의 잠금 | **선정 시점에 동의 상태 스냅샷으로 잠금** |
| 사후 토글 변경 효과 | **미래 응모만 차단**. 이미 활성 상태인 발표는 게시 기간 종료일까지 유지 |
| 게시 기간 | 이벤트별 운영팀 결정 (이벤트 공식 종료일 기준) |
| 게시 면적 | 이벤트 상세·결과 발표·관련 배너 등 사이트 내 (외부 SNS·언론 마케팅 자료는 별도 약관 라이선스 적용) |
| 권리 침해 사유 즉시 제거 | 신고 처리 "삭제"·저작권 침해 강제 삭제·명예훼손 등은 동의 잠금 무관 즉시 제거 |
| 동의 이력 보존 | Phase 1: 전시-이벤트 연결(`connectedEventId`) 자체가 응모 시점 체크박스 통과의 증거로 갈음. 별도 CONSENT_LOG 저장은 백엔드 도입 후 명시 구현(작가 ID·전시 ID·이벤트 ID·동의 시각·정보통신망법 §50 마케팅 동의 이력 보관 의무에 준하는 기준 검토). |

---

## 2. 한국어 원고

### 2.1 체크박스 라벨

> **선정될 경우 이벤트 결과·관련 페이지에 일정 기간 게시되며, 게시 기간 중 본 전시를 삭제해도 운영팀이 별도 보관한 사본으로 게시 기간 종료일까지 유지될 수 있음에 동의합니다.**

### 2.2 약관 보기 인라인 링크

> 응모 동의 자세히 보기

링크 탭 시 모달 또는 약관 페이지 분기로 본 §2.4 본문 게재.

### 2.3 미체크 시 에러 (발행 검증 #11)

> 이벤트에 응모하시려면 게시 보존 동의에 체크해 주세요.

### 2.4 동의 본문 (모달·약관 분기 시 게재)

**이벤트 응모 동의 — 게시 보존**

본 전시를 본 이벤트에 응모하시면, 운영팀이 응모작 중 일부를 선정해 이벤트 결과 발표·관련 페이지·배너 등 Artier 사이트 내에 일정 기간 게시할 수 있습니다.

**1. 동의 시점·범위**
- 본 동의는 응모 시점에 효력을 갖습니다.
- 동의가 없으시면 본 이벤트에 응모하실 수 없습니다.
- 다른 이벤트로의 응모·일반 업로드·공개·열람 등 다른 서비스 이용에는 영향이 없습니다.

**2. 게시 기간**
- 게시 기간은 이벤트별로 운영팀이 정하며, 이벤트의 공식 종료일을 기준으로 합니다.
- 게시 기간이 끝나면 별도 보관 사본도 자동으로 정리됩니다(작가 미상 익명화·완전 삭제 — 운영 정책에 따름).

**3. 발표 기간 중 작가 자가 삭제**
- 작가가 본 전시를 발표 기간 중 자가 삭제하시면, **운영팀이 별도 보관한 사본으로 발표를 게시 기간 종료일까지 유지**할 수 있습니다.
- 이는 발표·결과 페이지가 갑자기 끊기는 것을 막기 위한 운영 안전 장치입니다.
- 본 보관 사본은 발표 외 용도(외부 광고·재판매 등)로 사용되지 않습니다.

**4. 동의 철회·사후 변경**
- 응모 시점 동의 상태는 스냅샷으로 잠깁니다. 이후 동의 토글을 변경하셔도 이미 활성 상태인 발표에는 소급 적용되지 않습니다.
- 다음 이벤트 응모 시점부터는 변경된 동의 상태가 적용됩니다.

**5. 권리 침해 사유 즉시 제거**
- 본 작품이 저작권 침해·명예훼손·기타 법령 위반으로 신고·확인되면 본 동의와 관계없이 즉시 발표·사본 모두에서 제거됩니다.
- 본인 본의가 아닌 게시·악의적 도용 등이 의심되시면 [USR-INF-07] 문의로 알려주시기 바랍니다.

**6. 동의 이력 보존**
- 본 작품이 이벤트에 연결된 사실 자체가 응모 시점 동의의 증거로 갈음됩니다.
- 별도 동의 이력(작가 ID·전시 ID·이벤트 ID·동의 시각)의 명시 보관은 백엔드 도입 후 도입을 검토하며, 보존 기간은 회사 약관·관련 법령에서 정하는 기간을 따릅니다.

---

## 3. English copy

### 3.1 Checkbox label

> **I agree that, if selected, this exhibition may be displayed on the event results and related pages for a set period. If I delete this exhibition during that period, the team may keep a separate copy displayed until the end of the announcement period.**

### 3.2 Read-more link

> Read more about the entry consent

### 3.3 Validation error (publish check #11)

> Please check the display retention consent to enter the event.

### 3.4 Full consent text (modal or terms branch)

**Event Entry Consent — Display Retention**

By entering this exhibition into this event, you allow the team to select submissions and display them on the event results, related pages, and banners on Artier for a set period.

**1. When and what you consent to**
- This consent applies as of the moment you submit your entry.
- Without this consent you cannot enter this event.
- Submitting to other events, normal uploads, browsing, and other services are unaffected.

**2. Display period**
- The team sets the display period per event, based on the official event end date.
- When the display period ends, the separately kept copy is also cleaned up automatically (anonymized as “Unknown artist” or fully removed, per operations policy).

**3. Self-deletion during the announcement period**
- If you delete this exhibition yourself during the announcement period, the team may keep a separately stored copy displayed until the end of the announcement period.
- This is an operational safeguard to prevent abrupt breakage of result pages and announcements.
- The retained copy is used only for the announcement and not for any other purpose (external ads, resale, etc.).

**4. Withdrawal and later changes**
- Your consent state at the moment of entry is locked as a snapshot. Even if you change your consent toggle later, it does not retroactively affect an announcement that is already active.
- Your changed consent state applies from the next entry onward.

**5. Immediate removal for rights violations**
- If the work is reported and confirmed to violate copyright, defamation, or other laws, it will be removed immediately from both the announcement and the retained copy, regardless of this consent.
- If you believe a posting is unauthorized or maliciously misappropriated, please reach out via [USR-INF-07] inquiries.

**6. Consent record retention**
- The fact that this work is linked to the event itself serves as evidence of your consent at the moment of entry.
- An explicit consent record (user ID, exhibition ID, event ID, timestamp) will be considered for backend integration; the retention period follows our terms and applicable law.

---

## 4. 변호사 검토 포인트 (요약)

세부 검토 포인트는 [Handoff_LegalReview §3 LP-11] 단일 소스. 본 문서는 게재 문구만 다룬다.

핵심 검토 5건:
1. 약관규제법 §6 (소비자에게 부당히 불리한 조항)·§7 (예상하기 어려운 조항) 적합성
2. GDPR Art.7(3) 자유 동의 원칙 — 응모 시점 잠금 모델의 정합성
3. 공모전 표준약관 가이드라인 비교
4. 권리 침해 사유 즉시 제거 예외 명시 적정성
5. 동의 이력 보존 기간·증빙 가능성

---

## 5. 구현 체크 (개발팀)

- [ ] [USR-UPL-02] `?event=<id>` 분기에 응모 동의 체크박스 노출 (CTA 위 인라인)
- [ ] 약관 보기 인라인 링크 → 본 §2.4 본문 게재(모달 또는 별도 페이지)
- [ ] 발행 검증 순서 #11에 미체크 에러 진입(첫 위반 지점에서 중단)
- [ ] ko/en 양측 동일 의미 노출
- [ ] 변호사 검토 결과(LP-11) 수령 후 §2.4·§3.4 본문 확정본 반영
- [ ] (백엔드 도입 후) 명시 CONSENT_LOG 저장 — 작가 ID·전시 ID·이벤트 ID·동의 시각

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1 | 2026-05-04 | PM × Claude | 최초 작성 — Policy §15.5·§25.2·§32.1 #10 정책 결정 표·체크박스 라벨·약관 본문 ko/en·변호사 검토 5포인트·구현 체크 6건. LP-11 변호사 검토 대기 상태. 이후 append — Phase 1 동의 이력 저장 요구 완화: 전시-이벤트 연결(`connectedEventId`) 자체가 응모 시점 체크박스 통과의 증거로 갈음, 명시 CONSENT_LOG는 백엔드 도입 후 자연 흡수. §1 정책 결정 표·§2.4 #6·§3.4 #6·§5 구현 체크 정합. |

<!-- 인용 정의 -->
[Policy §15.5]: Policy_v1.md#policy-15-5
[Policy §25.2]: Policy_v1.md#policy-25-2
[Policy §32.1]: Policy_v1.md#policy-32-1
[Policy §21.0]: Policy_v1.md#policy-21-0
[Handoff_LegalReview §3 LP-11]: Handoff_LegalReview_Checklist_v1.md#lp-11-이벤트-응모-시점-동의게시-보존
[USR-UPL-02]: PRD_User_v1.md#usr-upl-02--업로드-메인-이미지작가메타-입력
[USR-INF-07]: PRD_User_v1.md#usr-inf-07--문의하기
