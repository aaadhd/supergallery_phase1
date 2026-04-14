// 작품 이미지 관련 헬퍼 함수

/**
 * 작품의 첫 번째 이미지를 반환
 * @param image - 단일 이미지 문자열 또는 이미지 배열
 * @returns 첫 번째 이미지 URL
 */
export function getFirstImage(image: string | string[]): string {
  return Array.isArray(image) ? image[0] : image;
}

/**
 * 작품의 커버(대표) 이미지를 반환. `coverImageIndex`가 지정되어 있고 유효하면 그 위치의 이미지를, 아니면 첫 번째 이미지를 반환.
 * 둘러보기/프로필 그리드/검색 결과 등 썸네일 소스에서 사용.
 */
export function getCoverImage(image: string | string[], coverImageIndex?: number): string {
  const arr = Array.isArray(image) ? image : [image];
  if (typeof coverImageIndex === 'number' && coverImageIndex >= 0 && coverImageIndex < arr.length) {
    return arr[coverImageIndex];
  }
  return arr[0];
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
