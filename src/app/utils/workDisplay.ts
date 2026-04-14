import type { Work } from '../data';

const PIECE_TITLE_MAX_LEN = 120;

/**
 * 로컬 JSON·레거시 데이터에서 title / imagePieceTitles 셀에
 * 숫자, 문자열 "undefined"/"null" 등이 들어온 경우를 표시용으로 정리합니다.
 */
export function normalizeStoredPieceTitle(raw: unknown): string {
  if (raw === undefined || raw === null) return '';
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (s === '' || s === 'undefined' || s === 'null') return '';
  return s.slice(0, PIECE_TITLE_MAX_LEN);
}

/** 화면에 쓰는 작품명: 비어 있으면 무제(또는 i18n 문구) */
export function displayPieceTitle(work: Pick<Work, 'title'>, untitledLabel: string): string {
  const s = normalizeStoredPieceTitle((work as { title?: unknown }).title);
  return s ? s : untitledLabel;
}

/** 다장 업로드 시 imagePieceTitles[index] 우선, 없으면 Work.title */
export function displayPieceTitleAtIndex(work: Work, index: number, untitledLabel: string): string {
  const arr = work.imagePieceTitles;
  if (Array.isArray(arr) && index >= 0 && index < arr.length) {
    const cell = normalizeStoredPieceTitle(arr[index]);
    return displayPieceTitle({ title: cell }, untitledLabel);
  }
  return displayPieceTitle(work, untitledLabel);
}

/** 편집용: 이미지 장수와 동일한 길이의 장별 제목 스냅샷(비어 있으면 빈 문자열). */
export function pieceTitlesEditableSnapshot(work: Work): string[] {
  const imgs = Array.isArray(work.image) ? work.image : [work.image];
  const n = imgs.length;
  const prev = work.imagePieceTitles ?? [];
  return Array.from({ length: n }, (_, i) => {
    if (i < prev.length) {
      const c = normalizeStoredPieceTitle(prev[i]);
      if (c) return c;
    }
    if (i === 0) {
      const t0 = normalizeStoredPieceTitle(work.title);
      if (t0) return t0;
    }
    return '';
  });
}

/**
 * 전시(기획) 제목: exhibitionName → 레거시(groupName만 있는 데이터) → 그룹 owner → 폴백
 * (구버전은 전시명을 groupName에만 두었을 수 있음)
 */
export function displayExhibitionTitle(work: Work, fallbackLabel: string): string {
  const ex = work.exhibitionName?.trim();
  if (ex) return ex;
  const legacy = work.groupName?.trim();
  if (legacy) return legacy;
  const owner = work.owner;
  if (owner?.type === 'group' && owner.data && typeof owner.data === 'object' && 'name' in owner.data) {
    return String((owner.data as { name: string }).name);
  }
  return fallbackLabel;
}

/** 그룹/소속 줄 노출용 (전시명과 별도로 둘 다 있을 때) */
export function displayGroupOrgName(work: Work): string | undefined {
  const ex = work.exhibitionName?.trim();
  const g = work.groupName?.trim();
  if (ex && g) return g;
  return undefined;
}

/**
 * 카드·목록·상단 헤더용: 작품명이 있으면 작품명, 없으면 전시명(및 레거시 폴백), 끝까지 없으면 무제.
 * (작품명 미입력이라도 전시명으로 식별)
 */
export function displayProminentHeadline(work: Work, untitledLabel: string): string {
  const piece = normalizeStoredPieceTitle(work.title);
  if (piece) return piece;
  return displayExhibitionTitle(work, untitledLabel);
}
