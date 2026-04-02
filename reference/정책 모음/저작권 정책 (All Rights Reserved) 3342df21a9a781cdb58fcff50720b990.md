# 저작권 정책 (All Rights Reserved)

관련 화면: 작품 업로드, 작업물 상세 모달, 서비스 소개, FAQ
구분: 법적 정책

> Phase 1 활성화된 저작권 정책. PRD v1.2 기준.
> 

> 사용자가 업로드하는 모든 작품에 자동 적용됨.
> 

---

## 확정 정책

| 항목 | 내용 |
| --- | --- |
| Phase 1 기본 저작권 | **All Rights Reserved** 단일 정책 |
| CCL 선택 UI | **Phase 2**에서 도입. Phase 1에서는 UI 없음 |
| 저작권 귀속 | 업로드한 본인에게 자동 귀속 |
| 이미지 직접 저장 차단 | 적용 (스크린샷·화면 캡처는 기술적 차단 불가 명시) |

## 플랫폼의 저작물 사용권

Artier는 서비스 운영 및 홍보 목적에 한해 제한적 사용권만 보유함. 이용약관 동의로 확보됨.

**허용 범위**

- Artier's Pick 선정 및 피드 노출
- 공식 SNS 소개
- 보도자료 · 투자자 자료
- OG 이미지 · 썸네일 자동 생성
- 이메일 알림 썸네일 삽입
- URL 공유 시 링크 미리보기 노출
- 검색엔진 크롤링

**금지 범위**

- 수정 · 재판매 불가
- 원작자 동의 없는 상업적 사용

## Phase 2 로드맵

| 단계 | 내용 |
| --- | --- |
| Phase 2 | CCL(Creative Commons License) 선택 UI 도입 |
| Phase 2 | 작가가 작품별로 CC BY / CC BY-NC / CC BY-ND 등 직접 설정 가능 |

## 개발 스펙

| 항목 | 내용 |
| --- | --- |
| User.copyright_default | Phase 1 고정값: `all_rights_reserved` (Phase 2에서 CCL 선택 활성화) |
| Exhibition.copyright | Phase 1 고정값: `all_rights_reserved` |
| 이미지 직접 저장 차단 | 우클릭 메뉴에서 다운로드 버튼 미제공 |

## 미결 사항

- [x]  Phase 1 저작권 정책 → **All Rights Reserved 단일** ✅ (PRD v1.2 확정)
- [x]  CCL 선택 UI Phase → **Phase 2** ✅
- [x]  이미지 직접 저장 차단 → **적용** ✅ (스크린샷은 기술적 차단 불가 명시)
- [x]  플랫폼 사용권 허용 범위 → **이용약관 동의로 확보** ✅