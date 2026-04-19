# Artier — 디자인 시스템 v1.0

> **v1.0 변경 요약 (2026-04-19)**:
> - 최초 작성. `src/styles/theme.css` + `index.css` + shadcn 컴포넌트 변형 토큰을 역공학으로 정리.
> - Figma 원본: file `Wp7bYMg3uhwJ2QrbYUuEBW`, node 42-3898 (Dev Mode).

**작성일**: 2026-04-19
**버전**: v1.0
**근거**: `src/styles/theme.css`, `src/styles/index.css`, `src/app/components/ui/*`
**상위 참조**: [README.md](README.md), [SystemArchitecture_v1.md](SystemArchitecture_v1.md)
**본 문서의 목적**: 사용자 앱과 어드민이 공유하는 **시각·상호작용 토큰** 및 **시니어 친화 규칙**을 단일 소스로 문서화. shadcn/ui + Tailwind 4 + Radix 조합.

---

## 제품별 적용 가이드 (빠른 참조)

| 제품 | 기준 뷰포트 | 주 상호작용 | 특화 원칙 |
|---|---|---|---|
| 사용자 앱 (USR) | **모바일 375px 우선** · 데스크톱 반응형 | 터치(≥ 44px) · 탭·스크롤 | §2 시니어 친화 UX, 큰 글꼴·넓은 터치 타깃 |
| 운영 어드민 (ADM) | **데스크톱 1280px 우선** | 마우스·키보드 | §3 데이터 테이블 밀도 허용, 사이드바 내비 |

> §1의 토큰은 두 제품이 공유한다. 오버라이드가 필요하면 컴포넌트 레벨에서만 적용하며, CSS 변수는 건드리지 않는다.

---

## §1. 공통 디자인 토큰 (전 제품 공유)

### 1.1 디자인 방향

**톤**: 시니어 작가의 작품이 주인공. UI는 뒤로 물러난다.
**키워드**: 차분 · 여유 · 존중.
**악센트 철학**: 로고 틸을 고정 악센트로 쓰지 않고, **모호·딥 플럼(plum, hue 328°)** 을 공용 primary로 사용한다. 온라인 갤러리의 차분한 공기감을 위한 선택이며, 로고의 틸 칩은 로고 자체에만 국소 적용한다.

토큰은 모두 **OKLCH** 로 정의해 다크 모드 전환 시 채도·명도를 독립적으로 조절한다. Figma Variables → `theme.css`로 1:1 동기화.

### 1.2 컬러 팔레트

**라이트 모드 (기본)**

| 토큰 | 값(OKLCH) | 용도 |
|---|---|---|
| `--background` | `oklch(0.97 0.014 85)` | 페이지 배경. 따뜻한 크림톤. |
| `--foreground` | `oklch(0.21 0.022 280)` | 본문 기본 텍스트. |
| `--card` | `oklch(0.995 0.008 85)` | 카드·모달 바닥면. 배경보다 약간 밝은 크림. |
| `--card-foreground` | `oklch(0.21 0.022 280)` | 카드 내 텍스트. |
| `--primary` | `oklch(0.46 0.075 328)` | 주요 CTA·강조. **딥 플럼**. WCAG AA ≈ 5.0:1. |
| `--primary-foreground` | `oklch(0.985 0.01 328)` | primary 위 텍스트. |
| `--secondary` | `oklch(0.955 0.018 85)` | 보조 배경(탭 비활성, 약한 블록). |
| `--secondary-foreground` | `oklch(0.28 0.022 280)` | secondary 위 텍스트. |
| `--muted` | `oklch(0.935 0.022 85)` | 조용한 배경(배지·입력 필드 비활성). |
| `--muted-foreground` | `oklch(0.43 0.022 280)` | 보조 텍스트. 배경 대비 ≈ 5.2:1. |
| `--accent` | `oklch(0.93 0.035 328)` | 호버·활성 하이라이트 배경. |
| `--accent-foreground` | `oklch(0.32 0.07 328)` | accent 위 텍스트. |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 파괴적 액션(삭제·탈퇴). 코랄 레드. |
| `--destructive-foreground` | `oklch(0.985 0 0)` | destructive 위 텍스트. |
| `--border` | `oklch(0.875 0.018 85)` | 구분선·테두리. |
| `--input` | `oklch(0.875 0.018 85)` | 입력 테두리. |
| `--input-background` | `oklch(0.995 0.008 85)` | 입력 필드 바닥면. |
| `--switch-background` | `oklch(0.815 0 0)` | 토글 오프 상태. |
| `--ring` | `oklch(0.52 0.08 328)` | 포커스 링. |

