/** img/src용 — 공백·괄호·한글 파일명도 Vite public 정적 서빙과 맞도록 각 경로 세그먼트만 인코딩 */
export function toPublicImageSrc(p: string): string {
  if (!p.startsWith('/')) return p;
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 0) return p;
  return '/' + parts.map(encodeURIComponent).join('/');
}
