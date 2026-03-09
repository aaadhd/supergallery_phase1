/**
 * 이미지에서 주요 색상을 추출하여 팔레트와 배경 제안을 반환
 */

export interface ColorPaletteResult {
  colors: string[];           // hex 색상 배열 (최대 8개)
  suggestedBackgrounds: {
    id: string;
    label: string;
    bgValue: string;
    preview: string;
  }[];
}

// 기본 제안 배경 (이미지 로드 실패 시 사용)
const FALLBACK_BACKGROUNDS: ColorPaletteResult['suggestedBackgrounds'] = [
  { id: 'white', label: '클린 화이트', bgValue: '#FFFFFF', preview: 'bg-white' },
  { id: 'offwhite', label: '웜 오프화이트', bgValue: '#F8F6F3', preview: 'bg-[#F8F6F3]' },
  { id: 'cream', label: '크림', bgValue: '#FFF8E7', preview: 'bg-[#FFF8E7]' },
  { id: 'charcoal', label: '차콜', bgValue: '#2C2C2C', preview: 'bg-[#2C2C2C]' },
  { id: 'slate', label: '슬레이트', bgValue: '#475569', preview: 'bg-slate-600' },
  { id: 'sage', label: '세이지', bgValue: '#9CAF88', preview: 'bg-[#9CAF88]' },
  { id: 'blush', label: '블러시 핑크', bgValue: '#E8D5D5', preview: 'bg-[#E8D5D5]' },
  { id: 'sand', label: '샌드', bgValue: '#D4C4A8', preview: 'bg-[#D4C4A8]' },
];

export async function extractColorPalette(imageUrl: string): Promise<ColorPaletteResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getFallbackResult());
          return;
        }

        // 샘플링을 위해 크기 제한 (성능)
        const maxSize = 150;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const colorCounts: Map<string, number> = new Map();

        // 색상을 32단계로 양자화하여 그룹화
        const step = 40; // 샘플 스텝
        for (let i = 0; i < pixels.length; i += step * 4) {
          const r = Math.floor(pixels[i] / 32) * 32;
          const g = Math.floor(pixels[i + 1] / 32) * 32;
          const b = Math.floor(pixels[i + 2] / 32) * 32;
          const a = pixels[i + 3];
          if (a < 128) continue; // 투명 스킵

          const key = `${r},${g},${b}`;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }

        // 빈도순 정렬 후 상위 8개
        const sorted = [...colorCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        const colors = sorted.map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
        });

        // 밝기 필터 (너무 어둡거나 밝은 것 제외)
        const filtered = colors.filter((hex) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          return luminance > 30 && luminance < 240;
        });

        const finalColors = filtered.length >= 3 ? filtered : colors;
        const suggestedBackgrounds = buildSuggestedBackgrounds(finalColors);

        resolve({ colors: finalColors, suggestedBackgrounds });
      } catch {
        resolve(getFallbackResult());
      }
    };

    img.onerror = () => resolve(getFallbackResult());
    img.src = imageUrl;
  });
}

function getFallbackResult(): ColorPaletteResult {
  return {
    colors: ['#2C2C2C', '#F8F6F3', '#9CAF88', '#E8D5D5'],
    suggestedBackgrounds: FALLBACK_BACKGROUNDS,
  };
}

function buildSuggestedBackgrounds(colors: string[]): ColorPaletteResult['suggestedBackgrounds'] {
  const results: ColorPaletteResult['suggestedBackgrounds'] = [];

  // 작품에서 추출한 색상 기반 배경 (보색/밝기 변형)
  colors.slice(0, 4).forEach((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const labels = ['작품 톤 매칭', '소프트 배경', '대비 배경', '뉴트럴'];
    const variationHexes = [
      hex,
      `#${[Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40)].map((x) => x.toString(16).padStart(2, '0')).join('')}`,
      `#${[Math.max(0, r - 60), Math.max(0, g - 60), Math.max(0, b - 60)].map((x) => x.toString(16).padStart(2, '0')).join('')}`,
      `#${[Math.floor((r + 245) / 2), Math.floor((g + 245) / 2), Math.floor((b + 245) / 2)].map((x) => x.toString(16).padStart(2, '0')).join('')}`,
    ];
    const vHex = variationHexes[i % variationHexes.length];
    results.push({
      id: `extracted-${i}`,
      label: labels[i % labels.length],
      bgValue: vHex,
      preview: '',
    });
  });

  results.push(...FALLBACK_BACKGROUNDS.slice(0, 4));
  return results.slice(0, 8);
}

