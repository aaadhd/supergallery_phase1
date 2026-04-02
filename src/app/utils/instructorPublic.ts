/** 강사 공개 표시(다른 사용자 프로필에서 배지·탭 노출) */
const KEY = 'artier_instructor_public_ids';

export function setPublicInstructor(artistId: string, enabled: boolean) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]') as string[];
    const s = new Set(Array.isArray(arr) ? arr : []);
    if (enabled) s.add(artistId);
    else s.delete(artistId);
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

export function isPublicInstructor(artistId: string): boolean {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]') as string[];
    return Array.isArray(arr) && arr.includes(artistId);
  } catch {
    return false;
  }
}
