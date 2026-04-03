import type { Artist, Work } from '../data';
import { toPublicImageSrc } from '../utils/toPublicImageSrc';

type Bucket = 'ahn' | 'web' | 'se' | 'ig' | 'imageye' | 'misc';

/** 패턴별 기본 작가 (data.ts의 id와 일치) */
const BUCKET_ARTIST: Record<Bucket, string> = {
  ahn: 'local-ahn',
  web: 'local-botanical',
  se: 'local-surreal',
  ig: 'local-sketch',
  imageye: 'local-abstract',
  misc: 'local-studio',
};

/** 알려진 경로만 작품명·작가 보정 (샘플 이미지 확인 + 파일명 힌트) */
const TITLES_BY_PATH: Record<string, { title: string; artistId?: string }> = {
  '/images/web0.jpg': { title: '글로리오사' },
  '/images/web1.jpg': { title: '맨드라미 들판' },
  '/images/서울전시회_안창홍.jpg': { title: '코트 위의 흐름' },
  '/images/369702721_777125777748569_3573259619719392013_n.jpg': { title: '팝 아트 수박', artistId: 'local-pop' },
  '/images/imageye___-_.jpg': { title: '푸른 명상' },
  '/images/SE-24a755f9-7d06-4291-9bf1-1e4663250636.jpg': { title: '노란 좌위와 물감' },
};

/** Instagram export 스타일 파일명 */
function isIgStyleName(file: string): boolean {
  return /_\d+_n\.(jpe?g)$/i.test(file) || /^\d+_\d+_\d+_n\.(jpe?g)$/i.test(file.trim());
}

function classifyBucket(file: string): Bucket {
  const t = file.trim();
  const lower = t.toLowerCase();
  if (lower.includes('fileview') || t.includes('안창홍') || t.includes('서울전시')) return 'ahn';
  if (/^web\d+\.(jpe?g|png|webp)$/i.test(t)) return 'web';
  if (/^se-/i.test(t)) return 'se';
  if (isIgStyleName(t)) return 'ig';
  if (lower.includes('imageye')) return 'imageye';
  return 'misc';
}

function titleForBucket(bucket: Bucket, serial: number, file: string): string {
  switch (bucket) {
    case 'ahn':
      return `디지털 펜 드로잉 ${serial}`;
    case 'web':
      return `화훼 연작 ${serial}`;
    case 'se':
      return `형태의 잔향 ${serial}`;
    case 'ig':
      return `스케치 노트 ${serial}`;
    case 'imageye':
      return `추상 초상 ${serial}`;
    case 'misc': {
      const base = file.replace(/\.[^.]+$/i, '').trim();
      if (base.length >= 2 && base.length <= 40 && !/^\d+$/.test(base)) return base;
      return `갤러리 작품 ${serial}`;
    }
  }
}

function getArtistById(artistsList: Artist[], id: string): Artist {
  return artistsList.find((a) => a.id === id) ?? artistsList[0];
}

export function buildLocalPublicWorks(paths: string[], artistsList: Artist[]): Work[] {
  const counters: Record<Bucket, number> = {
    ahn: 1,
    web: 1,
    se: 1,
    ig: 1,
    imageye: 1,
    misc: 1,
  };

  return paths.map((rawPath, i) => {
    const path = toPublicImageSrc(rawPath);
    const norm = rawPath.trim();
    const file = norm.replace(/^\/images\//, '');

    const ovr = TITLES_BY_PATH[norm];
    const bucket = classifyBucket(file);
    let title: string;
    let artistId: string;

    if (ovr) {
      counters[bucket] += 1;
      title = ovr.title;
      artistId = ovr.artistId ?? BUCKET_ARTIST[bucket];
    } else {
      const n = counters[bucket]++;
      artistId = BUCKET_ARTIST[bucket];
      title = titleForBucket(bucket, n, file);
    }

    const titleFinal = title.length > 48 ? `${title.slice(0, 45)}…` : title;
    const artist = getArtistById(artistsList, artistId);

    return {
      id: `local-img-${i}`,
      title: titleFinal,
      image: path,
      artistId: artist.id,
      artist,
      likes: (i * 17 + 11) % 2400 + 3,
      saves: (i * 11 + 7) % 600 + 1,
      comments: (i * 5) % 80,
      category: 'art',
      description: `${artist.name} · public/images 로컬 갤러리입니다.`,
      tags: [artist.name, '로컬 갤러리'],
      feedReviewStatus: 'approved',
    } satisfies Work;
  });
}
