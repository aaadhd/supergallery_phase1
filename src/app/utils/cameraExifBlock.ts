/**
 * 업로드 파일 검증 — 카메라 촬영 사진 차단 (기능 모음 스펙)
 * - JPEG APP1(Exif)에서 IFD0의 Make(0x010F), Model(0x0110)만 분석
 * - 둘 중 하나라도 비어 있지 않은 문자열이면 카메라 촬영으로 간주해 차단
 * - EXIF 없음 / 분석 실패 / PNG·WEBP·GIF 등은 스펙대로 허용
 */

function parseIfdMakeModel(
  view: DataView,
  buf: ArrayBuffer,
  tiffStart: number,
  ifdOffset: number,
  tiffEnd: number,
  littleEndian: boolean
): { make?: string; model?: string } | null {
  if (ifdOffset < 0 || tiffStart + ifdOffset + 2 > tiffEnd) return null;
  const ifd0 = tiffStart + ifdOffset;
  const count = view.getUint16(ifd0, littleEndian);
  let p = ifd0 + 2;
  const out: { make?: string; model?: string } = {};

  const readAscii = (type: number, compCount: number, valueField: number): string | null => {
    if (type !== 2 || compCount < 1) return null;
    const byteLen = compCount;
    // Make/Model은 대부분 4바이트 초과로 오프셋 참조. 4 이하 인라인은 카메라 메타에 거의 없음 → 생략
    if (byteLen <= 4) return null;
    const abs = tiffStart + valueField;
    if (abs + byteLen > tiffEnd || abs < 0) return null;
    return new TextDecoder('latin1')
      .decode(new Uint8Array(buf, abs, byteLen))
      .replace(/\0/g, '')
      .trim() || null;
  };

  for (let i = 0; i < count; i++) {
    if (p + 12 > tiffEnd) break;
    const tag = view.getUint16(p, littleEndian);
    const type = view.getUint16(p + 2, littleEndian);
    const compCount = view.getUint32(p + 4, littleEndian);
    const valueField = view.getUint32(p + 8, littleEndian);
    p += 12;

    if (tag === 0x010f || tag === 0x0110) {
      const s = readAscii(type, compCount, valueField);
      if (s) {
        if (tag === 0x010f) out.make = s;
        else out.model = s;
      }
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

/** @returns null = EXIF 없음 또는 파싱 불가 → 업로드 허용 */
export function extractJpegExifMakeModel(buffer: ArrayBuffer): { make?: string; model?: string } | null {
  const u8 = new Uint8Array(buffer);
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null;

  const view = new DataView(buffer);
  let offset = 2;

  while (offset < u8.length - 1) {
    if (u8[offset] !== 0xff) {
      offset++;
      continue;
    }
    let marker = u8[offset + 1];
    offset += 2;

    if (marker === 0xd8) continue;
    if (marker === 0xd9 || marker === 0xda) break;

    if (offset + 2 > u8.length) break;
    const segLen = view.getUint16(offset, false);
    offset += 2;
    const dataEnd = offset + segLen - 2;
    if (dataEnd > u8.length) break;

    if (marker === 0xe1 && dataEnd - offset >= 6) {
      const ds = offset;
      if (
        u8[ds] === 0x45 &&
        u8[ds + 1] === 0x78 &&
        u8[ds + 2] === 0x69 &&
        u8[ds + 3] === 0x66 &&
        u8[ds + 4] === 0 &&
        u8[ds + 5] === 0
      ) {
        const tiffStart = ds + 6;
        if (tiffStart + 8 > dataEnd) {
          offset = dataEnd;
          continue;
        }
        const bom = view.getUint16(tiffStart, false);
        const littleEndian = bom === 0x4949;
        if (bom !== 0x4949 && bom !== 0x4d4d) {
          offset = dataEnd;
          continue;
        }
        const ifd0Rel = view.getUint32(tiffStart + 4, littleEndian);
        const mm = parseIfdMakeModel(view, buffer, tiffStart, ifd0Rel, dataEnd, littleEndian);
        if (mm) return mm;
      }
    }

    offset = dataEnd;
  }

  return null;
}

/** JPEG magic bytes: FF D8 FF */
function isJpegByMagicBytes(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 3) return false;
  const view = new Uint8Array(buf);
  return view[0] === 0xFF && view[1] === 0xD8 && view[2] === 0xFF;
}

/** 카메라 메타가 감지되면 true (업로드 차단). */
export async function shouldBlockCameraPhoto(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, Math.min(file.size, 512 * 1024)).arrayBuffer();
    // Magic bytes로 실제 JPEG 여부 판별 (확장자/MIME 우회 방지)
    if (!isJpegByMagicBytes(buf)) return false;

    const tags = extractJpegExifMakeModel(buf);
    if (!tags) return false;
    const make = (tags.make || '').trim();
    const model = (tags.model || '').trim();
    return make.length > 0 || model.length > 0;
  } catch {
    return false;
  }
}
