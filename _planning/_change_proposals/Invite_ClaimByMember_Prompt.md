# 비회원 초대: 토큰 + 가입자 자동 연결 (Phase 1)

> 이 문서는 **Artier (SuperGallery Phase 1)** 비회원 초대 메커니즘 변경의 구현 프롬프트다.
> 다른 AI/개발자가 이 문서만 보고 작업에 들어갈 수 있도록 자족적으로 작성됨.
>
> 기준: Policy v2.13 (2026-04-26). v2.13에 이미 반영된 결정:
> - 글로벌 호환 가입·인증 재설계 (한국·해외 분기 폐기)
> - PASS 본인인증 도입 X
> - 가입 시 묵시적 자동 매칭 폐기 → 본인 확인 단계 도입
>
> 본 변경의 추가 결정:
> - 회사 채널 자동 발송 폐기 (정보통신망법·GDPR·CAN-SPAM·ePrivacy)
> - 비회원 식별자(전화·이메일) 사전 수집 폐기 (친구 동의 없는 PII)
> - 매칭: 전시 단위 공통 토큰 + 가입자 본인 슬롯 선택 → **즉시 자동 연결** (작가 승인 게이트 X)
>
> 코드와 _planning 문서는 단일 푸시 단위로 함께 갱신 (CLAUDE.md "문서 동기화·버전 규칙" §1).

---

## 1. 핵심 흐름

```
[작가]
비회원 슬롯에 이름만 입력 → 전시 발행
  ↓ 검수 통과
시스템이 전시 단위 토큰 발급, 작가 마이페이지 카드에 "친구에게 알리기" 노출
  ↓ 작가가 버튼 누름
navigator.share() / 링크 복사 / mailto: → 작가가 단톡방·메일 등에 공유

[받는 사람]
링크 클릭 → 랜딩 ("○○ 작가가 초대했어요") → 가입
  ↓ 가입 직후
"본인 작품 찾기" 화면
  ├─ 슬롯 1개: 즉시 자동 연결
  └─ 슬롯 여러 개: 카드 N개 표시 → 본인이 선택 → 확인 다이얼로그 → 자동 연결
  ↓
슬롯 'non-member' → 'member' 승격 (가입자 닉네임·아바타로 자동 표시)
작가에게 알림: "복례할매(김복례)님이 봄 전시 슬롯에 연결됐어요" (정보용)

[잘못 연결 시]
작가가 마이페이지에서 슬롯 편집으로 풀기 (기존 흐름)
```

**토큰 없이 자력 가입한 사람**: 자동 매칭 안 함. 본인 작품 연결 원하면 작가에게 직접 카톡으로 요청 → 작가가 마이페이지에서 슬롯 편집.

---

## 2. 핵심 원칙

1. **회사 자동 외부 발송 전면 폐기**.
2. **비회원 식별자 사전 수집 X** (이름만).
3. **공유 주체는 항상 회원 본인** (OS 공유 시트).
4. **토큰은 전시 단위 1개** (슬롯별 X).
5. **자동 연결 — 작가 승인 게이트 없음**. 잘못된 케이스는 작가가 사후 마이페이지에서 풀기.
6. **한국·해외 분기 없음**.
7. 단일 푸시로 _planning + 코드 함께 갱신.

---

## 3. UI 화면

### 3.1 작가

**Upload — 비회원 슬롯**: 이름 한 칸만. 전화·이메일 필드 제거. 헬퍼: "이름만 적어주세요. 그분이 가입하면 자동으로 연결됩니다."

**발행 완료**: "전시가 등록되었어요" + (검수 승인 후) `[📨 함께 올린 분들에게 알리기]` 1차 CTA.

**마이페이지 전시 카드**: 비회원 슬롯이 남아있으면 항상 `[📨 안 가입한 분들에게 알리기]` 버튼 노출.

**작가 알림 (정보용)**:
> 🔔 "복례할매(김복례)님이 봄 전시 슬롯에 연결됐어요"
- 닉네임(원래 표시명) 형식으로 작가가 인지하기 쉽게.
- 액션 불필요. 잘못 연결됐으면 마이페이지 슬롯 편집으로 풀기.

