// 작품 이미지 관련 헬퍼 함수

/**
 * 작품의 첫 번째 이미지를 반환
 * @param image - 단일 이미지 문자열 또는 이미지 배열
 * @returns 첫 번째 이미지 URL
 */
export function getFirstImage(image: string | string[] | undefined | null): string {
  if (!image) return '';
  if (Array.isArray(image)) return image[0] ?? '';
  return image;
}

/**
 * 작품의 커버(대표) 이미지를 반환. `coverImageIndex`가 지정되어 있고 유효하면 그 위치의 이미지를, 아니면 첫 번째 이미지를 반환.
 * 둘러보기/프로필 그리드/검색 결과 등 썸네일 소스에서 사용.
 */
export function getCoverImage(image: string | string[] | undefined | null, coverImageIndex?: number): string {
  if (!image) return '';
  const arr = Array.isArray(image) ? image : [image];
  if (arr.length === 0) return '';
  if (typeof coverImageIndex === 'number' && coverImageIndex >= 0 && coverImageIndex < arr.length) {
    return arr[coverImageIndex];
  }
  return arr[0] ?? '';
}

/**
 * 썸네일(둘러보기 카드·공유 OG·프로필 그리드) 표시용 커버.
 * 사용자가 별도 지정한 `customCoverUrl`이 있으면 우선, 없으면 image 배열에서 추출.
 */
export function getThumbCover(
  work: { image: string | string[]; coverImageIndex?: number; customCoverUrl?: string },
): string {
  if (work.customCoverUrl) return work.customCoverUrl;
  return getCoverImage(work.image, work.coverImageIndex);
}

/**
 * 작품의 모든 이미지를 배열로 반환
 * @param image - 단일 이미지 문자열 또는 이미지 배열
 * @returns 이미지 URL 배열
 */
export function getAllImages(image: string | string[]): string[] {
  return Array.isArray(image) ? image : [image];
}

/**
 * 작품의 이미지 개수 반환
 * @param image - 단일 이미지 문자열 또는 이미지 배열
 * @returns 이미지 개수
 */
export function getImageCount(image: string | string[]): number {
  return Array.isArray(image) ? image.length : 1;
}
