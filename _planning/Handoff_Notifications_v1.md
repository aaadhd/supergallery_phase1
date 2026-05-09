# 알림 원고 (통합)

**작성**: 기획 · **독자**: 개발(구현·QA)

사용자에게 도달하는 알림 카피 통합 문서. 시스템 푸시·이메일·알림톡(런칭 전 백엔드 연동 후) + 인박스(USR-NTF-01) 노출 카피를 한 곳에 모았다.

> **단일 소스**
> - 화면·알림 문자열은 [Copy_v1.md](./Copy_v1.md) 알림·검수·신고·초대·Pick 등 해당 영역이 단일 소스다.
> - 수정 시 Copy를 먼저 갱신하고 본 문서를 같은 작업 범위에서 맞춘다.
> - 일부 알림은 법적 의무 알림 채널(이메일)을 따른다 — [Policy §1](./Policy_v1.md#1-알림-채널-정책) 정합 확인 필수.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 채널 라우팅 | 일반·법적 알림 구분 없이 동일 적용 — ① 전화번호 보유 → 알림톡(SMS 폴백), 이메일 미발송 ② 전화번호 없음+이메일 보유 → 이메일 ③ 둘 다 없음 → 인앱 알림만 | [Policy §1.1](./Policy_v1.md#1-1-채널-라우팅) |
| 법적 의무 알림 (약관·처리방침 변경) | **이메일 단일 채널** | [Policy §1.1](./Policy_v1.md#1-1-채널-라우팅) |
| 마케팅 알림 | 단일 항목 동의(기본 OFF), 동의 시 보유 채널 자동 라우팅 | [Policy §21.1 L-4](./Policy_v1.md#21-1-검토-필요-문서-4종) |
| Phase 1 구현 상태 | 인박스(USR-NTF-01) 동작. 외부 채널은 백엔드 연동 후 활성화 | [Policy §1.2](./Policy_v1.md#1-2-phase-1-구현-상태) |
| 시니어 친화 톤 | 격식체 행정 어휘 폐기, 친근체 + 다음 행동 안내 | UX 톤·친근체 규칙은 [Copy 문서](Copy_v1.md)가 단일 소스 |

---

## 1) 인박스 화면 (USR-NTF-01)

전체 알림 목록을 사용자가 확인하는 페이지.

### 1.1 화면 라벨 (한국어 / English)

| 항목 | 한국어 | English |
|---|---|---|
| 제목 | 알림 | Notifications |
| 일괄 처리 | 모두 읽음 | Mark all read |
| 일괄 삭제 | 읽은 알림 삭제 | Delete read |
| 항목 삭제 | 삭제 | Delete |
| 필터 전체 | 전체 | All |
| 필터 미독 | 읽지 않음 | Unread |
| 빈 상태 제목 | 알림이 없어요 | No notifications yet |
| 빈 상태 미독 | 읽지 않은 알림이 없어요 | No unread notifications |
| 빈 상태 안내 | 새로운 소식이 생기면 여기에 표시돼요 | New updates will show up here. |
| 설정 링크 | 알림 설정 | Notification settings |

### 1.2 일괄 처리 확인 다이얼로그

| 시나리오 | 한국어 | English |
|---|---|---|
| 모두 읽음 처리 | 모든 알림을 읽음 처리할까요? | Mark all notifications as read? |
| 읽은 알림 삭제 | 읽은 알림을 모두 삭제할까요? | Delete all read notifications? |

### 1.3 카테고리 필터 (유형 전체 + 유형 7개 — 표 8행. PRD USR-NTF-01 SSoT 정합)

| 카테고리 | 한국어 | English | 묶이는 알림 종류 |
|---|---|---|---|
| 유형 전체 | 유형 전체 | All types | — |
| 좋아요 | 좋아요 | Likes | 좋아요 |
| 팔로우 | 팔로우 | Follows | 팔로우 |
| 그룹 전시 게시 | 그룹 전시 게시 | Group post | 다른 작가가 내 작품을 그룹 전시에 포함시킨 경우 |
| 큐레이션 | 큐레이션 | Curation | Pick 선정 + 기획전 선정 (운영팀 직권 큐레이션) |
| 응모전 | 응모전 | Events | 응모전 선정 + 응모전 공지 (응모전) |
| 시스템 | 시스템 | System | 검수 통과 + 검수 반려 + 작품 연결 + 신고 처리 결과(작가 수신) |

### 1.4 시간 표기

| 표기 | 한국어 | English |
|---|---|---|
| 방금 | 방금 | Just now |
| n분 전 | {n}분 전 | {n}m ago |
| n시간 전 | {n}시간 전 | {n}h ago |
| n일 전 | {n}일 전 | {n}d ago |

---

## 2) 검수 알림

작품 발행 → 검수 → 승인/반려 흐름에서 작가에게 도달하는 알림.

### 2.1 검수 시작 (작가에게 발행 직후)

- 한국어: '{title}' 전시가 검수에 들어갔어요. 보통 1영업일 안에 알림으로 결과를 알려드릴게요.
- English: Your exhibition '{title}' is now under review. We'll let you know the result within about 1 business day.

→ 발행 직후 1건. 검수 SLA([Policy §22.1](./Policy_v1.md#22-1-검수-sla)) 영업일 24시간 인지.

### 2.2 검수 승인 (작가)

- 한국어: 올리신 작품이 승인됐어요. 둘러보기에서 다른 분들이 볼 수 있어요.
- English: Your upload was approved and is now shown on Browse.

### 2.3 검수 승인 시 클레임된 친구에게

- 한국어: 함께 올라간 '{title}' 전시가 공개됐어요. 둘러보기 피드에서 확인하실 수 있어요.
- English: '{title}' that you joined has been published. You can find it in the Browse feed.

→ 검수 신청 단계에서 미리 본인 작품을 클레임한 회원 공동 작가에게 정보용 1건. ([Policy §3.3](./Policy_v1.md#3-3-자동-연결-후-알림과-동시-선택))

### 2.4 검수 반려 (작가)

- 한국어: 올리신 작품이 검수를 통과하지 못했어요. 사유: {reason}
- English: Your upload was not approved. Reason: {reason}

→ 반려 사유 1종 필수 기록 ([Policy §23.2](./Policy_v1.md#23-2-검수-상태-전환)). 사용자는 편집 후 재검수 요청 가능.

### 2.5 새 전시 알림 (팔로워에게)

- 한국어: 님이 새 전시를 올렸어요
- English: has posted a new exhibition

→ 닉네임 + 본 카피 형태로 조립. 팔로워에게 발송.

---

## 3) 신고 알림

신고 처리 결과를 **작품 작가에게만** 안내. 신고자에게는 처리 결과 알림을 발송하지 않는다 ([Policy §12.1.3](./Policy_v1.md#12-1-3-신고-처리-알림)). 자동 비공개 트리거는 [Policy §12.2 v2.20](./Policy_v1.md#12-2-폐기-자동-비공개-정책)에 따라 폐기 — 모든 처리는 운영팀이 직접 판정.

### 3.1 작품 삭제 (작가에게)

- 한국어: 회원님의 전시 '{title}'이 운영 정책 위반으로 삭제됐어요. 자세한 내용은 문의하기로 연락 주세요.
- English: Your exhibition '{title}' has been removed due to a policy violation. Contact support for details.

### 3.2 비공개 전환 (작가에게)

- 한국어: 회원님의 전시 '{title}'이 신고 검토 결과 비공개로 전환됐어요. 피드와 검색에서 제외돼요.
- English: Your exhibition '{title}' has been hidden from Browse/Search after review.

### 3.3 비공개 → 복원 (작가에게)

- 한국어: 회원님의 전시 '{title}'이 검토 결과 정상 복원됐어요.
- English: Your exhibition '{title}' has been restored following review.

→ 비공개 유지 상태였던 전시가 운영팀 기각 판정으로 복원될 때 작가에게 1건. 시스템 강제 발송.

---

## 4) Pick 선정 알림

- 한국어: 축하해요! '{title}'이(가) Proud's Pick으로 뽑혔어요
- English: Congrats! '{title}' has been picked as Proud's Pick

→ 운영팀이 매주 Pick 선정 시 작가에게 1건. 기본 ON · USR-STG-01에서 OFF 가능 (기획전·Pick 알림 토글). 카테고리: **큐레이션**. 단위: 전시.

---

## 4.4) 기획전 선정 알림

- 한국어: '{pieceTitle}' 작품이 '{curationTitle}' 기획전에 선정됐어요. 페이지에서 확인해 보세요.
- English: Your work '{pieceTitle}' was selected for the '{curationTitle}' curation. View it on the page.

→ 운영팀이 기획전 편집에서 piece를 추가할 때 그 piece의 작가에게 1건. 기본 ON · USR-STG-01에서 OFF 가능 (기획전·Pick 알림 토글). 카테고리: **큐레이션**. 단위: 작품(piece). **영구 배지는 부여하지 않음** (Policy §15.2 — 기획전 = 배지 없음). 알림으로만 인지.

---

## 4.5) 응모전 알림

### 4.5.1 응모전 선정 (작가에게, 본인 전시가 선정작 됐을 때)

- 한국어: 축하해요! '{title}'이(가) '{eventName}' 선정작으로 뽑혔어요
- English: Congrats! '{title}' has been selected for '{eventName}'

→ 운영팀이 응모전 선정작 확정 시 작가에게 1건. 강제 발송. 카테고리: **응모전**.

### 4.5.2 응모전 공지 (참여자에게)

- 한국어: 운영팀 작성 메시지 (응모전별 커스텀)
- English: Operator-authored message (per event)

→ 참여한 응모전의 공지·종료 알림. 강제 발송. 카테고리: **응모전**.

---

## 4.5.3) 알림 수신 토글 정책 요약 (USR-STG-01)

사용자가 Settings에서 ON/OFF 가능한 알림과 항상 발송되는 시스템 알림 구분.

| 알림 종류 | 토글 | 기본값 | Settings 항목 |
|---|---|---|---|
| 좋아요 | 가능 | ON | `settings.notifLike` |
| 팔로우 | 가능 | ON | `settings.notifNewFollower` |
| 그룹 전시 게시 | 가능 | ON | `settings.notifGroupInvite` |
| 기획전·Pick | 가능 | ON | `settings.notifWeeklyTheme` |
| 마케팅 | 가능 | OFF | `settings.notifMarketing` |
| 검수(승인·반려·접수) | 불가 | 항상 | 시스템 강제 |
| 신고 처리 결과(작가 수신) | 불가 | 항상 | 시스템 강제 |
| 초대 클레임 | 불가 | 항상 | 시스템 강제 |
| 응모전 선정·공지 | 불가 | 항상 | 시스템 강제 |

---

## 4.6) 그룹 전시 게시 알림 (포함된 회원 작가에게)

- 한국어: '{uploader}'님이 회원님의 작품을 '{title}' 전시에 함께 게시했어요.
- English: '{uploader}' included your work in the exhibition '{title}'.

→ 다른 작가가 USR-UPL-02에서 회원 슬롯으로 직접 지정한 시점에 1건. 토글 가능 (USR-STG-01 "그룹 전시 게시 알림").

---

## 5) 초대·자동 연결 알림

비회원 초대 토큰 모델([Policy §3](./Policy_v1.md#3-비회원-초대-정책)) 흐름.

### 5.1 친구가 본인 자리 등록 (작가에게)

- 한국어: '{name}'님이 '{title}' 전시에서 본인 작품을 연결했어요. 잘못 연결됐다면 전시 편집에서 풀 수 있어요.
- English: '{name}' linked their work in '{title}'. If it's wrong, you can unlink it from the exhibition editor.

→ 친구가 가입 직후 "본인 작품 찾기"에서 자리 클레임 시 작가에게 1건. 정보용. 별도 액션 진입점 없음(잘못 연결됐을 때 작가가 마이페이지 슬롯 편집으로 처리, [Policy §3.5](./Policy_v1.md#3-5-잘못-연결됐을-때)).

---

## 6) 인박스 시드 알림

인박스 데모·출시 직후 시드 데이터로 사용되는 카피.

| 시나리오 | 한국어 | English |
|---|---|---|
| 좋아요 받음 | 님이 회원님의 작품 "{work}"을 좋아했어요 | liked your work "{work}" |
| 팔로우 받음 | 님이 회원님을 팔로우하기 시작했어요 | followed you |
| Pick 선정 | 축하해요! "{work}"이(가) Proud's Pick으로 뽑혔어요 | Congrats! "{work}" was selected as a Proud's Pick |
| 환영 메시지 | Proud Gallery에 오신 것을 환영합니다! 첫 작품을 업로드해 보세요. | Welcome to Proud Gallery! Upload your first work. |
| 응모전 진행 중 | 「{event}」 응모전이 진행 중이에요. 지금 참여해 보세요. | Event "{event}" is active — join now. |

---

## 7) 채널 라우팅 매트릭스 (Phase 1 → 백엔드 연동 후)

각 알림 종류별 발송 채널과 SLA를 한 표로.

| 알림 유형 | 인박스 | 푸시 (백엔드 연동 후) | 이메일 | 알림톡(KR 전화 보유 시) | 비고 |
|---|---|---|---|---|---|
| 검수 접수(발행 직후) | ✓ | — | 자동 라우팅 | 자동 라우팅 | 발행 직후 1건 |
| 검수 승인(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 검수 승인 시 |
| 검수 승인(클레임 친구) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 클레임된 친구에게 |
| 검수 반려(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 검수 반려 시 |
| 신고→삭제(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 신고로 삭제 시 |
| 신고→비공개(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 신고로 비공개 시 |
| 신고→기각·복원(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 비공개 유지 후 운영팀 기각 판정으로 복원 시 |
| 신고 기각(신고자) | ✓ | — | 자동 라우팅 | — | 신고자에게 결과 |
| Pick·기획전 선정 | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 기본 ON · 설정에서 OFF 가능 |
| 초대 클레임(작가) | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 친구가 클레임했을 때 |
| 약관·처리방침 변경 | — | — | **이메일 단일 채널** | — | [Policy §1.1](./Policy_v1.md#1-1-채널-라우팅) 법적 의무 |

> **자동 라우팅 규칙** ([Policy §1.1](./Policy_v1.md#1-1-채널-라우팅))
> - 한국 전화번호 보유자: 카카오 알림톡 우선, 실패 시 SMS 폴백
> - 그 외: 이메일
> - 마케팅 알림은 동의 시에만 발송, 동의 채널 분리 없이 보유 식별자 자동 라우팅

---

## 8) 시니어 친화 톤

사용자(디지털 드로잉 시니어)에게 친근체로 일관 적용. 격식체·행정 어휘 회피.

| 회피 표현 | 권장 표현 |
|---|---|
| "노출됩니다" | "다른 분들이 볼 수 있어요" |
| "반려되었어요" | "검수를 통과하지 못했어요" |
| "전시했습니다" | "올렸어요" |
| "되었습니다" | "됐어요" |
| "기각" | "받아들여지지 않았어요" |
| "선정" | "뽑혔어요" |

ko/en 양측 동일 톤.

---

## 9) 문자열 출처

실제 i18n 원본은 [Copy_v1.md](./Copy_v1.md) 해당 영역 한 곳이다. 본 문서는 prose·트리거 설명용이며 키 슬러그는 적지 않는다.

---

## 10) 구현 체크

- [ ] 인박스 카테고리 필터 7종 동작 (전체·좋아요·팔로우·그룹 전시 게시·큐레이션·응모전·시스템)
- [ ] 빈 상태 메시지 3종 (전체 빈 상태·미독 빈 상태·빈 상태 안내)
- [ ] 시간 표기 4종 (방금·n분·n시간·n일)
- [ ] 일괄 처리 확인 다이얼로그 2종 (모두 읽음·읽은 알림 삭제)
- [ ] 검수 알림 5종 발송 트리거 정합 (제출·승인·승인-친구·반려·신규작품)
- [ ] 신고 알림 Policy §12.1.3 표 4행과 발송 트리거 정합 (삭제·비공개 유지·기각(신고자)·기각→복원). 자동 비공개 알림 행은 [Policy §12.2 v2.20](./Policy_v1.md#12-2-폐기-자동-비공개-정책) 트리거 폐기로 함께 폐기
- [ ] 채널 라우팅 — 3단계: 한국 전화 → 알림톡, 이메일만 → 이메일, 둘 다 없음 → 인앱만 (법적 의무 고지 충분성은 LP-12 법무 검토)
- [ ] 법적 의무 알림(약관·처리방침 변경)은 이메일 단일 채널 ([Policy §1.1](./Policy_v1.md#1-1-채널-라우팅))
- [ ] 시니어 친화 톤(친근체) ko/en 양측 일관 적용
- [ ] Phase 1 인박스 동작·외부 채널은 백엔드 연동 후 활성화

---

## 11) 법무·운영 검토 연결

- **법적 의무 알림** — 약관·개인정보처리방침 변경 시 이메일 단일 채널 발송. [Handoff_Privacy §12](./Handoff_Privacy_v1.md#12-개정-통지) 개정 통지 + [Handoff_Terms_v1.md 제3조](Handoff_Terms_v1.md) 약관 변경 통지와 정합.
- **마케팅 동의 로그** — 마케팅 알림 발송 전 동의 보관 + 발송 이력 추적 ([Handoff_LegalReview_Checklist §3 LP-9](./Handoff_LegalReview_Checklist_v1.md#lp-9-광고-마케팅-수신-동의-로그-보관)).
- **검수·신고 처리 알림 톤** — 명예훼손·표현 자유 분쟁 시 회사의 면책 근거 ([Handoff_LegalReview_Checklist §3 LP-6](./Handoff_LegalReview_Checklist_v1.md#lp-6-신고-처리-3액션의-사용자-고지-문구-통일)).
- **3자 처리자** — 카카오 알림톡·이메일 발송업체는 [Handoff_Privacy §5](./Handoff_Privacy_v1.md#5-개인정보-처리위탁) 위탁 처리 표에 등록.

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v7 | 2026-05-09 | PM × Claude | Pick·기획전 토글 기본 ON 정비, §4.5.3 요약표 신설; §10 필터 칩 명칭 정합(Pick→큐레이션, 초대→그룹 초대); §3 신고자 기각 알림 제거 — 작가 수신 3종만 유지, 섹션 번호 정합; §4.5.3 토글 표·§10 체크리스트 잔존 "그룹 초대"→"그룹 전시 게시" 정정 |
| v6 | 2026-05-07 | PM × Claude | Artier→Proud Gallery 브랜드 정합(Pick 알림 KO·EN, 환영 메시지 KO·EN, 시드 매트릭스 행) |
| v5 | 2026-05-05 | PM × Claude | 신고 알림·자동 비공개 폐기·삭제 사유 변수·매트릭스 정합. 이후 append — 문서 이력 단순화 |
| v4 | 2026-05-04 | PM × Claude | 기획전 선정 알림·카테고리 8종·응모전 표준어 |
| v3 | 2026-05-02 | PM × Codex | 신고 알림 정책 표 정합·구현 체크·문자열 출처 정리 |
| v2 | 2026-05-01 | PM × Codex | 인박스 카테고리 표기 정합 |
| v1 | 2026-05-01 | PM × Claude | 최초 작성(알림 prose·채널 매트릭스·법무 연결) |<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Policy §1]: Policy_v1.md#1-알림-채널-정책
[Policy §1.1]: Policy_v1.md#1-1-채널-라우팅
[Policy §21.1 L-4]: Policy_v1.md#21-1-검토-필요-문서-4종
[Policy §1.2]: Policy_v1.md#1-2-phase-1-구현-상태
[Policy §22.1]: Policy_v1.md#22-1-검수-sla
[Policy §22.2]: Policy_v1.md#22-2-신고-처리-원칙
[Policy §3.3]: Policy_v1.md#3-3-자동-연결-후-알림과-동시-선택
[Policy §23.2]: Policy_v1.md#23-2-검수-상태-전환
[Policy §12.2]: Policy_v1.md#12-2-폐기-자동-비공개-정책
[Policy §3]: Policy_v1.md#3-비회원-초대-정책
[Policy §3.5]: Policy_v1.md#3-5-잘못-연결됐을-때
[Handoff_Privacy §12]: Handoff_Privacy_v1.md#12-개정-통지
[Handoff_LegalReview_Checklist §3 LP-9]: Handoff_LegalReview_Checklist_v1.md#lp-9-광고-마케팅-수신-동의-로그-보관
[Handoff_LegalReview_Checklist §3 LP-6]: Handoff_LegalReview_Checklist_v1.md#lp-6-신고-처리-3액션의-사용자-고지-문구-통일
[Handoff_Privacy §5]: Handoff_Privacy_v1.md#5-개인정보-처리위탁
