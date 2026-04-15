# Artier (SuperGallery Phase 1) — 로컬 프로토타입

시니어/중장년 순수미술 작가를 위한 웹 기반 디지털 갤러리 플랫폼.
Figma 기반 번들에서 Phase 1 PRD에 맞춰 확장한 웹 앱입니다. 백엔드 없이 **localStorage**로 동작합니다.

## 기술 스택

- **프레임워크**: React + TypeScript (Vite)
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태관리**: workStore, draftStore (localStorage 영속화)
- **다국어**: 한국어/영어 (`useI18n()`)
- **배포**: Netlify (`npm run build`)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시되는 주소(기본 `http://localhost:5173`)로 접속합니다.

프로덕션 빌드 미리보기:

```bash
npm run build
npm run preview
```

## 주요 문서

| 문서 | 내용 |
|---|---|
| `CLAUDE.md` | 코딩 규칙·파일 인덱스·정책 요약 |
| `IMPLEMENTATION_DELTA.md` | 명세 대비 구현 델타 보고서 |
| `REFERENCE_DELTA.md` | reference 폴더 217개 파일 대조표 |
| `docs/product-policies.md` | 개발자 인수인계 (변경·목업·수치) |
| `docs/upload_spec.md` | 작품 올리기 전체 스펙 |
| `docs/SuperGallery_Phase 1 PRD_v 1.4.md` | 통합 PRD |

## 환경 변수

| 변수 | 동작 |
|---|---|
| `VITE_UPLOAD_AUTO_APPROVE=true` | 업로드 즉시 승인 (데모용) |
| `VITE_ADMIN_OPEN=true` | 어드민 게이트 우회 |
| `VITE_FOOTER_QA_LINKS=true` | QA 바로가기 표시 |

## 스토리지 버전

현재: `local-gallery-v11` — 값 변경 시 works 데이터 자동 재시드.