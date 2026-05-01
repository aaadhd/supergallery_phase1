# 푸터 원고 v2 (개발·법무 전달용)

전 화면 하단에 노출되는 글로벌 푸터의 메뉴·사업자 정보·법정 고지 전문.

> **단일 소스 안내**
> - 카피 단일 소스: [`Copy_v1.md`](Copy_v1.md) 푸터 카피 영역 키
> - 본 문서는 동일 내용을 prose 형태로 정리한 **핸드오프 보조본**이다.
> - 카피 변경은 [`Copy_v1.md`](Copy_v1.md)와 본 문서를 같은 작업 범위에서 동시 갱신한다.
> - **사업자 정보 값은 placeholder다**. 회사 확정 시 [`Handoff_LegalReview_Checklist_v1.md`](Handoff_LegalReview_Checklist_v1.md) §2와 함께 일괄 갱신.

---

## 푸터 화면 구성

```
─────────────────────────────────────────────────
[메뉴 행]   소개 · 공지사항 · FAQ · 문의 · 이용약관 · 개인정보처리방침 · 쿠키 설정
[사업자 정보 토글]   ▼ 사업자 정보 (펼치면 표 노출)
[법정 고지]   본 사이트에 게시된 이메일 주소가 …
─────────────────────────────────────────────────
```

---

## 1) 메뉴 (한국어 / English)

| 한국어 | English | 링크 |
|---|---|---|
| 소개 | About | 경로 /about (USR-INF-01) |
| 공지사항 | Notices | 경로 /notices (USR-INF-04) |
| FAQ | FAQ | 경로 /faq (USR-INF-02) |
| 문의 | Contact | 경로 /contact (USR-INF-07) |
| 이용약관 | Terms | 경로 /terms (USR-INF-05) |
| 개인정보처리방침 | Privacy | 경로 /privacy (USR-INF-06) |
| 쿠키 설정 | Cookie settings | 쿠키 동의 모달 재진입 (CM-05) |

**사업자 정보 토글**:
- 한국어: 사업자 정보 / 사업자 정보 열기 / 사업자 정보 닫기
- English: Business info / Open business info / Close business info

---

## 2) 사업자 정보 (placeholder — 회사 확정 후 채움)

> ⚠️ 아래 모든 값 컬럼 항목은 **placeholder**다. 회사 확정 후 본 문서와 [`Copy_v1.md`](Copy_v1.md)를 양측 동시 갱신. 변호사 검토 단계에선 [`Handoff_LegalReview_Checklist_v1.md`](Handoff_LegalReview_Checklist_v1.md) §2의 11종 정보로 일괄 채움.

### 한국어 표

| 항목 | 값 |
|---|---|
| 상호 | 주식회사 프라우드 |
| 대표 | 홍길동 |
| 사업자등록번호 | 000-00-00000 |
| 통신판매업 신고 | 제2026-서울강남-00000호 |
| 개인정보보호책임자 | 카테 |
| 주소 | 서울특별시 강남구 테헤란로 000, 0층 |
| 이메일 | contact@artier.kr |
| 전화 | 02-0000-0000 |
| 관할 법원 | 서울중앙지방법원 |

### English version

| Field | Value |
|---|---|
| Company | Proud Co., Ltd. |
| Representative | Hong Gil-dong |
| Business registration No. | 000-00-00000 |
| Mail-order business report | No. 2026-Seoul Gangnam-00000 |
| Privacy officer | Jo Ga-young |
| Address | 000 Teheran-ro, Gangnam-gu, Seoul (Floor 0) |
| Email | contact@artier.kr |
| Phone | +82-2-0000-0000 |
| Jurisdiction | Seoul Central District Court |

---

## 3) 법정 고지 (이메일 무단 수집 거부 안내)

전자우편 수집 프로그램에 의한 자동 수집을 거부한다는 정보통신망법상 표기. 푸터 하단에 항상 노출.

**한국어** (푸터 카피 키)
> 본 사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부합니다. (정보통신망법)

**English** (푸터 카피 키)
> We prohibit the unauthorized collection of email addresses posted on this site using harvesting software or other automated or technical means. (Act on Promotion of Information and Communications Network Utilization and Information Protection, etc.)

---

## 4) 적용 키 일람 (코드 동기화 매핑)

### 4.1 메뉴
- 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키
- 토글 라벨: 푸터 카피 키, 푸터 카피 키

### 4.2 사업자 정보 라벨
- 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키

### 4.3 사업자 정보 값 (placeholder)
- 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키, 푸터 카피 키

### 4.4 법정 고지
- 푸터 카피 키

### 4.5 QA·데모 진입점 (Phase 1 데모 환경 전용 — 사용자 노출 카피 아님)
- QA 푸터 카피 일군 — 검수·플로우 데모용 바로가기. 운영 상수 활성 시에만 노출. 본 문서 본문엔 미게재(사용자 운영 카피 아님).

---

## 5) 구현 체크

- [ ] 푸터 메뉴 7개 노출 (한·영 동일)
- [ ] 사업자 정보 토글 펼침/접힘 동작 + 라벨·값 한·영 분기
- [ ] 법정 고지 ko/en 양측 노출
- [ ] 쿠키 설정 클릭 시 CM-05 배너 재진입
- [ ] 사업자 정보 11종 placeholder는 회사 확정 후 일괄 갱신([Handoff_LegalReview_Checklist_v1.md](Handoff_LegalReview_Checklist_v1.md) §2 정합)
- [ ] 데모 QA 진입점은 프로덕션에서 노출되지 않아야 함

---

## 6) 법무 검토 연결

- 사업자 정보 11종 — [Handoff_LegalReview_Checklist_v1.md §2](Handoff_LegalReview_Checklist_v1.md) "회사가 확정해야 하는 정보" 표와 1:1 매핑
- 법정 고지 — 정보통신망법 §50의2(이메일 무단 수집 금지) 근거. 변호사 검토 시 표현 적정성 확인 권장
- DPO(개인정보보호책임자) 표기 — [Handoff_Privacy_v1.md §10](Handoff_Privacy_v1.md)과 정합

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 키 목록·체크 위주에서 메뉴·사업자 정보(ko/en 양 표)·법정 고지 ko/en 전문 게재로 확장. placeholder 11종 회사 확정 시점 명시 + 법무 체크리스트 §2와 1:1 매핑. QA·데모 진입점은 사용자 운영 카피가 아니므로 부록 표기만. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 링크 경로 + 구현 체크. 본문은 `Copy_v1.md` 단일 소스 위임. |
