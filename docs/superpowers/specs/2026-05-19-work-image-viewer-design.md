# WorkImageViewer — 딥줌 뷰어 설계

**날짜**: 2026-05-19  
**적용 화면**: USR-EXH-01 (전시상세모달) · USR-PRF-14 (내 작품 탭 뷰어)

---

## 1. 목적

전시상세모달과 마이페이지 내 작품 탭에서 작품 이미지를 탭하면 풀스크린 단일 이미지 뷰어로 진입하고, 그 안에서 딥줌(확대/이동)을 지원한다. 시니어 사용자가 버튼만으로 쉽게 확대하고 원래 크기로 돌아올 수 있어야 한다.

---

## 2. 트리거 변경

### 전시상세모달 (WorkDetailModal)
- **기존**: 싱글탭 → CSS scale(2.5) 인라인 줌 / 더블클릭 → DeepZoomViewer 오버레이
- **변경**: 싱글탭 → WorkImageViewer 진입
- 기존 `handleZoomClick`, `isZoomed`, `zoomOrigin` state 제거
- 기존 `DeepZoomViewer`, `deepZoomSrc` state 제거

### 내 작품 탭 뷰어 (Profile PRF-14)
- **기존**: 작품 탭 → 뷰어 진입 (줌 없음)
- **변경**: 동일 진입, WorkImageViewer 컴포넌트로 교체 → 줌 기능 추가

---

## 3. WorkImageViewer 컴포넌트

### 인터페이스

```
props:
  images: { src: string; title: string; artist: { name: string; avatar: string } }[]
  initialIndex: number
  open: boolean
  onClose: () => void
```

### 레이아웃 (플로팅 버튼 — 바 없음)

```
┌─────────────────────────────────────┐
│ [×N.N] [원래 크기]          [✕]     │  ← 확대 시만 좌상단 / ✕ 항상
│                                     │
│  [‹]      작품 이미지 전체      [›]  │  ← 양옆 수직 중앙
│                                     │
│ 아바타 작가명                [−][+] │  ← 좌하단: 정보 / 우하단: 줌버튼
│ 작품명                              │
└─────────────────────────────────────┘
```

### 버튼 위치 상세

| 위치 | 항상 표시 | 확대(scale>1) 시만 |
|---|---|---|
| 우상단 | ✕ 닫기 | — |
| 좌상단 | — | ×N.N 배율 배지 + "원래 크기" 버튼 |
| 좌측 중앙 | ‹ 이전 (활성) | ‹ 흐리게 (비활성) |
| 우측 중앙 | › 다음 (활성) | › 흐리게 (비활성) |
| 좌하단 | 아바타 + 작가명 + 작품명 | 동일 |
| 우하단 | − + 버튼 | 동일 |

모든 버튼 최소 터치 영역 44×44px (시니어 친화).  
버튼 배경: `rgba(0,0,0,0.55)` + `backdrop-filter: blur(4px)`.

---

## 4. 줌 동작

| 동작 | 결과 |
|---|---|
| + 버튼 | scale += 0.5 (최대 4.0) |
| − 버튼 | scale -= 0.5 (최소 1.0) |
| 핀치 줌 | 연속 scale 변경 (1.0~4.0 클램프) |
| 더블탭 | scale=1 ↔ 2.0 토글, 위치 리셋 |
| "원래 크기" 버튼 | scale=1, 위치 리셋 |
| 마우스 휠 | scale 연속 변경 |

- **MAX_SCALE**: 4.0
- **MIN_SCALE**: 1.0
- **ZOOM_STEP** (버튼): 0.5
- scale>1 상태에서 한 손가락 드래그/터치 이동 → 이미지 패닝
- scale=1에서 드래그는 이동 없음

---

## 5. 이미지 간 이동

| 방식 | 조건 |
|---|---|
| ‹ › 버튼 탭 | scale=1일 때 활성, scale>1일 때 비활성(흐리게) |
| 좌우 스와이프 | scale=1일 때 활성, scale>1일 때 비활성 (패닝으로 사용) |

이미지 변경 시 scale=1·위치 리셋.

---

## 6. 기타 동작

- **이미지 렌더**: `CopyrightProtectedImage` 사용 (우클릭·드래그 차단 유지)
- **ESC 키**: 닫기
- **배경 클릭**: 닫기 없음 (버튼만으로 닫기 — 시니어 실수 방지)
- **열릴 때**: scale=1·위치 리셋
- **닫힐 때**: scale=1·위치 리셋

---

## 7. 영향 파일

| 파일 | 변경 내용 |
|---|---|
| `src/app/components/WorkImageViewer.tsx` | 신규 생성 (DeepZoomViewer 대체) |
| `src/app/components/WorkDetailModal.tsx` | 싱글탭 → WorkImageViewer 진입, 기존 줌 state 제거 |
| `src/app/pages/Profile.tsx` | PRF-14 뷰어 → WorkImageViewer 교체 |
| `src/app/components/DeepZoomViewer.tsx` | 삭제 (WorkImageViewer로 통합) |
| `src/app/i18n/messages.ts` | `deepZoom.*` 키 → `viewer.*` 키로 교체 |

---

## 8. i18n 키 (신규)

| 키 | KO | EN |
|---|---|---|
| `viewer.close` | 닫기 | Close |
| `viewer.zoomIn` | 확대 | Zoom in |
| `viewer.zoomOut` | 축소 | Zoom out |
| `viewer.fitScreen` | 원래 크기 | Fit to screen |
| `viewer.prev` | 이전 작품 | Previous |
| `viewer.next` | 다음 작품 | Next |