### 3.2 받는 사람 (가입자)

**E. 초대장 랜딩** (`/exhibitions/:id?invite={token}`):
- "○○ 작가가 '봄 전시'에 회원님을 초대했어요"
- 전시 미리보기
- `[지금 가입하고 본인 작품 찾기]` / `[그냥 둘러볼게요]`
- 토큰 무효(만료·취소·소비) 시 안내 + 일반 가입 CTA

**F. 가입**: 기존 4가지 옵션 그대로. `pending_invite_token` 세션 키에 토큰 보관.

**G. "본인 작품 찾기"** (가입 직후, 토큰 진입 시만):
- 헤더: "혹시 이 중에 본인 작품이 있나요?"
- 안내: "본인이 그린 그림이 아닌데 선택하면 작가님께 잘못 연결됐다는 알림이 갑니다"
- **슬롯 1개**: 카드 1개 표시 + `[이거 제 작품이에요]` (또는 즉시 자동 연결도 옵션)
- **슬롯 여러 개**: 카드 N개 + 각각 `[이거 제 작품이에요]`
- `[여기 없어요. 그냥 둘러볼게요]` 스킵 옵션
- 카드 선택 시 확인 다이얼로그 1번 → 즉시 자동 연결

**H. 연결 완료 안내**: "○○ 작가의 봄 전시에 연결됐어요. 마이페이지에서 확인할 수 있어요" + `[마이페이지로 가기]`

---

## 4. 데이터 모델

### InviteToken (전시 단위)
```ts
type InviteToken = {
  token: string;         // base62 22+자리
  workId: string;
  inviterUserId: string;
  createdAt: string;
  expiresAt: string;     // 기본 90일 (코드 상수, 운영 조정 가능)
  status: 'active' | 'revoked';
};
```
- 한 전시에 1개. 작가 재발급 시 기존 active 토큰 revoke.
- `'revoked'` 트리거: 전시 삭제, 비회원 슬롯 0, 검수 반려, 만료, 작가 탈퇴.
- 검수 승인 전엔 토큰 발급되어도 **inactive** 취급 (랜딩에서 "검수 중" 안내).

### 비회원 슬롯 (`imageArtists[i]`)
- `{ type: 'non-member', displayName: string }` — 표시명만
- 가입자 연결 후: `{ type: 'member', memberId, memberName, memberAvatar }`
- 화면 렌더링은 type 따라 자동 분기 (이미 코드에 있음)

### ClaimRequest 등 별도 데이터 모델 **없음** (자동 연결 모델이라 불필요).

---

## 5. _planning 문서 변경

### 5.1 `Policy_v1.md` — §3 재작성

| 현재 | 변경 |
|---|---|
| §3.1 검수 승인 시점 자동 발송 | **폐기**. "검수 승인 후 토큰 활성. 작가가 OS 공유 시트로 직접 공유" |
| §3.2 식별자·채널 (한국/해외 분기) | **폐기**. 채널 라우팅 표 삭제 |
| §3.3 삭제·취소 | **재작성**. "전시 삭제 / 비회원 슬롯 0 / 작가 탈퇴 시 토큰 revoke. 자동 비공개 시 토큰 활성 유지하되 랜딩에서 '검토 중' 안내" |
| §3.4 중복·가입자 보호 | **재작성**. "토큰 클릭 후 이미 회원이면 로그인 후 'G 본인 작품 찾기'로 이동" |
| §3.4.1 가입자 식별자 입력 시 연결 제안 | **삭제** (식별자 사전 수집 X) |
| §3.5 가입 시 자동 매칭 | **재작성**. "토큰 진입 시 'G 본인 작품 찾기' 노출. 가입자가 슬롯 선택 → 즉시 자동 연결. 토큰 없는 가입은 자동 스킵" |
| §3.5.1 본인 확인 단계 | **재작성**. "G 본인 작품 찾기 화면. 슬롯 1개면 단일 카드, 여러 개면 카드 N개. 선택 시 확인 다이얼로그 1번 → 자동 연결" |
| §3.5.2 마이페이지 사후 보강 배너 | **폐기**. (가입자 본인 선택이라 불필요) |
| §3.5.3 사후 해제 (Disavow) | **유지하되 진입점 변경**. 마이페이지 "내 작품 아님" 카드 액션 **제거**. 회원 직접 추가 거부는 알림에서 직접. 자동 연결 잘못된 건 작가가 마이페이지 슬롯 편집으로 |
| §3.5.4 운영팀 신호 | **단순화**. 작가가 슬롯을 자주 풀면 패턴 모니터링만 |
| §3.5.5 발신자 알림 | **재작성**. 알림 카피: "닉네임(원래 표시명)님이 슬롯에 연결됐어요" 정보용 |

