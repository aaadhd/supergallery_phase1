/**
 * sessionStorage 기반 스크롤 위치 복원.
 * 지정한 element id의 스크롤 top을 키별로 저장·복원한다.
 * - save(): 보통 페이지 이탈 직전 or beforeunload에 호출
 * - restore(): 컴포넌트 mount 직후 requestAnimationFrame 안에서 호출 권장
 */

const PREFIX = 'artier_scroll_';

export function saveScrollTop(key: string, elementId: string) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById(elementId);
  const top = el ? el.scrollTop : window.scrollY;
  try {
    sessionStorage.setItem(PREFIX + key, String(top));
  } catch {
    /* quota·private mode 무시 */
  }
}

export function restoreScrollTop(key: string, elementId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return;
    const top = Number(raw);
    if (!Number.isFinite(top) || top < 0) return;
    const el = document.getElementById(elementId);
    // 레이아웃이 그려진 다음 프레임에 적용. 피드가 줄어들었을 수 있으므로 scrollHeight로 clamp.
    requestAnimationFrame(() => {
      if (el) {
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTop = Math.min(top, max);
      } else {
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo(0, Math.min(top, max));
      }
    });
  } catch {
    /* ignore */
  }
}

export function clearScrollTop(key: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
