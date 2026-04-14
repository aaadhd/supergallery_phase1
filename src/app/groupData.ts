// 그룹/스튜디오 타입 및 데이터

import type { Artist } from './data';
import { localPick } from './data/localImagePick';

let _gwImgSeq = 200;
const gwImgs = (n: number) => Array.from({ length: n }, () => localPick(_gwImgSeq++));

export interface Group {
  id: string;
  name: string;
  avatar: string;
  type: 'studio' | 'agency' | 'team' | 'collective'; // 그룹 유형
  bio?: string;
  memberCount?: number; // 멤버 수
  /** 그룹을 구성하는 작가 id 배열 (data.ts artists). peek 멤버 리스트 노출용.
   *  그룹 자체는 프로필이 없고, 멤버 개개인이 팔로우/프로필의 대상. */
  memberIds?: string[];
  followers?: number;
  location?: string;
  website?: string;
}

// 그룹 더미 데이터
// memberIds: data.ts의 artists 배열 id (기본 작가 '1'~'25' + 로컬 작가 'local-*')
export const groups: Group[] = [
  {
    id: 'g1',
    name: '픽셀아트랩',
    avatar: 'https://images.unsplash.com/photo-1742440710136-1976b1cad864?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '디지털 페인팅과 컨셉아트 전문 스튜디오',
    memberCount: 5,
    memberIds: ['local-character', 'local-webtoon-clean', 'local-fantasy', 'local-night-scene', '7', '1'],
    followers: 12400,
    location: '서울 강남구',
    website: 'https://studio.example.com'
  },
  {
    id: 'g2',
    name: '디지털캔버스컬렉티브',
    avatar: 'https://images.unsplash.com/photo-1761398703570-cb57abb14b6c?w=100&h=100&fit=crop',
    type: 'collective',
    bio: '디지털 일러스트 작가들의 창작 공동체',
    memberCount: 6,
    memberIds: ['local-rilin', 'local-haeb', 'local-sunnysun', 'local-cozy-illus', 'local-daily-diary', '1'],
    followers: 8900,
    location: '서울 종로구',
  },
  {
    id: 'g3',
    name: '드로잉웍스에이전시',
    avatar: 'https://images.unsplash.com/photo-1666698809123-44e998e93f23?w=100&h=100&fit=crop',
    type: 'agency',
    bio: '디지털 아트 작가 전문 매니지먼트',
    memberCount: 5,
    memberIds: ['local-sketch', 'local-abstract', 'local-pop', 'local-minimal-graphic', '3', '1'],
    followers: 15600,
    location: '서울 성동구',
    website: 'https://artflow.example.com'
  },
  {
    id: 'g4',
    name: '블룸일러스트팀',
    avatar: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=100&h=100&fit=crop',
    type: 'team',
    bio: '감성 디지털 드로잉 전문팀',
    memberCount: 4,
    memberIds: ['local-cozy-illus', 'local-rilin', 'local-warm-palette', 'local-daily-diary', '1'],
    followers: 6700,
    location: '부산 해운대구',
  },
  {
    id: 'g5',
    name: '한국전통화컬렉티브',
    avatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop',
    type: 'collective',
    bio: '전통 회화를 디지털로 재해석하는 그룹',
    memberCount: 5,
    memberIds: ['2', '11', '3', 'local-botanical', 'local-surreal'],
    followers: 10200,
    location: '전주 완산구',
  },
  {
    id: 'g6',
    name: '캐릭터드로잉스튜디오',
    avatar: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '독창적인 캐릭터 디지털 일러스트 전문',
    memberCount: 4,
    memberIds: ['local-character', 'local-webtoon-clean', 'local-fantasy', '17'],
    followers: 9800,
    location: '서울 마포구',
    website: 'https://characterlab.example.com'
  },
  {
    id: 'g7',
    name: '컬러스케치팀',
    avatar: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=100&h=100&fit=crop',
    type: 'team',
    bio: '상업 일러스트레이션 전문팀',
    memberCount: 4,
    memberIds: ['local-pop', 'local-sunnysun', 'local-sketch', '10', '1'],
    followers: 7300,
    location: '서울 용산구',
  },
  {
    id: 'g8',
    name: '비주얼렌더링랩',
    avatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '디지털 일러스트 및 컨셉아트 전문',
    memberCount: 5,
    memberIds: ['local-night-scene', 'local-abstract', 'local-fantasy', 'local-character', '5'],
    followers: 11500,
    location: '성남 분당구',
    website: 'https://producton.example.com'
  },
  {
    id: 'g9',
    name: '레터링아트컬렉티브',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    type: 'collective',
    bio: '디지털 레터링과 타이포 아트 그룹',
    memberCount: 5,
    memberIds: ['local-minimal-graphic', 'local-sketch', 'local-daily-diary', '13', '16'],
    followers: 8600,
    location: '서울 중구',
  },
  {
    id: 'g10',
    name: '패션드로잉에이전시',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    type: 'agency',
    bio: '패션 일러스트레이션 전문 에이전시',
    memberCount: 5,
    memberIds: ['10', '4', 'local-ahn', 'local-pop', '21'],
    followers: 13200,
    location: '서울 강남구',
    website: 'https://fashionimage.example.com'
  },
  {
    id: 'g11',
    name: '풍경화가모임',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    type: 'collective',
    bio: '자연과 풍경 디지털 페인팅 모임',
    memberCount: 6,
    memberIds: ['local-botanical', 'local-warm-palette', 'local-night-scene', '2', '11', '24'],
    followers: 14800,
    location: '제주 서귀포시',
  },
  {
    id: 'g12',
    name: '스페이스일러스트스튜디오',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '공간과 인테리어 디지털 드로잉 전문',
    memberCount: 4,
    memberIds: ['local-minimal-graphic', 'local-surreal', 'local-webtoon-clean', '3'],
    followers: 9100,
    location: '서울 서초구',
  }
];

