import type { Artist, Work } from '../data';
import { groups, type WorkOwner } from '../groupData';
import { toPublicImageSrc } from '../utils/toPublicImageSrc';

type Bucket = 'ahn' | 'fileview' | 'web' | 'se' | 'ig' | 'imageye' | 'misc';

const BUCKET_ARTIST: Record<Bucket, string> = {
  ahn: 'local-ahn',
  fileview: 'local-fileview-general',
  web: 'local-botanical',
  se: 'local-surreal',
  ig: 'local-sketch',
  imageye: 'local-abstract',
  misc: 'local-studio',
};

/** 버킷 단위 그룹전(작품 성격에 맞는 전시 제목) */
const BUCKET_GROUP_EXHIBITION: Record<Exclude<Bucket, 'fileview' | 'misc'>, string> = {
  ahn: '유령 패션과 디지털 펜 — 안창홍 초대전',
  web: '숨 쉬는 꽃 — 화훼 디지털 연작전',
  se: '형태의 잔향 — 단색·공간 조형전',
  ig: '일상의 한 컷 — 디지털 스케치 모음전',
  imageye: '잔상과 붓터치 — 추상 매체전',
};

/** fileView 내보내기 묶음별 전시명 (시간 버킷으로 같은 배치 → 같은 전시) */
const FILEVIEW_EXHIBITIONS = [
  '밤의 유원지 — 겨울 일러스트레이션 전',
  '스크린 너머 — 디지털 드로잉 살롱',
  '파스텔과 모니터 — 일러스트 콜렉티브',
  '겨울빛 캔버스 — 시즌 디지털 전',
  '회전목마와 별 — 판타지 스케치 전',
  '부드러운 선 — 캐릭터·풍경 드로잉',
  '창가의 스케치북 — 일상 일러스트 모음',
  '달빛 스튜디오 — 야간 작업 아카이브',
  '수채 느낌 디지털 — 컬러 연습 전',
  '도시의 틈 — 소품·풍경 일러스트',
  '작은 동물원 — 크리처 일러스트 살롱',
  '봄을 기다리며 — 계절 스케치 전',
  '한 장의 편지 — 감성 일러스트 모음',
  '종이 위의 여행 — 판타지 풍경전',
  '무지개 톤 스터디 — 컬러 팔레트 전',
  '고요한 오후 — 실내·정물 일러스트',
  '바람에 실린 선 — 라이트 스케치 전',
  '새벽 작업실 — 나이트 드로잉 아카이브',
  '미니어처 월드 — 소형 풍경 일러스트',
  '펜터치 기록 — 드로잉 저널 전',
] as const;

/** 기타 파일(misc) 전시 제목 풀 */
const MISC_GROUP_EXHIBITIONS = [
  '로컬 아카이브 — 혼합 매체전',
  '스튜디오 로컬 — 실험 작품 모음',
  '이름 없는 드로잉 — 미분류 스케치전',
  '갤러리 박스 — 단발 작품 큐레이션',
] as const;

/** 직접 본 이미지·파일명 힌트 */
const OVERRIDES: Record<string, { title: string; artistId?: string; exhibitionName?: string; groupName?: string }> = {
  '/images/서울전시회_안창홍.jpg': {
    title: '코트 위의 흐름',
    exhibitionName: '호리아트 스페이스 초대전 — 패션 드로잉',
    groupName: '안창홍 스튜디오',
  },
  '/images/_서울_전시회_안창홍_유령패션_갤럭시_노트_디지털펜화_호리아트스페이스_(17).jpg': {
    title: '유령 패션 스케치 17',
    exhibitionName: '호리아트 스페이스 초대전 — 패션 드로잉',
    groupName: '안창홍 스튜디오',
  },
  '/images/369702721_777125777748569_3573259619719392013_n.jpg': {
    title: '팝 아트 수박',
    artistId: 'local-pop',
  },
  '/images/fileView - 2026-04-03T144611.475.jpg': {
    title: '한밤의 회전목마',
    artistId: 'local-cozy-illus',
    exhibitionName: '겨울 빛 디지털 살롱 — 판타지 일러스트',
  },
};