**차트**: `--chart-1`~`--chart-5` — 무채색 5단 그라데이션(라이트는 어두운→밝은, 다크는 반대).

**다크 모드**

같은 토큰 이름, OKLCH 값만 달라진다. `.dark` 클래스가 조상에 있으면 자동 전환. Phase 1은 시스템 토글 미제공(향후 설정에서 선택).

**사용 원칙**
- 직접 HEX·RGB 쓰지 말 것. 언제나 Tailwind 클래스(`bg-primary`, `text-muted-foreground` 등) 또는 `var(--...)`.
- `background` / `card` / `popover` / `muted` 는 **같은 패밀리** 지만 레이어를 분리하려고 명도만 약간 띄운 것 — 계층을 무너뜨리려 새 토큰 만들지 말 것.

### 1.3 타이포그래피

**폰트 패밀리**

```
Pretendard (주) → Pretendard (system) → -apple-system → BlinkMacSystemFont → system-ui
→ Roboto → Helvetica Neue → Segoe UI → Apple SD Gothic Neo → Malgun Gothic → sans-serif
```

Pretendard는 CDN으로 로드(`fonts.css`). 한글·영문 타이포 균형이 맞춰져 있어 별도 폰트 믹스 금지.

**스케일**

| 역할 | Tailwind | 크기(rem → px) | Line-height | Letter-spacing | Weight |
|---|---|---|---|---|---|
| H1 | 기본 `h1` | 1.375rem → 22px | 1.35 | -0.02em | 600 (medium) |
| H2 | 기본 `h2` | 1.25rem → 20px | 1.4 | -0.015em | 600 |
| H3 | 기본 `h3` | 1.0625rem → 17px | 1.45 | -0.012em | 600 |
| H4 | 기본 `h4` | 0.9375rem → 15px | 1.5 | -0.008em | 600 |
| Label | 기본 `label` | 0.9375rem → 15px | 1.5 | — | 600 |
| Button | 기본 `button` | 0.9375rem → 15px | 1.45 | — | 600 |
| Body | (기본) | 1rem → 16px | 1.5 | — | 400 |
| Input | 기본 `input` | 1rem → 16px | 1.5 | — | 400 |

> **iOS 확대 방지**: input·textarea·select 전부 `font-size ≥ 16px` 필수. 이보다 작으면 iOS Safari가 자동 줌.

**폰트 두께**: `--font-weight-normal: 400`, `--font-weight-medium: 600`. 두께 600을 "medium"으로 부르고 실제 사용한다(Pretendard 700은 제목 강조용만). 시니어 UX상 가늘게(300/350) 금지.

**글꼴 크기 조절 (사용자 설정)**

`Settings`(`USR-STG-01`)에서 **작게 / 보통 / 크게** 3단 토글. `artier_font_scale`로 저장. 루트 `html { font-size }` 를 100% / 110% / 120%로 조정해 전 스케일이 비례 확대.

### 1.4 보더 라디우스

| 토큰 | 값 | 용도 |
|---|---|---|
| `--radius` (base) | 0.5rem (8px) | 기본 카드·버튼 |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 4px | 인풋·소형 칩 |
| `--radius-md` | `calc(var(--radius) - 2px)` = 6px | 버튼 메디엄 |
| `--radius-lg` | `var(--radius)` = 8px | 카드 표준 |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 12px | 모달·바텀시트 |

