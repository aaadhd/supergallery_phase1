# 작품 올리기 스펙 v1.8
> Upload.tsx 개편 기준 문서
> Notion 기획문서 + 코드 구현 현황 통합본
> v1.7 → v1.8 (2026-04-15): 코드·`IMPLEMENTATION_DELTA` 대조 — 전시명 길이, 비속어·이벤트 store, 색상 팔레트 모듈 제거(blur 트릭으로 대체), 자동승인 위치 정정
> v1.6 → v1.7: v1.2 워드 기획서(2026-04-12, Kate 작성) 흡수 — 콘텐츠 편집기 툴바, 파일 정책 상세, 비회원 알림 플로우, 미결 사항, EN 오류 메시지 추가
>
> **폐기 항목 (v1.2 → v1.7 병합 시 제외)**:
> - 프로필 강사 토글 / `instructorPublic.ts` (2026-04-13 단일화)
> - 카테고리·태그 (Phase 2)
> - 수강생 이메일 태그 섹션

### 구현 현황 (2026-04-15 갱신)

| 항목 | 상태 | 비고 |
|---|---|---|
| Step 0 유형 선택 | ✅ 완료 | solo/group 분기, openConfirm 경고 |
| Step 1 상단 고정 바 | ✅ 완료 | 전시명·그룹명 입력, 자동완성 |
| Step 1 이미지 업로드 | ✅ 완료 | 드래그드롭, WEBP변환, EXIF차단 |
| 단변 800px 최소 해상도 검증 | ✅ 완료 | `checkMinResolution()` 추가 |
| 우측 패널 — 혼자 올리기 | ✅ 완료 | 작품명만 노출, 작가명 제거 |
| 우측 패널 — 함께 올리기 | ✅ 완료 | 고정 오픈, 자동 첫 이미지 선택 |
| 작가 검색창 통합 (v1.7) | ✅ 완료 | 회원/비회원 탭 제거 → 검색창 하나로 통합 |
| 직접 입력 폼 | ✅ 완료 | 검색 결과 없을 때만 노출 |
| 이전/다음 패널 순회 (v1.7) | ✅ 완료 | ChevronLeft/Right 아이콘 버튼 |
| 작품명 자동생성 | ✅ 완료 | 혼자: 무제, 함께: [작가]의 작품 N |
| 그룹전시 자동 분류 | ✅ 완료 | uniqueArtists ≥ 2 → group |
| Step 2 세부 정보 모달 | ✅ 완료 | 강사 체크, 개인전시 탭, 원작 확인 |
| 강사 체크박스 단일화 | ✅ 완료 | 토글 스타일 bg-primary 적용 |
| 비속어 필터 | ✅ 완료 | 전시명·그룹명 발행 시 검증 |
| 변환 프로그레스 바 | ❌ 없음 | 별도 진행 바 UI 없음(업로드 처리는 기존 로직) |
| 재정렬 모드 그리드 뷰 | ✅ 완료 | 2~4열 그리드, 드래그 앤 드롭 |
| 자동 저장 (30초) | ✅ 완료 | BeforeUnload 경고 포함 |
| 콘텐츠 편집기 툴바 | ✅ 완료 | 패딩 토글, 이미지 변경, 재정렬, 삭제 |
| 이미지 그리드 블록 | ❌ Phase 2 | PD Figma 미결 (#8) |
| 배경색상 변경 UI | ❌ Phase 2 | 편집기 **전역** 배경 톤 슬라이더 없음. 작품 상세/업로드 배경의 "톤 묻어남"은 원본 이미지 `blur + scale + opacity` 트릭으로 대체 ([WorkDetailModal.tsx:407](src/app/components/WorkDetailModal.tsx#L407)). dominant-color 추출 모듈은 2026-04-15 삭제 |

---

## 현재 구조 vs 변경 목표

| 항목 | 현재 (변경 전) | 목표 (v1.7) |
|---|---|---|
| 업로드 유형 분기 | 강사 토글 (세부정보 모달 안) | 시작 시 혼자/함께 선택 화면 |
| 전시명/그룹명 입력 위치 | 세부정보 모달 (Step 2) | 상단 고정 바 (이미지 업로드 중) |
| 우측 패널 | 선택적 오픈 | 함께 올리기: 처음부터 고정 오픈 |
| 작가명 필드 | 항상 노출 (선택) | 혼자: 없음 / 함께: 필수 |
| 작품명 자동생성 | 없음 | 혼자: 무제 / 함께: [작가명]의 작품 N |
| 강사 표시 | 프로필 토글 + 업로드 토글 (이중 상태) | 업로드 체크박스 단일 진입점 → 자동 파생 |
| 카테고리·태그 | 세부정보 모달에 있음 | 제거 (Phase 2) |
| 원작 확인 체크박스 | 단일 문구 | 혼자/함께 문구 분리 |
| 확인 다이얼로그 | `window.confirm()` | `openConfirm()` (ConfirmDialog) |

---

## 핵심 설계 원칙

- 업로드 시작 시 유형(혼자/함께)을 먼저 선택해 불필요한 필드를 처음부터 숨긴다
- 혼자 올리기는 전시명 하나만 필수 — 최대한 단순하게
- 함께 올리기는 우측 고정 패널로 연속 입력 — 반복 동작 최소화
- 시니어 친화: 스프레드시트/다중선택/Tab 이동 방식 사용하지 않음

---

## Step 0 — 유형 선택 화면

Upload.tsx 진입 시 가장 먼저 표시. 이미지 업로드 전.

```
┌─────────────────────────────────┐
│  [ 🖼 혼자 올리기 ]              │
│  내 작품을 올려요                │
│  개인 작품 업로드                │
├─────────────────────────────────┤
│  [ 👥 함께 올리기 ]              │
│  여러 명의 작품을 함께 올려요    │
│  동호회·클래스·친구들과 함께     │
└─────────────────────────────────┘
```

| 항목 | 혼자 올리기 | 함께 올리기 |
|---|---|---|
| 아이콘 | 🖼 | 👥 |
| 메인 카피 | 내 작품을 올려요 | 여러 명의 작품을 함께 올려요 |
| 서브 카피 | 개인 작품 업로드 | 동호회·클래스·친구들과 함께 |
| 대상 | 개인 작가 | 강사, 동호회, 친구 그룹 등 |

### 정책

- state: `uploadType: 'solo' | 'group' | null` (초기값 null)
- 유형 미선택 시 이미지 업로드 불가
- 유형 변경 시 → 선택 화면으로 돌아가기 + contents 초기화
  - **contents 존재 시 `openConfirm()` 으로 손실 경고** (브라우저 confirm 금지)
- **"함께 올리기"는 강사 계정 전용이 아님** — 누구나 선택 가능
- 강사 체크는 세부정보 모달 안 단일 체크박스에서 결정 (아래 §Step 2 참조)

---

## Step 1 — 이미지 업로드 + 상단 고정 바

### 상단 고정 바 (기존 스텝 프로그레스 바 아래)

**혼자 올리기:**
```
[ 전시 제목을 입력하세요. * ]
```

**함께 올리기:**
```
[ 전시 제목을 입력하세요. * ]   [ 그룹명 * (그룹 전시일 때) ]
```

- 전시명: 필수 / **maxLength=20** (`Upload.tsx` 입력·발행 `slice(0, 20)`과 일치) / `autoComplete="off"` — **전시명 자동완성 드롭다운 없음**(그룹명만 과거 전시 기반 제안)
- 그룹명: 함께 올리기(그룹 전시)에서 **필수**. publishChecklist의 `groupName` 항목에 `done: !!groupName.trim()` 검증 (`Upload.tsx`). PRD §5.2 / 유저플로우 2 — 강사 업로드뿐 아니라 모든 그룹 전시에 적용.
- 그룹명 자동완성: `collectGroupNameSuggestions` — 전시명용 동일 패턴 없음 (IMPLEMENTATION_DELTA §8.7-1)
- 이미지 보면서 동시에 입력 가능
- **비속어 필터**: 발행 시 `containsProfanity(exhibitionName)`, `containsProfanity(groupName)` 검사 — 통과 못 하면 토스트 후 중단 (IMPLEMENTATION_DELTA §9.2). 비회원 작가 **직접 입력 이름**은 발행 핸들러에서 별도 비속어 검사 **미적용**(필요 시 후속)

### 이미지 업로드 캔버스

- 기존 로직 전부 유지
  - 드래그&드롭, 파일 선택, 최대 10장
  - 10MB 초과 차단
  - JPG·JPEG·PNG·WEBP·GIF 허용 (GIF → WEBP 자동변환)
  - **카메라 사진 차단** — `shouldBlockCameraPhoto()` 유지 (EXIF 분석)
  - WEBP 자동변환 유지

### 작품 톤 배경 "묻어나는" 효과 — blur 트릭

- 원본 이미지를 배경 레이어로 깔고 `blur-[120px] opacity-[0.95] scale-[1.3]` 적용 ([WorkDetailModal.tsx:407](src/app/components/WorkDetailModal.tsx#L407), [Upload.tsx:12,1140](src/app/pages/Upload.tsx#L12))
- 픽셀 기반 dominant-color 추출 없이 순수 CSS로 작품 톤이 주변에 번져 보이는 효과 달성
- dominant-color 추출 모듈(`colorPalette.ts`, `ColorPaletteSuggestion`)과 `docs/dominant-color-spec.md`는 **2026-04-15 삭제** (blur 트릭으로 대체)
- `Work.dominantColor` 필드는 레거시 — 저장은 되지만 현재 사용 경로 없음 (Phase 2에서 정리 또는 재활용 결정)

---

## Step 1 우측 패널 — 혼자 vs 함께 분기

### 혼자 올리기 우측 패널

- 이미지 클릭 시 선택적 오픈 (기존 방식 유지)
- 작품명 입력만 표시 (선택 / 미입력 → "무제")
- **작가명 섹션 완전 제거** (본인이므로 불필요)

### 함께 올리기 우측 패널 (고정 오픈)

- 이미지 업로드 완료 시 자동으로 첫 번째 이미지 선택 + 패널 오픈
- 패널 항상 열려 있음 (닫기 버튼 없음)
- 좌측 이미지 클릭 → 해당 이미지로 패널 전환

**패널 구성:**
```
┌──────────────────────────┐
│ [이미지 썸네일]           │
│ 3 / 10                   │  ← 장 진행 표시 (전시당 최대 10장)
├──────────────────────────┤
│ 작품명 (선택)             │
│ [                      ] │
│ 미입력 시 "[작가명]의 작품 N" 자동 생성 │
├──────────────────────────┤
│ 작가명 * (필수)           │
│ [작가명 또는 닉네임 검색 🔍] │
│  ↓ 결과 있으면 → 선택     │
│  ↓ 결과 없으면 → [직접 입력] 버튼 노출 │
│       → 이름 + 연락처 입력│
├──────────────────────────┤
│ [← 이전]        [다음 →] │
└──────────────────────────┘
```

**작가명 입력 UX — 검색창 먼저 방식:**
```
[작가명 또는 닉네임 검색        🔍]
 ↓ 검색 결과 있으면 → 선택 (회원)
 ↓ 검색 결과 없으면 → "직접 입력" 버튼 노출
      → 이름(필수) + 연락처(필수) 입력 (비회원)
```

- 회원/비회원 탭 제거 — 검색창 하나로 통일
- 본인도 검색 결과에 포함 (강사가 본인 작품 포함할 경우)
- 검색 결과 없을 때만 직접 입력 폼 노출
- 기존 `nonMemberArtist: { displayName, phoneNumber }` 구조 유지
- 연락처 미입력 시 발행 불가
- **비속어 필터**: 전시명·그룹명은 발행 시 검증됨. 비회원 직접 입력 **작가 표시명**은 Upload 발행 경로에서 별도 검사 없음 — 필요 시 `profanityFilter` 확장

**이전/다음 버튼:**
```javascript
const currentIndex = contents.findIndex(c => c.id === selectedContentId);
// 이전: currentIndex - 1 (0이면 비활성)
// 다음: currentIndex + 1 (마지막이면 비활성)
```

---

## Step 2 — 세부 정보 모달

### 제거할 항목

- (구) 강사 대리 업로드 토글 (`isInstructorUpload`) → 아래 강사 체크박스로 대체
- 수강생 이메일 태그 섹션 (`taggedEmails`, `emailInput`)
- 전시명 입력 → 상단 고정 바로 이동
- 그룹명 입력 → 상단 고정 바로 이동
- **카테고리 선택 → Phase 2 제거**
- **태그 입력 → Phase 2 제거**

### 유지할 항목

- 커버 이미지 (첫 번째 이미지 자동 적용 / 수동 변경 가능)
- 원작 확인 체크박스 (혼자/함께 문구 분리 — 아래 참조)
- 이벤트 연결 표시 (`linkedEventId` 있을 때)

### 강사 체크박스 (함께 올리기 전용)

함께 올리기 세부 정보 모달에만 노출. **시스템 전체에서 강사 여부를 결정하는 단일 진입점**.

```tsx
// 기본값 false (체크 OFF)
const [isInstructor, setIsInstructor] = useState(false);

// UI — 함께 올리기에서만 노출
{uploadType === 'group' && (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={isInstructor}
      onChange={(e) => setIsInstructor(e.target.checked)}
    />
    <div>
      <span>저는 강사예요</span>
      <p>체크 시 내 프로필에 수강생 작품 탭이 자동으로 생성돼요.</p>
    </div>
  </label>
)}
```

- 기본값 `false` (체크 OFF)
- 함께 올리기에서만 노출 (혼자 올리기에서는 노출 안 함)
- 발행 시 Work 객체에 `isInstructorUpload: true`로 저장
- **프로필 강사 토글 / `instructorPublic.ts` 트리거 호출 모두 제거됨** (2026-04-13)

### 강사 표시 자동 파생 (2026-04-13 단일화)

> IMPLEMENTATION_DELTA §3.3 / §10.4 참조

이전에는 다음 3개 상태가 모두 sync되어야 했음:
- ❌ 프로필 영구 토글 (`UserProfile.isInstructor`)
- ❌ `instructorPublic` Set (별도 저장소)
- ✅ 업로드 1회성 토글

**v1.5부터**: 업로드 체크박스 하나로 통합. 프로필 토글·`instructorPublic.ts` 모두 삭제.

```typescript
// Profile.tsx — 매번 작품 목록에서 파생
const instructorVisible = works.some(
  w => w.artistId === currentUserId && w.isInstructorUpload === true
);
```

**효과:**
- 한 작품이라도 `isInstructorUpload === true`로 발행 → 프로필에 "수강생 작품" 탭 자동 노출
- 모든 해당 작품 삭제 → 자동 비노출
- 상태 불일치 원천 차단 (단일 소스 = 작품 목록)
- 명세 "프로필에서 강사 토글 ON한 창작자" 문구는 "첫 대리 업로드 시 자동 활성화"로 해석

**금지 사항:**
- `UserProfile.isInstructor` 필드 부활 (store.ts에서 삭제됨)
- 프로필 편집 모달에 강사 토글 추가
- `instructorPublic.ts` 재생성 (파일 자체가 삭제됨)
- i18n 키 `profile.instructorToggle`, `profile.instructorHelp` 부활
- localStorage 키 `artier_instructor_public_ids` 재기록 — **deprecated**
  (이전 사용자 브라우저에 잔류 가능 → bootstrap에서 제거 권장. IMPLEMENTATION_DELTA §11.1 참조)

### 둘러보기 개인전시 탭 노출 (함께 올리기 전용)

함께 올리기 발행 화면에만 노출. 전시 단위로 적용.

```tsx
// 기본값 true (체크 ON)
const [showInSoloTab, setShowInSoloTab] = useState(true);

// UI — 함께 올리기에서만 노출
{uploadType === 'group' && (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={showInSoloTab}
      onChange={(e) => setShowInSoloTab(e.target.checked)}
    />
    <div>
      <span>둘러보기 개인전시 탭에도 노출하기</span>
      <p>각 작가의 작품이 개인전시 탭에도 표시돼요.</p>
    </div>
  </label>
)}
```

- 기본값 `true` (체크 ON)
- 전시 단위 적용 (장별 개별 설정 없음)
- 발행 시 `showInSoloTab` 값을 Work 객체에 저장

### 원작 확인 체크박스 (필수)

```javascript
// uploadType에 따라 문구 분기
혼자 올리기: "본인이 직접 창작한 원작임을 확인합니다"
함께 올리기: "업로드하는 작품들에 대한 작가의 동의를 받았습니다"
```

- 미체크 시 발행 버튼 비활성
- 기존 `isOriginalWork` state 유지
- 기존 `confirmLabel` 로직을 `uploadType` 기반으로 변경

### 커버 이미지

- 첫 번째 이미지 자동 적용
- 모달에서 수동 변경 가능
- 기존 로직 유지

### 이벤트 연결

- `linkedEventId`, `linkedEventTitle` 기존 로직 전부 유지
- 이벤트 업로드 시 자동 연결 상태 표시
- 쿼리 파라미터 진입(`/upload?event=:id&eventTitle=…`) 정상 동작 ✅
- **이벤트 메타**: `eventStore.ts` 단일 소스 + `artier_managed_events_v1` 영속화. 사용자 화면·어드민이 동일 store 구독 (IMPLEMENTATION_DELTA §8.5·§9.7). `linkedEventId`로 제목 등 표시 시 store 조회 패턴 사용.

---

## 콘텐츠 편집기 — 이미지 블록 툴바

> v1.2 §5에서 흡수. notefolio 실측 기반.

### 단일 이미지 블록 툴바

**업로드 전:**

| 아이콘 | 툴팁명 | 동작 |
|---|---|---|
| ↕ | 콘텐츠 재정렬 | 블록 순서 변경 |
| 🗑 | 콘텐츠 삭제 | 블록 삭제 |

**업로드 후:**

| 아이콘 | 툴팁명 | 동작 | 비고 |
|---|---|---|---|
| →← | 패딩 제거 | 토글. 기본 좌우 73px → 0px 전폭 확장 | 1100px↑ 조건부 활성 |
| 🖼 | 이미지 변경 | 새 이미지로 교체. 파일 선택창 오픈 | |
| ↕ | 콘텐츠 재정렬 | 블록 순서 변경 | |
| 🗑 | 콘텐츠 삭제 | 블록 삭제 | |

> ※ 패딩 제거 오류 메시지: "가로 폭 1100px 이상의 콘텐츠만 사용 가능한 기능입니다" (notefolio 실측)
> ※ Artier 임계값(px)은 PD/Dev 협의 필요 — 미결 #7

### 이미지 그리드 블록 툴바

**업로드 전:**

| 아이콘 | 툴팁명 | 동작 |
|---|---|---|
| ↕ | 콘텐츠 재정렬 | 블록 순서 변경 |
| 🗑 | 콘텐츠 삭제 | 그리드 블록 전체 삭제 |

**업로드 후:**

| 아이콘 | 툴팁명 | 동작 | 비고 |
|---|---|---|---|
| ↔ | 패딩 추가/제거 | 토글. 기본 패딩 없음(전폭) ↔ 패딩 있음 | 단일 블록과 반대 |
| 🖼 | 그리드 편집 | "이미지 그리드 편집" 모달 오픈 | |
| ↕ | 콘텐츠 재정렬 | 블록 순서 변경 | |
| 🗑 | 콘텐츠 삭제 | 그리드 블록 전체 삭제 | |

### 이미지 그리드 편집 모달

| 항목 | 내용 |
|---|---|
| 모달 제목 | 이미지 그리드 편집 |
| 각 셀 | 우상단 ✕ 버튼 → 셀 개별 삭제 가능 |
| 이미지 추가 | 우상단 "+ 이미지 파일 추가" 버튼 |
| 하단 버튼 | 취소 / 완료 |
| 레이아웃 | 이미지 수에 따라 자동 배치 — PD Figma 결정 (미결 #8) |

### 전역 설정

| 설정 | Phase 1 | 기본값 | 실측값 |
|---|---|---|---|
| 배경색상 | ❌ 전역 톤 슬라이더 없음 | #FFFFFF | #FFFFFF — "톤 묻어남" 효과는 blur 트릭으로 해결 (별도 dominant-color 모듈 없음) |
| 콘텐츠 간격 | ❌ 10px 고정 | 10px | 0~100px / 기본 10px (실측) |
| 콘텐츠 재정렬 | ✅ | — | 블록 순서 드래그 |

---

## 파일 업로드 정책

> v1.2 §6에서 흡수. 기존 v1.6 기본 제한을 상세화.

| 대상 | 허용 포맷 | 최대 용량 | 최대 수량 | 최소 해상도 | 비고 |
|---|---|---|---|---|---|
| 이미지 블록 (단일) | JPG·JPEG·PNG·WEBP·GIF | 10MB/장 | 전시당 10장 합산 | 단변 800px↑ | GIF→WEBP 자동변환 |
| 이미지 그리드 | JPG·JPEG·PNG·WEBP·GIF | 10MB/장 | 그리드당 10장 (합산 이내) | 단변 800px↑ | GIF→WEBP 자동변환 |
| 커버 이미지 | JPG·JPEG·PNG·WEBP | 5MB | 1장 | 760×760px 권장 | GIF 불가 |

> ※ 단변 800px 미만 업로드 차단. 갤러리 품질 보호 목적.
> ※ 전시당 10장 합산 — 추후 데이터 기반 조정 예정.
> ※ 카메라 사진 차단 (`shouldBlockCameraPhoto()` EXIF 분석) 유지.

---

## 발행 검증 로직

### 혼자 올리기

```javascript
if (imageContents.length === 0) → 발행 불가
if (!isOriginalWork) → 발행 불가
if (!exhibitionName.trim()) → 발행 불가
// 작가명 검증 없음
```

### 함께 올리기

```javascript
if (imageContents.length === 0) → 발행 불가
if (!isOriginalWork) → 발행 불가
if (!exhibitionName.trim()) → 발행 불가

// 전 장 작가명 검증
const missingArtist = imageContents.some(c =>
  !c.artist &&
  (!c.nonMemberArtist?.displayName || !c.nonMemberArtist?.phoneNumber)
);
if (missingArtist) → toast("모든 작품에 작가를 입력해주세요.")
```

### 자동 승인 모드 (개발 편의)

**운영 원칙**: 발행 직후 `feedReviewStatus: 'pending'`으로 두고 운영팀 검수(명세상 24시간 내 등)를 거친 뒤 피드 반영이 맞다. **업로드 즉시 승인은 제품 정책의 기본값이 아니다.**

**현재 코드베이스(Phase 1 클라 데모·목업)**: 실 검수 큐·백엔드 없이 PM 시연·로컬 개발 속도를 위해, 환경 변수로만 검수 단계를 건너뛸 수 있게 해 둔 것이다. 프로덕션에서는 이 플래그를 켜지 않는 것이 전제다.

환경 변수 `VITE_UPLOAD_AUTO_APPROVE=true` 설정 시:
- 발행 즉시 `feedReviewStatus: 'approved'`로 저장 (운영팀 검수 대기 우회)
- 위치: `Upload.tsx` 발행 핸들러 — `newWork`의 `feedReviewStatus` **510행**, 발행 후 토스트 분기(자동승인 여부 메시지) **553~555행**
- **프로덕션 배포 시 반드시 OFF**
- 데모/PM 시연 환경에서만 사용
- IMPLEMENTATION_DELTA §3.5 참조

---

## 작품명 자동생성 로직 (발행 시)

```javascript
const imagePieceTitles = imageContents.map((c, i) => {
  if (c.title?.trim()) return c.title.trim();

  if (uploadType === 'group') {
    // 함께 올리기: [작가명]의 작품 N
    const artistName =
      c.artist?.name ||
      c.nonMemberArtist?.displayName ||
      '';
    return artistName ? `${artistName}의 작품 ${i + 1}` : `작품 ${i + 1}`;
  }

  // 혼자 올리기
  if (imageContents.length === 1) {
    // 1장이면 전시명 자동 적용 (기존 Notion 규칙 유지)
    return exhibitionName.trim() || '무제';
  }
  return '무제';
});
```

---

## 그룹전시 자동 분류 (발행 시)

```javascript
const uniqueArtists = new Set(
  imageContents.map(c =>
    c.artist?.id || c.nonMemberArtist?.displayName || 'self'
  )
);
const primaryExhibitionType = uniqueArtists.size >= 2 ? 'group' : 'solo';
```

> ※ 강사가 학생 작품만 올려도 (본인 제외) 그룹전시로 분류됨.

---

## 비회원 작가 처리

> v1.2 §4.5에서 흡수.

| 단계 | 내용 |
|---|---|
| 입력 | 이름(필수) + 연락처(필수) |
| 발행 시 | 카카오 알림톡 우선 / SMS 보조 발송 |
| 알림 내용 | "내 작품이 Artier에 게시됐어요. 확인해볼래요?" |
| 가입 후 | 연락처 기반으로 작품 자동 연결 |
| 미가입 시 | 이름 텍스트만 표시, 팔로우 버튼 없음 |

- 데이터 구조: 기존 `nonMemberArtist: { displayName, phoneNumber }` 유지
- 동일 연락처 중복 입력 처리 — **미결 #5**
- 알림 발송 실패 재발송 정책 — **미결 #6**

---

## 발행 후 처리

### Work 객체 저장 필드 (강사 관련)

```typescript
const newWork: Work = {
  ...
  isInstructorUpload: uploadType === 'group' ? isInstructor : false,
  showInSoloTab: uploadType === 'group' ? showInSoloTab : true,
};
```

- `isInstructorUpload`: **Work 객체에 직접 저장**되는 영구 필드. 프로필의 강사 표시 파생 계산의 단일 소스.
- 저장 후 `Profile.tsx`가 매번 `works`를 스캔하여 `instructorVisible` 자동 계산.
- **별도 후처리 함수 호출 없음** (`instructorPublic.ts` 삭제됨).
- `Work.dominantColor` 필드는 레거시 — 저장은 타입상 허용되지만 현재 Upload는 설정하지 않고, 사용 경로도 없음 (blur 트릭으로 대체되어 불필요)

### 포인트 적립

- 업로드 완료 시 AP +20 자동 적립 (`pointsBackground.ts`)
- **포인트 회수 정책**: 업로드 후 24시간 이내 삭제 시 AP -20 회수
  (`pointsRecallIfQuickDelete` — 어뷰징 방지)

### 임시저장

- 임시저장 후 복귀 시 임시저장 직전 상태 그대로 복원
- 전시명 없을 때 임시저장 활성 여부 — **미결 #4**

### 발행 직후 공유 시 주의 (현재 이슈)

> IMPLEMENTATION_DELTA §11.4 참조

- 발행 직후 작품 상태는 `pending` (자동 승인 모드 OFF인 경우)
- 사용자가 곧바로 공유 URL(`/exhibitions/:id?from=invite`)을 보내면 수신자가 본 화면은 `ExhibitionInviteLanding`
- `ExhibitionInviteLanding`의 `collectExhibitionWorks`는 `isWorkVisibleOnPublicFeed` 필터를 적용하므로 **`pending`/`rejected` 작품은 그리드에서 제외됨**
- 결과: seed 작품이 검수 미통과 상태면 → **빈 전시처럼 보임** ("올린 작품을 친구한테 공유했는데 아무것도 안 보여요")

**권장 해결 (TODO)**:
- 옵션 A: seed는 필터 무시하고 항상 포함
- 옵션 B: 상단에 "검수 중 — 공개 전" 상태 배지 노출
- 발행 직후 공유 버튼 UI에 "검수 통과 후 공개됩니다" 안내 추가도 고려

---

## State 변경 요약

### 추가

```typescript
uploadType: 'solo' | 'group' | null  // 유형 선택 (초기값 null)
artistDirectInput: boolean           // false: 검색창 / true: 직접 입력 폼 (장별 로컬 state)
isInstructor: boolean                // 강사 체크박스 (기본값 false, 함께 올리기에서만 노출)
                                     // → 발행 시 Work.isInstructorUpload로 영속화
```

### 기본값 변경

```typescript
showInSoloTab: boolean  // false → true (기존 state 유지, 기본값만 변경)
```

### 제거

```typescript
// Upload.tsx 내부 state
taggedEmails: string[]        // 이메일 태그 제거
emailInput: string            // 이메일 입력 제거
selectedCategories: string[]  // 카테고리 Phase 2 제거
detailTags: string[]          // 태그 Phase 2 제거
detailTagInput: string        // 태그 입력 Phase 2 제거
// 작가 입력 UI: 회원/비회원 탭 제거 → 검색창 단일 진입점으로 대체

// store.ts (전역) — 2026-04-13 삭제
UserProfile.isInstructor      // 필드 자체 삭제
                              // → Profile에서 works.some(...)으로 매번 파생
// 파일 삭제
src/app/utils/instructorPublic.ts  // 파일 자체 삭제

// localStorage 키 — Deprecated (마이그레이션 대상)
artier_instructor_public_ids  // 더 이상 읽지 않음. bootstrap에서 1회 제거 권장
```

### 유지 (위치/용도 변경)

```typescript
exhibitionName   // 세부정보 모달 → 상단 고정 바
groupName        // 세부정보 모달 → 상단 고정 바 (함께 올리기만)
isOriginalWork   // 문구만 uploadType 기반으로 분기
```

### 유지 (그대로)

```typescript
contents
selectedContentId
artistSearch
reorderMode
previewMode
isPublishing
showDetailsModal
exhibitionName / groupName (자동완성 포함)
linkSinglePieceAndExhibition
linkedEventId / linkedEventTitle
editingWorkId
```

---

## 확인 다이얼로그 규칙 (필수)

업로드 플로우 내 모든 확인 다이얼로그는 **`openConfirm()`** (ConfirmDialog) 사용.
브라우저 네이티브 `window.confirm()` **금지**.

```typescript
import { openConfirm } from '@/app/components/ConfirmDialog';

// 일반 확인
const ok = await openConfirm({
  title: '업로드 유형을 변경하시겠어요?',
  description: '지금까지 추가한 이미지가 모두 사라져요.',
});

// 파괴적 작업 (빨간 버튼)
const ok = await openConfirm({
  title: '작품을 삭제하시겠어요?',
  description: '삭제 후 되돌릴 수 없어요.',
  destructive: true,
});
```

적용 대상:
- 업로드 유형 변경 (contents 존재 시)
- 발행 취소 / 페이지 이탈
- 개별 이미지 삭제
- 초안 폐기

---

## i18n / locale 처리 규칙

- 모든 문자열은 `useI18n()` 의 `t()` 사용
- **금지**: `getStoredLocale()` 같은 스냅샷 함수를 렌더 시점에 직접 호출
  - 런타임 언어 전환 이벤트(`artier-locale`) 발생 시 리렌더가 트리거되지 않아 옛 locale로 고정될 수 있음
  - 관련 안티패턴 사례: `admin/ContentReview.tsx` (IMPLEMENTATION_DELTA §11.5)
- **권장**: `const { locale, t } = useI18n()` 형태로 hook 사용

---

## 오류 메시지 (i18n key 추가/수정 필요)

| 트리거 | 메시지 (KR) | 메시지 (EN) |
|---|---|---|
| 전시명 미입력 발행 | 전시 제목을 입력해주세요. | Please enter an exhibition title. |
| 원작 확인 미체크 (혼자) | 창작물 확인에 동의해주세요. | Please confirm this is your original work. |
| 원작 확인 미체크 (함께) | 작가 동의 확인에 체크해주세요. | Please confirm you have the artists' consent. |
| 함께 올리기 — 작가명 미입력 장 존재 | 모든 작품에 작가를 입력해주세요. | Please enter an artist for every artwork. |
| 비회원 이름 미입력 | 작가 이름을 입력해주세요. | Please enter the artist's name. |
| 비회원 연락처 미입력 | 연락처를 입력해주세요. | Please enter a contact number. |
| 연락처 형식 오류 | 올바른 연락처 형식으로 입력해주세요. | Please enter a valid contact number. |
| 이미지 없이 발행 | 작품 이미지를 먼저 추가해주세요. | Please add artwork images first. |
| 단변 800px 미만 | 이미지 단변이 800px 이상이어야 합니다. | Image short side must be at least 800px. |
| 10MB 초과 | 파일 크기는 10MB 이하여야 합니다. | File size must be 10MB or less. |
| 5MB 초과 (커버) | 커버 이미지는 5MB 이하여야 합니다. | Cover image must be 5MB or less. |
| 전시당 10장 초과 | 이미지는 전시당 최대 10장까지 업로드할 수 있습니다. | Up to 10 images per exhibition. |
| 그리드 10장 초과 | 이미지 그리드는 최대 10장까지 추가할 수 있습니다. | You can add up to 10 images in a grid. |
| 패딩 제거 조건 미충족 | 가로 폭 1100px 이상의 콘텐츠만 사용 가능한 기능입니다. | Available only for content wider than 1100px. |
| 카메라 사진 차단 | 카메라로 촬영한 사진은 업로드할 수 없습니다. | Camera photos cannot be uploaded. |
| 비속어 포함 (전시명/그룹명/작가명) | 사용할 수 없는 단어가 포함되어 있어요. | This word is not allowed. |

### 제거된 i18n 키 (2026-04-13)

- `profile.instructorToggle` — 프로필 강사 토글 라벨 (한/영 모두 제거)
- `profile.instructorHelp` — 프로필 강사 토글 도움말 (한/영 모두 제거)

---

## 저작권 정책 (Phase 1)

- All Rights Reserved 단일 정책 적용
- UI에 별도 저작권 선택 없음 (Phase 2에서 CCL 선택 UI 추가 예정)
- 안내 문구만 표시

---

## Phase 2 선행 구현 (정리됨 — 2026-04-15)

이전엔 PRD §2.2 Out of Scope임에도 코드에 존재하던 3개 컴포넌트는 dead code였기에 모두 삭제됨 (IMPLEMENTATION_DELTA §2.1 참조):

- ~~Pin 코멘트 (`PinCommentLayer.tsx`, `pinCommentStore.ts`)~~ 🗑
- ~~타임랩스 (`TimelapsePlayer.tsx`)~~ 🗑
- ~~색상 팔레트 추출 (`colorPalette.ts`, `ColorPaletteSuggestion.tsx`)~~ 🗑 — "톤 묻어남" UX는 blur 트릭으로 대체

→ 업로드 플로우 변경 시 위 컴포넌트 호출부는 이미 없으므로 신경 쓸 필요 없음.

---

## 알려진 잔여 이슈 (Upload 관련, IMPLEMENTATION_DELTA §11)

| # | 항목 | 상태 |
|---|---|---|
| 11.1 | Orphan `artier_instructor_public_ids` | ✅ `PointsBootstrap` 정리 |
| 11.2 | 어드민 작품 관리 | ✅ 실 `workStore` 연동 |
| 11.4 | 초대 랜딩 빈 그리드 | ✅ seed 항상 포함 + 배지 (§11.4) |

---

## 우선 보완 항목 (Upload 관련)

최근 반영됨: **비속어**(전시명·그룹명), **이벤트 store**, **이미지 lazy load**, **검색 히스토리 병합**, **InviteLanding** 등 — IMPLEMENTATION_DELTA §9·§10·§11.

남은 것 예시:

1. **비회원 작가 표시명** 비속어 검사 — Upload 발행 시 선택 적용
2. **대용량 업로드 progress** — 별도 진행 UI 없음(제품 정책에 따라)
3. **스토리지 버전** — `Work` 스키마 변경 시 `WORKS_STORAGE_VERSION`(`local-gallery-v11` 등) 증가 유지

---

## 미결 사항 (기획/개발 협의 필요)

> v1.2 §9에서 흡수. v1.6 시점에 해결된 항목(전시명 글자수, 커버 이미지 자동 추천)은 제외.
> 2026-04-14 갱신: #3, #9, #10 해결.

| # | 항목 | 내용 | 담당 | 상태 |
|---|---|---|---|---|
| 2 | 그룹명 최대 글자 수 | 그룹명 입력 최대 글자 수 확정 | 기획 | 협의 필요 |
| 3 | 작품명 최대 글자 수 | 작품명 입력 maxLength=120 적용 | 개발 | ✅ 해결 (120자) |
| 4 | 임시저장 조건 | 전시명 없을 때 임시저장 활성 여부 | 기획 | 협의 필요 |
| 5 | 비회원 중복 연락처 | 동일 연락처 중복 입력 시 처리 방식 | 개발 | 협의 필요 |
| 6 | 알림 발송 실패 처리 | 카카오/SMS 발송 실패 시 재발송 정책 | 개발 | 협의 필요 |
| 7 | 패딩 제거 임계값 | Artier 기준 패딩 제거 활성화 px 기준 | 기획/개발 | 협의 필요 (Phase 2) |
| 8 | 그리드 레이아웃 옵션 | 열 수 옵션 (2열/3열 등) 및 전환 UI | PD | Figma 결정 (Phase 2) |
| 9 | 콘텐츠 재정렬 모드 UI | 재정렬 모드 그리드 뷰 구현 | 개발 | ✅ 해결 |
| 10 | 장별 패널 이전/다음 UI | ChevronLeft/Right 구현 | 개발 | ✅ 해결 |

---

Artier Phase 1 | 작품 올리기 스펙 v1.7 | v1.6 코드 명세 + v1.2 기획서 통합본 | 2026-04-14
