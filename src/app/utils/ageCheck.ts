/**
 * 만 14세 미만 가입 차단 (한국 정보통신망법 준수).
 * 명세(§9.1): 만 14세 이상만 가입 가능. 보호자 동의 플로우는 Phase 2.
 */

export const MIN_AGE = 14;

/** 유효한 날짜 조합인지 (2월 30일 같은 케이스 차단 + year 1900~현재 범위) */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/** 지정 생년월일의 만 나이 (현재 기준). 유효하지 않으면 -1 */
export function getAge(year: number, month: number, day: number, now: Date = new Date()): number {
  if (!isValidDate(year, month, day)) return -1;
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() - (month - 1);
  const dayDiff = now.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function meetsMinAge(year: number, month: number, day: number, now: Date = new Date()): boolean {
  const age = getAge(year, month, day, now);
  return age >= MIN_AGE;
}

/** 드롭다운 year 옵션 (현재 - 100 ~ 현재) */
export function birthYearOptions(now: Date = new Date()): number[] {
  const current = now.getFullYear();
  const list: number[] = [];
  for (let y = current; y >= current - 100; y -= 1) list.push(y);
  return list;
}
