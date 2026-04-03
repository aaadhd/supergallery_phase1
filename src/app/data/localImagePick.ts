import localGalleryManifest from './localGalleryManifest.json';
import { toPublicImageSrc } from '../utils/toPublicImageSrc';

/** `localGalleryManifest.json` 경로 목록을 인덱스로 순환해 공개 URL로 변환 */
export function localPick(index: number): string {
  const { paths } = localGalleryManifest;
  if (!paths.length) return '';
  const raw = paths[((index % paths.length) + paths.length) % paths.length];
  return toPublicImageSrc(raw);
}
