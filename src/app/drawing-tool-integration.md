# 드로잉 툴과 artier 연동 가이드

이 문서는 드로잉 툴에서 artier 플랫폼으로 작품을 전송하는 방법을 설명합니다.

## 통합 방법

### 방법 1: localStorage를 통한 데이터 공유

드로잉 툴에서 작품을 저장할 때 다음 코드를 사용하세요:

```javascript
// 드로잉 툴에서 작품 저장하기
function saveDrawingToArtier(imageDataUrl, title = '제목 없음') {
  try {
    // localStorage에서 기존 작품 목록 가져오기
    const existingDrawings = JSON.parse(localStorage.getItem('artier_drawings') || '[]');
    
    // 새 작품 추가
    const newDrawing = {
      id: `drawing-${Date.now()}`,
      url: imageDataUrl,  // base64 이미지 데이터 또는 Blob URL
      title: title,
      timestamp: Date.now()
    };
    
    // 업데이트된 목록 저장
    const updatedDrawings = [newDrawing, ...existingDrawings];
    localStorage.setItem('artier_drawings', JSON.stringify(updatedDrawings));
    
    console.log('작품이 artier에 저장되었습니다:', newDrawing);
    return true;
  } catch (error) {
    console.error('작품 저장 실패:', error);
    return false;
  }
}

// 사용 예시
const canvas = document.getElementById('myCanvas');
const imageDataUrl = canvas.toDataURL('image/png');
saveDrawingToArtier(imageDataUrl, '내 멋진 작품');
```

### 방법 2: postMessage를 통한 윈도우 간 통신

artier에서 드로잉 툴을 열었을 때, 완성된 작품을 다시 artier로 전송:

```javascript
// 드로잉 툴에서 작품을 artier로 전송
function sendDrawingToArtier(imageDataUrl, title = '제목 없음') {
  // artier의 origin (실제 환경에 맞게 수정)
  const artierOrigin = window.location.origin;
  
  // 부모 윈도우가 있는 경우 (팝업이나 iframe으로 열린 경우)
  if (window.opener) {
    window.opener.postMessage({
      type: 'DRAWING_SAVED',
      imageUrl: imageDataUrl,
      title: title,
      timestamp: Date.now()
    }, artierOrigin);
    
    console.log('작품이 artier로 전송되었습니다');
    
    // localStorage에도 저장
    saveDrawingToArtier(imageDataUrl, title);
  }
}

// 사용 예시
const canvas = document.getElementById('myCanvas');
const imageDataUrl = canvas.toDataURL('image/png');
sendDrawingToArtier(imageDataUrl, '내 멋진 작품');
```

### 방법 3: URL 파라미터를 통한 컨텍스트 전달

artier에서 드로잉 툴을 열 때 URL 파라미터로 정보를 전달받을 수 있습니다:

```javascript
// 드로잉 툴에서 URL 파라미터 읽기
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source');  // 'artier'
const returnUrl = urlParams.get('returnUrl');  // artier 업로드 페이지 URL

if (source === 'artier') {
  console.log('artier에서 열림');
  
  // 작품 저장 후 artier로 돌아가기
  function saveAndReturn(imageDataUrl, title) {
    saveDrawingToArtier(imageDataUrl, title);
    sendDrawingToArtier(imageDataUrl, title);
    
    // artier 업로드 페이지로 돌아가기
    if (returnUrl) {
      window.location.href = returnUrl;
    }
  }
}
```

## 완전한 통합 예시

```html
<!DOCTYPE html>
<html>
<head>
  <title>드로잉 툴</title>
</head>
<body>
  <canvas id="drawingCanvas" width="800" height="600"></canvas>
  <button onclick="saveDrawing()">저장하고 artier에 업로드</button>
  
  <script>
    // 드로잉 툴 초기화
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const returnUrl = urlParams.get('returnUrl');
    
    // 작품 저장 함수
    function saveDrawing() {
      const imageDataUrl = canvas.toDataURL('image/png');
      const title = prompt('작품 제목을 입력하세요:', '제목 없음');
      
      // localStorage에 저장
      try {
        const existingDrawings = JSON.parse(localStorage.getItem('artier_drawings') || '[]');
        const newDrawing = {
          id: `drawing-${Date.now()}`,
          url: imageDataUrl,
          title: title || '제목 없음',
          timestamp: Date.now()
        };
        
        const updatedDrawings = [newDrawing, ...existingDrawings];
        localStorage.setItem('artier_drawings', JSON.stringify(updatedDrawings));
        
        // postMessage로 전송 (artier에서 열린 경우)
        if (window.opener && source === 'artier') {
          window.opener.postMessage({
            type: 'DRAWING_SAVED',
            imageUrl: imageDataUrl,
            title: title || '제목 없음',
            timestamp: Date.now()
          }, window.location.origin);
        }
        
        alert('작품이 저장되었습니다!');
        
        // artier로 돌아가기
        if (source === 'artier' && returnUrl) {
          window.location.href = returnUrl;
        }
      } catch (error) {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다.');
      }
    }
  </script>
</body>
</html>
```

## 데이터 구조

artier에 저장되는 작품 데이터 구조:

```typescript
interface Drawing {
  id: string;           // 고유 ID (예: "drawing-1709884800000")
  url: string;          // 이미지 데이터 (base64 또는 Blob URL)
  title: string;        // 작품 제목
  timestamp: number;    // 저장 시간 (Unix timestamp)
}
```

## 보안 고려사항

1. **Origin 검증**: postMessage 사용 시 반드시 origin을 확인하세요
2. **데이터 크기**: localStorage는 5-10MB 제한이 있으므로 이미지 크기에 주의하세요
3. **데이터 압축**: 필요시 이미지를 압축하여 저장하세요

## 테스트 방법

1. artier 플랫폼에서 "드로잉 툴 열기" 버튼 클릭
2. 드로잉 툴에서 작품 그리기
3. "저장" 버튼으로 작품 저장
4. artier 업로드 페이지에서 "드로잉 툴에서 가져오기" 클릭
5. 저장된 작품 목록에서 원하는 작품 선택
