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
