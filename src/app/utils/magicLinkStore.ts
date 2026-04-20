/**
 * 이메일 매직 링크 모의 저장소 (Phase 1 로컬).
 * 실제 백엔드 붙이면 `/auth/magic-link` 발행 + `/auth/verify?token` 검증으로 대체.
 */

const STORAGE_KEY = 'artier_pending_magic_links';
const TTL_MS = 30 * 60 * 1000;

export type MagicLinkIntent = 'login' | 'signup';

export interface MagicLinkRequest {
  token: string;
  email: string;
  intent: MagicLinkIntent;
  createdAt: number;
  expiresAt: number;
  redirectTo?: string;
}

type StoreMap = Record<string, MagicLinkRequest>;

function loadAll(): StoreMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoreMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: StoreMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function generateToken(): string {
  const raw =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
  return raw.replace(/-/g, '');
}

function purgeStale(map: StoreMap, emailToReplace?: string): void {
  const now = Date.now();
  for (const [token, req] of Object.entries(map)) {
    if (req.expiresAt < now) delete map[token];
    else if (emailToReplace && req.email.toLowerCase() === emailToReplace.toLowerCase()) delete map[token];
  }
}

export function issueMagicLink(params: {
  email: string;
  intent: MagicLinkIntent;
  redirectTo?: string;
}): MagicLinkRequest {
  const now = Date.now();
  const token = generateToken();
  const req: MagicLinkRequest = {
    token,
    email: params.email.trim(),
    intent: params.intent,
    createdAt: now,
    expiresAt: now + TTL_MS,
    redirectTo: params.redirectTo,
  };
  const all = loadAll();
  purgeStale(all, req.email);
  all[token] = req;
  saveAll(all);
  return req;
}

export function getMagicLink(token: string): MagicLinkRequest | null {
  const all = loadAll();
  const req = all[token];
  if (!req) return null;
  if (req.expiresAt < Date.now()) {
    delete all[token];
    saveAll(all);
    return null;
  }
  return req;
}

export function consumeMagicLink(token: string): MagicLinkRequest | null {
  const req = getMagicLink(token);
  if (!req) return null;
  const all = loadAll();
  delete all[token];
  saveAll(all);
  return req;
}

export function latestMagicLinkFor(email: string): MagicLinkRequest | null {
  const all = loadAll();
  const now = Date.now();
  const target = email.trim().toLowerCase();
  let latest: MagicLinkRequest | null = null;
  for (const req of Object.values(all)) {
    if (req.email.toLowerCase() !== target) continue;
    if (req.expiresAt < now) continue;
    if (!latest || req.createdAt > latest.createdAt) latest = req;
  }
  return latest;
}

export function buildVerifyUrl(token: string): string {
  return `/auth/verify?token=${encodeURIComponent(token)}`;
}