리스트 아이템은 `border-radius: 12px` 고정(`index.css`의 `.list-item`). 원형은 버튼 icon 크기(`rounded-md` 유지, 원형은 프로필·아바타 한정 `rounded-full`).

### 1.5 그림자

shadcn 기본을 따르되, **카드는 최소한의 그림자** 만 사용하여 갤러리 톤을 유지한다.

- `shadow-sm` — 기본 카드
- `shadow` — 호버/선택
- `shadow-lg` — 모달·시트(`DialogContent`, `SheetContent` 기본)

작품 썸네일 카드는 그림자 대신 **1px border + 배경 레이어**로 깊이감을 준다(고해상 이미지가 주인공).

### 1.6 모션

| 토큰 | 지속 | 이징 | 용도 |
|---|---|---|---|
| 인터랙티브 기본 | 200ms | ease | 버튼·카드 배경·그림자 전환 |
| `transform` | 200ms | ease | hover scale, active press |
| `fade-in-up` | 300~500ms | ease | 신규 콘텐츠 등장 |
| `animate-slow-pan` | 20s | ease-in-out infinite alternate | 배경 이미지 느린 팬 |
| `animate-slow-zoom` | 15s | ease-in-out infinite alternate | 스플래시·히어로 배경 |
| `animate-slow-drift` | 30s | ease-in-out infinite | 이벤트 히어로 |
| `confetti-pop` | 0.95s | ease-out forwards | 업로드 완료 등 축하 |

**원칙**
- 시니어 대상: 화면 전환·스크롤 애니메이션은 **짧고 느리게**(200ms 내외). 번쩍이는 효과 금지.
- `prefers-reduced-motion: reduce` 를 존중(CSS에서 자동 비활성은 현재 미구현 → v1.1 추가 예정).

### 1.7 아이콘

- **라이브러리**: `lucide-react` (단일). 추가 아이콘 팩 금지.
- **크기**: 버튼 내 `size-4` (16px), 툴바·카드 액션 `size-5` (20px), 히어로 강조 `size-6` (24px).
- **스트로크**: lucide 기본(`stroke-width: 2`). 시니어 가시성 목적으로 1.5 이하로 낮추지 말 것.

### 1.8 핵심 시각 법칙 (깨지면 일관성 붕괴)

1. **터치 타깃 44px** — 모든 인터랙티브 요소 `min-h-[44px] min-w-[44px]`. `button.icon` 사이즈가 기본 44x44(`ui/button.tsx`).
2. **폰트 ≥ 16px** — 입력 필드는 예외 없이 16px 이상(iOS 줌 방지).
3. **호버는 데스크톱만** — `@media (hover: hover) and (pointer: fine) and (min-width: 1024px)` 게이트로 호버 상태를 격리. 모바일·태블릿에선 호버 효과 없음, 대신 `active` 상태에서 opacity 0.8 + scale 0.98.
4. **포커스 가시성** — 모든 인터랙티브에 `focus-visible:ring-ring/50 focus-visible:ring-[3px]`. 2px solid 아웃라인 + 2px 오프셋이 기본.
5. **색상 단독 정보 금지** — 상태(승인/반려/정지)는 항상 아이콘 + 라벨 동반.
6. **`window.confirm()` 금지** — 모든 확인은 `openConfirm({...})`(`ConfirmDialog`). destructive 액션은 빨간 확정 버튼 고정.
7. **문자열 하드코딩 금지** — 모든 UI 텍스트는 `useI18n().t('key')` 경유.

---

## §2. UA 가이드 (사용자 앱 — 모바일 375px)

사용자 앱은 시니어(50대 이상) 작가·감상자가 주 타깃이다. 아래 규칙은 Phase 1 전체에 적용된다.

### 2.1 레이아웃

