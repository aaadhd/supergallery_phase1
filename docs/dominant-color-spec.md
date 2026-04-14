# 작품 주조색 자동 배경 스펙
> 이미지 업로드 시 주조색을 추출해 배경색으로 자동 적용
> 참고: artness.kr/discover 동일 방식

> **구현 상태**: ✅ **구현 완료** (2026-04-12 기준 — IMPLEMENTATION_DELTA §2.1 참조)
> 명세상 "배경색 자동 적용" 수준만 있었으나, 색상 추출 알고리즘이 선행 구현됨.

---

## 적용 위치

| 위치 | 동작 | 상태 |
|---|---|---|
| 업로드 편집기 | 이미지 업로드 완료 시 캔버스 배경색 실시간 변경 | ✅ |
| 전시 상세 페이지 | 저장된 주조색으로 페이지 배경색 적용 | ✅ |

---

## 구현 위치 (실제 파일)

| 역할 | 파일 |
|---|---|
| 색상 추출 알고리즘 | `src/app/utils/colorPalette.ts` |
| 추천 UI 컴포넌트 | `src/app/components/work/ColorPaletteSuggestion.tsx` |
| 업로드 편집기 통합 | `src/app/pages/Upload.tsx` |
| 전시 상세 적용 | `src/app/pages/ExhibitionDetail.tsx` |
| 데이터 필드 | `src/app/data.ts` (Work.dominantColor) |

> 신규 생성이 아닌 **기존 `colorPalette.ts` 활용**. 별도 `extractDominantColor.ts` 파일을 새로 만들지 말 것.

---

## 구현 전략

### 색상 추출 — 클라이언트 (canvas 방식)

이미지 업로드 완료 후 브라우저에서 즉시 추출.
`convertImageFileToWebpDataUrlIfPossible` 이후 호출.

기본 알고리즘 (참고용 — 실제 구현은 `colorPalette.ts` 확인):

```typescript
// src/app/utils/colorPalette.ts (구현됨)

export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 50; // 성능을 위해 50x50으로 다운샘플링
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('#FFFFFF');

      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // 픽셀 색상 집계
      const colorMap: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;     // 양자화
        const g = Math.round(data[i+1] / 32) * 32;
        const b = Math.round(data[i+2] / 32) * 32;
        const a = data[i+3];
        if (a < 128) continue; // 투명 픽셀 제외

        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      // 최빈 색상 추출
      const dominant = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (!dominant) return resolve('#FFFFFF');

      const [r, g, b] = dominant.split(',').map(Number);

      // 너무 밝거나 어두우면 약간 조정 (배경색으로 쓰기 좋게)
      const lightened = lightenColor(r, g, b, 0.7); // 70% 밝기로 조정
      resolve(lightened);
    };
    img.onerror = () => resolve('#FFFFFF');
    img.src = imageUrl;
  });
}

// 색상을 배경용으로 밝게 조정
function lightenColor(r: number, g: number, b: number, factor: number): string {
  const nr = Math.round(r + (255 - r) * factor);
  const ng = Math.round(g + (255 - g) * factor);
  const nb = Math.round(b + (255 - b) * factor);
  return `rgb(${nr}, ${ng}, ${nb})`;
}
```

---

## 업로드 편집기 적용

### 트리거
- 이미지 업로드 완료 시 (`handleFileSelect` 완료 후)
- 첫 번째 이미지 기준으로 추출

### 동작
```typescript
// handleFileSelect 완료 후
const firstImage = incoming[0];
if (firstImage?.url && contents.length === 0) {
  // 첫 이미지 업로드 시에만 자동 적용
  const color = await extractDominantColor(firstImage.url);
  setDominantColor(color);
}
```

### State
```typescript
const [dominantColor, setDominantColor] = useState<string>('#FFFFFF');
```

### 배경 적용
```tsx
// 캔버스 영역 style
<div style={{ backgroundColor: dominantColor, transition: 'background-color 0.5s ease' }}>
```

### 전환 애니메이션
- `transition: 'background-color 0.5s ease'` — 부드럽게 전환

---

## 전시 상세 페이지 적용

### 저장
발행 시 `dominantColor`를 Work 객체에 포함해서 저장.

```typescript
// Work 타입에 필드 추가
dominantColor?: string;

// 발행 시
const newWork: Work = {
  ...
  dominantColor: dominantColor || '#FFFFFF',
};
```

### 표시
전시 상세 페이지에서 `work.dominantColor`를 페이지 배경색으로 적용.

```tsx
<div
  className="min-h-screen transition-colors duration-500"
  style={{ backgroundColor: work.dominantColor || '#FFFFFF' }}
>
```

---

## 주의사항

### crossOrigin 이슈
- 이미지가 외부 도메인(Supabase Storage 등)에서 오는 경우 CORS 오류 발생 가능
- 업로드 직후 DataURL(base64) 상태일 때 추출하면 CORS 문제 없음
- **따라서 WEBP 변환 직후 DataURL 상태에서 추출하는 것을 권장**

```typescript
// WEBP 변환 후 DataURL 상태에서 바로 추출
const url = await convertImageFileToWebpDataUrlIfPossible(file);
const color = await extractDominantColor(url); // DataURL이라 CORS 없음
```

### 색상 품질
- 너무 어두운 색 → 텍스트 가독성 문제
- 너무 밝은 색 (흰색에 가까운) → 효과 없음
- `lightenColor` factor를 조정해서 배경용으로 적절한 밝기 유지
- 권장 factor: 0.6~0.75

### Phase 1 범위
- 수동 색상 변경 기능 없음 (자동 적용만)
- 색상 리셋(흰색으로) 버튼은 Phase 2 검토
- `ColorPaletteSuggestion` 컴포넌트는 Phase 1에서 활성 (PRD §2.2 Out of Scope이지만 선행 구현 — IMPLEMENTATION_DELTA §2.1)

### 스토리지 버전 관리
- `dominantColor` 필드를 Work 타입에 추가/변경할 경우, `WORKS_STORAGE_VERSION` 증가 필요
- 미증가 시 기존 localStorage works 데이터에 필드가 없어 fallback(#FFFFFF) 처리됨

---

## 관련 파일

| 파일 | 변경 내용 | 상태 |
|---|---|---|
| `src/app/utils/colorPalette.ts` | 색상 추출 알고리즘 | ✅ 구현됨 |
| `src/app/components/work/ColorPaletteSuggestion.tsx` | 추천 UI | ✅ 구현됨 |
| `src/app/pages/Upload.tsx` | dominantColor state, 추출 호출, 캔버스 배경 적용 | ✅ 구현됨 |
| `src/app/pages/ExhibitionDetail.tsx` | work.dominantColor로 배경색 적용 | ✅ 구현됨 |
| `src/app/data.ts` | Work 타입에 `dominantColor?: string` 추가 | ✅ 구현됨 |