**신규 §3.6 — 공유·자동 연결 메커니즘**

비회원 초대는 회원 본인이 OS 공유 시트로 공유 + 받은 사람이 가입 후 본인 슬롯 선택 → 즉시 자동 연결하는 2단 구조.

- **토큰**: 전시 단위 1개. 추측 불가능 무작위(>= 128bit base62). 만료 90일(코드 상수). status는 active/revoked.
- **공유 UI**: 모바일 navigator.share / PC 링크 복사 + mailto: / QR 옵션
- **비회원 식별자**: 수집 X (이름만)
- **자동 연결 흐름**: 토큰 진입 → 가입 → "본인 작품 찾기" → 슬롯 선택 + 확인 1번 → 즉시 'member' 승격
- **잘못 연결 처리**: 작가가 마이페이지에서 슬롯 편집으로 풀기

**§31 런칭 전 미해결 항목**
- "외부 발송 연동 (카카오 알림톡, SMS, 이메일)" **삭제**
- "토큰 발급·검증 백엔드" **추가** (Phase 2 백엔드 이관 시)

### 5.2 `IA_ScreenList_v1.md`

| 화면 | 변경 |
|---|---|
| USR-AUT-10 본인 확인 | **재정의**: "본인 작품 찾기" 화면. 토큰 진입 시 슬롯 카드 표시(1개 또는 여러 개). 가입자가 카드 선택 + 확인 → 즉시 자동 연결 |
| USR-EXH-03 초대장 랜딩 | URL `/exhibitions/:id?invite={token}` 토큰 디코드. SMS 초대 한정 프리필 항목 삭제 |
| USR-EXH-04 공유 | 비회원 슬롯 포함 전시도 동일 메커니즘 |
| USR-UPL-08 발행 전 비회원 초대 프리뷰 모달 | "검수 승인 후 발송" 카피 삭제 → "발행 후 마이페이지에서 친구에게 보낼 수 있어요". 전화·이메일 입력 필드 제거 |
| USR-PRF-06 내 작품 탭 | "본인 작품 아님" 카드 액션 **제거**. 작가가 잘못 연결 풀려면 전시 편집으로 |

### 5.3 `PRD_User_v1.md`

| 화면 | 변경 |
|---|---|
| USR-AUT-06 가입/온보딩 Step 2 | 토큰 진입 시 USR-AUT-10(본인 작품 찾기)로 분기. 토큰 없으면 자동 스킵. AC 재작성: 슬롯 선택 → 자동 연결 |
| USR-EXH-04 공유 | 모바일 OS 공유 시트 + PC 클립보드/메일 폴백 |
| USR-EXH-03 초대장 랜딩 | 토큰 URL 트리거. 토큰 무효 시 안내 |
| USR-UPL-08 | "공유 링크가 생성됩니다" 카피. 식별자 입력 UI 제거 AC |

### 5.4 `PRD_Admin_v1.md`

- ADM-RPT-01 "초대 매칭 거부" 카테고리 **폐기** (작가 승인 게이트 없으므로 거부 신호 없음)
- 운영팀 모니터링: "작가가 슬롯을 자주 푸는 패턴" 정도 (도용 시도 의심) — 정보 로그만

### 5.5 `Copy_v1.md`

주요 키 갱신 (한/영):

