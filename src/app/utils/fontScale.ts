export type FontScale = 'small' | 'medium' | 'large';

export const FONT_SCALE_STORAGE_KEY = 'artier_font_scale';

const BASE_PX = 16;

const SCALE_FACTOR: Record<FontScale, number> = {
  small: 0.9375,
  medium: 1,
  large: 1.125,
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
