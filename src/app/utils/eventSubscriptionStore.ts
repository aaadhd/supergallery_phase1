/**
 * 이벤트·공지 메일 구독 목록 (Phase 1: 단말 전역 1목록, 이벤트별 분리 없음).
 * 키는 CLAUDE.md `artier_event_subscriptions`와 동일.
 */

const STORAGE_KEY = 'artier_event_subscriptions';
const CHANGED = 'artier-event-subscriptions-changed';

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function readList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').map((e) => e.toLowerCase());
  } catch {
    return [];
  }
}

function writeList(emails: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  window.dispatchEvent(new Event(CHANGED));
}

/**
 * @returns ok — duplicate true if 이미 구독된 주소
 */
export function addEventEmailSubscription(
  raw: string,
): { ok: true; duplicate: boolean } | { ok: false; reason: 'empty' | 'invalid' } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  const email = normalizeEmail(trimmed);
  if (!isValidEmail(email)) return { ok: false, reason: 'invalid' };
  const list = readList();
  if (list.includes(email)) return { ok: true, duplicate: true };
  writeList([...list, email]);
  return { ok: true, duplicate: false };
}

/** 목록에서 제거했으면 true */
export function removeEventEmailSubscription(raw: string): boolean {
  const email = normalizeEmail(raw);
  if (!email || !isValidEmail(email)) return false;
  const list = readList();
  const next = list.filter((e) => e !== email);
  if (next.length === list.length) return false;
  writeList(next);
  return true;
}

export function getEventEmailSubscriptions(): string[] {
  return readList();
}
