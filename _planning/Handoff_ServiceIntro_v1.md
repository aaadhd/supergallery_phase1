# 서비스 소개 원고 (USR-INF-01)

**작성**: 기획 · **독자**: 개발(구현·QA)

`USR-INF-01` 서비스 소개(About) 화면 본문 전문이다. 레이아웃·스크롤 등 구현 세부는 PRD·구현 판단에 따른다.

> **단일 소스**
> - 화면 문자열(i18n)은 [Copy_v1.md](./Copy_v1.md) About 영역이 단일 소스다.
> - 본 문서와 Copy를 같은 의미로 유지하고, 수정 시 Copy를 먼저 갱신한다.

---

## 화면 구성 (USR-INF-01)

페이지는 4구간으로 구성된다 — **히어로 → 기능 4종 → 미션 → 하단 CTA**.

| 구간 | 역할 |
|---|---|
| 히어로 | 한 문장 가치 제안 + 양 갈래 CTA(둘러보기·업로드) |
| 기능 | Artier에서 할 수 있는 일 4종 카드 |
| 미션 | 서비스의 신념·세계관 |
| 하단 CTA | 가입 유도 종결 |

---

## 한국어 원고

### 1) 히어로

**제목**
> 모든 작가를 위한
> 온라인 갤러리

**리드**
> Artier는 세대와 장르를 넘어 모든 작가가 자유롭게 작품을 전시하고, 발견하고, 연결될 수 있는 디지털 갤러리 플랫폼이에요.

**CTA 버튼 2종**
- 갤러리 둘러보기 → `/`
- 작품 올리기 → 경로 /upload

### 2) 기능 4종 ("Artier에서 할 수 있는 것")

| # | 제목 | 설명 |
|---|---|---|
| 1 | 작품 전시 | 당신의 작품을 아름다운 온라인 갤러리에 전시하고, 전 세계와 공유하세요. |
| 2 | 커뮤니티 | 같은 열정을 가진 작가들과 연결되고, 영감을 주고받으세요. |
| 3 | Artier's Pick | 매주 뽑히는 우수 작품을 통해 더 많은 관객을 만나보세요. |
| 4 | 그룹 전시 | 강사와 수강생이 함께하는 그룹 전시로 수업 결과를 공유하세요. |

### 3) 미션

**제목**: 우리의 미션

**본문**
> 예술은 나이, 경력, 장르에 관계없이 누구나 창작하고 공유할 수 있어야 합니다.
>
> Artier는 디지털 시대에 작가와 감상자를 연결하는 다리가 되어, 모든 작품이 세상과 만날 기회를 만들어 갑니다.

### 4) 하단 CTA

**제목**: 지금 시작하세요

**리드**: 가입은 무료이며, 첫 작품 업로드까지 1분이면 돼요.

**CTA 버튼**: 첫 작품 올리기 → 경로 /upload

---

## English copy

### 1) Hero

**Title**
> An online gallery
> for every artist

**Lead**
> Artier is a digital gallery where artists of every generation and genre can exhibit, discover, and connect freely.

**CTA buttons (2)**
- Browse the gallery → `/`
- Upload work → `/upload`

### 2) Features ("What you can do on Artier")

| # | Title | Description |
|---|---|---|
| 1 | Show your work | Present your work in a beautiful online gallery and share it with the world. |
| 2 | Community | Connect with artists who share your passion and exchange inspiration. |
| 3 | Artier's Pick | Reach more viewers through weekly selections of outstanding work. |
| 4 | Group exhibitions | Share class outcomes with group shows for instructors and students. |

### 3) Mission

**Title**: Our mission

**Body**
> Art should be something anyone can create and share, regardless of age, experience, or genre.
>
> Artier bridges artists and audiences in the digital age so every work can meet the world.

### 4) Bottom CTA

**Title**: Start now

**Lead**: Sign-up is free, and you can upload your first work in about a minute.

**CTA button**: Upload your first work → `/upload`

---

## 문자열 출처

표시 문구는 [Copy_v1.md](./Copy_v1.md) About 영역과 동일 의미로 맞춘다. i18n 키 목록은 적지 않는다.

---

## 구현 체크

- [ ] 4구간(히어로·기능·미션·하단 CTA) 모두 반영
- [ ] CTA 링크 동작 확인 — 갤러리 둘러보기(홈)·작품 올리기·첫 작품 올리기
- [ ] 히어로 제목·미션 본문의 줄바꿈 정확 렌더
- [ ] 한국어·영어 양측 동일 카드 수·동일 미션 본문 길이 일치

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록 + 체크 위주에서 4구간(히어로·기능·미션·CTA) ko/en 전문 게재로 확장. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
