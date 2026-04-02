/**
 * 그룹명 정규화·자동완성 (기능 모음: 그룹명 자동완성 및 정규화 / 그룹명 처리 정책)
 */

const CANONICAL_MAP_KEY = 'artier_group_canonical_map';
const LAST_GROUP_KEY = 'artier_last_group_name';
const MY_GROUPS_KEY = 'artier_my_group_names';

export function normalizeGroupKey(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

function loadCanonicalMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CANONICAL_MAP_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, string>;
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
  }
}

function saveCanonicalMap(map: Record<string, string>) {
  localStorage.setItem(CANONICAL_MAP_KEY, JSON.stringify(map));
}

/** 입력을 정규화 키로 매칭해 표시용 캐논 이름 반환 (최초 등록 시 입력값이 캐논) */
export function resolveCanonicalGroupName(trimmedInput: string): string {
  if (!trimmedInput) return '';
  const key = normalizeGroupKey(trimmedInput);
  if (!key) return trimmedInput;
  const map = loadCanonicalMap();
  if (map[key]) return map[key];
  map[key] = trimmedInput;
  saveCanonicalMap(map);
  return trimmedInput;
}

export function getLastUsedGroupName(): string {
  try {
    return localStorage.getItem(LAST_GROUP_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastUsedGroupName(displayName: string) {
  if (!displayName.trim()) return;
  localStorage.setItem(LAST_GROUP_KEY, displayName.trim());
  addMyGroupName(displayName.trim());
}

function loadMyGroupNames(): string[] {
  try {
    const raw = localStorage.getItem(MY_GROUPS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as string[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function addMyGroupName(displayName: string) {
  const list = loadMyGroupNames().filter((x) => normalizeGroupKey(x) !== normalizeGroupKey(displayName));
  localStorage.setItem(MY_GROUPS_KEY, JSON.stringify([displayName, ...list].slice(0, 50)));
}

/** 작품에 달린 그룹명 + 레지스트리 + 내 목록 */
export function collectGroupNameSuggestions(
  partial: string,
  workGroupNames: string[]
): string[] {
  const map = loadCanonicalMap();
  const fromRegistry = Object.values(map);
  const mine = loadMyGroupNames();
  const fromWorks = [...new Set(workGroupNames.filter(Boolean) as string[])];
  const merged = [...new Set([...mine, ...fromRegistry, ...fromWorks])];
  const q = partial.trim().toLowerCase();
  if (!q) return merged.slice(0, 30);
  return merged.filter((name) => name.toLowerCase().includes(q)).slice(0, 20);
}