/** 장르별 제목 풀 — 버킷/화풍에 맞게 선택 */
const TITLE_POOLS = {
  daily: [
    '창가의 고요한 오후', '오후 네 시의 커피', '실내의 화분들', '거울 앞의 하루',
    '한 잔의 따뜻함', '책장 너머의 빛', '조용한 방의 시계', '스케치북 한 장',
    '옷걸이와 햇빛', '손끝의 온도', '두 사람의 거리', '일상의 자투리',
    '햇볕 아래의 낮잠', '오래된 책상', '창문 옆의 작은 소원', '하루의 끝자락',
  ],
  landscape: [
    '이른 봄의 산책로', '벚꽃이 지는 길', '파도 소리와 모래', '강가의 휴식',
    '골목 끝 풍경', '찬 공기 속 산책', '가을 골목의 발자국', '첫눈의 발자국',
    '바다 향기', '산 입구의 안내판', '강변의 벤치', '그림 같은 풍경',
    '들판 위의 바람', '언덕에서 본 풍경', '호수의 반영', '길 위의 하루',
  ],
  night: [
    '한 겨울 밤의 불빛', '별이 내리는 마을', '달빛 아래 독서', '밤하늘의 연등',
    '여름밤의 바람', '노을진 창고의 문', '야경 속 작은 빛', '별무리 아래서',
    '달과 구름의 밤', '도시의 불빛 사이', '새벽의 창', '조용한 골목의 가로등',
  ],
  botanical: [
    '작은 정원의 비밀', '풀잎에 맺힌 이슬', '비 오는 날의 우산', '봄을 담은 꽃잎',
    '정원의 첫 새싹', '햇살과 꽃잎', '화분 곁의 오후', '꽃잎의 결',
    '초록 위의 아침 이슬', '작은 들꽃들', '한 송이의 여름', '뿌리가 자라는 소리',
  ],
  abstract: [
    '물결 사이의 대화', '빛바랜 사진 한 장', '물감이 번진 순간', '그리움의 실루엣',
    '사각형 아래의 꿈', '종이 위의 선', '비어 있는 캔버스', '붓터치 잔향',
    '색의 경계에서', '흐려진 기억', '무채의 여운', '형태의 분해',
  ],
  animal: [
    '창밖을 보는 고양이', '쉬는 강아지의 오후', '작은 새의 노래', '고양이의 낮잠',
    '토끼의 한적한 오후', '공원의 비둘기', '창가의 햇살과 고양이', '하늘을 나는 새',
  ],
  fantasy: [
    '안개 낀 숲의 입구', '모퉁이를 돌면', '다시 만날 약속', '작별의 인사',
    '바람에 흔들리는 커튼', '잃어버린 지도', '동화 속의 길', '마법사의 작업실',
    '별을 담은 상자', '꿈속의 정원',
  ],
  food: [
    '갓 구운 빵의 냄새', '따뜻한 국수 한 그릇', '오후의 디저트', '커피와 책',
    '아침 식탁', '여름 과일 접시', '티타임의 풍경', '시장에서 온 채소',
  ],
  portrait: [
    '조용한 시선', '서 있는 자화상', '빛을 바라보는 사람', '누군가의 옆모습',
    '익숙한 얼굴', '먼 곳을 보는 이', '창가에 기댄 사람',
  ],
} as const;

type Genre = keyof typeof TITLE_POOLS;

/** 버킷·파일 패턴으로 장르 추정 */
function genreForBucket(bucket: Bucket): Genre {
  switch (bucket) {
    case 'ahn': return 'portrait';
    case 'web': return 'botanical';
    case 'se': return 'abstract';
    case 'ig': return 'daily';
    case 'imageye': return 'abstract';
    case 'fileview': return 'daily'; // 시간 버킷에 따라 런타임에 재조정
    case 'misc': return 'landscape';
  }
}

