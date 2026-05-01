# 알림 원고 v1 (개발·운영·UX 전달용)

사용자에게 도달하는 모든 알림 카피의 통합 핸드오프. 시스템 푸시·이메일·알림톡(런칭 전 백엔드 연동 후) + 인박스(USR-NTF-01) 노출 카피를 한 곳에 모았다.

> **단일 소스 안내**
> - 코드(i18n) 단일 소스: [`Copy_v1.md`](Copy_v1.md) `notifications.*` · `review.notif*` · `report.notif*` · `invite.notif*` · `pick.notif*` 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다.
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.
> - 일부 알림은 법적 의무 알림 채널(이메일)을 따른다 — [Policy §1](Policy_v1.md#1-알림-채널-정책) 정합 확인 필수.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 채널 라우팅 | 사용자 보유 식별자 기준 자동 — 한국 전화번호 보유자는 카카오 알림톡(SMS 폴백), 그 외는 이메일 | [Policy §1.1](Policy_v1.md#11-채널-라우팅) |
| 법적 의무 알림 (약관·처리방침 변경) | **이메일 단일 채널** | [Policy §1.1](Policy_v1.md#11-채널-라우팅) |
| 마케팅 알림 | 단일 항목 동의(기본 OFF), 동의 시 보유 채널 자동 라우팅 | [Policy §21.1 L-4](Policy_v1.md#211-검토-필요-문서-4종) |
| Phase 1 구현 상태 | 인박스(USR-NTF-01) 동작. 외부 채널은 백엔드 연동 후 활성화 | [Policy §1.2](Policy_v1.md#12-phase-1-구현-상태) |
| 시니어 친화 톤 | 격식체 행정 어휘 폐기, 친근체 + 다음 행동 안내 | [Memory: feedback_screen_spec_html_sync](../../.claude/projects/-Users-im-1688/memory/feedback_screen_spec_html_sync.md) |

---

## 1) 인박스 화면 (USR-NTF-01)

전체 알림 목록을 사용자가 확인하는 페이지.

### 1.1 화면 라벨 (한국어 / English)

| 항목 | 한국어 | English | 키 |
|---|---|---|---|
| 제목 | 알림 | Notifications | `notifications.title` |
| 일괄 처리 | 모두 읽음 | Mark all read | `notifications.markAll` |
| 일괄 삭제 | 읽은 알림 삭제 | Delete read | `notifications.deleteRead` |
| 항목 삭제 | 삭제 | Delete | `notifications.delete` |
| 필터 전체 | 전체 | All | `notifications.filterAll` |
| 필터 미독 | 읽지 않음 | Unread | `notifications.filterUnread` |
| 빈 상태 제목 | 알림이 없어요 | No notifications yet | `notifications.empty` |
| 빈 상태 미독 | 읽지 않은 알림이 없습니다 | No unread notifications | `notifications.emptyUnread` |
| 빈 상태 안내 | 새로운 소식이 생기면 여기에 표시됩니다 | New updates will show up here. | `notifications.emptyHint` |
| 설정 링크 | 알림 설정 | Notification settings | `notifications.settingsLink` |

### 1.2 일괄 처리 확인 다이얼로그

| 시나리오 | 한국어 | English | 키 |
|---|---|---|---|
| 모두 읽음 처리 | 모든 알림을 읽음 처리할까요? | Mark all notifications as read? | `notifications.confirmMarkAll` |
| 읽은 알림 삭제 | 읽은 알림을 모두 삭제할까요? | Delete all read notifications? | `notifications.confirmDeleteRead` |

### 1.3 카테고리 필터 (6종)

| 카테고리 | 한국어 | English | 키 |
|---|---|---|---|
| 유형 전체 | 유형 전체 | All types | `notifications.categoryAll` |
| 좋아요 | 좋아요 | Likes | `notifications.categoryLike` |
| 팔로우 | 팔로우 | Follows | `notifications.categoryFollow` |
| Pick | Pick | Pick | `notifications.categoryPick` |
| 이벤트 | 이벤트 | Events | `notifications.categoryEvent` |
| 초대 | 초대 | Invite | `notifications.categoryInvite` |
| 시스템 | 시스템 | System | `notifications.categorySystem` |

### 1.4 시간 표기

| 표기 | 한국어 | English | 키 |
|---|---|---|---|
| 방금 | 방금 | Just now | `notifications.timeJustNow` |
| n분 전 | {n}분 전 | {n}m ago | `notifications.timeMinutes` |
| n시간 전 | {n}시간 전 | {n}h ago | `notifications.timeHours` |
| n일 전 | {n}일 전 | {n}d ago | `notifications.timeDays` |

---

## 2) 검수 알림 (review.notif*)

작품 발행 → 검수 → 승인/반려 흐름에서 작가에게 도달하는 알림.

### 2.1 검수 시작 (작가에게 발행 직후)

`review.notifSubmitted`
- 한국어: '{title}' 전시가 검수에 들어갔어요. 보통 1영업일 안에 알림으로 결과를 알려드릴게요.
- English: Your exhibition '{title}' is now under review. We'll let you know the result within about 1 business day.

→ 발행 직후 1건. 검수 SLA([Policy §22.1](Policy_v1.md#221-검수-sla)) 영업일 24시간 인지.

### 2.2 검수 승인 (작가)

`review.notifApproved`
- 한국어: 올리신 작품이 승인됐어요. 둘러보기에서 다른 분들이 볼 수 있어요.
- English: Your upload was approved and is now shown on Browse.

### 2.3 검수 승인 시 클레임된 친구에게 (Policy v2.16 신설)

`review.notifApprovedForParticipant`
- 한국어: 함께 올라간 '{title}' 전시가 공개됐어요. 둘러보기 피드에서 확인하실 수 있어요.
- English: '{title}' that you joined has been published. You can find it in the Browse feed.

→ 검수 신청 단계에서 미리 본인 작품을 클레임한 친구(member co-creator)에게 정보용 1건. [Policy v2.16](Policy_v1.md#문서-이력) 신설.

### 2.4 검수 반려 (작가)

`review.notifRejected`
- 한국어: 올리신 작품이 검수를 통과하지 못했어요. 사유: {reason}
- English: Your upload was not approved. Reason: {reason}

→ 반려 사유 1종 필수 기록 ([Policy §23.2](Policy_v1.md#232-검수-상태-전환)). 사용자는 편집 후 재검수 요청 가능.

### 2.5 새 작품 알림 (팔로워에게)

`review.notifNewWork`
- 한국어: 님이 새 작품을 올렸어요
- English: has posted a new exhibition

→ 닉네임 + 본 카피 형태로 조립. 팔로워에게 발송.

---

## 3) 신고·자동 비공개 알림 (report.notif*)

신고 처리 결과를 신고 대상 작가·신고자에게 양방향 안내.

### 3.1 작품 삭제 (작가에게)

`report.notifTargetWorkDeleted`
- 한국어: 회원님의 전시 '{title}'이 신고 처리로 삭제됐어요.
- English: Your exhibition '{title}' has been removed following a report.

### 3.2 비공개 전환 (작가에게)

`report.notifTargetWorkHidden`
- 한국어: 회원님의 전시 '{title}'이 신고 검토 결과 비공개로 전환됐어요. 피드와 검색에서 제외돼요.
- English: Your exhibition '{title}' has been hidden from Browse/Search after review.

### 3.3 자동 비공개 (작가에게, 2회 신고 누적)

`report.notifAutoHidden`
- 한국어: 회원님 전시 '{title}'이 신고 누적으로 잠시 비공개되었어요. 운영팀이 영업일 24시간 안에 확인해드리고, 문제 없으면 다시 공개돼요.
- English: Your exhibition '{title}' is temporarily hidden after multiple reports. Our team will review it within 24 business hours, and it will reappear if there are no issues.

→ [Policy §12.2](Policy_v1.md#122-2회-신고-자동-비공개) 자동 비공개 발동 시 즉시. SLA 영업일 24시간 인지([§22.2](Policy_v1.md#222-신고-sla)).

### 3.4 신고 기각 (신고자에게)

`report.notifReporterDismissed`
- 한국어: 접수하신 신고는 운영팀 검토 결과 받아들여지지 않았어요.
- English: Your report was dismissed after review.

→ 신고자에게 처리 결과 회신. 행정 어휘("기각")가 아니라 친근체("받아들여지지 않았어요"). [Copy v1.10](Copy_v1.md) UX Writing audit 정합.

---

## 4) Pick 선정 알림 (pick.notif*)

`pick.notifSelected`
- 한국어: 회원님의 전시 '{title}'이 Artier's Pick으로 선정되었어요. 축하드려요!

→ 운영팀이 매주 Pick 선정 시 작가에게 1건. 영문 키 별도 검토 필요(현재 ko 단일).

---

## 5) 초대·자동 연결 알림 (invite.notif*)

비회원 초대 토큰 모델([Policy §3 v2.14+](Policy_v1.md#3-비회원-초대-정책)) 흐름.

### 5.1 친구가 본인 자리 등록 (작가에게)

`invite.notifAutoMatched`
- 한국어: '{name}' 님이 '{title}' 전시에 본인 자리를 등록했어요. 잘못 연결됐다면 전시 편집에서 풀 수 있어요.
- English: '{name}' claimed their slot in '{title}'. If it's the wrong link, you can unlink it from the exhibition editor.

→ 친구가 가입 직후 "본인 작품 찾기"에서 자리 클레임 시 작가에게 1건. 정보용. 별도 액션 진입점 없음(잘못 연결됐을 때 작가가 마이페이지 슬롯 편집으로 처리, [Policy §3.5](Policy_v1.md#35-잘못-연결됐을-때)).

> **폐기된 초대 알림 키** (Policy §3 v2.14 토큰 모델 전환으로 제거):
> - ~~`invite.notifClaimDeclined`~~ — 매칭 후보 거부 신호 (yes/no 게이트 폐기)
> - ~~`invite.notifMemberLinked`~~ — 작가의 회원 직접 추가 사후 알림 (자가 해제 진입점 폐기)
> - ~~`invite.notifDisavowed`~~ — 자가 disavow 후 알림 (자가 해제 진입점 폐기)

---

## 6) 인박스 시드 알림 (notifications.seed*)

인박스 데모·발사 직후 시드 데이터로 사용되는 카피.

| 시나리오 | 한국어 | English | 키 |
|---|---|---|---|
| 좋아요 받음 | 님이 회원님의 작품 "{work}"을 좋아합니다 | liked your work "{work}" | `notifications.seedLikedWork` |
| 팔로우 받음 | 님이 회원님을 팔로우합니다 | followed you | `notifications.seedFollowed` |
| Pick 선정 | 축하해요! "{work}"이(가) Artier's Pick으로 뽑혔어요 | Congrats! "{work}" was selected as an Artier's Pick | `notifications.seedPickSelected` |
| 환영 메시지 | Artier에 오신 것을 환영합니다! 첫 작품을 업로드해 보세요. | Welcome to Artier! Upload your first work. | `notifications.seedWelcome` |
| 이벤트 진행 중 | 「{event}」 이벤트가 진행 중입니다. 지금 참여해 보세요. | Event "{event}" is active — join now. | `notifications.seedEventActive` |

---

## 7) 채널 라우팅 매트릭스 (Phase 1 → 백엔드 연동 후)

각 알림 종류별 발송 채널과 SLA를 한 표로.

| 알림 키 | 인박스 | 푸시 (백엔드 연동 후) | 이메일 | 알림톡(KR 전화 보유 시) | 비고 |
|---|---|---|---|---|---|
| `review.notifSubmitted` | ✓ | — | 자동 라우팅 | 자동 라우팅 | 발행 직후 1건 |
| `review.notifApproved` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 검수 승인 시 |
| `review.notifApprovedForParticipant` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 클레임된 친구에게(v2.16) |
| `review.notifRejected` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 검수 반려 시 |
| `review.notifNewWork` | ✓ | 자동 라우팅 | 동의 시 | 동의 시 | 팔로워 알림 |
| `report.notifTargetWorkDeleted` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 신고로 삭제 시 |
| `report.notifTargetWorkHidden` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 신고로 비공개 시 |
| `report.notifAutoHidden` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 자동 비공개 발동 시 |
| `report.notifReporterDismissed` | ✓ | — | 자동 라우팅 | — | 신고자에게 결과 |
| `pick.notifSelected` | ✓ | 자동 라우팅 | 동의 시 | 동의 시 | Pick 선정 시 |
| `invite.notifAutoMatched` | ✓ | 자동 라우팅 | 자동 라우팅 | 자동 라우팅 | 친구가 클레임했을 때 |
| 약관·처리방침 변경 (별도 카피) | — | — | **이메일 단일 채널** | — | [Policy §1.1](Policy_v1.md#11-채널-라우팅) 법적 의무 |

> **자동 라우팅 규칙** ([Policy §1.1](Policy_v1.md#11-채널-라우팅))
> - 한국 전화번호 보유자: 카카오 알림톡 우선, 실패 시 SMS 폴백
> - 그 외: 이메일
> - 마케팅 알림은 동의 시에만 발송, 동의 채널 분리 없이 보유 식별자 자동 라우팅

---

## 8) 시니어 친화 톤 적용 (Memory 정합)

[Copy v1.10](Copy_v1.md) UX Writing audit에서 14건의 격식체·행정 어휘를 친근체로 정합. 본 문서 모든 알림 카피는 이 정합 후 상태.

| 정합 전 패턴 | 정합 후 |
|---|---|
| "노출됩니다" | "다른 분들이 볼 수 있어요" |
| "반려되었어요" | "검수를 통과하지 못했어요" |
| "전시했습니다" | "올렸어요" |
| "되었습니다" | "됐어요" |
| "기각" (행정 어휘) | "받아들여지지 않았어요" |
| "선정" (행정 어휘) | "뽑혔어요" |

→ 사용자(디지털 드로잉 시니어)에게 친근하지만 격식 있는 톤. "~합니다" 격식체와 "~니다" 행정 어휘는 회피.

---

## 9) 적용 키 일람 (코드 동기화 매핑)

### 9.1 인박스 (notifications.*)
- 라벨: `notifications.title`, `markAll`, `deleteRead`, `delete`, `filterAll`, `filterUnread`, `empty`, `emptyUnread`, `emptyHint`, `settingsLink`
- 다이얼로그: `notifications.confirmMarkAll`, `confirmDeleteRead`
- 카테고리: `notifications.categoryAll`, `categoryLike`, `categoryFollow`, `categoryPick`, `categoryEvent`, `categoryInvite`, `categorySystem`
- 시간: `notifications.timeJustNow`, `timeMinutes`, `timeHours`, `timeDays`
- 시드: `notifications.seedLikedWork`, `seedFollowed`, `seedPickSelected`, `seedWelcome`, `seedEventActive`

### 9.2 검수 알림 (review.notif*)
- `review.notifSubmitted`, `notifApproved`, `notifApprovedForParticipant`, `notifRejected`, `notifNewWork`

### 9.3 신고 알림 (report.notif*)
- `report.notifTargetWorkDeleted`, `notifTargetWorkHidden`, `notifAutoHidden`, `notifReporterDismissed`

### 9.4 Pick 알림 (pick.notif*)
- `pick.notifSelected`

### 9.5 초대·연결 알림 (invite.notif*)
- `invite.notifAutoMatched`

---

## 10) 구현 체크

- [ ] 인박스 카테고리 필터 6종 동작 (전체·좋아요·팔로우·Pick·이벤트·초대·시스템 — 7개 카테고리)
- [ ] 빈 상태 메시지 3종 (전체 빈 상태·미독 빈 상태·빈 상태 안내)
- [ ] 시간 표기 4종 (방금·n분·n시간·n일)
- [ ] 일괄 처리 확인 다이얼로그 2종 (모두 읽음·읽은 알림 삭제)
- [ ] 검수 알림 5종 발송 트리거 정합 (제출·승인·승인-친구·반려·신규작품)
- [ ] 신고 알림 4종 발송 트리거 정합 (삭제·비공개·자동 비공개·신고자 기각)
- [ ] 채널 라우팅 — 사용자 보유 식별자 자동 판정 (한국 전화 → 알림톡, 그 외 → 이메일)
- [ ] 법적 의무 알림(약관·처리방침 변경)은 이메일 단일 채널 ([Policy §1.1](Policy_v1.md#11-채널-라우팅))
- [ ] 시니어 친화 톤(친근체) ko/en 양측 일관 적용
- [ ] Phase 1 인박스 동작·외부 채널은 백엔드 연동 후 활성화

---

## 11) 법무·운영 검토 연결

- **법적 의무 알림** — 약관·개인정보처리방침 변경 시 이메일 단일 채널 발송. [Handoff_Privacy_v1.md §12](Handoff_Privacy_v1.md) 개정 통지 + [Handoff_Terms_v1.md 제3조](Handoff_Terms_v1.md) 약관 변경 통지와 정합.
- **마케팅 동의 로그** — 마케팅 알림 발송 전 동의 보관 + 발송 이력 추적 ([Handoff_LegalReview_Checklist_v1.md §3 LP-9](Handoff_LegalReview_Checklist_v1.md)).
- **검수·신고 처리 알림 톤** — 명예훼손·표현 자유 분쟁 시 회사의 면책 근거 ([Handoff_LegalReview_Checklist_v1.md §3 LP-6](Handoff_LegalReview_Checklist_v1.md)).
- **3자 처리자** — 카카오 알림톡·이메일 발송업체는 [Handoff_Privacy_v1.md §5](Handoff_Privacy_v1.md) 위탁 처리 표에 등록.

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1 | 2026-05-01 | PM × Claude | 최초 작성 — 인박스(USR-NTF-01) 라벨·카테고리·시간 표기 + 검수(5종)·신고(4종)·Pick(1종)·초대(1종) 알림 ko/en prose 게재. 채널 라우팅 매트릭스(Policy §1.1) + 시니어 친화 톤 매트릭스(Copy v1.10) + 법무 검토 연결. 본 작업에서 코드(messages.ts) → Copy_v1.md 동기화 누락 보강: `review.notifSubmitted` ko/en 추가 + 폐기 키 3종(invite.notifClaimDeclined·notifMemberLinked·notifDisavowed) Copy 잔재 ko/en 일괄 제거(코드는 v1.5 사이클에서 이미 제거됨). |
