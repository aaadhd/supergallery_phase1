/**
 * 그룹명 자동완성 — 내 최근 그룹명 + 작품에 달린 그룹명을 모아 드롭다운에 제안.
 *
 * 그룹명은 중복 허용 정책(2026-04-17): 다른 사용자가 같은 이름을 써도 병합하지 않는다.
 * canonical 맵(`artier_group_canonical_map`)·normalizeGroupKey는 이때 제거됐다.
 * 내 목록 안에서만 가벼운 중복 제거(대소문자·공백 무시)를 적용한다.
 */

const LAST_GROUP_KEY = 'artier_last_group_name';
const MY_GROUPS_KEY = 'artier_my_group_names';

function softKey(input: string): string {
  return input.trim().replace(/\s+/g, '').toLowerCase();
}

export function getLastUsedGroupName(): string {
  try {
    return localStorage.getItem(LAST_GROUP_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastUsedGroupName(displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  localStorage.setItem(LAST_GROUP_KEY, trimmed);
  addMyGroupName(trimmed);
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
  const key = softKey(displayName);
  const list = loadMyGroupNames().filter((x) => softKey(x) !== key);
  localStorage.setItem(MY_GROUPS_KEY, JSON.stringify([displayName, ...list].slice(0, 50)));
}

/** 내가 쓴 그룹명 + 작품에 달린 그룹명을 합쳐 제안. 부분 일치 필터. */
export function collectGroupNameSuggestions(
  partial: string,
  workGroupNames: string[]
): string[] {
  const mine = loadMyGroupNames();
  const fromWorks = [...new Set(workGroupNames.filter(Boolean))];
  const merged = [...new Set([...mine, ...fromWorks])];
  const q = partial.trim().toLowerCase();
  if (!q) return merged.slice(0, 30);
  return merged.filter((name) => name.toLowerCase().includes(q)).slice(0, 20);
}
