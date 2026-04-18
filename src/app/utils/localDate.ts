/**
 * 사용자 로컬 시간대 기준 `YYYY-MM-DD` 문자열.
 *
 * `Date#toISOString().slice(0,10)`은 UTC 날짜를 돌려주므로 한국(UTC+9)에서는
 * 자정 이후 9시간 동안 "하루 전날"로 계산되는 버그가 생긴다.
 * date-only 필드(배너/이벤트 startAt·endAt, 작품 uploadedAt 등)는 이 함수 사용.
 */
export function todayLocalIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
