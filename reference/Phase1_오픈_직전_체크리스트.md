# Phase 1 오픈 직전 체크리스트

> 이 레포는 **Phase 1 제품 범위**로 오픈한다는 전제에서, 배포 전에 손볼 항목만 모았습니다. Phase 2 기능은 구현하지 않되, DB·도메인은 백엔드 설계 시 `work`·`notification`·`point_ledger` 등에 `payload`/`ref_type`/`ref_id`·`deleted_at` 여유를 두는 식으로 확장하면 됩니다.

---

## 1. 메인 사용자 플로우 (반드시 수동 클릭 테스트)

| 플로우 | 확인 |
|--------|------|
| 비로그인 → 둘러보기 → 작품 상세(모달) → 프로필 이동 | ☐ |
| 로그인(데모) → 좋아요/저장/팔로우 → 새로고침 후 상태 유지(로컬) | ☐ |
| 업로드 → 발행 → Browse/프로필에 노출, 그룹명·강사 업로드 규칙 | ☐ |
| 이벤트 목록 → 상세 → 참여(로그인 시 업로드로 이동) | ☐ |
| 알림 목록 → 유형 필터 → 설정 `#notifications` 연동 | ☐ |
| 설정 → 언어 전환(ko/en) → GNB/적용된 화면 문구 일치 | ☐ |
| 약관/개인정보/소개/푸터 링크 깨짐 없음 | ☐ |

---

## 2. 다국어(ko/en)

### 이미 `useI18n` 등으로 문자열 전환되는 곳 (우선 검수)

- `Header`, `Footer`, `Browse`, `Login`, `Settings`(일부), `About`, `Terms`(별도 `termsContent`), `Notifications`, `EventDetail`(일부), `Profile`(일부), `Upload`(일부)

### 페이지 단위로 **한국어 하드코딩이 남아 있을 가능성이 큰 파일**

오픈 전 **노출 빈도 높은 것부터** `messages.ts`(또는 페이지별 모듈)로 옮기면 됩니다.

- `Events.tsx`, `Search.tsx`, `Signup.tsx`, `Onboarding.tsx`
- `Privacy.tsx`, `Faq.tsx`, `Contact.tsx`, `Notices.tsx`, `NoticeDetail.tsx`
- `ExhibitionDetail.tsx`, `InvitationLanding.tsx`
- `PasswordReset.tsx`, `NotFound.tsx`, `ServerError.tsx`, `Maintenance.tsx`

### 공통 컴포넌트

- `WorkDetailModal`, `LoginPromptModal`, `CoachMark` 등 모달·토스트는 페이지보다 후순위로 스캔해도 됨 (첫 오픈이 글로벌이면 우선순위 상향).

---

## 3. 법무·정책 문구 (Phase 1)

| 항목 | 할 일 |
|------|--------|
| 이용약관·개인정보처리방침 | 시행일, 상호·대표·사업자번호, 주소 등 **Footer/문서와 실제 운영 주체 일치** 확인 |
| 약관 초안 문구 | `Terms` / `Privacy`에 “초안·런칭 전” 안내가 있다면 **법무 확정 후 삭제 또는 갱신** |
| 이메일·전화 | Footer `contact@…`, 대표번호 등 **실제 수신 가능 여부** |
| 업로드·저작권 | 카메라/EXIF 차단, 다운로드 미제공 안내가 **현재 제품 동작과 일치**하는지 |
| 데모 기능 | 로그인/소셜/알림이 데모인 경우, **랜딩·FAQ 등에 한 줄 고지** 검토 |

---

## 4. 오픈 시 제품 한계 (내부 공유용)

- 인증·알림·파일 저장·포인트 정산 등은 **서버 없이 로컬/시뮬**인 구간이 있음 → CS·운영 문서에 정리 권장.
- 포인트 UI 없음: 정책은 로그(ledger) 수준일 수 있음.

---

## 5. 기술·배포 (짧게)

- `npm run build` 통과, 프로덕션 `base`·라우터(history) 설정
- `robots.txt` / OG 메타(공유 시) 필요 여부
- 에러 페이지(`NotFound`, `ServerError`) 노출 경로 확인

---

## 6. 완료 기준 (Phase 1)

- 위 **섹션 1 메인 플로우** 전부 통과
- **법무 3항**(약관·개인정보·연락처) 실데이터 반영
- 글로벌 오픈이면 **섹션 2 상단 노출 페이지** 다국어 최소 1차 완료

이후 개선은 Phase 2 백로그로 분리합니다.