- **최대 폭**: 본문 컨테이너 `max-w-screen-sm` (640px) 기준. 1024px 이상에서만 2열·3열 그리드 허용.
- **그리드 갭**: 작품 그리드는 `gap-2 md:gap-3 lg:gap-4` 로 점진 확장.
- **패딩**: 페이지 좌우 `px-4 md:px-6`. 카드 내부 `p-4`.
- **safe-area**: 하단 탭바·스티키 버튼은 `.safe-area-bottom` 유틸로 `env(safe-area-inset-bottom)` 반영.

### 2.2 네비게이션

**PC(≥ 1024px) — Header 고정형**
- 좌측: 로고(Artier) → `/`
- 중앙: Home · Events · Search 텍스트 링크
- 우측: 업로드 버튼(Plus, primary), 알림(Bell + unread 배지), 아바타 드롭다운(설정·로그아웃), 언어 토글(Globe → KO/EN)

**모바일(< 1024px)**
- 상단 Header: 로고 + 알림 + 아바타 + 업로드
- 하단: Footer(없음 on `/upload` 경로). Footer는 스크롤 시 표시되는 보조 링크(정책·문의·FAQ)로 구성되고, 주요 네비는 상단 Header에만 있음
- 검색은 상단 검색 탭이 아닌 **전용 화면** (`/search`) 진입 방식

> Phase 1에선 하단 탭바(Tabbar) 형태의 글로벌 내비를 쓰지 않는다. 시니어 UX 검토 결과 상단 Header + 명시적 진입이 오인조작이 적었음.

### 2.3 컴포넌트

아래는 **`src/app/components/ui/*`** 에서 제공하는 shadcn 기반 프리셋. 신규 컴포넌트를 만들기 전, 이 목록을 먼저 확인한다.

**레이아웃·구조**
- `card`, `aspect-ratio`, `scroll-area`, `separator`, `resizable`, `sidebar`(어드민용)

**내비·디스클로저**
- `accordion`, `breadcrumb`, `collapsible`, `menubar`, `navigation-menu`, `pagination`, `tabs`, `sheet`

