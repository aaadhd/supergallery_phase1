import type { Artist, Work } from '../data';
import { toPublicImageSrc } from '../utils/toPublicImageSrc';

type Bucket = 'ahn' | 'fileview' | 'web' | 'se' | 'ig' | 'imageye' | 'misc';

/** 패턴별 기본 작가 (data.ts의 id와 일치) */
const BUCKET_ARTIST: Record<Bucket, string> = {
  ahn: 'local-ahn',
  fileview: 'local-fileview-general',
  web: 'local-botanical',
  se: 'local-surreal',
  ig: 'local-sketch',
  imageye: 'local-abstract',
  misc: 'local-studio',
};

/** 알려진 경로만 작품명·작가 보정 (샘플 이미지 확인 + WebP는 PNG 변환 후 감상) */
const TITLES_BY_PATH: Record<string, { title: string; artistId?: string; groupName?: string }> = {
  '/images/web0.jpg': { title: '글로리오사' },
  '/images/web1.jpg': { title: '맨드라미 들판' },
  '/images/서울전시회_안창홍.jpg': { title: '코트 위의 흐름' },
  '/images/369702721_777125777748569_3573259619719392013_n.jpg': { title: '팝 아트 수박', artistId: 'local-pop' },
  '/images/imageye___-_.jpg': { title: '푸른 명상' },
  '/images/SE-24a755f9-7d06-4291-9bf1-1e4663250636.jpg': { title: '노란 좌위와 물감' },
  // fileView (n).webp — macOS sips로 변환 후 내용 기반 제목·작가
  '/images/fileView (1).webp': { title: '신발과 손주 운동화', artistId: 'local-cozy-illus' },
  '/images/fileView (2).webp': { title: '말차 딸기 파르페', artistId: 'local-rilin' },
  '/images/fileView (3).webp': { title: '바삭한 달래 모양 튀김', artistId: 'local-rilin' },
  '/images/fileView (4).webp': { title: '하늘빛 들꽃', artistId: 'local-rilin' },
  '/images/fileView (5).webp': { title: '데이지와 금빛 테두리', artistId: 'local-cozy-illus' },
  '/images/fileView (6).webp': { title: '활을 당기는 소년', artistId: 'local-webtoon-clean' },
  '/images/fileView (7).webp': { title: '해피 퍼피 데이', artistId: 'local-haeb' },
  '/images/fileView (8).webp': { title: '함께 걷는 첫눈', artistId: 'local-webtoon-clean' },
  '/images/fileView (9).webp': { title: '작은 재봉소', artistId: 'local-cozy-illus' },
  '/images/fileView (10).webp': { title: '네 시, 책상 위의 오후', artistId: 'local-sunnysun' },
  '/images/fileView (11).webp': { title: '파스텔 헤어핀 여덟', artistId: 'local-rilin' },
  '/images/fileView (12).webp': { title: '숙성된 바나나', artistId: 'local-minimal-graphic' },
  '/images/fileView (13).webp': { title: '집 안 냥이의 달리기', artistId: 'local-minimal-graphic' },
  '/images/fileView (14).webp': { title: '손으로 받는 물줄기', artistId: 'local-cozy-illus' },
  '/images/fileView (15).webp': { title: '별 밤과 물결', artistId: 'local-cozy-illus' },
  '/images/fileView (17).webp': { title: '붉은 카네이션 드로잉', artistId: 'local-minimal-graphic' },
  '/images/fileView (18).webp': { title: '눈 쌓인 길의 발자국', artistId: 'local-cozy-illus' },
  '/images/fileView (20).webp': { title: '모래빛 나뭇잎', artistId: 'local-minimal-graphic' },
  '/images/fileView (21).webp': { title: '조약돌과 풀잎', artistId: 'local-minimal-graphic' },
  '/images/fileView (23).webp': { title: '바람에 날리는 곡선', artistId: 'local-minimal-graphic' },
  '/images/fileView (25).webp': { title: '두 개의 겨울 가지', artistId: 'local-minimal-graphic' },
  '/images/fileView (26).webp': { title: '둥근 잎사귀', artistId: 'local-minimal-graphic' },
  '/images/fileView (29).webp': { title: '솔방울 스케치', artistId: 'local-minimal-graphic' },
  '/images/fileView (30).webp': { title: '부채꼴 잎의 나열', artistId: 'local-minimal-graphic' },
  '/images/fileView (31).webp': { title: '어린 침엽수 가지', artistId: 'local-minimal-graphic' },
  '/images/fileView (32).webp': { title: '어둠 속의 파편', artistId: 'local-abstract' },
  '/images/fileView (34).webp': { title: '심연을 건너는 배', artistId: 'local-webtoon-clean' },
  '/images/fileView (35).webp': { title: '푸른 배경의 단발머리 소녀', artistId: 'local-sunnysun' },
  '/images/fileView (36).webp': { title: '돌담과 노란 꽃밭', artistId: 'local-sunnysun' },
  '/images/fileView (37).webp': { title: '겨울밤 불빛 아래의 연인', artistId: 'local-webtoon-clean' },
  '/images/fileView (38).webp': { title: '초록 들판 위의 리프트', artistId: 'local-cozy-illus' },
  '/images/fileView (39).webp': { title: '가을 포항 여행 일기', artistId: 'local-sketch' },
  '/images/fileView (40).webp': { title: '왕과 사는 남자', artistId: 'local-webtoon-clean' },
  '/images/fileView (41).webp': { title: '햇살 가득한 오후의 명상', artistId: 'local-cozy-illus' },
  '/images/fileView (42).webp': { title: '흩날리는 벚꽃 길 산책', artistId: 'local-haeb' },
  '/images/fileView (43).webp': { title: '별구름 바다와 돌고래', artistId: 'local-sunnysun' },
  '/images/fileView (44).webp': { title: '세 사람의 일상', artistId: 'local-cozy-illus' },
  '/images/fileView (45).webp': { title: '빨간 목도리와 코트', artistId: 'local-sunnysun' },
  '/images/fileView (46).webp': { title: '더플코트와 스카프', artistId: 'local-sunnysun' },
  '/images/fileView (47).webp': { title: '봄동 비빔밥', artistId: 'local-rilin' },
  '/images/fileView (48).webp': { title: '보라빛 꽃밭의 오후', artistId: 'local-cozy-illus' },
  '/images/fileView (49).webp': { title: '삼일절 기념 일러스트', artistId: 'local-sketch' },
  '/images/fileView (50).webp': { title: '레이디 두마의 인물들', artistId: 'local-webtoon-clean' },
  '/images/fileView (51).webp': { title: '2026 해피 뉴 이어', artistId: 'local-pop' },
  '/images/fileView (52).webp': { title: '입춘대길', artistId: '4', groupName: '봄을 여는 시선전' },
  '/images/fileView (53).webp': { title: '싱그러운 야채 씻기', artistId: '5' },
  '/images/fileView (54).webp': { title: '별빛을 담은 손', artistId: '10' },
  '/images/fileView (55).webp': { title: '퇴근역의 노을', artistId: '16', groupName: '일상의 온기전' },
  '/images/fileView (56).webp': { title: '거대한 꽃들 사이에서', artistId: '13', groupName: '봄을 여는 시선전' },
  '/images/fileView (57).webp': { title: '푸른 꽃을 든 단발소녀', artistId: '7' },
  '/images/fileView (58).webp': { title: '온전한 내가 되기', artistId: '21', groupName: '자아 발견 그룹전' },
  '/images/fileView (59).webp': { title: 'Lovely Time!', artistId: '1' },
  '/images/fileView (60).webp': { title: '눈 내리는 오두막', artistId: '6' },
  '/images/fileView (61).webp': { title: '구름 아래 꽃길', artistId: '24', groupName: '봄을 여는 시선전' },
  '/images/fileView (62).webp': { title: '초록 아치와 비밀의 화원', artistId: '24', groupName: '봄날의 자연전' },
  '/images/fileView (63).webp': { title: '비상하는 흰 비둘기', artistId: '19', groupName: '봄날의 자연전' },
  '/images/fileView (64).webp': { title: '버드나무 아래의 휴식', artistId: '21', groupName: '여행의 기억전' },
  '/images/fileView (65).webp': { title: '다리가 보이는 카페 창가', artistId: '16', groupName: '여행의 기억전' },
  '/images/fileView (66).webp': { title: '억새꽃 흩날리는 하늘', artistId: '22' },
  '/images/fileView (67).webp': { title: '보라빛 둥근 꽃과 들판', artistId: '24', groupName: '봄날의 자연전' },
  '/images/fileView (68).webp': { title: '숲 위로 보이는 도시 풍경', artistId: '19' },
  '/images/fileView (69).webp': { title: '행복했던 바다 여행', artistId: '21', groupName: '여행의 기억전' },
  '/images/fileView (70).webp': { title: '노을 지는 바닷가', artistId: '17' },
  '/images/fileView (71).webp': { title: '토끼와 함께하는 봄날', artistId: '13', groupName: '동화 속 세상전' },
  '/images/fileView (72).webp': { title: '햇살 아래 미소', artistId: '10', groupName: '일러스트 인물전' },
  '/images/fileView (73).webp': { title: '푸른 드레스와 산양', artistId: '14', groupName: '일러스트 인물전' },
  '/images/fileView (74).webp': { title: '거울공주 유니콘', artistId: '20', groupName: '마인드 일러스트전' },
  '/images/fileView (75).webp': { title: '바텐더 유니콘', artistId: '20', groupName: '마인드 일러스트전' },
  '/images/fileView (76).webp': { title: '요리사 유니콘과 계란', artistId: '20' },
  '/images/fileView (77).webp': { title: '김밥 먹방 유니콘', artistId: '20' },
  '/images/fileView (78).webp': { title: '새들에게 파묻힌 유니콘', artistId: '20', groupName: '마인드 일러스트전' },
  '/images/fileView (79).webp': { title: '유니콘의 편지', artistId: '20' },
  '/images/fileView (80).webp': { title: '지렁이와 뱀 소동', artistId: '20' },
  '/images/fileView (81).webp': { title: '유니콘 초상화 갤러리', artistId: '20', groupName: '마인드 일러스트전' },
  '/images/fileView (82).webp': { title: '찜기 속 유니콘과 만두', artistId: '20', groupName: '마인드 일러스트전' },
  '/images/fileView (83).webp': { title: '알록달록 종이 조명', artistId: '4' },
  '/images/fileView (84).webp': { title: '바다 위 강렬한 노을', artistId: '19' },
  '/images/fileView (85).webp': { title: '두바이 초콜릿 다이어리', artistId: '16', groupName: '다이어리 기록전' },
  '/images/fileView (86).webp': { title: '노란 꽃과 초록 원피스', artistId: '13', groupName: '여인상 시리즈' },
  '/images/fileView (87).webp': { title: '하트와 목도리 소녀', artistId: '13', groupName: '여인상 시리즈' },
  '/images/fileView (88).webp': { title: '만년설을 담는 사진가', artistId: '21', groupName: '풍경과 사람들' },
  '/images/fileView (89).webp': { title: '빗방울과 맨발의 소녀', artistId: '13', groupName: '여인상 시리즈' },
  '/images/fileView (91).webp': { title: '아련한 시선의 여인', artistId: '10', groupName: '일러스트 인물전' },
  '/images/fileView (92).webp': { title: '크리스마스 트리 앞 친구들', artistId: '17', groupName: '동화 속 세상전' },
  '/images/fileView (93).webp': { title: '흑백요리사 팬아트', artistId: '16' },
  '/images/fileView (94).webp': { title: '여름 햇살 속 산책', artistId: '17', groupName: '여름날의 산책전' },
  '/images/fileView (95).webp': { title: '독서와 강아지', artistId: '21', groupName: '일상의 온기전' },
  '/images/fileView (96).webp': { title: '도심 속 빛나는 별', artistId: '8', groupName: '도시풍경전' },
  '/images/fileView (97).webp': { title: '눈사람 창가 풍경', artistId: '17', groupName: '동화 속 세상전' },
  '/images/fileView (98).webp': { title: '겨울 숲속 눈길 편지', artistId: '17', groupName: '동화 속 세상전' },
};

