import type { Artist, Work } from '../data';
import { toPublicImageSrc } from '../utils/toPublicImageSrc';
import manifestRaw from './imagesV1Manifest.json';

export interface ImagesV1Entry {
  folder: string;
  artistName: string;
  bio?: string;
  groupName?: string;
  exhibitionName: string;
  isInstructor: boolean;
  profile: string | null;
  images: string[];
  pieceTitles: string[];
}

const manifest = manifestRaw as { entries: ImagesV1Entry[] };

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';

function slugifyArtistId(name: string, folder: string): string {
  const base = folder
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `images-v1-${base || name.replace(/\s+/g, '-').toLowerCase()}`;
}

export function buildImagesV1Artists(): Artist[] {
  return manifest.entries.map((e) => ({
    id: slugifyArtistId(e.artistName, e.folder),
    name: e.artistName,
    avatar: e.profile ? toPublicImageSrc(e.profile) : FALLBACK_AVATAR,
    bio: e.bio,
    followers: 400 + (Math.abs(hashStr(e.artistName)) % 3200),
    following: 30 + (Math.abs(hashStr(e.folder)) % 250),
  }));
}

export function buildImagesV1Works(artistsList: Artist[]): Work[] {
  return manifest.entries.map((entry, idx) => {
    const artistId = slugifyArtistId(entry.artistName, entry.folder);
    const artist =
      artistsList.find((a) => a.id === artistId) ??
      ({
        id: artistId,
        name: entry.artistName,
        avatar: entry.profile ? toPublicImageSrc(entry.profile) : FALLBACK_AVATAR,
        bio: entry.bio,
      } satisfies Artist);

    const imageSrcs = entry.images.map(toPublicImageSrc);
    const pieceTitles = entry.pieceTitles.map((t, i) => t?.trim() || `작품 ${i + 1}`);
    const leadTitle = pieceTitles[0] ?? entry.exhibitionName;

    // Phase 1은 가입 회원 대상 단일 업로더. 업로드 자체는 solo 전시로 구성한다.
    // (그룹명은 표시용 소속/모임으로만 쓰고 primaryExhibitionType은 solo 유지)
    const work: Work = {
      id: `images-v1-${idx}`,
      title: leadTitle,
      image: imageSrcs.length > 1 ? imageSrcs : imageSrcs[0] ?? '',
      imagePieceTitles: imageSrcs.length > 1 ? pieceTitles : undefined,
      artistId,
      artist,
      likes: 180 + ((idx * 37 + 11) % 1600),
      saves: 40 + ((idx * 23 + 7) % 420),
      description: entry.groupName
        ? `「${entry.exhibitionName}」 · ${entry.groupName} — 대표 작가 ${entry.artistName}`
        : `「${entry.exhibitionName}」 — 대표 작가 ${entry.artistName}`,
      tags: [entry.exhibitionName, entry.groupName, entry.artistName, 'Featured'].filter(
        (x): x is string => Boolean(x),
      ),
      exhibitionName: entry.exhibitionName,
      groupName: entry.groupName,
      primaryExhibitionType: 'solo',
      feedReviewStatus: 'approved',
      isInstructorUpload: entry.isInstructor || undefined,
      pick: true,
      pickBadge: true,
      uploadedAt: new Date().toISOString(),
    };

    return work;
  });
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
