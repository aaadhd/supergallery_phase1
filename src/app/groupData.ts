// 그룹/스튜디오 타입 및 데이터

import { Artist, artists } from './data';

export interface Group {
  id: string;
  name: string;
  avatar: string;
  type: 'studio' | 'agency' | 'team' | 'collective'; // 그룹 유형
  bio?: string;
  memberCount?: number; // 멤버 수
  followers?: number;
  location?: string;
  website?: string;
}

// 그룹 더미 데이터
export const groups: Group[] = [
  {
    id: 'g1',
    name: '픽셀아트랩',
    avatar: 'https://images.unsplash.com/photo-1742440710136-1976b1cad864?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '디지털 페인팅과 컨셉아트 전문 스튜디오',
    memberCount: 8,
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
    memberCount: 15,
    followers: 8900,
    location: '서울 종로구',
  },
  {
    id: 'g3',
    name: '드로잉웍스에이전시',
    avatar: 'https://images.unsplash.com/photo-1666698809123-44e998e93f23?w=100&h=100&fit=crop',
    type: 'agency',
    bio: '디지털 아트 작가 전문 매니지먼트',
    memberCount: 12,
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
    memberCount: 5,
    followers: 6700,
    location: '부산 해운대구',
  },
  {
    id: 'g5',
    name: '한국전통화컬렉티브',
    avatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop',
    type: 'collective',
    bio: '전통 회화를 디지털로 재해석하는 그룹',
    memberCount: 10,
    followers: 10200,
    location: '전주 완산구',
  },
  {
    id: 'g6',
    name: '캐릭터드로잉스튜디오',
    avatar: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '독창적인 캐릭터 디지털 일러스트 전문',
    memberCount: 6,
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
    followers: 7300,
    location: '서울 용산구',
  },
  {
    id: 'g8',
    name: '비주얼렌더링랩',
    avatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '디지털 일러스트 및 컨셉아트 전문',
    memberCount: 7,
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
    memberCount: 9,
    followers: 8600,
    location: '서울 중구',
  },
  {
    id: 'g10',
    name: '패션드로잉에이전시',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    type: 'agency',
    bio: '패션 일러스트레이션 전문 에이전시',
    memberCount: 11,
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
    memberCount: 13,
    followers: 14800,
    location: '제주 서귀포시',
  },
  {
    id: 'g12',
    name: '스페이스일러스트스튜디오',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    type: 'studio',
    bio: '공간과 인테리어 디지털 드로잉 전문',
    memberCount: 5,
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
export const groupWorks = [
  {
    id: 'gw1',
    title: '디지털 한국화 시리즈',
    image: [
      'https://images.unsplash.com/photo-1702633958555-37621380df67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMHBhaW50aW5nJTIwZGlnaXRhbHxlbnwxfHx8fDE3NzI4OTQ5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1717758220144-aae8c59dbd7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1vZGVybiUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3Mjg5NDkzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762114974364-0d2dd74b0fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGFuZHNjYXBlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzcyODk0OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1763141711469-32db51fa2e17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMG5pZ2h0JTIwY2l0eXNjYXBlJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI4OTQ5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762436933065-fe6d7f51d4f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3Mjg3NDI3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1717758220144-aae8c59dbd7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1vZGVybiUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3Mjg5NDkzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1740516367203-6c024110cde8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmNvbG9yJTIwZmxvd2VycyUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4OTQ5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1659670991072-ddc190ebfbc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnB1bmslMjBuZW9uJTIwYWVzdGhldGljfGVufDF8fHx8MTc3Mjc4MDY5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1616643786457-d15eb569c1ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW9tZXRyaWMlMjBwYXR0ZXJuJTIwZGVzaWdufGVufDF8fHx8MTc3Mjg4MTAzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1769867296317-bb70cd68b565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbmclMjBibG9zc29tJTIwaWxsdXN0cmF0aW9uJTIwcGFzdGVsfGVufDF8fHx8MTc3Mjg5NDkzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1740516367203-6c024110cde8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmNvbG9yJTIwZmxvd2VycyUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4OTQ5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762114974364-0d2dd74b0fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGFuZHNjYXBlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzcyODk0OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1717758220144-aae8c59dbd7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1vZGVybiUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3Mjg5NDkzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1702633958555-37621380df67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMHBhaW50aW5nJTIwZGlnaXRhbHxlbnwxfHx8fDE3NzI4OTQ5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1763141711469-32db51fa2e17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMG5pZ2h0JTIwY2l0eXNjYXBlJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI4OTQ5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1629869020755-9c4624176474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGtvcmVhbiUyMGtub3QlMjBwYXR0ZXJufGVufDF8fHx8MTc3Mjg5NDkzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1616643786457-d15eb569c1ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW9tZXRyaWMlMjBwYXR0ZXJuJTIwZGVzaWdufGVufDF8fHx8MTc3Mjg4MTAzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1659670991072-ddc190ebfbc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnB1bmslMjBuZW9uJTIwYWVzdGhldGljfGVufDF8fHx8MTc3Mjc4MDY5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1717758220144-aae8c59dbd7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1vZGVybiUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3Mjg5NDkzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1702633958555-37621380df67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMHBhaW50aW5nJTIwZGlnaXRhbHxlbnwxfHx8fDE3NzI4OTQ5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1740516367203-6c024110cde8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmNvbG9yJTIwZmxvd2VycyUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4OTQ5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762114974364-0d2dd74b0fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGFuZHNjYXBlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzcyODk0OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1763141711469-32db51fa2e17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMG5pZ2h0JTIwY2l0eXNjYXBlJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI4OTQ5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1710388766264-07a47a416e93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5vayUyMHRyYWRpdGlvbmFsJTIwa29yZWFuJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3Mjg5NDkzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1697224687433-de3d2a618872?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdGV4dHVyZSUyMHBhcGVyfGVufDF8fHx8MTc3Mjg2NjczM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1629869020755-9c4624176474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGtvcmVhbiUyMGtub3QlMjBwYXR0ZXJufGVufDF8fHx8MTc3Mjg5NDkzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1702633958555-37621380df67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMHBhaW50aW5nJTIwZGlnaXRhbHxlbnwxfHx8fDE3NzI4OTQ5MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762436933065-fe6d7f51d4f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3Mjg3NDI3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1772371272152-d1806d4351e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaWxsdXN0cmF0aW9uJTIwY2hhcmFjdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3Mjg5NTY4MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762278804729-13d330fad71a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwbmVvbnxlbnwxfHx8fDE3NzI4NjM3MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1716901548718-da465a9060fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhaW50aW5nJTIwY29sb3JmdWx8ZW58MXx8fHwxNzcyNzgzNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1697320846048-43f9631634c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHklMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc3Mjg5NTY4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1528262004378-a108d795029c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZGVzaWduJTIwYWVzdGhldGljfGVufDF8fHx8MTc3Mjg5NTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1740516367203-6c024110cde8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmNvbG9yJTIwZmxvd2VycyUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4OTQ5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762114974364-0d2dd74b0fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGFuZHNjYXBlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzcyODk0OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1667266543254-505cf5b16ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwZGVzaWduJTIwbW9ja3VwfGVufDF8fHx8MTc3MjgyNjEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1666302707255-13651d539be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMHJlbmRlciUyMGFic3RyYWN0fGVufDF8fHx8MTc3Mjg5MDYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1616643786457-d15eb569c1ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZW9tZXRyaWMlMjBwYXR0ZXJuJTIwZGVzaWdufGVufDF8fHx8MTc3Mjg4MTAzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzI4MjYwODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1695067440629-b5e513976100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmUlMjBtb2Rlcm4lMjBidWlsZGluZ3xlbnwxfHx8fDE3NzI4OTQ4NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3Mjg0OTUwMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1654865433650-23e71f161b64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwcG9zdGVyfGVufDF8fHx8MTc3Mjg4ODc1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1628522994788-53bc1b1502c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBhcnQlMjBncmFmZml0aXxlbnwxfHx8fDE3NzI4OTUzMzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1660018322139-0e58555df00d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZWRpdG9yaWFsJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcyNzg3MTMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1649107835391-07d0b93a409d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDF8fHx8MTc3Mjg2MTI1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1622032209098-b34bd5fb1776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwcmV0cm8lMjBkZXNpZ258ZW58MXx8fHwxNzcyODk1Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762278804729-13d330fad71a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwbmVvbnxlbnwxfHx8fDE3NzI4NjM3MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1716901548718-da465a9060fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhaW50aW5nJTIwY29sb3JmdWx8ZW58MXx8fHwxNzcyNzgzNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1697320846048-43f9631634c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHklMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc3Mjg5NTY4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1729944080510-16b8a89df8b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGUlMjBwaG90b2dyYXBoeSUyMG1vdW50YWluc3xlbnwxfHx8fDE3NzI4MjE1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1626765702953-adc1a858a274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBtYWNybyUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3Mjg5NTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1738522111031-e2fcf473472a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3RhbmljYWwlMjBpbGx1c3RyYXRpb24lMjBwbGFudHN8ZW58MXx8fHwxNzcyODk1NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1740516367203-6c024110cde8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmNvbG9yJTIwZmxvd2VycyUyMG5hdHVyZXxlbnwxfHx8fDE3NzI4OTQ5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1769867296317-bb70cd68b565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbmclMjBibG9zc29tJTIwaWxsdXN0cmF0aW9uJTIwcGFzdGVsfGVufDF8fHx8MTc3Mjg5NDkzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1762114974364-0d2dd74b0fcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbGFuZHNjYXBlJTIwcGFpbnRpbmd8ZW58MXx8fHwxNzcyODk0OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1729944080510-16b8a89df8b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGUlMjBwaG90b2dyYXBoeSUyMG1vdW50YWluc3xlbnwxfHx8fDE3NzI4MjE1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1626765702953-adc1a858a274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBtYWNybyUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3Mjg5NTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1738522111031-e2fcf473472a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3RhbmljYWwlMjBpbGx1c3RyYXRpb24lMjBwbGFudHN8ZW58MXx8fHwxNzcyODk1NjgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
    image: [
      'https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzI4MjYwODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1695067440629-b5e513976100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmUlMjBtb2Rlcm4lMjBidWlsZGluZ3xlbnwxfHx8fDE3NzI4OTQ4NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1528262004378-a108d795029c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZGVzaWduJTIwYWVzdGhldGljfGVufDF8fHx8MTc3Mjg5NTY4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1666302707255-13651d539be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMHJlbmRlciUyMGFic3RyYWN0fGVufDF8fHx8MTc3Mjg5MDYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1667266543254-505cf5b16ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwZGVzaWduJTIwbW9ja3VwfGVufDF8fHx8MTc3MjgyNjEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
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
  }
];