| 키 | 변경 |
|---|---|
| `upload.toastNonMemberInviteSent` | `'비가입 작가 {n}명의 공유 링크가 준비됐어요'` |
| `upload.toastNonMemberInviteMixed` | (삭제) |
| `upload.toastInvitePending` | `'검수가 끝나면 마이페이지에서 친구에게 알릴 수 있어요'` |
| `upload.confirmInviteTitle` | `'공유 링크를 만들까요?'` |
| `upload.confirmInviteListIntro` | `'다음 분들의 슬롯이 만들어져요. 발행 후 한 번에 알릴 수 있어요'` |
| `upload.confirmInviteHelper` | `'카카오톡·문자·이메일 등 원하는 방법으로 보낼 수 있어요. 받는 분이 가입 후 본인 작품을 선택하면 자동으로 연결돼요.'` |
| `upload.nonMemberPhoneHelper` | (삭제) |
| `upload.nonMemberNamePh` | `'함께 올린 분의 이름'` |
| `invite.notifAutoMatched` | `'{nicknameWithDisplayName}님이 \'{title}\' 슬롯에 연결됐어요'` (예: "복례할매(김복례)님이…") |
| `invite.notifClaimDeclined` | (삭제 — 작가 승인 게이트 없음) |
| `invite.shareCta` (신규) | `친구에게 알리기` |
| `invite.shareCopyDone` (신규) | `링크가 복사되었어요. 카톡·문자·이메일에 붙여넣어 보내주세요` |
| `invite.landingHeadline` (신규) | `{inviter} 작가가 회원님을 전시에 초대했어요` |
| `invite.tokenExpired` (신규) | `초대 링크가 만료됐어요. 보내주신 분께 다시 받아주세요` |
| `invite.tokenRevoked` (신규) | `이 초대는 취소되었어요` |
| `claim.findMyWorksTitle` (신규) | `혹시 이 중에 본인 작품이 있나요?` |
| `claim.findMyWorksWarning` (신규) | `본인이 그린 그림이 아닌데 선택하면 작가님께 잘못 연결됐다는 알림이 갑니다` |
| `claim.thisIsMine` (신규) | `이거 제 작품이에요` |
| `claim.notHere` (신규) | `여기 없어요. 그냥 둘러볼게요` |
| `claim.confirmTitle` (신규) | `'{slotName}' 슬롯을 회원님 작품으로 연결할까요?` |
| `claim.confirmYes` (신규) | `네, 맞아요` |
| `claim.doneTitle` (신규) | `연결됐어요!` |
| `onboarding.errPhoneRequiredInvite` | **삭제** |
| `onboarding.inviteNotice` | `초대 링크로 들어오셨어요. 가입 직후 초대받은 작품을 보여드릴게요` |

### 5.6 `CLAUDE.md`

- "초대 자동 연결 정책" 단락의 "PASS 본인인증 기반…" 부분 **새 모델로 갱신** (PASS·전화 매칭 일소)
- "외부 연동 미완 (런칭 전)"에서 "SMS/카카오 알림톡" 삭제
- `inviteMessaging.ts` 주석 갱신
- localStorage 키:
  - 신규: `artier_invite_tokens_v1`, `artier_pending_invite_token`(세션)
  - 폐기 (LEGACY 키로 정리): `artier_invite_messaging_log`, `artier_pending_sms_invite`, `artier_invite_match_log`

---

## 6. 코드 변경

### 6.1 핵심 파일

**`src/app/utils/inviteMessaging.ts` — 역할 전환**

폐기:
- `sendInviteToNonMember`, `pickChannel`, `isKoreanNumber`, `buildMessage`, `hasAlreadySent`
- `findMatchCandidates(phone)`, `applyConfirmedMatches`, `recordDeclinedMatches`, `matchSmsInviteOnSignup`
- `readInviteLog`, `InviteLogEntry`

신규 (또는 새 파일 `inviteTokenStore.ts`로 분리):
```ts
export type InviteToken = { token; workId; inviterUserId; createdAt; expiresAt; status: 'active' | 'revoked' };

export function issueInviteToken(workId, inviterUserId): InviteToken;
export function getInviteToken(token): InviteToken | null;
export function revokeInviteToken(workId): void;
export function findActiveTokenForWork(workId): InviteToken | null;
export function buildInviteShareUrl(token): string;
export function buildInviteShareText(token, workTitle, inviterName, locale): string;

// 자동 연결 (가입자가 슬롯 선택 시 호출)
export function connectMemberToSlot(workId, slotKey, member): { ok; promoted };
```

