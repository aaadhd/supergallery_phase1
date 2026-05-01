# 온보딩 원고 v1 (개발·법무·UX 전달용)

`USR-AUT-06` 가입 직후 온보딩 다단 흐름의 카피 전문 — 환영·프로필 입력·진입 분기별 안내·"본인 작품 찾기"(claim) 단계까지.

> **단일 소스 안내**
> - 카피 단일 소스: [`Copy_v1.md`](Copy_v1.md) 온보딩 카피 키 · 본인 작품 찾기 카피 키 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다.
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.
> - "본인 작품 찾기" 단계는 [Policy §3 v2.16 토큰 모델](Policy_v1.md#3-비회원-초대-정책)과 직결되어 변호사 검토 시 [Handoff_LegalReview_Checklist_v1.md §3 LP-3](Handoff_LegalReview_Checklist_v1.md) 함께 참조 권장.

---

## 정책 (Policy 정합)

| 항목 | 결정 | 근거 |
|---|---|---|
| 진입 분기 | 일반 가입 / 소셜 가입 / 초대 링크 가입 3종 | [Policy §2.1](Policy_v1.md#21-가입-옵션과-필수-수집-정보-region-분기-폐기)·[§3](Policy_v1.md#3-비회원-초대-정책) |
| Step 2 (본인 작품 찾기) 진입 조건 | 활성 또는 비활성 토큰 보유 시 | [Policy §3.2](Policy_v1.md#32-본인-작품-찾기-가입자-본인-선택)·[Policy v2.16](Policy_v1.md#문서-이력) |
| 자동 연결 | 없음. 가입자 명시 클릭 + 확인 다이얼로그 1회 필요 | [Policy §3.2](Policy_v1.md#32-본인-작품-찾기-가입자-본인-선택) |
| 동시 선택 처리 | 두 가입자가 동시에 같은 자리를 선택하면 첫 번째만 인정, 두 번째는 자동 차단 + 안내 | [Policy §3.3](Policy_v1.md#3-비회원-초대-정책) |
| Step 1 공통 폼 | 지역 분기 폐기. 닉네임·생년월일·프로필 이미지 단일 폼 | [Policy v2.13](Policy_v1.md#문서-이력) |

---

## 1) Step 0 — 환영 화면 (선택)

가입 직후 짧은 환영 화면. "시작하기" 또는 "나중에 설정하기" 분기.

### 한국어
- 제목: **{brand}에 오신 것을 환영합니다** (온보딩 카피 키)
- 리드: 나만의 갤러리를 만들어보세요 (온보딩 카피 키)
- 시작 버튼: 시작하기 (온보딩 카피 키)
- 건너뛰기: 나중에 설정하기 (온보딩 카피 키)

### English
- Title: **Welcome to {brand}** (온보딩 카피 키)
- Lead: Create your own gallery (온보딩 카피 키)
- Primary CTA: Get started (온보딩 카피 키)
- Skip: Set up later (온보딩 카피 키)

---

## 2) Step 1 — 프로필 입력 (모든 사용자 공통)

[Policy v2.13](Policy_v1.md#문서-이력)에서 지역 분기 폐기 후 단일 폼.

### 2.1 진입 분기별 안내 (상단 배너)

가입 경로에 따라 상단에 다음 배너 1줄이 노출된다.

#### 초대 링크 가입자 (온보딩 카피 키)
- 한국어: 친구가 보내주신 초대 링크로 오셨어요. 프로필 설정을 마치면 본인 작품을 직접 골라 연결할 수 있어요.
- English: You arrived via an invite from a friend. After you finish profile setup, you can pick the artwork that belongs to you.

#### 소셜 가입자 (온보딩 카피 키)
- 한국어: 소셜 계정으로 빠르게 가입했어요. 닉네임은 방금 적은 그대로 채워뒀어요 — 바꾸고 싶으면 수정해 주세요. 전화번호는 나중에 설정에서 추가할 수 있어요.
- English: You signed up with a social account. The nickname you just chose is filled in — feel free to change it. You can add your phone number later in Settings.

### 2.2 입력 필드

| 필드 | 한국어 라벨 | 영어 라벨 | 비고 |
|---|---|---|---|
| 제목 | 프로필 설정 | Profile setup | 온보딩 카피 키 |
| 리드 | 기본 정보를 입력해주세요 | Enter your basic information | 온보딩 카피 키 |
| 작가명(닉네임) | 작가명 (닉네임) | Artist name (nickname) | 온보딩 카피 키 · 2~20자 |
| 작가명 placeholder | 활동할 닉네임을 입력하세요 | Enter a nickname | 온보딩 카피 키 |
| 이메일 | 이메일 | Email | 온보딩 카피 키 |
| 이메일 placeholder | name@example.com | name@example.com | 온보딩 카피 키 |
| 이메일 보조 설명 | 중요 안내와 로그인·가입 인증 링크 수신에 사용돼요. | Used for important notices and sign-in verification links. | 온보딩 카피 키 |
| 사진 올리기 버튼 | 사진 올리기 | Upload photo | 온보딩 카피 키 |

### 2.3 관심사 태그 (15종 + 기타)

작가의 작업 영역을 나타내는 칩 형태. 다중 선택 가능.

| 키 | 한국어 | English |
|---|---|---|
| 온보딩 태그 카피 키 | 회화 | Painting |
| 온보딩 태그 카피 키 | 드로잉 | Drawing |
| 온보딩 태그 카피 키 | 디지털아트 | Digital art |
| 온보딩 태그 카피 키 | 수채화 | Watercolor |
| 온보딩 태그 카피 키 | 유화 | Oil |
| 온보딩 태그 카피 키 | 아크릴 | Acrylic |
| 온보딩 태그 카피 키 | 판화 | Printmaking |
| 온보딩 태그 카피 키 | 조각 | Sculpture |
| 온보딩 태그 카피 키 | 사진 | Photo |
| 온보딩 태그 카피 키 | 일러스트 | Illustration |
| 온보딩 태그 카피 키 | 캘리그래피 | Calligraphy |
| 온보딩 태그 카피 키 | 도자기 | Ceramics |
| 온보딩 태그 카피 키 | 공예 | Craft |
| 온보딩 태그 카피 키 | 텍스타일 | Textile |
| 온보딩 태그 카피 키 | 기타 | Other |

### 2.4 검증 메시지 (에러)

| 시나리오 | 한국어 | English | 키 |
|---|---|---|---|
| 닉네임 2자 미만 | 작가명은 2자 이상 입력해주세요 | Please enter at least 2 characters | 온보딩 카피 키 |
| 닉네임 20자 초과 | 작가명은 20자 이하로 입력해주세요 | Please keep it to 20 characters or fewer | 온보딩 카피 키 |
| 닉네임 비속어 | 닉네임에 부적절한 단어가 포함되어 있어요. | Nickname contains inappropriate language. | 온보딩 카피 키 |
| 이메일 미입력 | 연락 가능한 이메일을 입력해주세요 | Please enter a contact email | 온보딩 카피 키 |
| 이메일 형식 오류 | 이메일 형식을 확인해주세요 | Please check the email format | 온보딩 카피 키 |
| 이메일 중복 | 이미 가입된 이메일이에요. 다른 이메일을 입력해주세요. | This email is already registered. Please use a different email. | 온보딩 카피 키 |
| 전화번호 형식 오류 | 전화번호 형식을 확인해주세요 | Please check the phone number format | 온보딩 카피 키 |
| 전화번호 중복 | 이미 가입된 전화번호예요. 다른 번호를 입력해주세요. | This phone number is already registered. Please use a different number. | 온보딩 카피 키 |
| 이미지 5MB 초과 | 이미지 크기는 5MB 이하여야 합니다. | Image must be under 5MB. | 온보딩 카피 키 |

### 2.5 네비게이션 버튼

- 이전: 온보딩 카피 키 ("이전" / "Back")
- 다음: 온보딩 카피 키 ("다음" / "Next")

---

## 3) Step 2 — 본인 작품 찾기 (claim, 토큰 보유자만)

초대 링크로 가입한 사용자가 가입 직후 진입하는 단계. **활성 또는 비활성 토큰** 보유 시에만 노출 ([Policy §3.2 v2.16](Policy_v1.md#32-본인-작품-찾기-가입자-본인-선택)).

### 3.1 진입 안내

#### 활성 토큰 (검수 통과 후)
일반 안내만 노출.

#### 비활성 토큰 (검수 신청 단계, Policy v2.16)
헤더 한 줄 추가 (본인 작품 찾기 카피 키)
- 한국어: 이 전시는 검수 신청 중이에요. 미리 본인 작품을 골라두시면 공개 시 자동으로 노출돼요.
- English: This exhibition is under review. Pick your work now and it will be linked automatically when approved.

### 3.2 화면 본문

**제목** (본인 작품 찾기 카피 키)
- 한국어: 혹시 이 중에 본인 작품이 있나요?
- English: Is any of these yours?

**안심 안내** (본인 작품 찾기 카피 키)
- 한국어: 잘못 고르셔도 작가님이 마이페이지에서 풀어주실 수 있어요. 편하게 골라보세요.
- English: Don't worry — if you pick the wrong one, the artist can unlink it from My page anytime.

**카드 1개일 때 안전 신호** (본인 작품 찾기 카피 키) — 카드 그리드가 1개일 때만 추가
- 한국어: 아래 작품이 정말 본인이 그린 그림이 맞으면 눌러주세요.
- English: Please tap only if the work below is really yours.

### 3.3 액션 버튼

| 액션 | 한국어 | English | 키 |
|---|---|---|---|
| 카드 클릭 | 이거 제 작품이에요 | This one is mine | 본인 작품 찾기 카피 키 |
| 건너뛰기 | 여기 없어요. 그냥 둘러볼게요 | Not here. I'll just browse | 본인 작품 찾기 카피 키 |

### 3.4 확인 다이얼로그 (명시 클릭 후)

자동 연결 방지 — 카드를 누르면 1회 확인 거친 뒤 연결.

**제목** (본인 작품 찾기 카피 키)
- 한국어: '{slotDisplayName}' 자리를 회원님 작품으로 연결할까요?
- English: Link the '{slotDisplayName}' slot to you?

**본문** (본인 작품 찾기 카피 키)
- 한국어: 잘못 클릭하셨다면 카톡·문자 등으로 작가님께 말씀해 주세요.\n작가님이 마이페이지에서 풀어주실 수 있어요.
- English: If this was a mistake, send the artist a message (KakaoTalk, SMS, etc.).\nThey can unlink it from My page.

**확인 버튼** (본인 작품 찾기 카피 키)
- 한국어: 네, 맞아요
- English: Yes, that's mine

### 3.5 결과 토스트·메시지

| 시나리오 | 한국어 | English | 키 |
|---|---|---|---|
| 동시 선택 (이미 가져감) | 이 자리는 이미 다른 분이 연결됐어요. 본인 작품이 맞다면 작가님께 말씀해 주세요. | This spot has already been claimed. If it's actually your work, please let the artist know. | 본인 작품 찾기 카피 키 |
| 스킵 후 안심 토스트 | 마음 바뀌시면 작가님께 카톡 등으로 말씀해 주세요. 새 초대 링크를 다시 받으실 수 있어요. | If you change your mind, just message the artist (KakaoTalk, etc.) and they can send you a new invite link. | 본인 작품 찾기 카피 키 |
| 연결 완료 제목 | 연결됐어요! | Linked! | 본인 작품 찾기 카피 키 |
| 연결 완료 본문 | '{title}'에 연결됐어요. 마이페이지에서 확인할 수 있어요. | You're now linked to '{title}'. Check My page anytime. | 본인 작품 찾기 카피 키 |

---

## 4) Step 3 — 완료 화면

### 한국어
- 제목: 설정 완료! (온보딩 카피 키)
- 환영: {name}님, 환영합니다! (온보딩 카피 키)
- CTA 1: 첫 작품 올리기 → 경로 /upload (온보딩 카피 키)
- CTA 2: 갤러리 둘러보기 → `/` (온보딩 카피 키)

### English
- Title: You're all set! (온보딩 카피 키)
- Welcome: Welcome, {name}! (온보딩 카피 키)
- CTA 1: Upload your first work → 경로 /upload (온보딩 카피 키)
- CTA 2: Explore the gallery → `/` (온보딩 카피 키)

---

## 5) 시니어 친화 톤 적용 (Memory 정합)

사용자는 **디지털 드로잉에 익숙한 시니어 작가**다([Memory: user_artier_target_persona](../../.claude/projects/-Users-im-1688/memory/user_artier_target_persona.md)). 일반 시니어 가이드(친절·반복·확대 글꼴)를 모두 적용하지 않고 핵심 임계값만 강제한다.

| 톤 원칙 | 본 화면 적용 |
|---|---|
| 위협보다 안심 | 본인 작품 찾기 카피 키 "잘못 고르셔도..." (Nielsen 휴리스틱 후속 정정) |
| 회복 경로 명시 | 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키 모두 다음 행동 안내 |
| 시니어 행동 어휘 | "카톡·문자" 같은 일반어 사용. "메시지"로 추상화 X |
| 격식체 절제 | "~돼요·~해요" 정중·친근 톤 (격식체 "~합니다"와 다름) |

---

## 6) 적용 키 일람 (코드 동기화 매핑)

### 6.1 Step 0 (환영)
- 온보딩 카피 키, 환영 리드 카피 키, 시작 카피 키, 나중에 카피 키

### 6.2 Step 1 (프로필)
- 분기 안내: 온보딩 카피 키, 내부 식별자
- 제목: 온보딩 카피 키, 내부 식별자
- 필드: 온보딩 카피 키, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자, 사진 업로드 카피 키
- 태그: 온보딩 태그 카피 키 ~ 온보딩 태그 카피 키 (15종)
- 검증: 온보딩 카피 키, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자, 내부 식별자
- 네비: 온보딩 카피 키, 다음 카피 키

### 6.3 Step 2 (claim, 본인 작품 찾기)
- 진입 안내: 본인 작품 찾기 카피 키 (비활성 토큰 단계), 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키
- 액션: 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키
- 확인 다이얼로그: 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키
- 결과: 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키, 본인 작품 찾기 카피 키

### 6.4 Step 3 (완료)
- 온보딩 카피 키, 내부 식별자, 첫 업로드 카피 키, 내부 식별자

---

## 7) 구현 체크

- [ ] Step 0~3 4단계 모두 ko/en 동작
- [ ] 진입 분기별 배너 자동 분기 (일반·소셜·초대) — 단말에 임시 보관된 토큰 보유 여부로 판정
- [ ] Step 2 진입 조건: 활성 또는 비활성 토큰 보유 (Policy v2.16). 토큰 없으면 자동 스킵
- [ ] 동시 선택 처리: 두 번째 클릭 시 본인 작품 찾기 카피 키 토스트 + 카드 새로고침
- [ ] 명시 클릭 + 확인 다이얼로그 1회 = 자동 연결 방지 (Policy §3.2 자동 연결 옵션 없음)
- [ ] 관심사 태그 15종 ko/en 동일 노출 + 다중 선택 동작
- [ ] 검증 메시지 9종 ko/en 분기
- [ ] 완료 화면 CTA 2종 동작 (경로 /upload, `/`)
- [ ] 비활성 토큰 단계 Step 2 진입 시 본인 작품 찾기 카피 키 헤더 한 줄 추가 노출

---

## 8) 법무·UX 검토 연결

- **claim 흐름의 법적 적정성** — 자동 매칭 폐기·명시 클릭만 허용 ([Handoff_LegalReview_Checklist_v1.md §3 LP-3](Handoff_LegalReview_Checklist_v1.md))
- **만 14세 검증** — 본 화면은 가입 후 단계라 검증은 가입 시점에서 끝남. 본 화면에 14세 표기 별도 없음
- **개인정보 자기결정권** — 잘못 연결됐을 때 자가 해제 진입점이 없는 정책 ([Policy §3.5](Policy_v1.md#35-잘못-연결됐을-때)). 본 화면 카피는 "작가에게 알려 풀기" 흐름을 안내 (본인 작품 찾기 카피 키·본인 작품 찾기 카피 키)

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1 | 2026-05-01 | PM × Claude | 최초 작성 — 온보딩 카피 키(Step 0~3) + 본인 작품 찾기 카피 키(Step 2 본인 작품 찾기) ko/en prose 게재. Policy §3 v2.16 토큰 모델 정합 + 시니어 친화 톤 매트릭스 + 법무·UX 검토 연결. claim.* 키 13개(ko/en 26 entries)는 본 작업에서 코드(messages.ts) → Copy_v1.md 동기화 누락 보강과 함께 추가됨. |
