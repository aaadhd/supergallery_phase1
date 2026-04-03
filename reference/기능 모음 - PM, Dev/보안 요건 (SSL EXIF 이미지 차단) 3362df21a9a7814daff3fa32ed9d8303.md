# 보안 요건 (SSL/EXIF/이미지 차단)

정책 모음: https://www.notion.so/3342df21a9a781cdb58fcff50720b990
최종 편집 일시: 2026년 4월 2일 오전 11:06
화면 모음: https://www.notion.so/3352df21a9a780f4b80ff1d74486179b, https://www.notion.so/3352df21a9a78124b0ebc155fe84354c, https://www.notion.so/3352df21a9a781c6b21cc496828051f7,https://www.notion.so/3352df21a9a78017bca6f284428ca7c2, https://www.notion.so/3352df21a9a780f4b80ff1d74486179b, https://www.notion.so/3352df21a9a781c6b21cc496828051f7
📋 유저스토리 기반 WBS v2: 나는 내 작품이 공유될 때 직접 저장되지 않도록 보호받고 싶다 (https://www.notion.so/3352df21a9a78134b41de3e063350a0b?pvs=21), 작품은 보호받아야 한다 — 보안 요건을 충족해야 한다 (https://www.notion.so/3352df21a9a781b59360e9f3d7f076fc?pvs=21)

## 개요

저작권 보호 및 개인정보 보호를 위해 서비스 전반에 적용해야 하는 보안 요건 정의. 전 Sprint에 걸쳐 개발 시 반드시 준수.

## 보안 요건 목록

| 항목 | 내용 | HTTPS / SSL | 전 페이지 SSL 인증서 적용 필수 |
| --- | --- | --- | --- |
| EXIF 제거 | 업로드 이미지의 EXIF 메타데이터 완전 제거 (개인정보 노출 방지) | 카메라 촬영 파일 차단 | EXIF Make/Model 필드 감지 시 업로드 차단 + 안내 메시지 |
| 이미지 직접 저장 차단 | 우클릭 컨텍스트 메뉴 차단, 드래그 저장 방지 | 스크린샷 차단 | 기술적 차단 불가 — 화면에 "All Rights Reserved" 문구 표시로 대응 |
| 비밀번호 정책 | 최소 8자, 영문 + 숫자 조합 필수 | 403 처리 | 권한 없는 페이지 접근 시 로그인 화면 리다이렉트 |

## 관련 EPIC

O: 시스템/비기능, B: 작품업로드/전시생성, E: 작업물상세/상호작용

## 개발 스펙

- EXIF 제거 및 카메라 파일 차단: TECH-B01 (이미지 업로드 파이프라인) 내 구현
- 이미지 저장 차단: CSS pointer-events + JS 이벤트 핸들러로 처리
- 원본 파일 서버 저장 안 함 (WEBP 변환본만 S3 보관)

## 미결 사항

- [x]  스크린샷 차단 방향 → **기술적 차단 불가, All Rights Reserved 문구 표시로 대응** ✅
- [x]  저작권 표시 방식 → **화면 내 All Rights Reserved 고정 노출** ✅