기존 `disavow` 유사 함수는 **마이페이지 슬롯 편집 흐름**에 통합 (별도 호출 진입점은 제거).

**`src/app/pages/Upload.tsx`**
- 비회원 슬롯 입력 UI: 이름만. 전화·이메일 필드 제거
- 발행 완료 토스트: "공유 링크가 준비됐어요"

**`src/app/pages/ExhibitionInviteLanding.tsx`**
- URL `?invite={token}` 파싱 → 토큰 무효 안내 분기
- `pending_invite_token` 세션 키 저장
- SMS 초대 한정 프리필 로직 제거

**`src/app/pages/Onboarding.tsx` — Step 2 재정의**
- 기존 전화/이메일 매칭 후보 카드 로직 **삭제**
- `pending_invite_token` 있으면 → 해당 전시 비회원 슬롯 카드 표시
- 가입자가 카드 선택 → 확인 다이얼로그(`openConfirm`) → `connectMemberToSlot` 호출 → 슬롯 'member' 승격
- 토큰 없으면 자동 스킵

**신규 `src/app/components/InviteShareButton.tsx`**
- `navigator.share` 우선, 미지원 시 클립보드 복사 + mailto: 폴백
- 마이페이지 전시 카드 + 발행 완료 화면에 노출

**`src/app/pages/Profile.tsx`** — 변경 최소
- 비회원 슬롯 포함 전시 카드에 InviteShareButton 노출
- "내 작품" 탭의 "본인 작품 아님" 카드 액션 제거 (disavow UI 진입점 마이페이지에서 빼기)

### 6.2 부수
- 알림 시스템에 `'invite_member_connected'` 타입 (정보용 1건)
- `src/app/store.ts` LEGACY_STORAGE_KEYS / LEGACY_SESSION_KEYS에 폐기 키 추가
- i18n `messages.ts` ko/en 갱신

---

## 7. 단계별 진행

1. **정책 합의 (1 push)**: `Policy_v1.md` §3 재작성 + `CLAUDE.md` + `DELTA.md` 1행
2. **토큰 스토어 (1 push)**: `inviteTokenStore.ts` 신규, `inviteMessaging.ts` 폐기 export 정리
3. **공유 UI + Upload 단순화 (1 push)**: `InviteShareButton`, Upload 비회원 슬롯, 발행 완료 화면
4. **랜딩 + 자동 연결 흐름 (1 push)**: ExhibitionInviteLanding 토큰 파싱, Onboarding Step 2 재정의 (본인 작품 찾기 + 자동 연결)
5. **알림 + 정리 (1 push)**: 작가 알림 카피, Profile에서 disavow UI 제거, IA·PRD·Copy 동기화, LEGACY 키 정리

---

## 8. 약점·완화책

| 약점 | 완화책 |
|---|---|
| 외부인이 토큰 링크로 들어와 잘못된 슬롯 선택 → 자동 연결 | 본인이 안 그린 그림을 선택할 가능성 매우 낮음. 작가 알림으로 즉시 인지 + 마이페이지 슬롯 편집으로 풀기. 도용 시도해도 외부인이 얻는 가치 거의 없음 |
| 작가가 알림 못 봐서 잘못 연결 방치 | 마이페이지 전시 카드에 비회원/회원 슬롯 상태 항상 표시 → 자연스럽게 검토 가능 |
| 토큰 노출 (검색 인덱싱·SNS 카드) | 랜딩 페이지에 `<meta name="robots" content="noindex,nofollow">`. 토큰은 추측 불가능 무작위 |
| 토큰 없이 자력 가입한 사람의 본인 작품 연결 | 본인이 작가에게 직접 카톡으로 요청 → 작가가 마이페이지에서 슬롯 편집 (서로 아는 관계 전제) |

---

## 9. 검증 체크리스트

