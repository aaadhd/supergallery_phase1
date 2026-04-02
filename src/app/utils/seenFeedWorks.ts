const STORAGE_KEY = 'artier_feed_seen_work_ids';
const MAX_IDS = 800;

function loadIdList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as string[]).filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function loadSeenWorkIds(): Set<string> {
  return new Set(loadIdList());
}

/** 상세(모달) 진입 등 “본 작품” 기록 — 피드에서 뒤로 밀기용 */
export function rememberSeenWork(workId: string) {
  const list = loadIdList().filter((id) => id !== workId);
  list.push(workId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_IDS)));
}
