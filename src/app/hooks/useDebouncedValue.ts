import { useEffect, useState } from 'react';

/**
 * 값이 delayMs 동안 안정되면 그 값을 반환.
 * 어드민 검색 input → 필터 useMemo 사이에 끼워 PRD_Admin §0.5.3 "300ms 디바운스"를 충족한다.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