### 기능
- [ ] 작가가 비회원 슬롯에 이름만 입력하고 발행 가능
- [ ] 검수 승인 후 토큰 active, "친구에게 알리기" 버튼 노출
- [ ] 모바일 navigator.share / PC 링크 복사 + mailto: 동작
- [ ] 토큰 URL 클릭 → 랜딩에 작가·전시 자동 표시
- [ ] 가입 직후 "본인 작품 찾기" 슬롯 카드 표시 (1개 또는 여러 개)
- [ ] 카드 선택 + 확인 다이얼로그 → 즉시 자동 연결
- [ ] 슬롯 'non-member' → 'member' 승격 시 닉네임·아바타 자동 적용
- [ ] 작가에게 정보용 알림 1건 ("닉네임(원래 표시명)…")
- [ ] 토큰 없이 가입 시 본인 작품 찾기 자동 스킵
- [ ] 만료·취소 토큰 클릭 시 안내 화면
- [ ] 작가가 마이페이지에서 슬롯 편집으로 잘못 연결 풀 수 있음

### 정책·문서
- [ ] `Policy_v1.md` §3 재작성. PASS·전화/이메일 매칭·자동 발송 일소
- [ ] `CLAUDE.md` 초대 단락 정책 v2.13 + 새 모델로 동기화
- [ ] `IA_ScreenList_v1.md` USR-AUT-10 재정의, USR-EXH-03·USR-UPL-08·USR-PRF-06 갱신
- [ ] `PRD_User_v1.md` AC 갱신
- [ ] `PRD_Admin_v1.md` ADM-RPT-01 "초대 매칭 거부" 카테고리 폐기
- [ ] `Copy_v1.md` ko/en 갱신
- [ ] `DELTA.md` 변경 행 1건

### 비기능
- [ ] 신규 인터랙티브 요소 `min-h-[44px]`
- [ ] 신규 카피 ko/en 동시 작업
- [ ] `openConfirm` 사용 (window.confirm 금지)
- [ ] localStorage 신규 키 `artier_` prefix
- [ ] LEGACY 키 정리 (`PointsBootstrap` 자동)

### 회귀
- [ ] 회원 직접 추가 흐름 정상 (영향 없음)
- [ ] 강사·그룹·개인 전시 모두 정상
- [ ] 토큰 없이 일반 가입 흐름 정상

---

## 10. 폐기되는 시스템 (이전 토큰 1:1 / 클레임 모델 잔재)

- ClaimRequest 데이터 모델 (작가 승인 게이트 자체가 없어짐)
- 마이페이지 "내 신청" 섹션
- 30일 만료, 7일 리마인더, 자동 비공개 시 분기 처리 (자동 연결이라 'pending' 라이프사이클 자체가 없음)
- 작가 승인 모달 (ClaimApprovalModal) — 만들지 않음
- USR-AUT-11 (본인 작품 찾기) 신규 화면 — USR-AUT-10을 재정의로 대체
- USR-EXH-05 (신청 완료) 신규 화면 — 단순 토스트로 대체
- ADM-CLM-01 (작가 승인) 신규 화면 — 만들지 않음
- 마이페이지 piece 카드 "본인 작품 아님" 액션 — 제거 (작가가 슬롯 편집으로)
- 운영팀 ADM-RPT-01 "초대 매칭 거부" 카테고리

---

## 11. Phase 2 향후 후보

- 전시 단위 OG 이미지 동적 생성
- 작가가 슬롯 편집 시 닉네임 검색 자동완성 (현재 회원 검색 흐름과 통합)
- 토큰 백엔드 + JWT 통합
- 가입자 대상 "본인이 작가로 등록된 전시 모음" 마이페이지 섹션
- 토큰 진입자 외에 자력 가입자도 작가/단체 검색에서 본인 작품 발견 도와주는 추천

---

## 마지막 노트

이 모델의 핵심은 **"작가가 일을 하지 않게 하는 것"**. 클레임 신청·작가 승인·만료·리마인더 같은 무거운 라이프사이클을 다 폐기하고, 토큰 받은 사람이 본인 그림 보고 한 번 클릭 → 즉시 연결로 단순화. 잘못된 케이스(외부인 도용 등)는 발생 가능하지만 작가가 마이페이지에서 풀면 되고, 도용 시도자가 얻는 가치가 거의 없어서 실제로는 드물 거예요.

서로 아는 사람들 간의 신뢰 기반 시스템 — 시니어 사회의 본질에 가장 잘 맞는 모델.