/** Instagram export 스타일 파일명 */
function isIgStyleName(file: string): boolean {
  return /_\d+_n\.(jpe?g)$/i.test(file) || /^\d+_\d+_\d+_n\.(jpe?g)$/i.test(file.trim());
}

function classifyBucket(file: string): Bucket {
  const t = file.trim();
  const lower = t.toLowerCase();
  if (t.includes('안창홍') || t.includes('서울전시')) return 'ahn';
  if (lower.includes('fileview')) return 'fileview';
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
    case 'fileview':
      return `컬러 일러스트 ${serial}`;
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

const HUMAN_ARTIST_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
const RANDOM_GROUPS = ['빛과 아크릴전', '시선의 흔적들', '도심 속 휴식전', '일상의 조각들', '초록의 향연전', '새로운 봄날전'];
const ADJ = ['따뜻한', '고요한', '흩날리는', '반짝이는', '아련한', '포근한', '신비로운', '생동감 넘치는', '오후의', '깊은 밤의', '푸른', '빛나는', '설레는', '조용한', '꿈꾸는'];
const NOUNS = ['풍경', '정물', '초상화', '기억', '바다', '하늘', '정원', '고양이', '온도', '꽃잎', '풍경화', '소녀', '마을', '숲길', '파도', '산책로'];

function generateProceduralMeta(serial: number) {
  const artistId = HUMAN_ARTIST_IDS[serial % HUMAN_ARTIST_IDS.length];
  // 30% chance to have a group name
  const hasGroup = serial % 3 === 0; 
  const groupName = hasGroup ? RANDOM_GROUPS[serial % RANDOM_GROUPS.length] : undefined;
  const adj = ADJ[(serial * 7) % ADJ.length];
  const noun = NOUNS[(serial * 13) % NOUNS.length];
  const title = `${adj} ${noun} ${serial}`;
  return { title, artistId, groupName };
}

export function buildLocalPublicWorks(paths: string[], artistsList: Artist[]): Work[] {
  const counters: Record<Bucket, number> = {
    ahn: 1,
    fileview: 1,
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
    let groupName: string | undefined;

    if (ovr) {
      counters[bucket] += 1;
      title = ovr.title;
      artistId = ovr.artistId ?? BUCKET_ARTIST[bucket];
      groupName = ovr.groupName;
    } else {
      const n = counters[bucket]++;
      if (bucket === 'fileview' || bucket === 'misc') {
        const generated = generateProceduralMeta(n);
        title = generated.title;
        artistId = generated.artistId;
        groupName = generated.groupName;
      } else {
        artistId = BUCKET_ARTIST[bucket];
        title = titleForBucket(bucket, n, file);
      }
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
      groupName: groupName,
      primaryExhibitionType: groupName ? 'group' : 'solo',
    } satisfies Work;
  });
}
