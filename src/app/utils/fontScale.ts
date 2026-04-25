export type FontScale = 'small' | 'medium' | 'large';

export const FONT_SCALE_STORAGE_KEY = 'artier_font_scale';

const BASE_PX = 16;

// Policy §19.1 / §20: 시니어 접근성 — 작게 100% / 보통 110% / 크게 120%.
// 'medium'(보통)이 기본 110%이며 시니어 사용자에게 권장되는 기본값.
const SCALE_FACTOR: Record<FontScale, number> = {
  small: 1.0,
  medium: 1.1,
  large: 1.2,
};

export function getFontScale(): FontScale {
  if (typeof window === 'undefined') return 'medium';
  const raw = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
  if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  return 'medium';
}

export function setFontScale(next: FontScale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, next);
  applyFontScale(next);
  window.dispatchEvent(new CustomEvent('artier:font-scale-change', { detail: next }));
}

export function applyFontScale(scale: FontScale = getFontScale()) {
  if (typeof document === 'undefined') return;
  const px = BASE_PX * SCALE_FACTOR[scale];
  document.documentElement.style.fontSize = `${px}px`;
  document.documentElement.dataset.fontScale = scale;
}
