# 저작권 정책 (All Rights Reserved)

구분: 법적 정책
기능 모음: https://www.notion.so/3362df21a9a7814daff3fa32ed9d8303,https://www.notion.so/32b2df21a9a7815ab34bc51295dba478,https://www.notion.so/32b2df21a9a781bebd2df40cdebbf4d4,https://www.notion.so/32b2df21a9a7813fb24fd791cab256b3
최종 편집 일시: 2026년 3월 31일 오전 10:17
화면 모음: https://www.notion.so/3352df21a9a780f4b80ff1d74486179b, https://www.notion.so/3352df21a9a78124b0ebc155fe84354c, https://www.notion.so/3352df21a9a781c6b21cc496828051f7,https://www.notion.so/3352df21a9a78017bca6f284428ca7c2, https://www.notion.so/3352df21a9a780b7b77eda23ee11d4a4, https://www.notion.so/3352df21a9a781a2ba7fcbd716998c2f,https://www.notion.so/3352df21a9a78037af3ce1c436ceaa0c, https://www.notion.so/3352df21a9a780ecba27eaabb1c60bb2, https://www.notion.so/3352df21a9a781278708ccc1dcf1cfcc, https://www.notion.so/3352df21a9a781a2ba7fcbd716998c2f,https://www.notion.so/3352df21a9a78017bca6f284428ca7c2, https://www.notion.so/3352df21a9a780f4b80ff1d74486179b, https://www.notion.so/3352df21a9a781c6b21cc496828051f7,https://www.notion.so/3352df21a9a78017bca6f284428ca7c2, https://www.notion.so/3352df21a9a78031a613c65d5c207a62, https://www.notion.so/3352df21a9a78093b7d3ec394116a2b0, https://www.notion.so/3352df21a9a780a793d8f7c6aecc9a04, https://www.notion.so/3352df21a9a780b7b77eda23ee11d4a4, https://www.notion.so/3352df21a9a780e089c2fb5273e5b33f, https://www.notion.so/3352df21a9a780f696c4f95e95431fd6, https://www.notion.so/3352df21a9a781a2ba7fcbd716998c2f,https://www.notion.so/3352df21a9a78124b0ebc155fe84354c, https://www.notion.so/3352df21a9a7818cb48ed032ab1e84d8, https://www.notion.so/3352df21a9a781c6b21cc496828051f7, https://www.notion.so/3352df21a9a781d0881ac77188ffe8cf
📋 유저스토리 기반 WBS v2: 나는 내 작품이 공유될 때 직접 저장되지 않도록 보호받고 싶다 (https://www.notion.so/3352df21a9a78134b41de3e063350a0b?pvs=21), 나는 카메라로 찍은 사진은 업로드되지 않길 원한다 (저작권 보호) (https://www.notion.so/3352df21a9a7813e8b51ff885f4ec1b8?pvs=21), 나는 특정 작품을 일시적으로 비공개로 바꿀 수 있어야 한다 (https://www.notion.so/3352df21a9a781a1b09ddaeae4bacb00?pvs=21), 작품은 보호받아야 한다 — 보안 요건을 충족해야 한다 (https://www.notion.so/3352df21a9a781b59360e9f3d7f076fc?pvs=21), 나는 내 그림을 올리면 자동으로 예쁜 전시 화면이 만들어지길 원한다 (https://www.notion.so/3352df21a9a781eaa017e1ac7725f75e?pvs=21), 나는 작품 카드를 클릭하면 전시 상세를 모달 또는 페이지로 감상할 수 있어야 한다 (https://www.notion.so/3352df21a9a781f5941cc7695519c2c2?pvs=21)

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