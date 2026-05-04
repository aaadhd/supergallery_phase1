/**
 * piece 안정 식별자 발급 utility (Policy §15.4 / §32.1 #8b).
 * 기획전·이벤트 발표 페이지 등 작품 단위 큐레이션이 image 배열 인덱스
 * 시프트(전시 편집)에 영향 받지 않도록 안정 ID로 참조한다.
 */

/** 한 piece용 새 안정 ID 생성. 형식: `piece-{timestamp}-{random}`. */
export function generatePieceId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `piece-${ts}-${rnd}`;
}

/** 이미지 배열 길이만큼 새 piece ID 배열을 만든다. */
export function generatePieceIds(count: number): string[] {
  return Array.from({ length: count }, () => generatePieceId());
}

/**
 * 기존 imagePieceIds가 image 배열 길이와 맞지 않거나 비어 있으면 보정.
 * 보정 결과 배열 반환(원본 영향 X). 기존 ID는 가능한 한 보존.
 */
export function reconcilePieceIds(
  imageCount: number,
  existing: string[] | undefined,
): string[] {
  const safe = Array.isArray(existing) ? existing.filter((s) => typeof s === 'string' && s) : [];
  if (safe.length === imageCount) return safe;
  if (safe.length < imageCount) {
    return [...safe, ...generatePieceIds(imageCount - safe.length)];
  }
  return safe.slice(0, imageCount);
}