**입력**
- `input`, `password-input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `input-otp`, `label`, `form`, `toggle`, `toggle-group`

**오버레이·피드백**
- `alert`, `alert-dialog`, `dialog`, `drawer`, `dropdown-menu`, `context-menu`, `popover`, `tooltip`, `sonner`(토스트), `skeleton`, `progress`, `command`

**콘텐츠**
- `avatar`, `badge`, `button`, `calendar`, `carousel`, `table`, `hover-card`

**Artier 전용 컴포넌트**
- `SplashScreen`, `ConfirmDialog`(`openConfirm` API), `LoginPromptModal`, `ReportModal`, `WorkDetailModal`, `ProfileImageModal`, `PendingInviteClaimGate`, `SocialSignupModal`, `ExternalLinksEditor`, `CookieConsent`, `OfflineBanner`, `ErrorBoundary`, `DeepZoomViewer`, `QaScreenShortcuts`, `RequiredMark`, `Footer`, `Header`, `work/CopyrightProtectedImage`, `work/WorkCard`, `work/ExhibitionCard`

**버튼 변형** (`ui/button.tsx`)

| variant | 용도 | 비고 |
|---|---|---|
| `default` | 기본 primary CTA | 플럼 배경 + 흰 텍스트. |
| `destructive` | 삭제·탈퇴 | 코랄 레드. `ConfirmDialog`의 destructive=true와 짝. |
| `outline` | 보조 CTA | 흰 배경 + 테두리. 라이트 톤. |
| `secondary` | 약한 강조 | 크림 배경. |
| `ghost` | 텍스트 느낌 | 배경 없음, 호버 시 accent. |
| `toolbar` | 오버레이 툴바 | 투명 배경 + 호버 시 검정 6% overlay. 작품 뷰어 등. |
| `link` | 인라인 링크 | 언더라인·primary 색. |

**버튼 크기**

| size | 높이 | 용도 |
|---|---|---|
| `default` | 44px (h-11) | 주요 CTA |
| `sm` | 36px (h-9) | 툴바·보조 |
| `lg` | 48px (h-12) | 스플래시·온보딩 등 랜딩 페이지 메인 CTA |
| `icon` | 44x44 | **터치 타깃 최소치 — 축소 금지** |

**배지 변형** (`ui/badge.tsx`): `default` / `secondary` / `destructive` / `outline`. Artier의 **Pick 배지** · **강사 배지** · **검수 상태 배지**(pending/rejected) 는 이 기본 variant 위에 커스텀 tailwind 클래스를 조합해 만든다(영구 적용 전용 시각 신호라 별도 디자인 토큰을 두지 않음).

### 2.4 카드 패턴

**WorkCard (작품·전시 썸네일)**
- 비율: `aspect-[4/5]` 또는 `aspect-square`
- 이미지: `CopyrightProtectedImage`(우클릭·드래그 차단)
- 호버 오버레이: `.touch-gradient-overlay` — 모바일은 항상 약한 그라데이션, 데스크톱 호버 시 진한 그라데이션
- 하단: **아이콘만** (좋아요·저장 상태) · 카운트 숫자 비노출(§15.2 Policy)
- 배지: Pick · 강사 · 검수 상태(본인에게만)

**ExhibitionCard (전시 커버)**
- 비율: 4:5, 커스텀 커버가 있으면 전면 표시
- 오버레이: 전시명 + 그룹명 + 이미지 개수 배지(다장)

### 2.5 알림·피드백

- **토스트**: `sonner` 기반. 성공/에러 텍스트만. 인라인 액션 버튼 없음.
- **인라인 배너**: 업로드 카메라 차단·오프라인·쿠키 동의 — 컴포넌트 상단 고정.
- **확인 다이얼로그**: `openConfirm({ title, description?, destructive? })`. **제목에 대상 이름**(전시명·파일명 등) 포함, **설명에 영구 삭제/복원 불가 여부** 명시.

---

## §3. 어드민 가이드 (ADM — 데스크톱 1280px)

운영팀이 사용하는 백오피스. 데이터 밀도를 허용하고 키보드·마우스 워크플로우 중심.

### 3.1 레이아웃

- **기준 폭**: 1280px. 1024px 이하에서도 동작하지만 표·사이드바가 축약되어 장시간 작업엔 부적합.
- **컨테이너**: `AdminLayout` — 좌측 고정 사이드바(240px) + 상단 헤더 + 메인 영역.
- **여백**: 메인 `px-6 py-4`, 카드 내부 `p-4`.
- **테이블 밀도**: 본문 14px 허용(어드민 한정 예외. 사용자 앱은 ≥ 15px).

### 3.2 네비게이션

**AdminLayout 사이드바 (고정)**

| 순서 | 항목 | 경로 | 배지 조건 |
|---|---|---|---|
| 1 | 대시보드 | `/admin` | — |
| 2 | 미결 이슈 | `/admin/issues` | 미결 건수 |
| 3 | 런칭 체크리스트 | `/admin/checklist` | 차단됨 건수 |
| 4 | 파트너 작가 | `/admin/partners` | — |
| 5 | 이벤트 참여자 | `/admin/events` | — |
| 6 | 콘텐츠 검수 | `/admin/content-review` | `pending` 건수 |
| 7 | 작품 관리 | `/admin/works` | — |
| 8 | Pick 관리 | `/admin/picks` | 주간 현재 수 |
| 9 | 기획전 | `/admin/curation` | — |
| 10 | 배너 관리 | `/admin/banners` | 활성 수 |
| 11 | 이벤트 관리 | `/admin/managed-events` | — |
| 12 | 신고 처리 | `/admin/reports` | 대기 건수 |
| 13 | 회원 관리 | `/admin/members` | — |

접근 제어: `AdminGuard` 컴포넌트가 라우트 레벨에서 `canAccessAdminRoutes(isLoggedIn)` 체크(`adminGate.ts`).

### 3.3 컴포넌트 (어드민 특화)

사용자 앱 컴포넌트를 기본으로 쓰되, 어드민 한정으로 다음 패턴을 허용.

**데이터 테이블**
- `table` 기반. 컬럼 고정(sticky) 허용.
- 행 선택: 단일 체크박스만(**다중 선택 Shift+Click 금지** — 사용자 앱 금지 원칙을 어드민에도 적용).
- 필터 바: 상단에 `select` + `input` + `date picker` 조합. 필터 상태 URL 쿼리에 반영.
- 정렬: 한 번에 한 컬럼만.

**액션 다이얼로그**
- 단순 확인 → `ConfirmDialog`
- 사유 입력 필요(정지·반려) → `dialog` + 폼
- 파괴적 액션 → `destructive: true` + "이 작업은 되돌릴 수 없습니다" 문구 필수

**빈 상태(Empty State)**
- 아이콘 + 안내 문구 + 주요 CTA 1개
- "추가하기" / "새로 만들기" 버튼은 `Plus` 아이콘 좌측 + 텍스트

**폼 구성**
- `form` + `label` + `input` 필수 조합. 필수 입력은 `RequiredMark`(빨간 별 + sr-only "필수").
- 긴 폼은 `accordion` 또는 `tabs`로 섹션 분리. 단일 스크롤 1500px 넘지 않기.

### 3.4 색·상태 컨벤션 (어드민 한정)

| 상태 | 배지 색 | 사용처 |
|---|---|---|
| 승인(approved) · 활성 | `secondary`(회색) · 작은 체크 | 검수·이벤트·파트너 |
| 대기(pending) · 시작 전 | `outline`(회색 보더) | 검수·체크리스트 |
| 반려(rejected) · 차단됨 | `destructive`(코랄 레드) | 검수·체크리스트 |
| 진행 중(in-progress) | `default`(플럼) | 체크리스트·이슈 |
| 경고(warning) | 노랑 배지(커스텀) | 신고 경고 누적 표시 |
| 정지(suspended) | `destructive` 풀배지 | 회원 |

> 어드민이 사용자 앱보다 색 종류가 많지만, **같은 의미면 같은 색**. 다른 의미인데 같은 색으로 재사용 금지.

---

## §4. 디자인 시스템 관리

### 4.1 Figma ↔ 코드 동기화

- **Figma 파일**: file `Wp7bYMg3uhwJ2QrbYUuEBW`, node 42-3898 (Dev Mode)
- **동기화 흐름**: Figma Variables에서 컬러·라디우스 변경 → Dev Mode MCP로 변수 읽기 → `theme.css` 의 OKLCH 값 갱신 → PR
- **단방향**: 코드가 Figma를 따라간다. 코드에서 임의로 만든 커스텀 값은 다음 동기화 시 충돌.

### 4.2 신규 컴포넌트 추가 규칙

1. shadcn 기본 컴포넌트로 해결 가능한지 먼저 확인(`components/ui/*` 41종)
2. 커스터마이즈가 2~3줄 내라면 사용처에서 className만 확장
3. 재사용 3회 이상 + 구조가 다른 경우에만 `components/*` 또는 `components/work/*`에 새 컴포넌트 신설
4. 단방향 의존: `ui/*` → `components/*` → `pages/*` → `admin/*`. 역방향 import 금지.

### 4.3 알려진 제약 (v1.1에서 개선 예정)

- `prefers-reduced-motion` 자동 처리 없음 → 수동으로 `motion-safe:` / `motion-reduce:` 유틸 추가 필요
- 다크 모드 토글 UI 없음 — CSS 변수는 준비됐으나 설정에서 선택하는 화면 미구현
- 차트 컬러(`--chart-1`~`-5`)는 무채색 5단만 — 다채색 필요 시 별도 팔레트 설계 필요

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v1.0 | 2026-04-19 | PM × Claude | 최초 작성. `src/styles/theme.css` + `index.css` + shadcn 변형 토큰 역공학. Figma node 42-3898 기준. |
