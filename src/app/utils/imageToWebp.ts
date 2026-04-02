/**
 * Phase 1: 브라우저가 WebP 인코딩을 지원하면 JPG/PNG를 WebP 데이터 URL로 변환.
 * GIF는 애니메이션 보존을 위해 그대로 둠. 이미 WebP면 그대로 읽음.
 */

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function browserCanEncodeWebp(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const u = c.toDataURL('image/webp');
    return u.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

export async function convertImageFileToWebpDataUrlIfPossible(
  file: File,
  quality = 0.88,
): Promise<string> {
  if (file.type === 'image/webp') return readAsDataURL(file);
  if (file.type === 'image/gif') return readAsDataURL(file);
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') return readAsDataURL(file);
  if (!browserCanEncodeWebp()) return readAsDataURL(file);

  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bmp.close();
      return readAsDataURL(file);
    }
    ctx.drawImage(bmp, 0, 0);
    bmp.close();

    const blob = await new Promise<Blob | null>((res) => {
      canvas.toBlob((b) => res(b), 'image/webp', quality);
    });
    if (!blob || blob.size === 0) return readAsDataURL(file);

    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return readAsDataURL(file);
  }
}