/** 시간 버킷 기반 장르 순환 — fileview 시간대별로 다른 장르 선택 → 같은 시간 배치는 같은 장르 */
const FILEVIEW_GENRE_ROTATION: Genre[] = ['daily', 'landscape', 'night', 'fantasy', 'botanical', 'abstract', 'food', 'animal'];

const ARTIST_ROTATION: string[] = [
  'local-rilin',
  'local-haeb',
  'local-sunnysun',
  'local-webtoon-clean',
  'local-cozy-illus',
  'local-minimal-graphic',
  'local-sketch',
  'local-pop',
  'local-abstract',
  'local-botanical',
  'local-surreal',
  'local-ahn',
  'local-fileview-general',
  'local-warm-palette',
  'local-night-scene',
  'local-daily-diary',
  'local-fantasy',
  'local-character',
  '13', '16', '17', '19', '21', '7', '10',
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function fileViewTimeBucket(norm: string): number {
  const m = norm.match(/fileView - \d{4}-\d{2}-\d{2}T(\d{2})(\d{2})(\d{2})\./i);
  if (m) return parseInt(m[1] + m[2] + m[3], 10);
  return 0;
}

function isIgStyleName(file: string): boolean {
  return /_\d+_n\.(jpe?g)$/i.test(file) || /^\d+_\d+_\d+_n\.(jpe?g)$/i.test(file.trim());
}

function classifyBucket(file: string): Bucket {
  const t = file.trim();
  const lower = t.toLowerCase();
  if (t.includes('안창홍') || t.includes('서울전시') || t.includes('_서울_')) return 'ahn';
  if (lower.includes('fileview')) return 'fileview';
  if (/^web\d+\.(jpe?g|png|webp)$/i.test(t)) return 'web';
  if (/^se-/i.test(t)) return 'se';
  if (isIgStyleName(t)) return 'ig';
  if (lower.includes('imageye')) return 'imageye';
  return 'misc';
}

function exhibitionForFileview(norm: string, h: number): string {
  const tb = fileViewTimeBucket(norm);
  const idx =
    tb > 0
      ? (tb * 17 + (h & 0xff)) % FILEVIEW_EXHIBITIONS.length
      : (h >> 9) % FILEVIEW_EXHIBITIONS.length;
  return FILEVIEW_EXHIBITIONS[idx] ?? FILEVIEW_EXHIBITIONS[0];
}

function exhibitionForMisc(h: number): string {
  const idx = (h >> 11) % MISC_GROUP_EXHIBITIONS.length;
  return MISC_GROUP_EXHIBITIONS[idx] ?? MISC_GROUP_EXHIBITIONS[0];
}

function hashedTitle(h: number, genre: Genre): string {
  const pool = TITLE_POOLS[genre];
  const base = pool[h % pool.length];
  // 같은 제목 반복 방지: 해시 하위 비트로 일부에 번호 접미 (연작 느낌)
  const variant = (h >> 12) % 97;
  return variant < 15 ? `${base} · ${variant + 1}` : base;
}

function getArtistById(artistsList: Artist[], id: string): Artist {
  return artistsList.find((a) => a.id === id) ?? artistsList[0];
}

/** 항상 의미 있는 제목 보장. 과거엔 랜덤 50%를 빈 문자열로 두었으나 UI 무제 카드가 너무 많아 제거 (2026-04) */
function maybePieceTitle(raw: string): string {
  return raw;
}

/** 작가별 개인전 풀 — solo 버킷 작가에게 부여 */
const SOLO_EXHIBITIONS: Record<string, string[]> = {
  'local-ahn': ['유령 패션 드로잉', '디지털 펜 연작'],
  'local-botanical': ['꽃을 닮은 날들', '숨 쉬는 정원'],
  'local-surreal': ['형태의 잔향', '조형과 침묵'],
  'local-pop': ['색의 계절', '여름 팝'],
  'local-sketch': ['일상의 한 컷', '드로잉 저널'],
  'local-abstract': ['붓터치 초상전', '잔상의 풍경'],
  'local-warm-palette': ['따뜻한 시선', '빛이 머문 자리'],
  'local-night-scene': ['도시의 밤', '달빛의 기록'],
  'local-daily-diary': ['오늘의 페이지', '하루 드로잉'],
  'local-fantasy': ['동화의 문', '꿈을 여는 방'],
  'local-character': ['캐릭터 아틀리에', '살아있는 인물들'],
  'local-cozy-illus': ['포근한 오후', '수채 일기'],
  'local-webtoon-clean': ['라인의 흐름', '깔끔한 장면들'],
};

function soloExhibitionFor(artistId: string, h: number): string {
  const list = SOLO_EXHIBITIONS[artistId];
  if (!list?.length) return '로컬 작가 개인전';
  return list[h % list.length];
}

/** 그룹 전시에 가끔 섞이는 비회원 참여 작가 이름 풀 — 프로필 없음, 팔로우 불가, bio 없음 */
const NON_MEMBER_GUEST_NAMES = [
  '박승우', '이다영', '김태현', '최은지', '한지훈',
  '송혜린', '권도윤', '조민서', '배수민', '유진아',
  '장우진', '문가람', '백지원', '오현서', '임채원',
];

export function buildLocalPublicWorks(paths: string[], artistsList: Artist[]): Work[] {
  const counters: Record<Bucket, number> = {
    ahn: 1, fileview: 1, web: 1, se: 1, ig: 1, imageye: 1, misc: 1,
  };

  const baseWorks = paths.map((rawPath, i) => {
    const path = toPublicImageSrc(rawPath);
    const norm = rawPath.trim();
    const file = norm.replace(/^\/images\//, '');
    const h = hashStr(norm);
    const bucket = classifyBucket(file);
    const ovr = OVERRIDES[norm];

    // fileview는 시간 배치별 장르 고정 → 동일 전시 안에서 장르 일관
    const tb = bucket === 'fileview' ? fileViewTimeBucket(norm) : 0;
    const genre: Genre =
      bucket === 'fileview' && tb > 0
        ? FILEVIEW_GENRE_ROTATION[tb % FILEVIEW_GENRE_ROTATION.length]
        : genreForBucket(bucket);

    let title: string;
    let artistId: string;

    if (ovr) {
      counters[bucket] += 1;
      title = ovr.title;
      artistId = ovr.artistId ?? BUCKET_ARTIST[bucket];
    } else if (bucket === 'fileview') {
      counters[bucket] += 1;
      // fileview는 그룹전시 — 여러 작가 로테이션
      artistId = ARTIST_ROTATION[h % ARTIST_ROTATION.length];
      title = hashedTitle(h, genre);
    } else if (bucket === 'ig') {
      const n = counters[bucket]++;
      artistId = ARTIST_ROTATION[(h + n) % ARTIST_ROTATION.length];
      title = hashedTitle(h ^ (n * 31), genre);
    } else if (bucket === 'misc') {
      const n = counters[bucket]++;
      // misc는 일부만 개인작가(랜덤 풀), 일부는 그룹 스튜디오
      artistId = (h % 100 < 35)
        ? ARTIST_ROTATION[(h >> 5) % ARTIST_ROTATION.length]
        : BUCKET_ARTIST[bucket];
      // 파일명(타임스탬프 등)은 제목으로 쓰지 않음 — 항상 장르 풀에서 선택
      title = hashedTitle(h ^ (n * 17), genre);
    } else {
      // 개인 작가 버킷 (ahn, web, se, imageye) — 본인 작품 시리즈
      const n = counters[bucket]++;
      artistId = BUCKET_ARTIST[bucket];
      title = hashedTitle(h ^ (n * 11), genre);
    }

    title = maybePieceTitle(title);

    // 개인/그룹 전시 분류:
    //  - fileview, ig: 기본 group
    //  - ahn/web/se/imageye/misc: 기본 solo (작가별 개인전)
    //  - 단, 해시 일부(약 15%)는 반대로 전환 → 데이터 다양성
    const coinFlip = h % 100;
    const defaultGroup = bucket === 'fileview' || bucket === 'ig';
    const isGroup = defaultGroup ? coinFlip >= 12 : coinFlip < 15;
    const primaryExhibitionType: Work['primaryExhibitionType'] = isGroup ? 'group' : 'solo';

    let artist: Artist;
    let groupName: string | undefined;
    let coOwners: Artist[] | undefined;
    let owner: WorkOwner | undefined;

    if (isGroup) {
      // 그룹전시: 실제 groups[] 중 해시로 하나 선택 → groupName 부여
      // 단일 이미지 작품이므로 1장 = 1작가 원칙 적용: 대표 작가 1명만, coOwners 없음
      const group = groups[h % groups.length];
      const memberIds = group.memberIds ?? [];
      const resolvedMembers = memberIds
        .map((mid) => artistsList.find((a) => a.id === mid))
        .filter((a): a is Artist => Boolean(a));
      if (resolvedMembers.length > 0) {
        const leadIdx = h % resolvedMembers.length;
        artist = resolvedMembers[leadIdx];
        artistId = artist.id;
      } else {
        artist = getArtistById(artistsList, artistId);
      }
      groupName = group.name;
      owner = { type: 'group', data: group };
    } else {
      // 개인전시: 기존 경로 그대로 (artistId → Artist)
      artist = getArtistById(artistsList, artistId);
      // 원본 override에 groupName이 지정되어 있으면 유지(호환)
      groupName = ovr?.groupName;
    }

    // 전시명 결정
    let exhibitionName: string;
    if (ovr?.exhibitionName) {
      exhibitionName = ovr.exhibitionName;
    } else if (isGroup) {
      exhibitionName =
        bucket === 'fileview' ? exhibitionForFileview(norm, h)
          : bucket === 'misc' ? exhibitionForMisc(h)
            : BUCKET_GROUP_EXHIBITION[bucket as keyof typeof BUCKET_GROUP_EXHIBITION]
            ?? exhibitionForMisc(h);
    } else {
      exhibitionName = soloExhibitionFor(artistId, h);
    }

    const titleFinal = title && title.length > 48 ? `${title.slice(0, 45)}…` : title;
    const tagList = [exhibitionName, artist.name, '로컬 갤러리'];
    if (groupName) tagList.splice(1, 0, groupName);

    // 단일 이미지 그룹 전시 기여작은 imageArtists를 비워두고 owner.memberIds 폴백에 맡긴다.
    // 정책: 그룹 전시는 2+ 작가 필수. imageArtists에 1명만 넣으면 카드 peek에 1명만 노출돼
    // 정책 위배로 보이므로, 그룹 맥락은 소유 그룹 전체 멤버로 대체. (2026-04-17)
    // 여러 장이 같은 전시·그룹 키로 묶인 경우 아래 groupMultiMocks 단계에서 실제 기여자로 재구성.
    const imageArtists: Work['imageArtists'] | undefined = undefined;

    return {
      id: `local-img-${i}`,
      title: titleFinal,
      image: path,
      artistId: artist.id,
      artist,
      coOwners,
      owner,
      imageArtists,
      likes: (i * 17 + 11) % 2400 + 3,
      saves: (i * 11 + 7) % 600 + 1,
      description: groupName
        ? `전시 「${exhibitionName}」·그룹 「${groupName}」에 속한 작품입니다. 대표 작가 ${artist.name}. public/images 로컬 갤러리.`
        : `전시 「${exhibitionName}」에 속한 작품입니다. 대표 작가 ${artist.name}. public/images 로컬 갤러리.`,
      tags: tagList,
      feedReviewStatus: 'approved',
      exhibitionName,
      groupName,
      primaryExhibitionType,
    } satisfies Work;
  });

  // 그룹전시 목업: "대부분이 다장"으로 보이도록 단장 그룹 작품을 전시 단위로 묶는다.
  const groupBuckets = new Map<string, Work[]>();
  const groupSingles = baseWorks.filter(
    (w) =>
      w.primaryExhibitionType === 'group' &&
      !Array.isArray(w.image),
  );
  for (const w of groupSingles) {
    const key = `${w.groupName ?? w.artistId}::${w.exhibitionName ?? ''}`;
    const list = groupBuckets.get(key);
    if (list) list.push(w);
    else groupBuckets.set(key, [w]);
  }

  const groupMultiMocks: Work[] = [];
  const removeGroupSingleIds = new Set<string>();
  const sortedGroupBuckets = Array.from(groupBuckets.values()).sort((a, b) => b.length - a.length);
  const targetGroupedCoverage = Math.round(groupSingles.length * 0.72);
  let groupedCoverage = 0;
  let groupMockIdx = 0;
  for (const list of sortedGroupBuckets) {
    if (groupedCoverage >= targetGroupedCoverage) break;
    if (list.length < 2) continue;

    const picked = list.slice(0, Math.min(6, list.length));
    const imageList = picked
      .map((w) => (Array.isArray(w.image) ? w.image[0] : w.image))
      .filter((src): src is string => Boolean(src));
    if (imageList.length < 2) continue;

    const lead = picked[0];
    const pieceTitles = picked.map((w, idx) => w.title?.trim() || `작품 ${idx + 1}`);
    const imageArtists: Work['imageArtists'] = picked.map((w) => ({
      type: 'member' as const,
      memberId: w.artist.id,
      memberName: w.artist.name,
      memberAvatar: w.artist.avatar,
    }));

    groupMultiMocks.push({
      ...lead,
      id: `local-group-multi-${groupMockIdx++}`,
      image: imageList,
      imagePieceTitles: pieceTitles,
      imageArtists,
      title: pieceTitles[0],
      likes: lead.likes + imageList.length * 7,
      saves: lead.saves + imageList.length * 3,
      primaryExhibitionType: 'group',
    });

    for (const w of picked) {
      removeGroupSingleIds.add(w.id);
    }
    groupedCoverage += picked.length;
  }

  const baseWorksAfterGroupMerge = baseWorks.filter((w) => !removeGroupSingleIds.has(w.id));

  // 둘러보기 목업 다양성: 개인전시(solo)의 약 30%를 다장 업로드 케이스로 합성한다.
  const soloBuckets = new Map<string, Work[]>();
  const soloSingles: Work[] = [];
  for (const w of baseWorksAfterGroupMerge) {
    if (w.primaryExhibitionType !== 'solo') continue;
    if (w.groupName) continue;
    if (Array.isArray(w.image)) continue;
    soloSingles.push(w);
    const key = `${w.artistId}::${w.exhibitionName ?? ''}`;
    const list = soloBuckets.get(key);
    if (list) list.push(w);
    else soloBuckets.set(key, [w]);
  }

  const toSoloMultiMock = (list: Work[], mockId: string): Work | null => {
    const picked = list.slice(0, Math.min(4, list.length));
    const imageList = picked
      .map((w) => (Array.isArray(w.image) ? w.image[0] : w.image))
      .filter((src): src is string => Boolean(src));
    if (imageList.length < 2) return null;

    const pieceTitles = picked.map((w, idx) => w.title?.trim() || `작품 ${idx + 1}`);
    const lead = picked[0];
    return {
      ...lead,
      id: mockId,
      image: imageList,
      imagePieceTitles: pieceTitles,
      title: pieceTitles[0],
      // 원본 단일 작품보다 살짝 높은 노출 수치로 목업 카드가 섞여 보이게 조정
      likes: lead.likes + imageList.length * 9,
      saves: lead.saves + imageList.length * 4,
      primaryExhibitionType: 'solo',
    } satisfies Work;
  };

  const candidateGroups = Array.from(soloBuckets.values())
    .filter((list) => list.length >= 3)
    .sort((a, b) => b.length - a.length);

  const soloMultiMocks: Work[] = [];
  let mockIdx = 0;
  const targetSoloMultiCount = Math.max(1, Math.round(soloSingles.length * 0.3));
  const pickedGroupKeys = new Set<string>();
  for (const list of candidateGroups) {
    if (soloMultiMocks.length >= targetSoloMultiCount) break;
    const key = `${list[0]?.artistId ?? 'unknown'}::${list[0]?.exhibitionName ?? ''}`;
    if (pickedGroupKeys.has(key)) continue;
    const mock = toSoloMultiMock(list, `local-solo-multi-${mockIdx++}`);
    if (mock) {
      soloMultiMocks.push(mock);
      pickedGroupKeys.add(key);
    }
  }

  // 카테(id: 1)도 개인전시 중 약 30%가 다장으로 보이도록 별도 보정한다.
  const kateSingles = soloSingles.filter((w) => w.artistId === '1');
  const kateTargetSoloMultiCount =
    kateSingles.length > 0 ? Math.max(1, Math.round(kateSingles.length * 0.3)) : 0;
  let kateCurrentSoloMultiCount = soloMultiMocks.filter((w) => w.artistId === '1').length;

  if (kateCurrentSoloMultiCount < kateTargetSoloMultiCount) {
    const kateGroups = candidateGroups.filter((list) => list[0]?.artistId === '1');
    for (const list of kateGroups) {
      if (kateCurrentSoloMultiCount >= kateTargetSoloMultiCount) break;
      const key = `${list[0]?.artistId ?? 'unknown'}::${list[0]?.exhibitionName ?? ''}`;
      if (pickedGroupKeys.has(key)) continue;
      const kateMock = toSoloMultiMock(list, `local-solo-multi-kate-${mockIdx++}`);
      if (!kateMock) continue;
      soloMultiMocks.unshift(kateMock);
      pickedGroupKeys.add(key);
      kateCurrentSoloMultiCount += 1;
    }

    // 같은 전시 그룹이 부족하면 카테 단일 작품을 3장씩 묶어 추가 생성해 비율을 맞춘다.
    while (kateCurrentSoloMultiCount < kateTargetSoloMultiCount && kateSingles.length >= 3) {
      const start = (kateCurrentSoloMultiCount * 2) % (kateSingles.length - 2);
      const windowed = kateSingles.slice(start, start + 3);
      const kateMock = toSoloMultiMock(windowed, `local-solo-multi-kate-${mockIdx++}`);
      if (!kateMock) break;
      soloMultiMocks.unshift(kateMock);
      kateCurrentSoloMultiCount += 1;
    }
  }

  const mergedWorks: Work[] = [...baseWorksAfterGroupMerge, ...groupMultiMocks, ...soloMultiMocks];

  // 둘러보기 확인용 목업:
  // 그룹전시의 약 30%를 "복지관/문화센터" 톤의 강사 업로드로 표시한다.
  // B안 준수: 업로더(강사)는 imageArtists에 포함되지 않는다 — 기존 작가는 수강생으로 남기고
  // artistId/artist만 별도 강사 persona로 교체한다.
  const instructorPool = ['local-botanical', 'local-character', 'local-night-scene'] as const;
  const instructorGroupNamePool = [
    '강남복지관',
    '송파문화센터',
    '마포복지관',
    '종로문화센터',
    '노원복지관',
    '광진문화센터',
    '수원복지관',
    '분당문화센터',
    '부산진복지관',
    '해운대문화센터',
    '대구수성복지관',
    '광주북구문화센터',
    '전주완산복지관',
    '창원성산문화센터',
    '청주상당복지관',
  ] as const;
  const groupWorks = mergedWorks.filter((w) => w.primaryExhibitionType === 'group');
  const instructorTarget = Math.round(groupWorks.length * 0.3);
  const instructorCandidates = [...groupWorks].sort((a, b) => {
    const ah = hashStr(`${a.id}:${a.groupName ?? ''}:${a.exhibitionName ?? ''}`);
    const bh = hashStr(`${b.id}:${b.groupName ?? ''}:${b.exhibitionName ?? ''}`);
    return ah - bh;
  });
  for (let i = 0; i < instructorCandidates.length; i++) {
    const w = instructorCandidates[i]!;
    const makeInstructor = i < instructorTarget;
    if (!makeInstructor) {
      w.isInstructorUpload = false;
      continue;
    }
    // 원 작가(수강생)가 강사 풀에 포함되어 있으면 다른 강사를 선택 — B안(업로더≠참여자) 유지
    const studentId = w.artistId;
    const eligible = instructorPool.filter((id) => id !== studentId);
    if (eligible.length === 0) {
      w.isInstructorUpload = false;
      continue;
    }
    const instructorId = eligible[hashStr(`${w.id}:inst-persona`) % eligible.length]!;
    const instructor = artistsList.find((a) => a.id === instructorId);
    if (!instructor) {
      w.isInstructorUpload = false;
      continue;
    }
    w.artistId = instructor.id;
    w.artist = instructor;
    w.isInstructorUpload = true;
    const nameIdx = hashStr(`${w.id}:inst-group`) % instructorGroupNamePool.length;
    w.groupName = instructorGroupNamePool[nameIdx];
  }

  // Artier's Pick 목업:
  // - 운영 5주 가정: 누적 Pick 이력 50개
  // - 이력 구성: 개인 25 + 그룹 25
  // - 현재 주간 활성 Pick 10개: 개인 5 + 그룹 5
  const pickCandidates = mergedWorks.filter((w) => w.feedReviewStatus === 'approved' && !w.isHidden);
  const ordered = [...pickCandidates].sort((a, b) => {
    const ah = hashStr(`${a.id}:${a.artistId}:${a.exhibitionName ?? ''}`);
    const bh = hashStr(`${b.id}:${b.artistId}:${b.exhibitionName ?? ''}`);
    return ah - bh;
  });

  const soloOrdered = ordered.filter((w) => w.primaryExhibitionType === 'solo');
  const groupOrdered = ordered.filter((w) => w.primaryExhibitionType === 'group');
  const soloHistoryTarget = Math.min(25, soloOrdered.length);
  const groupHistoryTarget = Math.min(25, groupOrdered.length);
  const historyPicks = [
    ...soloOrdered.slice(0, soloHistoryTarget),
    ...groupOrdered.slice(0, groupHistoryTarget),
  ];

  // 한쪽이 부족하면 남는 슬롯을 다른 쪽에서 채워 총 50에 최대한 맞춘다.
  if (historyPicks.length < 50) {
    const pickedIds = new Set(historyPicks.map((w) => w.id));
    for (const w of ordered) {
      if (historyPicks.length >= 50) break;
      if (pickedIds.has(w.id)) continue;
      historyPicks.push(w);
      pickedIds.add(w.id);
    }
  }

  const historyIds = new Set(historyPicks.map((w) => w.id));
  const soloHistory = historyPicks.filter((w) => w.primaryExhibitionType === 'solo');
  const groupHistory = historyPicks.filter((w) => w.primaryExhibitionType === 'group');
  const activePicks = [
    ...soloHistory.slice(Math.max(0, soloHistory.length - Math.min(5, soloHistory.length))),
    ...groupHistory.slice(Math.max(0, groupHistory.length - Math.min(5, groupHistory.length))),
  ];
  const activeIds = new Set(activePicks.map((w) => w.id));

  for (const w of ordered) {
    w.editorsPick = historyIds.has(w.id);
    w.pick = activeIds.has(w.id);
  }

  return mergedWorks;
}
