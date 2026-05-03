# 온보딩 원고 (USR-AUT-09 ~ USR-AUT-11)

**작성**: 기획 · **독자**: 개발(구현·QA)

가입 직후 온보딩 다단 흐름 — Step 0 환영(USR-AUT-09) · Step 0.5 전시 단위 개념 안내(USR-AUT-09b) · Step 1 프로필 입력(USR-AUT-10) · 조건부 Step 2 본인 작품 찾기(USR-AUT-10b, 활성 또는 비활성 토큰 보유 시) · Step 3 완료 축하(USR-AUT-11). **스텝·레이아웃**은 PRD, 세부 인터랙션은 구현 판단.

> **단일 소스**
> - 화면 문자열은 [Copy_v1.md] 온보딩·claim 관련 영역이 단일 소스다.
> - 수정 시 Copy를 먼저 갱신하고 본 문서를 같은 작업 범위에서 맞춘다.
> - "본인 작품 찾기" 단계는 [Policy §3]과 직결되어 변호사 검토 시 [Handoff_LegalReview_Checklist §3 LP-3] 함께 참조 권장.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 진입 분기 | 일반 가입 / 소셜 가입 / 초대 링크 가입 3종 | [Policy §2.1]·[Policy §3] |
| Step 2 (본인 작품 찾기) 진입 조건 | 활성 또는 비활성 토큰 보유 시 | [Policy §3.2] |
| 자동 연결 | 없음. 가입자 명시 클릭 + 확인 다이얼로그 1회 필요 | [Policy §3.2] |
| 동시 선택 처리 | 두 가입자가 동시에 같은 자리를 선택하면 첫 번째만 인정, 두 번째는 자동 차단 + 안내 | [Policy §3.3] |
| Step 1 공통 폼 | 지역 분기 없음. 닉네임·생년월일·프로필 이미지 단일 폼 | [Policy §2.1] |

---

## 1) Step 0 — 환영 화면 (USR-AUT-09)

가입 직후 짧은 환영 화면. "시작하기" CTA로 다음 단계 진입.

### 한국어
- 제목: **{brand}에 오신 것을 환영합니다**
- 리드: 그림 한 점만 올려도 나만의 전시가 열려요
- 시작 버튼: 시작하기

### English
- Title: **Welcome to {brand}**
- Lead: Even one piece becomes your own exhibition
- Primary CTA: Get started

---

## 1.5) Step 0.5 — "전시 단위" 개념 안내 (USR-AUT-09b)

시니어 사용자에게 "그림 한 점 = 전시 한 개" 개념을 시각 카드 2장으로 즉시 인지시킨다(P1).

### 한국어
- 제목: 여기는 디지털 갤러리예요
- 보조: 게시판이 아니라 작품을 전시하는 공간이에요
- 예시 카드 1: ○○○ 작가의 첫 전시 / 작품 1점
- 예시 카드 2: △△△ 작가의 봄 전시 / 작품 6점
- 보강: 한 점이어도 어엿한 전시예요. 작품을 올리시면 자동으로 나만의 전시가 열려요.
- 네비게이션: 이전 / 다음

### English
- Title: This is a digital gallery
- Lead: Not a feed — a space to exhibit your art
- Example 1: An artist's first exhibition / 1 work
- Example 2: An artist's spring exhibition / 6 works
- Reinforce: Even one piece is a full exhibition. Upload your work and your own exhibition opens automatically.
- Nav: Back / Next

---

## 2) Step 1 — 프로필 입력 (모든 사용자 공통, USR-AUT-10)

지역 분기 없는 단일 폼([Policy §2.1]).

### 2.1 진입 분기별 안내 (상단 배너)

가입 경로에 따라 상단에 다음 배너 1줄이 노출된다.

#### 초대 링크 가입자
- 한국어: 친구가 보내주신 초대 링크로 오셨어요. 프로필 설정을 마치면 본인 작품을 직접 골라 연결할 수 있어요.
- English: You arrived via an invite from a friend. After you finish profile setup, you can pick the artwork that belongs to you.

#### 소셜 가입자
- 한국어: 소셜 계정으로 빠르게 가입했어요. 닉네임은 방금 적은 그대로 채워뒀어요 — 바꾸고 싶으면 수정해 주세요. 전화번호는 나중에 설정에서 추가할 수 있어요.
- English: You signed up with a social account. The nickname you just chose is filled in — feel free to change it. You can add your phone number later in Settings.

### 2.2 입력 필드

닉네임 2~20자 등 제약은 PRD·Policy와 동일. 문구는 Copy와 맞춘다.

