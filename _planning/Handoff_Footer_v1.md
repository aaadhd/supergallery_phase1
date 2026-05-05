# 푸터 원고 (글로벌 푸터)

**작성**: 기획 · **독자**: 개발(구현·QA)

전 화면 하단 글로벌 푸터의 메뉴·사업자 정보·법정 고지다. **문구 의미·노출 항목**만 고정한다. 반응형·토글 애니메이션 등은 구현 판단에 따른다.

> **단일 소스**
> - 화면 문자열(i18n)은 [Copy_v1.md](./Copy_v1.md) 푸터 영역이 단일 소스다.
> - 본 문서와 Copy를 같은 의미로 유지하고, 수정 시 Copy를 먼저 갱신한다.
> - **사업자 정보 값은 placeholder**다. 회사 확정 시 [Handoff_LegalReview_Checklist §2](./Handoff_LegalReview_Checklist_v1.md#2-사업자-정보-11종)와 함께 일괄 갱신.

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

> ⚠️ 아래 값 컬럼은 **placeholder**다. 회사 확정 후 본 문서와 [Copy_v1.md](./Copy_v1.md)를 동시 갱신. 변호사 검토 단계에는 [Handoff_LegalReview_Checklist §2](./Handoff_LegalReview_Checklist_v1.md#2-사업자-정보-11종)의 11종 정보로 일괄 채움.

### 한국어 표

| 항목 | 값 |
|---|---|
| 상호 | 주식회사 프라우드 |
| 대표 | 홍길동 |
| 사업자등록번호 | 000-00-00000 |
| 통신판매업 신고 | 제2026-서울강남-00000호 |
| 개인정보보호책임자 | 조가영 |
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

**한국어**
> 본 사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부합니다. (정보통신망법)

**English**
> We prohibit the unauthorized collection of email addresses posted on this site using harvesting software or other automated or technical means. (Act on Promotion of Information and Communications Network Utilization and Information Protection, etc.)

---

## 4) 문자열 출처·비범위

- 메뉴 라벨·토글·사업자 라벨·법정 고지 문구는 모두 [Copy_v1.md](./Copy_v1.md) 푸터 영역과 동일 의미로 맞춘다.
- **QA·데모 전용 푸터 바로가기**(Phase 1 데모): 사용자 운영 카피가 아니다. 운영 상수 활성 시에만 노출 — 본 문서 본문에 prose 없음.

---

## 5) 구현 체크

- [ ] 푸터 메뉴 7개 노출 (한·영 동일)
- [ ] 사업자 정보 토글 펼침/접힘 + 라벨·값 한·영 분기
- [ ] 법정 고지 ko/en 양측 노출
- [ ] 쿠키 설정 클릭 시 CM-05 배너 재진입
- [ ] 사업자 정보 11종 placeholder는 회사 확정 후 일괄 갱신([Handoff_LegalReview_Checklist §2](./Handoff_LegalReview_Checklist_v1.md#2-사업자-정보-11종) 정합)
- [ ] 데모 QA 진입점은 프로덕션에서 비노출

---

## 6) 법무 검토 연결

- 사업자 정보 11종 — [Handoff_LegalReview_Checklist §2](./Handoff_LegalReview_Checklist_v1.md#2-사업자-정보-11종) "회사가 확정해야 하는 정보" 표와 1:1 매핑
- 법정 고지 — 정보통신망법 §50의2 근거
- DPO 표기 — [Handoff_Privacy §10](./Handoff_Privacy_v1.md#10-개인정보-보호책임자-dpo)과 정합

---

## 문서 이력

| 버전 | 일자 | 작성 | 변경 내용 |
|------|------|------|----------|
| v2 | 2026-05-01 | PM × Claude | 본문 보강 — 메뉴·사업자 정보(ko/en 양 표)·법정 고지 ko/en 전문 게재로 확장. placeholder 11종 회사 확정 시점 명시 + 법무 체크리스트 §2와 1:1 매핑. **DPO ko/en SSoT 정합** — 한국어와 영문이 서로 다른 인물을 가리키던 결함 → 동일 인물(조가영)로 정정. |
| v1 | 2026-04-26 | PM | 최초 작성 — 적용 키 목록 + 링크 경로 + 구현 체크. 본문은 Copy 단일 소스 위임. |
<!-- 인용 정의 -->
[Copy_v1.md]: Copy_v1.md
[Handoff_LegalReview_Checklist §2]: Handoff_LegalReview_Checklist_v1.md#2-사업자-정보-11종
[Handoff_Privacy §10]: Handoff_Privacy_v1.md#10-개인정보-보호책임자-dpo