// 작품 소유자 타입 (개인 또는 그룹)
export type WorkOwner = 
  | { type: 'artist'; data: Artist }
  | { type: 'group'; data: Group };

// 소유자 헬퍼 함수
export function getOwnerName(owner: WorkOwner): string {
  return owner.data.name;
}

export function getOwnerAvatar(owner: WorkOwner): string {
  return owner.data.avatar;
}

export function getOwnerFollowers(owner: WorkOwner): number {
  return owner.data.followers || 0;
}

export function getOwnerTypeLabel(owner: WorkOwner): string {
  if (owner.type === 'artist') {
    return '아티스트';
  }
  
  const typeLabels: Record<Group['type'], string> = {
    studio: '스튜디오',
    agency: '에이전시',
    team: '팀',
    collective: '컬렉티브'
  };
  
  return typeLabels[owner.data.type];
}

// 그룹 작품 데이터 - 기존 works 배열에 추가될 그룹 소유 작품들
const _rawGroupWorks = [
  {
    id: 'gw1',
    title: '디지털 한국화 시리즈',
    exhibitionName: '디지털 한국화 재해석 — 스튜디오 초대전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(3),
    owner: { type: 'group' as const, data: groups[0] },
    artistId: groups[0].id,
    artist: {
      id: groups[0].id,
      name: groups[0].name,
      avatar: groups[0].avatar,
      bio: groups[0].bio,
      followers: groups[0].followers
    },
    likes: 1245,
    saves: 567,
    comments: 89,
    description: '전통 한국화를 디지털 기법으로 재해석한 협업 프로젝트',
    tags: ['디지털아트', '한국화', '협업', '스튜디오'],
    editorsPick: true,
    saleOptions: {
      download: { price: 85000 },
      print: { sizes: [{ size: 'A3', price: 165000 }, { size: 'A2', price: 245000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw2',
    title: '서울 야경 컬렉션',
    exhibitionName: '도시의 빛 2026 — 야경 일러스트 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(4),
    owner: { type: 'group' as const, data: groups[1] },
    artistId: groups[1].id,
    artist: {
      id: groups[1].id,
      name: groups[1].name,
      avatar: groups[1].avatar,
      bio: groups[1].bio,
      followers: groups[1].followers
    },
    likes: 2134,
    saves: 892,
    comments: 134,
    description: '서울의 다양한 야경을 작가들의 시선으로 담은 공동 작업',
    tags: ['서울', '야경', '도시', '공동작업'],
    editorsPick: true,
    saleOptions: {
      download: { price: 95000 },
      print: { sizes: [{ size: 'A3', price: 175000 }, { size: 'A2', price: 265000 }] }
    }
  },
  {
    id: 'gw3',
    title: '사이버 감성 프로젝트',
    exhibitionName: '사이버 감성 — 에이전시 아카이브',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(2),
    owner: { type: 'group' as const, data: groups[2] },
    artistId: groups[2].id,
    artist: {
      id: groups[2].id,
      name: groups[2].name,
      avatar: groups[2].avatar,
      bio: groups[2].bio,
      followers: groups[2].followers
    },
    likes: 1876,
    saves: 734,
    comments: 102,
    description: '미래적 감성과 아날로그 정서의 조화',
    tags: ['사이버펑크', '미래', '감성', '에이전시'],
    saleOptions: {
      download: { price: 78000 },
      print: { sizes: [{ size: 'A3', price: 158000 }, { size: 'A2', price: 238000 }] }
    }
  },
  {
    id: 'gw4',
    title: '봄날의 추억',
    exhibitionName: '봄날의 기록 — 감성 드로잉 살롱',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(6),
    owner: { type: 'group' as const, data: groups[3] },
    artistId: groups[3].id,
    artist: {
      id: groups[3].id,
      name: groups[3].name,
      avatar: groups[3].avatar,
      bio: groups[3].bio,
      followers: groups[3].followers
    },
    likes: 3421,
    saves: 1432,
    comments: 198,
    description: '봄의 따뜻한 순간들을 담은 감성 일러스트 시리즈',
    tags: ['봄', '일러스트', '감성', '팀작업'],
    editorsPick: true,
    saleOptions: {
      download: { price: 68000 },
      print: { sizes: [{ size: 'A3', price: 148000 }, { size: 'A2', price: 228000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw5',
    title: '전통 매듭 현대화',
    exhibitionName: '전통의 선 — 매듭·공예 실험전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(8),
    owner: { type: 'group' as const, data: groups[4] },
    artistId: groups[4].id,
    artist: {
      id: groups[4].id,
      name: groups[4].name,
      avatar: groups[4].avatar,
      bio: groups[4].bio,
      followers: groups[4].followers
    },
    likes: 2987,
    saves: 1123,
    comments: 167,
    description: '전통 매듭을 네온 효과로 재해석한 실험적 프로젝트',
    tags: ['전통', '매듭', '현대화', '공예'],
    saleOptions: {
      download: { price: 92000 },
      print: { sizes: [{ size: 'A3', price: 172000 }, { size: 'A2', price: 252000 }] }
    }
  },
  {
    id: 'gw6',
    title: '한옥의 재발견',
    exhibitionName: '한옥, 빛과 결 — 건축 드로잉 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(5),
    owner: { type: 'group' as const, data: groups[4] },
    artistId: groups[4].id,
    artist: {
      id: groups[4].id,
      name: groups[4].name,
      avatar: groups[4].avatar,
      bio: groups[4].bio,
      followers: groups[4].followers
    },
    likes: 1654,
    saves: 678,
    comments: 92,
    description: '한옥 건축의 아름다움을 빈티지 감성으로',
    tags: ['한옥', '건축', '빈티지', '전통'],
    saleOptions: {
      download: { price: 75000 },
      print: { sizes: [{ size: 'A3', price: 155000 }, { size: 'A2', price: 235000 }] }
    }
  },
  {
    id: 'gw7',
    title: '캐릭터 IP 개발 시리즈',
    exhibitionName: '캐릭터 IP 1기 — 쇼케이스',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(3),
    owner: { type: 'group' as const, data: groups[5] },
    artistId: groups[5].id,
    artist: {
      id: groups[5].id,
      name: groups[5].name,
      avatar: groups[5].avatar,
      bio: groups[5].bio,
      followers: groups[5].followers
    },
    likes: 2543,
    saves: 987,
    comments: 156,
    description: '독창적인 캐릭터 개발 및 스토리텔링',
    tags: ['캐릭터디자인', 'IP', '일러스트', '스튜디오'],
    editorsPick: true,
    saleOptions: {
      download: { price: 98000 },
      print: { sizes: [{ size: 'A3', price: 178000 }, { size: 'A2', price: 268000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw8',
    title: '미식 비주얼 프로젝트',
    exhibitionName: '테이블 위 미학 — 푸드 비주얼 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(4),
    owner: { type: 'group' as const, data: groups[6] },
    artistId: groups[6].id,
    artist: {
      id: groups[6].id,
      name: groups[6].name,
      avatar: groups[6].avatar,
      bio: groups[6].bio,
      followers: groups[6].followers
    },
    likes: 1987,
    saves: 745,
    comments: 118,
    description: 'F&B 브랜드를 위한 미니멀 푸드 포토그래피',
    tags: ['푸드포토', '미니멀', '브랜딩', '팀'],
    saleOptions: {
      download: { price: 72000 },
      print: { sizes: [{ size: 'A3', price: 152000 }, { size: 'A2', price: 232000 }] }
    }
  },
  {
    id: 'gw9',
    title: '제품 렌더링 컬렉션',
    exhibitionName: '프리미엄 라인 — 제품 비주얼 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(5),
    owner: { type: 'group' as const, data: groups[7] },
    artistId: groups[7].id,
    artist: {
      id: groups[7].id,
      name: groups[7].name,
      avatar: groups[7].avatar,
      bio: groups[7].bio,
      followers: groups[7].followers
    },
    likes: 3156,
    saves: 1234,
    comments: 187,
    description: '프리미엄 제품 디자인 3D 렌더링',
    tags: ['제품디자인', '3D렌더링', '모던', '스튜디오'],
    editorsPick: true,
    saleOptions: {
      download: { price: 105000 },
      print: { sizes: [{ size: 'A3', price: 185000 }, { size: 'A2', price: 275000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw10',
    title: '한글 타이포 실험',
    exhibitionName: '레터링 랩 — 한글 타이포 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(3),
    owner: { type: 'group' as const, data: groups[8] },
    artistId: groups[8].id,
    artist: {
      id: groups[8].id,
      name: groups[8].name,
      avatar: groups[8].avatar,
      bio: groups[8].bio,
      followers: groups[8].followers
    },
    likes: 2678,
    saves: 1089,
    comments: 143,
    description: '한글의 아름다움을 현대적으로 해석',
    tags: ['타이포그래피', '한글', '그래픽디자인', '컬렉티브'],
    saleOptions: {
      download: { price: 82000 },
      print: { sizes: [{ size: 'A3', price: 162000 }, { size: 'A2', price: 242000 }] }
    }
  },
  {
    id: 'gw11',
    title: '패션 에디토리얼',
    exhibitionName: 'S/S 에디토리얼 — 패션 드로잉 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(6),
    owner: { type: 'group' as const, data: groups[9] },
    artistId: groups[9].id,
    artist: {
      id: groups[9].id,
      name: groups[9].name,
      avatar: groups[9].avatar,
      bio: groups[9].bio,
      followers: groups[9].followers
    },
    likes: 4123,
    saves: 1687,
    comments: 224,
    description: '2026 S/S 패션 화보 시리즈',
    tags: ['패션', '에디토리얼', '포트레이트', '에이전시'],
    editorsPick: true,
    saleOptions: {
      download: { price: 115000 },
      print: { sizes: [{ size: 'A3', price: 195000 }, { size: 'A2', price: 285000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw12',
    title: '자연의 순간',
    exhibitionName: '제주 사계 — 풍경 디지털 페인팅',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(9),
    owner: { type: 'group' as const, data: groups[10] },
    artistId: groups[10].id,
    artist: {
      id: groups[10].id,
      name: groups[10].name,
      avatar: groups[10].avatar,
      bio: groups[10].bio,
      followers: groups[10].followers
    },
    likes: 3845,
    saves: 1567,
    comments: 203,
    description: '제주 자연을 담은 사계절 풍경 사진',
    tags: ['자연사진', '풍경', '제주', '컬렉티브'],
    editorsPick: true,
    saleOptions: {
      download: { price: 88000 },
      print: { sizes: [{ size: 'A3', price: 168000 }, { size: 'A2', price: 248000 }] },
      license: { available: true }
    }
  },
  {
    id: 'gw13',
    title: '공간의 재구성',
    exhibitionName: '인테리어 비전 — 공간 스튜디오 전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(5),
    owner: { type: 'group' as const, data: groups[11] },
    artistId: groups[11].id,
    artist: {
      id: groups[11].id,
      name: groups[11].name,
      avatar: groups[11].avatar,
      bio: groups[11].bio,
      followers: groups[11].followers
    },
    likes: 2765,
    saves: 1134,
    comments: 167,
    description: '미니멀 인테리어 공간 비주얼라이제이션',
    tags: ['인테리어', '공간디자인', '3D', '스튜디오'],
    saleOptions: {
      download: { price: 92000 },
      print: { sizes: [{ size: 'A3', price: 172000 }, { size: 'A2', price: 252000 }] }
    }
  },
  // ── 카테(id:'1') 참여 그룹 전시 5종 ──
  {
    id: 'gw-kate-1',
    title: '빛과 감성의 대화',
    exhibitionName: '빛과 감성 — 디지털캔버스 정기전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(5),
    owner: { type: 'group' as const, data: groups[1] },
    artistId: groups[1].id,
    artist: { id: groups[1].id, name: groups[1].name, avatar: groups[1].avatar, bio: groups[1].bio, followers: groups[1].followers },
    likes: 1823, saves: 645, comments: 87,
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-rilin' },
      { type: 'member' as const, memberId: 'local-haeb' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-sunnysun' },
    ],
  },
  {
    id: 'gw-kate-2',
    title: '일상 속 특별함',
    exhibitionName: '우리의 하루 — 드로잉웍스 합동전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(4),
    owner: { type: 'group' as const, data: groups[2] },
    artistId: groups[2].id,
    artist: { id: groups[2].id, name: groups[2].name, avatar: groups[2].avatar, bio: groups[2].bio, followers: groups[2].followers },
    likes: 956, saves: 312, comments: 45,
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-sketch' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-abstract' },
      { type: 'member' as const, memberId: '1' },
    ],
  },
  {
    id: 'gw-kate-3',
    title: '계절의 색채',
    exhibitionName: '계절이 남긴 것들 — 블룸팀 시즌전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(6),
    owner: { type: 'group' as const, data: groups[3] },
    artistId: groups[3].id,
    artist: { id: groups[3].id, name: groups[3].name, avatar: groups[3].avatar, bio: groups[3].bio, followers: groups[3].followers },
    likes: 2341, saves: 1023, comments: 156,
    editorsPick: true,
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-cozy-illus' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-warm-palette' },
      { type: 'member' as const, memberId: 'local-daily-diary' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-cozy-illus' },
    ],
  },
  {
    id: 'gw-kate-4',
    title: '도시 풍경 릴레이',
    exhibitionName: '도시의 표정 — 컬러스케치팀 릴레이전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(3),
    owner: { type: 'group' as const, data: groups[6] },
    artistId: groups[6].id,
    artist: { id: groups[6].id, name: groups[6].name, avatar: groups[6].avatar, bio: groups[6].bio, followers: groups[6].followers },
    likes: 678, saves: 201, comments: 28,
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-pop' },
      { type: 'member' as const, memberId: 'local-sunnysun' },
    ],
  },
  {
    id: 'gw-kate-5',
    title: '밤의 일러스트레이션',
    exhibitionName: '야간 비행 — 픽셀아트랩 신작전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(4),
    owner: { type: 'group' as const, data: groups[0] },
    artistId: groups[0].id,
    artist: { id: groups[0].id, name: groups[0].name, avatar: groups[0].avatar, bio: groups[0].bio, followers: groups[0].followers },
    likes: 1456, saves: 534, comments: 72,
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-night-scene' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-character' },
      { type: 'member' as const, memberId: '7' },
    ],
  },

  // ── 강사 업로드 작품 (isInstructorUpload) ──
  {
    id: 'gw-inst-1',
    title: '봄날의 수채화 수업',
    exhibitionName: '봄의 정원 — 윤서연 수채화 클래스 전시',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(5),
    owner: { type: 'group' as const, data: groups[3] },
    artistId: groups[3].id,
    artist: { id: groups[3].id, name: groups[3].name, avatar: groups[3].avatar, bio: groups[3].bio, followers: groups[3].followers },
    likes: 1340, saves: 489, comments: 63,
    isInstructorUpload: true,
    _instructorId: 'local-botanical',
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-rilin' },
      { type: 'member' as const, memberId: 'local-cozy-illus' },
      { type: 'member' as const, memberId: 'local-daily-diary' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-warm-palette' },
    ],
  },
  {
    id: 'gw-inst-2',
    title: '캐릭터 일러스트 워크숍',
    exhibitionName: '나만의 캐릭터 — 조성호 일러스트 아카데미',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(4),
    owner: { type: 'group' as const, data: groups[6] },
    artistId: groups[6].id,
    artist: { id: groups[6].id, name: groups[6].name, avatar: groups[6].avatar, bio: groups[6].bio, followers: groups[6].followers },
    likes: 2105, saves: 876, comments: 98,
    isInstructorUpload: true,
    _instructorId: 'local-character',
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-pop' },
      { type: 'member' as const, memberId: 'local-sketch' },
      { type: 'member' as const, memberId: 'local-sunnysun' },
      { type: 'member' as const, memberId: 'local-haeb' },
    ],
  },
  {
    id: 'gw-inst-3',
    title: '야경 디지털 페인팅 실습',
    exhibitionName: '밤의 도시 — 서정우 디지털 아카데미 성과전',
    primaryExhibitionType: 'group' as const,
    image: gwImgs(6),
    owner: { type: 'group' as const, data: groups[1] },
    artistId: groups[1].id,
    artist: { id: groups[1].id, name: groups[1].name, avatar: groups[1].avatar, bio: groups[1].bio, followers: groups[1].followers },
    likes: 1789, saves: 623, comments: 81,
    isInstructorUpload: true,
    editorsPick: true,
    _instructorId: 'local-night-scene',
    feedReviewStatus: 'approved' as const,
    _forceImageArtists: [
      { type: 'member' as const, memberId: 'local-abstract' },
      { type: 'member' as const, memberId: '1' },
      { type: 'member' as const, memberId: 'local-fantasy' },
      { type: 'member' as const, memberId: 'local-minimal-graphic' },
      { type: 'member' as const, memberId: 'local-webtoon-clean' },
      { type: 'member' as const, memberId: 'local-botanical' },
    ],
  },
];

const _NON_MEMBER_GUESTS = [
  '박승우', '이다영', '김태현', '최은지', '한지훈',
  '송혜린', '권도윤', '조민서', '배수민', '유진아',
];

const _PIECE_TITLE_POOL = [
  '고요한 새벽', '빛의 경계', '달빛 아래', '바람이 지나간 자리',
  '첫눈의 기억', '파란 오후', '노을빛 정원', '나무 사이로',
  '물결의 흐름', '안개 낀 산길', '열린 창가', '기다림의 시간',
  '그늘 아래 쉼', '작은 소리', '풀밭 위의 낮잠', '강 건너의 풍경',
  '차가운 아침', '봄비 내리는 날', '따뜻한 손', '빛바랜 사진',
  '숲의 숨결', '하늘과 땅', '수평선 너머', '고요의 시간',
  '그림자 놀이', '바다의 기억', '창밖의 풍경', '구름 위의 산책',
  '꽃길을 걷다', '밤하늘의 별', '아침 이슬', '석양의 노래',
  '실바람', '초록빛 꿈', '흐르는 시간', '먼 곳의 불빛',
];

/**
 * groupWorks를 실제 artists 데이터로 hydrate.
 * data.ts → groupData.ts 순환 참조를 피하기 위해 호출 시점에 artists를 주입.
 */
export function hydrateGroupWorks(allArtists: Artist[]) {
  return _rawGroupWorks.map((gw, idx) => {
    const group = gw.owner.data;
    const memberIds = group.memberIds ?? [];
    const images = Array.isArray(gw.image) ? gw.image : [gw.image];
    const forced = (gw as any)._forceImageArtists as { type: 'member' | 'non-member'; memberId?: string; displayName?: string }[] | undefined;

    const imageArtists = forced
      ? forced.map((fa) => {
          if (fa.type === 'member' && fa.memberId) {
            const found = allArtists.find(a => a.id === fa.memberId);
            if (found) return { type: 'member' as const, memberId: found.id, memberName: found.name, memberAvatar: found.avatar };
          }
          return { type: 'non-member' as const, displayName: fa.displayName || '미지정' };
        })
      : images.map((_, imgIdx) => {
          const addNonMember = idx % 3 === 0;
          if (addNonMember && imgIdx === images.length - 1) {
            return {
              type: 'non-member' as const,
              displayName: _NON_MEMBER_GUESTS[(idx * 5 + imgIdx * 3) % _NON_MEMBER_GUESTS.length],
            };
          }
          const memberIdx = (idx * 7 + imgIdx) % memberIds.length;
          const memberId = memberIds[memberIdx];
          const found = allArtists.find((a) => a.id === memberId);
          if (found) {
            return {
              type: 'member' as const,
              memberId: found.id,
              memberName: found.name,
              memberAvatar: found.avatar,
            };
          }
          return {
            type: 'non-member' as const,
            displayName: _NON_MEMBER_GUESTS[(idx * 5 + imgIdx * 3) % _NON_MEMBER_GUESTS.length],
          };
        });

    const imagePieceTitles = images.map((_, imgIdx) =>
      _PIECE_TITLE_POOL[(idx * 13 + imgIdx * 7) % _PIECE_TITLE_POOL.length]
    );

    const firstMember = imageArtists.find(ia => ia.type === 'member' && ia.memberId);
    const leadArtist = firstMember?.type === 'member' && firstMember.memberId
      ? allArtists.find(a => a.id === firstMember.memberId) : undefined;

    const isInstructorWork = (gw as any).isInstructorUpload === true;
    const instructorArtistId = isInstructorWork ? (gw as any)._instructorId as string | undefined : undefined;
    const resolvedInstructorArtist = instructorArtistId ? allArtists.find(a => a.id === instructorArtistId) : undefined;

    return {
      ...gw,
      artistId: isInstructorWork && resolvedInstructorArtist ? resolvedInstructorArtist.id : (leadArtist?.id ?? gw.artistId),
      artist: isInstructorWork && resolvedInstructorArtist ? resolvedInstructorArtist : (leadArtist ?? gw.artist),
      imageArtists,
      imagePieceTitles,
      groupName: group.name,
    };
  });
}