| 필드 | 한국어 라벨 | 영어 라벨 |
|---|---|---|
| 제목 | 프로필 설정 | Profile setup |
| 리드 | 기본 정보를 입력해주세요 | Enter your basic information |
| 작가명(닉네임) | 작가명 (닉네임) | Artist name (nickname) |
| 작가명 placeholder | 활동할 닉네임을 입력하세요 | Enter a nickname |
| 이메일 (소셜 가입자 중 미제공자만 노출) | 이메일 | Email |
| 이메일 placeholder | name@example.com | name@example.com |
| 이메일 보조 설명 | 중요 안내와 로그인·가입 인증 링크 수신에 사용돼요. (애플 릴레이 비활성·계정 비공개 등 소셜 제공자가 이메일을 안 줄 때만 입력 받아요. 이메일 가입자·제공된 소셜 가입자는 이 칸이 안 보여요.) | Used for important notices and sign-in verification links. (Shown only when the social provider didn't return an email — e.g., Apple relay disabled. Email sign-ups and other social sign-ups skip this field.) |
| 사진 올리기 버튼 | 사진 올리기 | Upload photo |

### 2.3 관심사 태그 (15종 + 기타)

작가의 작업 영역을 나타내는 칩 형태. 다중 선택 가능.

| 한국어 | English |
|---|---|
| 회화 | Painting |
| 드로잉 | Drawing |
| 디지털아트 | Digital art |
| 수채화 | Watercolor |
| 유화 | Oil |
| 아크릴 | Acrylic |
| 판화 | Printmaking |
| 조각 | Sculpture |
| 사진 | Photo |
| 일러스트 | Illustration |
| 캘리그래피 | Calligraphy |
| 도자기 | Ceramics |
| 공예 | Craft |
| 텍스타일 | Textile |
| 기타 | Other |

### 2.4 검증 메시지 (에러)

| 시나리오 | 한국어 | English |
|---|---|---|
| 닉네임 2자 미만 | 작가명은 2자 이상 입력해주세요 | Please enter at least 2 characters |
| 닉네임 20자 초과 | 작가명은 20자 이하로 입력해주세요 | Please keep it to 20 characters or fewer |
| 닉네임 비속어 | 닉네임에 부적절한 단어가 포함되어 있어요. | Nickname contains inappropriate language. |
| 이메일 미입력 | 연락 가능한 이메일을 입력해주세요 | Please enter a contact email |
| 이메일 형식 오류 | 이메일 형식을 확인해주세요 | Please check the email format |
| 이메일 중복 | 이미 가입된 이메일이에요. 다른 이메일을 입력해주세요. | This email is already registered. Please use a different email. |
| 전화번호 형식 오류 | 전화번호 형식을 확인해주세요 | Please check the phone number format |
| 전화번호 중복 | 이미 가입된 전화번호예요. 다른 번호를 입력해주세요. | This phone number is already registered. Please use a different number. |
| 이미지 5MB 초과 | 이미지 크기는 5MB 이하여야 해요. | Image must be under 5MB. |

### 2.5 네비게이션 버튼

- 이전 / Back
- 다음 / Next

---

## 3) Step 2 — 본인 작품 찾기 (claim, 토큰 보유자만)

초대 링크로 가입한 사용자가 가입 직후 진입하는 단계. **활성 또는 비활성 토큰** 보유 시에만 노출 ([Policy §3.2]).

### 3.1 진입 안내

#### 활성 토큰 (검수 통과 후)
일반 안내만 노출.

#### 비활성 토큰 (검수 신청 단계)
헤더 한 줄 추가
- 한국어: 이 전시는 검수 신청 중이에요. 미리 본인 작품을 골라두시면 공개 시 자동으로 노출돼요.
- English: This exhibition is under review. Pick your work now and it will be linked automatically when approved.

### 3.2 화면 본문

**제목**
- 한국어: 혹시 이 중에 본인 작품이 있나요?
- English: Is any of these yours?

**안심 안내**
- 한국어: 잘못 고르셔도 작가님이 마이페이지에서 풀어주실 수 있어요. 편하게 골라보세요.
- English: Don't worry — if you pick the wrong one, the artist can unlink it from My page anytime.

**카드 1개일 때 안전 신호** — 카드 그리드가 1개일 때만 추가
- 한국어: 아래 작품이 정말 본인이 그린 그림이 맞으면 눌러주세요.
- English: Please tap only if the work below is really yours.

### 3.3 액션 버튼

| 액션 | 한국어 | English |
|---|---|---|
| 카드 클릭 | 이거 제 작품이에요 | This one is mine |
| 건너뛰기 | 여기 없어요. 그냥 둘러볼게요 | Not here. I'll just browse |

### 3.4 확인 다이얼로그 (명시 클릭 후)

자동 연결 방지 — 카드를 누르면 1회 확인 거친 뒤 연결.

**제목**
- 한국어: '{slotDisplayName}' 자리를 회원님 작품으로 연결할까요?
- English: Link the '{slotDisplayName}' slot to you?

**본문**
- 한국어: 잘못 클릭하셨다면 카톡·문자 등으로 작가님께 말씀해 주세요.\n작가님이 마이페이지에서 풀어주실 수 있어요.
- English: If this was a mistake, send the artist a message (KakaoTalk, SMS, etc.).\nThey can unlink it from My page.

**확인 버튼**
- 한국어: 네, 맞아요
- English: Yes, that's mine

### 3.5 결과 토스트·메시지

| 시나리오 | 한국어 | English |
|---|---|---|
| 동시 선택 (이미 가져감) | 이 자리는 이미 다른 분이 연결됐어요. 본인 작품이 맞다면 작가님께 말씀해 주세요. | This spot has already been claimed. If it's actually your work, please let the artist know. |
| 스킵 후 안심 토스트 | 마음 바뀌시면 작가님께 카톡 등으로 말씀해 주세요. 새 초대 링크를 다시 받으실 수 있어요. | If you change your mind, just message the artist (KakaoTalk, etc.) and they can send you a new invite link. |
| 연결 완료 제목 | 연결됐어요! | Linked! |
| 연결 완료 본문 | '{title}'에 연결됐어요. 마이페이지에서 확인할 수 있어요. | You're now linked to '{title}'. Check My page anytime. |

---

## 4) Step 3 — 완료 화면

### 한국어
- 제목: 설정 완료!
- 환영: {name}님, 환영합니다!
- CTA 1: 첫 작품 올리기 → 경로 /upload
- CTA 2: 갤러리 둘러보기 → `/`

### English
- Title: You're all set!
- Welcome: Welcome, {name}!
- CTA 1: Upload your first work → `/upload`
- CTA 2: Explore the gallery → `/`

---

## 5) 시니어 친화 톤 적용

사용자는 **디지털 드로잉에 익숙한 시니어 작가**를 기본 페르소나로 둔다. 일반 시니어 가이드(친절·반복·확대 글꼴)를 모두 적용하지 않고 핵심 임계값만 강제한다.

| 톤 원칙 | 본 화면 적용 |
|---|---|
| 위협보다 안심 | §3.2 안심 안내 ("잘못 고르셔도…") |
| 회복 경로 명시 | 확인 다이얼로그 본문·토스트에 작가에게 연락 → 슬롯 풀기 안내 |
| 시니어 행동 어휘 | "카톡·문자" 같은 일반어 사용. "메시지"로 추상화하지 않음 |
| 격식체 절제 | "~돼요·~해요" 정중·친근 톤 |

---

## 6) 문자열 출처

모든 UI 문구는 [Copy_v1.md] 온보딩·claim 영역을 따른다. 본 문서는 prose 참고용이며 i18n 키 목록은 적지 않는다.

---

## 7) 구현 체크

- [ ] Step 0 / 0.5 / 1 / 2(조건부) / 3 — 총 5단계 모두 ko/en 동작
- [ ] 진입 분기별 배너 자동 분기 (일반·소셜·초대) — 단말에 임시 보관된 토큰 보유 여부로 판정
- [ ] Step 2 진입 조건: 활성 또는 비활성 토큰 보유 ([Policy §3.2]). 토큰 없으면 자동 스킵
- [ ] 동시 선택 처리: 두 번째 클릭 시 §3.5 동시 선택 토스트 + 카드 새로고침
- [ ] 명시 클릭 + 확인 다이얼로그 1회 = 자동 연결 방지 (Policy §3.2 자동 연결 옵션 없음)
- [ ] 관심사 태그 15종 ko/en 동일 노출 + 다중 선택 동작
- [ ] 검증 메시지 9종 ko/en 분기
- [ ] 완료 화면 CTA 2종 동작 (경로 /upload, `/`)
- [ ] 비활성 토큰 단계 Step 2 진입 시 §3.1 비활성 토큰 헤더 한 줄 추가 노출

---

## 8) 법무·UX 검토 연결

- **claim 흐름의 법적 적정성** — 자동 매칭 폐기·명시 클릭만 허용 ([Handoff_LegalReview_Checklist §3 LP-3])
- **만 14세 검증** — 본 화면은 가입 후 단계라 검증은 가입 시점에서 끝남. 본 화면에 14세 표기 별도 없음
- **개인정보 자기결정권** — 잘못 연결 시 사용자 자가 해제 UI 없음 ([Policy §3.5]). §3.4·§3.5 카피가 "작가에게 알려 풀기" 회복 경로를 안내

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1 | 2026-05-01 | PM × Claude | 최초 작성 — 온보딩 카피(Step 0~3) + 본인 작품 찾기(Step 2) ko/en prose. Policy §3 토큰 모델 정합 + 시니어 친화 톤 + 법무·UX 검토 연결. 단일 소스 안내 문구 정리. **후속** — 독자=개발·작성=기획 명시, `(온보딩 카피 키)` 등 플레이스홀더·표 키 열 제거, 관심사 태그 표 복구, §「적용 키」→「문자열 출처」, 시니어 표·체크리스트·법무 절 자연어화. |

<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Policy §3]: Policy_v1.md#3-비회원-초대-정책
[Handoff_LegalReview_Checklist §3 LP-3]: Handoff_LegalReview_Checklist_v1.md#lp-3-비회원-초대--토큰-모델-적법-근거
[Policy §2.1]: Policy_v1.md#21-가입-옵션과-필수-수집-정보-region-분기-폐기
[Policy §3.2]: Policy_v1.md#32-본인-작품-찾기-가입자-본인-선택
[Policy §3.3]: Policy_v1.md#33-자동-연결-후-알림과-동시-선택
[Policy §3.5]: Policy_v1.md#35-잘못-연결됐을-때
