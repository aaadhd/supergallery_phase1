// 더미 데이터 및 타입 정의

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  followers?: number;
  following?: number;
}

export interface Work {
  id: string;
  title: string;
  image: string | string[]; // 1~10장의 이미지 지원
  artistId: string;
  artist: Artist;
  likes: number;
  saves: number;
  comments: number;
  isForSale: boolean;
  description?: string;
  tags?: string[];
  category?: 'art' | 'fashion' | 'craft' | 'product'; // 카테고리 필터링용
  coOwners?: Artist[]; // 공동 소유자 (여러 명의 아티스트)
  groupName?: string; // 공동 작업 시 그룹명 (예: "한국전통화컬렉티브", "컬러스케치팀")
  saleOptions?: {
    download?: { price: number };
    print?: { sizes: { size: string; price: number }[] };
    license?: { available: boolean };
  };
  // 판매 권한 시스템
  saleStatus?: 'none' | 'requested' | 'approved';
  saleRequestDate?: string; // 심사 요청 날짜
  saleApprovalDate?: string; // 승인 날짜
  saleRequest?: { // 판매 심사 요청 데이터
    description: string;
    interview: string;
    price: string;
    editionSize: string;
  };
  owner?: any; // 작품 소유자 (개인 또는 그룹) - groupData.ts의 WorkOwner 타입
}

export interface Room {
  id: string;
  title: string;
  cover: string;
  description: string;
  artistId: string;
  artist: Artist;
  works: Work[];
  views: number;
  visitors: number;
}

export interface Class {
  id: string;
  title: string;
  cover: string;
  instructor: Artist;
  price: number;
  level: string;
  students: number;
  rating: number;
  description?: string;
  curriculum?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  user: Artist;
  content: string;
  createdAt: string;
  likes: number;
}

// 아티스트 더미 데이터
export const artists: Artist[] = [
  { id: '1', name: '조가영', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', bio: '빛과 색을 통해 감정을 표현합니다', followers: 1204, following: 89 },
  { id: '2', name: '김영자', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', bio: '30년 경력의 동양화 작가입니다', followers: 2108, following: 142 },
  { id: '3', name: '박정호', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', bio: '전통 회화와 현대 미술의 경계를 탐구합니다', followers: 856, following: 73 },
  { id: '4', name: '최미경', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop', bio: '섬유와 도자기로 이야기를 엮습니다', followers: 3421, following: 201 },
  { id: '5', name: '정은수', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', bio: '제품 디자이너이자 수채화 작가', followers: 1687, following: 115 },
  { id: '6', name: '홍순덕', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', bio: '한국 전통 자수와 섬유 예술 25년', followers: 2456, following: 98 },
  { id: '7', name: '서경희', avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop', bio: '추상화로 내면의 풍경을 그립니다', followers: 1823, following: 134 },
  { id: '8', name: '윤태식', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', bio: '목공예와 가구 디자인 전문가', followers: 1534, following: 76 },
  { id: '9', name: '강미란', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop', bio: '도자 공예로 자연을 빚습니다', followers: 2987, following: 156 },
  { id: '10', name: '조인숙', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop', bio: '패션 일러스트레이션과 텍스타일 디자인', followers: 3654, following: 189 },
  { id: '11', name: '한상욱', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', bio: '수묵화와 서예를 결합한 작업', followers: 1245, following: 67 },
  { id: '12', name: '문정애', avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop', bio: '정물화와 꽃그림 전문', followers: 2134, following: 112 },
  { id: '13', name: '봄날의화가', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop', bio: '봄처럼 따뜻한 수채 일러스트를 그립니다', followers: 3876, following: 234 },
  { id: '14', name: '이종환', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop', bio: '수채화 35년, 디지털로 새로운 도전', followers: 4521, following: 178 },
  { id: '15', name: '여백의미학', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop', bio: '비움의 아름다움을 그립니다', followers: 2234, following: 145 },
  { id: '16', name: '송미희', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop', bio: '일상의 소소한 순간을 디지털로 기록합니다', followers: 1987, following: 203 },
  { id: '17', name: '숲속작업실', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', bio: '자연을 사랑하는 디지털 드로잉 작가', followers: 3123, following: 167 },
  { id: '18', name: '권순자', avatar: 'https://images.unsplash.com/photo-1546967191-fdfb13ed6b1e?w=100&h=100&fit=crop', bio: '전통 민화를 디지털로 재해석합니다', followers: 2765, following: 134 },
  { id: '19', name: '빛을그리다', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop', bio: '빛과 그림자의 감성 디지털 페인팅', followers: 2987, following: 189 },
  { id: '20', name: '오정림', avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop', bio: '40년 화가 인생, 디지털 수채의 매력에 빠지다', followers: 5234, following: 223 },
  { id: '21', name: '오후의캔버스', avatar: 'https://images.unsplash.com/photo-1580820258381-20c91a156841?w=100&h=100&fit=crop', bio: '오후의 햇살 같은 따뜻한 그림', followers: 1876, following: 156 },
  { id: '22', name: '장혜숙', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop', bio: '식물 세밀화와 디지털 일러스트', followers: 2543, following: 198 },
  { id: '23', name: '고요한붓끝', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', bio: '침묵 속에서 피어나는 색', followers: 1654, following: 123 },
  { id: '24', name: '안명순', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop', bio: '정원과 꽃을 주로 그립니다', followers: 3298, following: 187 },
  { id: '25', name: '정원사화가', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', bio: '정원을 가꾸듯 그림을 그립니다', followers: 2109, following: 167 },
];

// 작품 더미 데이터
export const works: Work[] = [
  // === 조가영 작품 (7개) - 디지털 페인팅 전문 ===
  {
    id: '1',
    title: '창가의 빛',
    image: ['window-light', 'spring-memory', 'city-morning'], // 3장 - 빛의 변화를 담은 시리즈
    artistId: '1',
    artist: artists[0],
    likes: 245,
    saves: 89,
    comments: 12,
    isForSale: true,
    category: 'art',
    coOwners: [artists[1], artists[2]], // 공동 작업 예제
    groupName: '한국전통화컬렉티브', // 그룹명
    description: '오후의 햇살이 창을 통해 들어오는 순간을 포착한 작품입니다. 빛의 변화를 3장의 이미지로 담았습니다.',
    tags: ['빛', '인테리어', '디지털회화', '시리즈'],
    saleOptions: {
      download: { price: 35000 },
      print: { sizes: [{ size: 'A3', price: 85000 }, { size: 'A2', price: 125000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true,
    saleApprovalDate: '2026-02-15'
  },
  {
    id: '6',
    title: '봄날의 기억',
    image: 'spring-memory',
    artistId: '1',
    artist: artists[0],
    likes: 334,
    saves: 142,
    comments: 19,
    isForSale: false,
    category: 'art',
    coOwners: [artists[3], artists[4]],
    groupName: '컬러스케치팀',
    description: '봄의 따뜻함을 색으로 표현한 작품.',
    tags: ['봄', '따뜻함', '파스텔'],
    saleStatus: 'none'
  },
  {
    id: '13',
    title: '도시의 아침',
    image: 'city-morning',
    artistId: '1',
    artist: artists[0],
    likes: 78,
    saves: 34,
    comments: 5,
    isForSale: false,
    description: '고요한 아침, 도시가 깨어나는 순간을 담았습니다.',
    tags: ['도시', '아침', '빛'],
    saleStatus: 'requested',
    saleRequestDate: '2026-03-05T09:30:00',
    saleRequest: {
      description: '고요한 아침, 도시가 깨어나는 순간을 담았습니다. 첫 햇살이 빌딩 사이로 스며들며 만들어내는 드라마틱한 빛의 변화를 표현했습니다.',
      interview: '바쁜 일상 속에서 우리가 놓치는 아름다운 순간들이 있습니다. 이른 아침 도시의 고요함, 첫 햇살이 만들어내는 황금빛 순간을 영원히 간직하고 싶었습니다.',
      price: '320000',
      editionSize: '50'
    }
  },
  {
    id: '14',
    title: '달빛 정원',
    image: 'moonlight-garden',
    artistId: '1',
    artist: artists[0],
    likes: 156,
    saves: 112,
    comments: 23,
    isForSale: true,
    description: '달빛 아래 펼쳐진 신비로운 정원의 모습.',
    tags: ['달빛', '정원', '밤'],
    saleStatus: 'unlocked',
    saleApprovalDate: '2026-03-03',
    saleOptions: {
      download: { price: 38000 },
      print: { sizes: [{ size: 'A3', price: 88000 }, { size: 'A2', price: 128000 }] }
    }
  },
  {
    id: '15',
    title: '여름의 끝',
    image: 'end-of-summer',
    artistId: '1',
    artist: artists[0],
    likes: 412,
    saves: 189,
    comments: 34,
    isForSale: true,
    description: '여름이 저물어가는 순간의 감성을 담았습니다.',
    tags: ['여름', '감성', '노스탤지어'],
    saleStatus: 'approved',
    editorsPick: true,
    saleApprovalDate: '2026-02-28',
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 95000 }, { size: 'A2', price: 145000 }] },
      license: { available: true }
    }
  },
  {
    id: '16',
    title: '구름 사이',
    image: 'between-clouds',
    artistId: '1',
    artist: artists[0],
    likes: 67,
    saves: 28,
    comments: 7,
    isForSale: false,
    description: '구름 사이로 비치는 하늘의 모습.',
    tags: ['하늘', '구름', '자연'],
    saleStatus: 'none'
  },
  {
    id: '17',
    title: '겨울 산책로',
    image: 'winter-walk',
    artistId: '1',
    artist: artists[0],
    likes: 92,
    saves: 41,
    comments: 11,
    isForSale: false,
    description: '눈 내린 겨울 산책로의 고요한 풍경.',
    tags: ['겨울', '눈', '산책'],
    saleStatus: 'requested',
    saleRequestDate: '2026-03-06T14:20:00',
    saleRequest: {
      description: '눈이 내린 후의 고요한 산책로를 표현한 작품입니다. 하얀 눈으로 덮인 길과 나무들의 순백의 아름다움을 담았습니다.',
      interview: '겨울의 고요함과 순수함을 좋아합니다. 눈이 내린 후 세상이 고요해지는 그 순간의 평화로움을 담고 싶었습니다.',
      price: '280000',
      editionSize: '25'
    }
  },

  // === 김영자 작품 (6개) - 동양화 전통 작가 ===
  {
    id: '2',
    title: '바람의 결',
    image: ['wind-texture', 'mountain-mist', 'bamboo-forest', 'lotus-pond', 'autumn-leaves'], // 5장 - 사계절 자연 시리즈
    artistId: '2',
    artist: artists[1],
    likes: 412,
    saves: 156,
    comments: 28,
    isForSale: true,
    description: '바람이 만들어내는 자연의 패턴을 수묵으로 표현했습니다.',
    tags: ['동양화', '추상', '수묵'],
    saleOptions: {
      download: { price: 45000 },
      print: { sizes: [{ size: 'A3', price: 95000 }, { size: 'A2', price: 145000 }] },
    },
    saleStatus: 'unlocked',
    unlockThreshold: 150,
    saleApprovalDate: '2026-03-01'
  },
  {
    id: '7',
    title: '고요한 수면',
    image: 'quiet-water',
    artistId: '2',
    artist: artists[1],
    likes: 456,
    saves: 187,
    comments: 23,
    isForSale: true,
    description: '물의 고요함과 반사되는 빛을 동양화 기법으로 담았습니다.',
    tags: ['수묵화', '평화', '자연'],
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 92000 }, { size: 'A2', price: 140000 }] },
    }
  },
  {
    id: '12',
    title: '추상의 조화',
    image: 'abstract-harmony',
    artistId: '2',
    artist: artists[1],
    likes: 678,
    saves: 312,
    comments: 48,
    isForSale: true,
    description: '수묵의 번짐을 이용한 현대적 추상화.',
    tags: ['추상', '수묵', '현대동양화'],
    saleOptions: {
      download: { price: 60000 },
      print: { sizes: [{ size: 'A3', price: 110000 }, { size: 'A2', price: 170000 }] },
      license: { available: true }
    }
  },
  {
    id: '18',
    title: '매화 향기',
    image: 'plum-blossom',
    artistId: '2',
    artist: artists[1],
    likes: 523,
    saves: 267,
    comments: 34,
    isForSale: true,
    description: '전통 매화도를 현대적 감각으로 재해석했습니다.',
    tags: ['매화', '전통', '동양화'],
    saleOptions: {
      download: { price: 48000 },
      print: { sizes: [{ size: 'A3', price: 98000 }, { size: 'A2', price: 148000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '19',
    title: '산수 명상',
    image: 'mountain-meditation',
    artistId: '2',
    artist: artists[1],
    likes: 389,
    saves: 145,
    comments: 21,
    isForSale: true,
    description: '산과 물, 그 사이의 여백으로 명상의 시간을 표현했습니다.',
    tags: ['산수화', '명상', '여백'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 155000 }] },
    }
  },
  {
    id: '20',
    title: '대나무 숲',
    image: 'bamboo-forest',
    artistId: '2',
    artist: artists[1],
    likes: 234,
    saves: 98,
    comments: 15,
    isForSale: false,
    description: '먹의 농담으로 표현한 대나무의 절개.',
    tags: ['대나무', '사군자', '전통']
  },

  // === 박정호 작품 (5개) - 현대 회화 ===
  {
    id: '3',
    title: '분당의 오후',
    image: 'afternoon-bundang',
    artistId: '3',
    artist: artists[2],
    likes: 189,
    saves: 67,
    comments: 8,
    isForSale: false,
    description: '도심 공원의 가을 오후를 유화 기법으로 그렸습니다.',
    tags: ['풍경', '유화', '가을'],
    saleStatus: 'requested',
    saleRequestDate: '2026-03-05'
  },
  {
    id: '8',
    title: '저녁의 색',
    image: 'evening-colors',
    artistId: '3',
    artist: artists[2],
    likes: 289,
    saves: 103,
    comments: 15,
    isForSale: true,
    description: '저녁 노을의 색감을 아크릴로 표현했습니다.',
    tags: ['노을', '아크릴', '색감'],
    saleOptions: {
      download: { price: 38000 },
      print: { sizes: [{ size: 'A3', price: 88000 }, { size: 'A2', price: 130000 }] },
      license: { available: true }
    }
  },
  {
    id: '21',
    title: '도시 야경',
    image: 'city-night',
    artistId: '3',
    artist: artists[2],
    likes: 445,
    saves: 178,
    comments: 26,
    isForSale: true,
    description: '빛나는 도시의 밤을 캔버스에 담았습니다.',
    tags: ['도시', '야경', '현대회화'],
    saleOptions: {
      download: { price: 52000 },
      print: { sizes: [{ size: 'A3', price: 102000 }, { size: 'A2', price: 152000 }] },
    }
  },
  {
    id: '22',
    title: '추상 풍경',
    image: 'abstract-landscape',
    artistId: '3',
    artist: artists[2],
    likes: 312,
    saves: 134,
    comments: 19,
    isForSale: true,
    description: '자연을 추상적으로 해석한 작품.',
    tags: ['추상', '풍경', '현대미술'],
    saleOptions: {
      download: { price: 45000 },
      print: { sizes: [{ size: 'A3', price: 95000 }, { size: 'A2', price: 145000 }] },
    }
  },
  {
    id: '23',
    title: '내면의 풍경',
    image: 'inner-landscape',
    artistId: '3',
    artist: artists[2],
    likes: 267,
    saves: 89,
    comments: 12,
    isForSale: false,
    description: '마음속 풍경을 색과 형태로 표현했습니다.',
    tags: ['추상', '감성', '내면']
  },

  // === 최미경 작품 (6개) - 섬유/도자 공예 ===
  {
    id: '4',
    title: '오래된 정원',
    image: 'old-garden',
    artistId: '4',
    artist: artists[3],
    likes: 578,
    saves: 234,
    comments: 42,
    isForSale: true,
    description: '섬유로 직조한 정원의 이야기.',
    tags: ['섬유공예', '정원', '텍스타일'],
    saleOptions: {
      download: { price: 40000 },
      print: { sizes: [{ size: 'A3', price: 90000 }, { size: 'A2', price: 135000 }] },
      license: { available: true }
    }
  },
  {
    id: '9',
    title: '도자 정물',
    image: 'ceramic-still-life',
    artistId: '4',
    artist: artists[3],
    likes: 512,
    saves: 221,
    comments: 34,
    isForSale: true,
    description: '백자 작품을 디지털로 기록한 시리즈.',
    tags: ['도자기', '정물', '백자'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 160000 }] },
    }
  },
  {
    id: '24',
    title: '자수 만다라',
    image: 'embroidery-mandala',
    artistId: '4',
    artist: artists[3],
    likes: 687,
    saves: 298,
    comments: 45,
    isForSale: true,
    description: '전통 자수 기법으로 만든 만다라 문양.',
    tags: ['자수', '만다라', '전통공예'],
    saleOptions: {
      download: { price: 65000 },
      print: { sizes: [{ size: 'A3', price: 115000 }, { size: 'A2', price: 175000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '25',
    title: '실과 바늘의 시',
    image: 'thread-poetry',
    artistId: '4',
    artist: artists[3],
    likes: 423,
    saves: 167,
    comments: 28,
    isForSale: true,
    description: '섬유 예술로 표현한 서정적 작품.',
    tags: ['섬유', '텍스타일', '서정']
  },
  {
    id: '26',
    title: '청자 연구',
    image: 'celadon-study',
    artistId: '4',
    artist: artists[3],
    likes: 356,
    saves: 142,
    comments: 22,
    isForSale: true,
    description: '고려청자의 아름다움을 기록한 작품.',
    tags: ['청자', '도자', '전통']
  },
  {
    id: '27',
    title: '보자기 문양',
    image: 'bojagi-pattern',
    artistId: '4',
    artist: artists[3],
    likes: 289,
    saves: 98,
    comments: 17,
    isForSale: false,
    description: '전통 보자기의 색과 문양을 현대적으로.',
    tags: ['보자기', '패턴', '전통']
  },

  // === 정은수 작품 (5개) - 제품 디자인/수채화 ===
  {
    id: '5',
    title: '가구 스케치',
    image: 'furniture-sketch',
    artistId: '5',
    artist: artists[4],
    likes: 621,
    saves: 289,
    comments: 51,
    isForSale: true,
    description: '한국 전통 가구를 수채화로 스케치했습니다.',
    tags: ['가구', '수채화', '제품디자인'],
    saleOptions: {
      download: { price: 50000 },
      print: { sizes: [{ size: 'A3', price: 100000 }, { size: 'A2', price: 155000 }] },
    }
  },
  {
    id: '10',
    title: '숲속의 빛',
    image: 'forest-light',
    artistId: '5',
    artist: artists[4],
    likes: 397,
    saves: 168,
    comments: 21,
    isForSale: false,
    description: '숲 사이로 스며드는 아침 햇살을 수채로.',
    tags: ['숲', '수채화', '자연']
  },
  {
    id: '28',
    title: '찻잔 연작',
    image: 'teacup-series',
    artistId: '5',
    artist: artists[4],
    likes: 534,
    saves: 212,
    comments: 29,
    isForSale: true,
    description: '다양한 찻잔을 관찰하고 그린 수채화 시리즈.',
    tags: ['찻잔', '수채화', '정물'],
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 92000 }, { size: 'A2', price: 142000 }] },
    }
  },
  {
    id: '29',
    title: '의자의 역사',
    image: 'chair-history',
    artistId: '5',
    artist: artists[4],
    likes: 445,
    saves: 178,
    comments: 25,
    isForSale: true,
    description: '시대별 의자 디자인을 일러스트로 기록.',
    tags: ['의자', '디자인', '일러스트'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 155000 }] },
    }
  },
  {
    id: '30',
    title: '한옥 문살',
    image: 'hanok-window',
    artistId: '5',
    artist: artists[4],
    likes: 378,
    saves: 156,
    comments: 19,
    isForSale: true,
    description: '한옥 창문의 아름다움을 담은 수채화.',
    tags: ['한옥', '전통', '수채화']
  },

  // === 홍순덕 작품 (5개) - 전통 자수/섬유 ===
  {
    id: '31',
    title: '궁중 자수',
    image: 'royal-embroidery',
    artistId: '6',
    artist: artists[5],
    likes: 756,
    saves: 334,
    comments: 52,
    isForSale: true,
    description: '궁중 자수 기법을 재현한 작품.',
    tags: ['궁중자수', '전통', '섬유예술'],
    saleOptions: {
      download: { price: 75000 },
      print: { sizes: [{ size: 'A3', price: 125000 }, { size: 'A2', price: 185000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '32',
    title: '모시 질감',
    image: 'ramie-texture',
    artistId: '6',
    artist: artists[5],
    likes: 423,
    saves: 189,
    comments: 27,
    isForSale: true,
    description: '한국 전통 모시의 아름다운 질감을 표현.',
    tags: ['모시', '섬유', '질감']
  },
  {
    id: '33',
    title: '매듭 문양',
    image: 'knot-pattern',
    artistId: '6',
    artist: artists[5],
    likes: 534,
    saves: 223,
    comments: 31,
    isForSale: true,
    description: '전통 매듭의 반복 문양을 디지털화.',
    tags: ['매듭', '문양', '전통공예']
  },
  {
    id: '34',
    title: '자수 병풍',
    image: 'embroidered-screen',
    artistId: '6',
    artist: artists[5],
    likes: 612,
    saves: 267,
    comments: 38,
    isForSale: true,
    description: '전통 병풍에 수놓은 화조도.',
    tags: ['병풍', '화조도', '자수']
  },
  {
    id: '35',
    title: '실 색상 연구',
    image: 'thread-color-study',
    artistId: '6',
    artist: artists[5],
    likes: 289,
    saves: 112,
    comments: 18,
    isForSale: false,
    description: '천연 염색 실의 색상을 연구한 작업.',
    tags: ['염색', '색상', '섬유']
  },

  // === 서경희 작품 (5개) - 추상화 ===
  {
    id: '36',
    title: '내면의 울림',
    image: 'inner-resonance',
    artistId: '7',
    artist: artists[6],
    likes: 645,
    saves: 289,
    comments: 43,
    isForSale: true,
    description: '내면의 감정을 색과 형태로 표현한 추상화.',
    tags: ['추상', '감정', '현대미술'],
    saleOptions: {
      download: { price: 58000 },
      print: { sizes: [{ size: 'A3', price: 108000 }, { size: 'A2', price: 162000 }] },
    }
  },
  {
    id: '37',
    title: '시간의 겹',
    image: 'layers-of-time',
    artistId: '7',
    artist: artists[6],
    likes: 523,
    saves: 234,
    comments: 35,
    isForSale: true,
    description: '시간이 쌓이는 과정을 레이어로 표현.',
    tags: ['시간', '레이어', '추상'],
    saleOptions: {
      download: { price: 62000 },
      print: { sizes: [{ size: 'A3', price: 112000 }, { size: 'A2', price: 168000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '38',
    title: '고요의 색',
    image: 'color-of-silence',
    artistId: '7',
    artist: artists[6],
    likes: 412,
    saves: 178,
    comments: 28,
    isForSale: true,
    description: '침묵과 고요함을 색으로 담았습니다.',
    tags: ['고요', '침묵', '색감']
  },
  {
    id: '39',
    title: '흐름',
    image: 'flow',
    artistId: '7',
    artist: artists[6],
    likes: 356,
    saves: 145,
    comments: 22,
    isForSale: true,
    description: '자연스러운 흐름과 움직임의 표현.',
    tags: ['흐름', '움직임', '추상']
  },
  {
    id: '40',
    title: '깊은 곳',
    image: 'deep-place',
    artistId: '7',
    artist: artists[6],
    likes: 289,
    saves: 98,
    comments: 16,
    isForSale: false,
    description: '마음 깊은 곳의 풍경.',
    tags: ['내면', '깊이', '추상']
  },

  // === 윤태식 작품 (4개) - 목공예/가구 디자인 ===
  {
    id: '41',
    title: '나무결 연구',
    image: 'wood-grain-study',
    artistId: '8',
    artist: artists[7],
    likes: 534,
    saves: 212,
    comments: 31,
    isForSale: true,
    description: '다양한 나무의 결을 관찰하고 기록한 작업.',
    tags: ['나무', '목공예', '질감'],
    saleOptions: {
      download: { price: 48000 },
      print: { sizes: [{ size: 'A3', price: 98000 }, { size: 'A2', price: 148000 }] },
    }
  },
  {
    id: '42',
    title: '전통 장롱',
    image: 'traditional-cabinet',
    artistId: '8',
    artist: artists[7],
    likes: 445,
    saves: 189,
    comments: 26,
    isForSale: true,
    description: '조선시대 장롱의 아름다움을 그림으로.',
    tags: ['장롱', '전통가구', '목공']
  },
  {
    id: '43',
    title: '목가구 설계도',
    image: 'furniture-blueprint',
    artistId: '8',
    artist: artists[7],
    likes: 378,
    saves: 156,
    comments: 21,
    isForSale: true,
    description: '전통 가구의 정교한 설계도를 손그림으로.',
    tags: ['설계도', '가구', '손그림']
  },
  {
    id: '44',
    title: '나무와 시간',
    image: 'wood-and-time',
    artistId: '8',
    artist: artists[7],
    likes: 312,
    saves: 134,
    comments: 19,
    isForSale: false,
    description: '오래된 나무가 품은 시간의 이야기.',
    tags: ['나무', '시간', '공예']
  },

  // === 강미란 작품 (5개) - 도자 공예 ===
  {
    id: '45',
    title: '백자 달항아리',
    image: 'white-porcelain-moon-jar',
    artistId: '9',
    artist: artists[8],
    likes: 823,
    saves: 378,
    comments: 56,
    isForSale: true,
    description: '전통 달항아리의 은은한 아름다움.',
    tags: ['백자', '달항아리', '도자기'],
    saleOptions: {
      download: { price: 68000 },
      print: { sizes: [{ size: 'A3', price: 118000 }, { size: 'A2', price: 178000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '46',
    title: '분청사기 문양',
    image: 'buncheong-pattern',
    artistId: '9',
    artist: artists[8],
    likes: 612,
    saves: 267,
    comments: 38,
    isForSale: true,
    description: '분청사기의 자유로운 문양을 기록.',
    tags: ['분청', '문양', '도자']
  },
  {
    id: '47',
    title: '찻사발의 미학',
    image: 'tea-bowl-aesthetic',
    artistId: '9',
    artist: artists[8],
    likes: 534,
    saves: 223,
    comments: 32,
    isForSale: true,
    description: '다도 문화 속 찻사발의 아름다움.',
    tags: ['찻사발', '다도', '도자']
  },
  {
    id: '48',
    title: '흙의 숨결',
    image: 'breath-of-clay',
    artistId: '9',
    artist: artists[8],
    likes: 445,
    saves: 189,
    comments: 27,
    isForSale: true,
    description: '도자 작업 과정을 담은 손그림 스케치.',
    tags: ['도자', '공예', '손그림']
  },
  {
    id: '49',
    title: '청화백자',
    image: 'blue-white-porcelain',
    artistId: '9',
    artist: artists[8],
    likes: 378,
    saves: 156,
    comments: 23,
    isForSale: false,
    description: '청화백자의 푸른 문양 연구.',
    tags: ['청화백자', '문양', '전통']
  },

  // === 조인숙 작품 (5개) - 패션 일러스트/텍스타일 ===
  {
    id: '50',
    title: '한복의 선',
    image: 'hanbok-lines',
    artistId: '10',
    artist: artists[9],
    likes: 712,
    saves: 312,
    comments: 47,
    isForSale: true,
    description: '한복의 우아한 선을 패션 일러스트로.',
    tags: ['한복', '패션일러스트', '전통'],
    saleOptions: {
      download: { price: 58000 },
      print: { sizes: [{ size: 'A3', price: 108000 }, { size: 'A2', price: 162000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '51',
    title: '텍스타일 패턴',
    image: 'textile-pattern',
    artistId: '10',
    artist: artists[9],
    likes: 623,
    saves: 278,
    comments: 39,
    isForSale: true,
    description: '전통 문양을 현대 텍스타일로 재해석.',
    tags: ['텍스타일', '패턴', '디자인']
  },
  {
    id: '52',
    title: '여인의 자태',
    image: 'grace-of-woman',
    artistId: '10',
    artist: artists[9],
    likes: 534,
    saves: 234,
    comments: 33,
    isForSale: true,
    description: '우아한 여인의 자태를 일러스트로.',
    tags: ['패션', '일러스트', '우아함']
  },
  {
    id: '53',
    title: '전통 색동',
    image: 'traditional-saekdong',
    artistId: '10',
    artist: artists[9],
    likes: 445,
    saves: 189,
    comments: 26,
    isForSale: true,
    description: '색동 저고리의 색 조합 연구.',
    tags: ['색동', '색상', '전통']
  },
  {
    id: '54',
    title: '자락의 움직임',
    image: 'movement-of-fabric',
    artistId: '10',
    artist: artists[9],
    likes: 378,
    saves: 156,
    comments: 22,
    isForSale: false,
    description: '옷자락이 만드는 우아한 움직임.',
    tags: ['움직임', '패션', '드로잉']
  },

  // === 한상욱 작품 (4개) - 수묵화/서예 ===
  {
    id: '55',
    title: '묵란',
    image: 'ink-orchid',
    artistId: '11',
    artist: artists[10],
    likes: 512,
    saves: 223,
    comments: 31,
    isForSale: true,
    description: '난초를 수묵으로 그린 사군자 작품.',
    tags: ['난초', '사군자', '수묵화'],
    saleOptions: {
      download: { price: 52000 },
      print: { sizes: [{ size: 'A3', price: 102000 }, { size: 'A2', price: 152000 }] },
    }
  },
  {
    id: '56',
    title: '서예와 그림',
    image: 'calligraphy-painting',
    artistId: '11',
    artist: artists[10],
    likes: 445,
    saves: 189,
    comments: 27,
    isForSale: true,
    description: '서예와 수묵화를 결합한 작업.',
    tags: ['서예', '수묵', '융합']
  },
  {
    id: '57',
    title: '먹의 번짐',
    image: 'ink-bleeding',
    artistId: '11',
    artist: artists[10],
    likes: 378,
    saves: 156,
    comments: 22,
    isForSale: true,
    description: '먹이 번지는 우연의 아름다움.',
    tags: ['수묵', '번짐', '우연']
  },
  {
    id: '58',
    title: '매화 향기',
    image: 'plum-fragrance',
    artistId: '11',
    artist: artists[10],
    likes: 312,
    saves: 134,
    comments: 19,
    isForSale: false,
    description: '매화의 향기를 수묵으로 담다.',
    tags: ['매화', '사군자', '향기']
  },

  // === 문정애 작품 (4개) - 정물화/꽃그림 ===
  {
    id: '59',
    title: '모란 정물',
    image: 'peony-still-life',
    artistId: '12',
    artist: artists[11],
    likes: 634,
    saves: 278,
    comments: 41,
    isForSale: true,
    description: '화려한 모란을 유화로 그린 정물화.',
    tags: ['모란', '정물화', '유화'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 158000 }] },
    }
  },
  {
    id: '60',
    title: '계절의 꽃',
    image: 'seasonal-flowers',
    artistId: '12',
    artist: artists[11],
    likes: 523,
    saves: 234,
    comments: 34,
    isForSale: true,
    description: '사계절 꽃을 수채화로 담은 시리즈.',
    tags: ['꽃', '수채화', '사계절']
  },
  {
    id: '61',
    title: '과일 바구니',
    image: 'fruit-basket',
    artistId: '12',
    artist: artists[11],
    likes: 445,
    saves: 189,
    comments: 27,
    isForSale: true,
    description: '전통적인 구도의 과일 정물화.',
    tags: ['과일', '정물', '전통회화']
  },
  {
    id: '62',
    title: '백합 향기',
    image: 'lily-scent',
    artistId: '12',
    artist: artists[11],
    likes: 378,
    saves: 156,
    comments: 23,
    isForSale: false,
    description: '하얀 백합의 은은한 향기를 그림으로.',
    tags: ['백합', '꽃', '향기']
  },

  // === 봄날의화가 작품 (6개) - 감성 디지털 수채화 ===
  {
    id: '63',
    title: '벚꽃 산책',
    image: 'cherry-blossom-walk',
    artistId: '13',
    artist: artists[12],
    likes: 892,
    saves: 423,
    comments: 67,
    isForSale: true,
    description: '벚꽃 길을 산책하는 따뜻한 오후를 디지털 수채로 표현했습니다.',
    tags: ['벚꽃', '디지털수채화', '봄'],
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 92000 }, { size: 'A2', price: 142000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '64',
    title: '카페 창가',
    image: 'cafe-window',
    artistId: '13',
    artist: artists[12],
    likes: 723,
    saves: 334,
    comments: 52,
    isForSale: true,
    description: '카페 창가에서 바라본 일상의 풍경.',
    tags: ['카페', '일상', '디지털페인팅'],
    saleOptions: {
      download: { price: 38000 },
      print: { sizes: [{ size: 'A3', price: 88000 }, { size: 'A2', price: 138000 }] },
    }
  },
  {
    id: '65',
    title: '봄비 내리는 날',
    image: 'spring-rain',
    artistId: '13',
    artist: artists[12],
    likes: 654,
    saves: 298,
    comments: 45,
    isForSale: true,
    description: '봄비가 내리는 창밖 풍경을 감성적으로.',
    tags: ['봄비', '감성', '수채화'],
    saleOptions: {
      download: { price: 40000 },
      print: { sizes: [{ size: 'A3', price: 90000 }, { size: 'A2', price: 140000 }] },
    }
  },
  {
    id: '66',
    title: '오래된 책방',
    image: 'old-bookstore',
    artistId: '13',
    artist: artists[12],
    likes: 567,
    saves: 245,
    comments: 38,
    isForSale: true,
    description: '골목길 오래된 책방의 정겨운 모습.',
    tags: ['책방', '골목', '디지털드로잉']
  },
  {
    id: '67',
    title: '정원의 오후',
    image: 'garden-afternoon',
    artistId: '13',
    artist: artists[12],
    likes: 489,
    saves: 212,
    comments: 31,
    isForSale: true,
    description: '햇살 가득한 정원에서 보내는 평화로운 오후.',
    tags: ['정원', '평화', '수채화']
  },
  {
    id: '68',
    title: '첫눈 오는 날',
    image: 'first-snow',
    artistId: '13',
    artist: artists[12],
    likes: 412,
    saves: 189,
    comments: 27,
    isForSale: false,
    description: '올해 첫눈이 내리는 날의 설렘.',
    tags: ['첫눈', '겨울', '감성']
  },

  // === 이종환 작품 (7개) - 전통 수채화+디지털 ===
  {
    id: '69',
    title: '한강의 노을',
    image: 'hangang-sunset',
    artistId: '14',
    artist: artists[13],
    likes: 1234,
    saves: 567,
    comments: 89,
    isForSale: true,
    description: '35년 수채화 경력으로 그린 한강의 아름다운 노을.',
    tags: ['한강', '노을', '디지털수채화'],
    saleOptions: {
      download: { price: 58000 },
      print: { sizes: [{ size: 'A3', price: 108000 }, { size: 'A2', price: 168000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '70',
    title: '남산 타워',
    image: 'namsan-tower',
    artistId: '14',
    artist: artists[13],
    likes: 876,
    saves: 412,
    comments: 63,
    isForSale: true,
    description: '전통 수채 기법으로 담아낸 남산 타워의 풍경.',
    tags: ['남산', '랜드마크', '수채화'],
    saleOptions: {
      download: { price: 52000 },
      print: { sizes: [{ size: 'A3', price: 102000 }, { size: 'A2', price: 158000 }] },
    }
  },
  {
    id: '71',
    title: '경복궁 단풍',
    image: 'gyeongbokgung-autumn',
    artistId: '14',
    artist: artists[13],
    likes: 1045,
    saves: 489,
    comments: 74,
    isForSale: true,
    description: '가을 경복궁의 아름다운 단풍.',
    tags: ['경복궁', '단풍', '가을'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 162000 }] },
    }
  },
  {
    id: '72',
    title: '시골 풍경',
    image: 'countryside-view',
    artistId: '14',
    artist: artists[13],
    likes: 723,
    saves: 334,
    comments: 51,
    isForSale: true,
    description: '고향의 시골 풍경을 추억하며 그린 작품.',
    tags: ['시골', '추억', '풍경화']
  },
  {
    id: '73',
    title: '아침 안개',
    image: 'morning-mist',
    artistId: '14',
    artist: artists[13],
    likes: 654,
    saves: 298,
    comments: 46,
    isForSale: true,
    description: '아침 안개 속 고요한 산의 모습.',
    tags: ['안개', '산', '아침']
  },
  {
    id: '74',
    title: '강변 산책로',
    image: 'riverside-path',
    artistId: '14',
    artist: artists[13],
    likes: 567,
    saves: 256,
    comments: 39,
    isForSale: true,
    description: '강변을 따라 이어진 산책로의 평화로운 풍경.',
    tags: ['강변', '산책', '풍경']
  },
  {
    id: '75',
    title: '전통 한옥',
    image: 'traditional-hanok',
    artistId: '14',
    artist: artists[13],
    likes: 489,
    saves: 223,
    comments: 34,
    isForSale: false,
    description: '한옥의 아름다운 곡선과 처마를 수채로.',
    tags: ['한옥', '전통', '건축']
  },

  // === 여백의미학 작품 (5개) - 미니멀 동양화 스타일 ===
  {
    id: '76',
    title: '여백',
    image: 'empty-space',
    artistId: '15',
    artist: artists[14],
    likes: 923,
    saves: 445,
    comments: 71,
    isForSale: true,
    description: '비워둔 공간이 만드는 아름다움.',
    tags: ['여백', '미니멀', '동양화'],
    saleOptions: {
      download: { price: 48000 },
      print: { sizes: [{ size: 'A3', price: 98000 }, { size: 'A2', price: 148000 }] },
    },
    saleStatus: 'approved'
  },
  {
    id: '77',
    title: '한 송이 매화',
    image: 'single-plum-blossom',
    artistId: '15',
    artist: artists[14],
    likes: 812,
    saves: 378,
    comments: 58,
    isForSale: true,
    description: '여백 속 외로이 핀 한 송이 매화.',
    tags: ['매화', '여백', '디지털수묵'],
    saleOptions: {
      download: { price: 45000 },
      print: { sizes: [{ size: 'A3', price: 95000 }, { size: 'A2', price: 145000 }] },
    }
  },
  {
    id: '78',
    title: '바람의 흔적',
    image: 'trace-of-wind',
    artistId: '15',
    artist: artists[14],
    likes: 701,
    saves: 323,
    comments: 49,
    isForSale: true,
    description: '보이지 않는 바람을 여백으로 표현.',
    tags: ['바람', '흔적', '추상']
  },
  {
    id: '79',
    title: '달',
    image: 'moon-minimalist',
    artistId: '15',
    artist: artists[14],
    likes: 634,
    saves: 289,
    comments: 42,
    isForSale: true,
    description: '어둠 속 홀로 빛나는 달.',
    tags: ['달', '미니멀', '밤']
  },
  {
    id: '80',
    title: '침묵',
    image: 'silence',
    artistId: '15',
    artist: artists[14],
    likes: 556,
    saves: 245,
    comments: 36,
    isForSale: false,
    description: '소리 없는 침묵을 그림으로.',
    tags: ['침묵', '고요', '여백']
  },

  // === 송미희 작품 (6개) - 일상 디지털 드로잉 ===
  {
    id: '81',
    title: '아침 식탁',
    image: 'morning-table',
    artistId: '16',
    artist: artists[15],
    likes: 789,
    saves: 356,
    comments: 54,
    isForSale: true,
    description: '소소한 아침 식사 풍경을 디지털로 기록.',
    tags: ['아침', '식탁', '일상'],
    saleOptions: {
      download: { price: 35000 },
      print: { sizes: [{ size: 'A3', price: 85000 }, { size: 'A2', price: 135000 }] },
    }
  },
  {
    id: '82',
    title: '빨래 너는 날',
    image: 'laundry-day',
    artistId: '16',
    artist: artists[15],
    likes: 678,
    saves: 312,
    comments: 47,
    isForSale: true,
    description: '햇살 좋은 날 빨래를 너는 평범한 일상.',
    tags: ['빨래', '일상', '햇살'],
    saleOptions: {
      download: { price: 32000 },
      print: { sizes: [{ size: 'A3', price: 82000 }, { size: 'A2', price: 132000 }] },
    }
  },
  {
    id: '83',
    title: '창가의 화분',
    image: 'window-plant',
    artistId: '16',
    artist: artists[15],
    likes: 601,
    saves: 278,
    comments: 41,
    isForSale: true,
    description: '창가에 놓인 작은 화분의 사랑스러움.',
    tags: ['화분', '식물', '창가']
  },
  {
    id: '84',
    title: '동네 빵집',
    image: 'neighborhood-bakery',
    artistId: '16',
    artist: artists[15],
    likes: 545,
    saves: 245,
    comments: 37,
    isForSale: true,
    description: '매일 지나치는 동네 빵집의 따뜻한 풍경.',
    tags: ['빵집', '동네', '일상']
  },
  {
    id: '85',
    title: '비 오는 창밖',
    image: 'rainy-window',
    artistId: '16',
    artist: artists[15],
    likes: 489,
    saves: 212,
    comments: 32,
    isForSale: true,
    description: '비 오는 날 창문에 맺힌 빗방울.',
    tags: ['비', '창문', '감성']
  },
  {
    id: '86',
    title: '저녁 준비',
    image: 'dinner-prep',
    artistId: '16',
    artist: artists[15],
    likes: 423,
    saves: 189,
    comments: 28,
    isForSale: false,
    description: '가족을 위해 저녁을 준비하는 시간.',
    tags: ['저녁', '요리', '가족']
  },

  // === 숲속작업실 작품 (6개) - 자연 디지털 드로잉 ===
  {
    id: '87',
    title: '깊은 숲',
    image: 'deep-forest',
    artistId: '17',
    artist: artists[16],
    likes: 1012,
    saves: 478,
    comments: 76,
    isForSale: true,
    description: '숲 깊은 곳의 신비로운 풍경을 디지털로.',
    tags: ['숲', '자연', '디지털드로잉'],
    saleOptions: {
      download: { price: 48000 },
      print: { sizes: [{ size: 'A3', price: 98000 }, { size: 'A2', price: 148000 }] },
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '88',
    title: '이끼 낀 바위',
    image: 'mossy-rock',
    artistId: '17',
    artist: artists[16],
    likes: 834,
    saves: 389,
    comments: 61,
    isForSale: true,
    description: '이끼가 자란 바위의 질감을 세밀하게.',
    tags: ['이끼', '바위', '질감'],
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 92000 }, { size: 'A2', price: 142000 }] },
    }
  },
  {
    id: '89',
    title: '나무 뿌리',
    image: 'tree-roots',
    artistId: '17',
    artist: artists[16],
    likes: 723,
    saves: 334,
    comments: 52,
    isForSale: true,
    description: '오래된 나무의 굵은 뿌리.',
    tags: ['나무', '뿌리', '자연']
  },
  {
    id: '90',
    title: '숲속 오솔길',
    image: 'forest-trail',
    artistId: '17',
    artist: artists[16],
    likes: 656,
    saves: 298,
    comments: 46,
    isForSale: true,
    description: '숲속을 지나는 좁은 오솔길.',
    tags: ['오솔길', '산책', '숲']
  },
  {
    id: '91',
    title: '나뭇잎 사이 햇살',
    image: 'sunlight-through-leaves',
    artistId: '17',
    artist: artists[16],
    likes: 589,
    saves: 267,
    comments: 41,
    isForSale: true,
    description: '나뭇잎 사이로 비치는 따스한 햇살.',
    tags: ['햇살', '나뭇잎', '빛']
  },
  {
    id: '92',
    title: '숲의 새벽',
    image: 'forest-dawn',
    artistId: '17',
    artist: artists[16],
    likes: 512,
    saves: 234,
    comments: 36,
    isForSale: false,
    description: '새벽 안개 속 고요한 숲.',
    tags: ['새벽', '안개', '숲']
  },

  // === 권순자 작품 (5개) - 민화 디지털 재해석 ===
  {
    id: '93',
    title: '호랑이와 까치',
    image: 'tiger-magpie',
    artistId: '18',
    artist: artists[17],
    likes: 1123,
    saves: 534,
    comments: 85,
    isForSale: true,
    description: '전통 민화 호작도를 현대적으로 재해석.',
    tags: ['민화', '호랑이', '디지털페인팅'],
    saleOptions: {
      download: { price: 55000 },
      print: { sizes: [{ size: 'A3', price: 105000 }, { size: 'A2', price: 162000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '94',
    title: '모란도',
    image: 'peony-minhwa',
    artistId: '18',
    artist: artists[17],
    likes: 945,
    saves: 445,
    comments: 69,
    isForSale: true,
    description: '부귀를 상징하는 모란 민화.',
    tags: ['모란', '민화', '전통'],
    saleOptions: {
      download: { price: 52000 },
      print: { sizes: [{ size: 'A3', price: 102000 }, { size: 'A2', price: 155000 }] },
    }
  },
  {
    id: '95',
    title: '십장생도',
    image: 'ten-symbols',
    artistId: '18',
    artist: artists[17],
    likes: 867,
    saves: 401,
    comments: 63,
    isForSale: true,
    description: '장수를 기원하는 십장생 민화.',
    tags: ['십장생', '민화', '장수']
  },
  {
    id: '96',
    title: '책거리',
    image: 'chaekgeori',
    artistId: '18',
    artist: artists[17],
    likes: 789,
    saves: 356,
    comments: 55,
    isForSale: true,
    description: '조선시대 책과 문방구를 그린 민화.',
    tags: ['책거리', '민화', '전통']
  },
  {
    id: '97',
    title: '화조도',
    image: 'birds-flowers-minhwa',
    artistId: '18',
    artist: artists[17],
    likes: 712,
    saves: 323,
    comments: 49,
    isForSale: false,
    description: '꽃과 새가 어우러진 화조 민화.',
    tags: ['화조도', '민화', '새']
  },

  // === 빛을그리다 작품 (6개) - 빛과 그림자 디지털 페인팅 ===
  {
    id: '98',
    title: '창문 그림자',
    image: 'window-shadow',
    artistId: '19',
    artist: artists[18],
    likes: 956,
    saves: 445,
    comments: 72,
    isForSale: true,
    description: '오후 햇살이 만든 창문 그림자의 아름다움.',
    tags: ['그림자', '빛', '디지털페인팅'],
    saleOptions: {
      download: { price: 46000 },
      print: { sizes: [{ size: 'A3', price: 96000 }, { size: 'A2', price: 146000 }] },
    },
    saleStatus: 'approved'
  },
  {
    id: '99',
    title: '골목길 빛',
    image: 'alley-light',
    artistId: '19',
    artist: artists[18],
    likes: 823,
    saves: 389,
    comments: 61,
    isForSale: true,
    description: '좁은 골목길에 스며드는 햇살.',
    tags: ['골목', '햇살', '감성'],
    saleOptions: {
      download: { price: 42000 },
      print: { sizes: [{ size: 'A3', price: 92000 }, { size: 'A2', price: 142000 }] },
    }
  },
  {
    id: '100',
    title: '저녁 노을빛',
    image: 'evening-glow',
    artistId: '19',
    artist: artists[18],
    likes: 745,
    saves: 345,
    comments: 54,
    isForSale: true,
    description: '노을빛이 물든 도시 풍경.',
    tags: ['노을', '빛', '도시']
  },
  {
    id: '101',
    title: '나무 그림자',
    image: 'tree-shadow',
    artistId: '19',
    artist: artists[18],
    likes: 678,
    saves: 312,
    comments: 48,
    isForSale: true,
    description: '바닥에 드리운 나무 그림자의 패턴.',
    tags: ['나무', '그림자', '패턴']
  },
  {
    id: '102',
    title: '아침 햇살',
    image: 'morning-sunlight',
    artistId: '19',
    artist: artists[18],
    likes: 601,
    saves: 278,
    comments: 42,
    isForSale: true,
    description: '방 안으로 들어오는 아침 햇살.',
    tags: ['아침', '햇살', '따뜻함']
  },
  {
    id: '103',
    title: '가로등 아래',
    image: 'under-streetlight',
    artistId: '19',
    artist: artists[18],
    likes: 534,
    saves: 245,
    comments: 37,
    isForSale: false,
    description: '밤 가로등이 만드는 빛과 그림자.',
    tags: ['가로등', '밤', '그림자']
  },

  // === 오정림 작품 (7개) - 베테랑 디지털 수채화 ===
  {
    id: '104',
    title: '서울의 사계',
    image: 'seoul-four-seasons',
    artistId: '20',
    artist: artists[19],
    likes: 1456,
    saves: 678,
    comments: 103,
    isForSale: true,
    description: '40년 화가 인생이 담긴 서울의 사계절.',
    tags: ['서울', '사계절', '디지털수채화'],
    saleOptions: {
      download: { price: 68000 },
      print: { sizes: [{ size: 'A3', price: 118000 }, { size: 'A2', price: 178000 }] },
      license: { available: true }
    },
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '105',
    title: '북촌 한옥마을',
    image: 'bukchon-hanok',
    artistId: '20',
    artist: artists[19],
    likes: 1234,
    saves: 589,
    comments: 91,
    isForSale: true,
    description: '전통과 현대가 공존하는 북촌의 아름다움.',
    tags: ['북촌', '한옥', '전통'],
    saleOptions: {
      download: { price: 62000 },
      print: { sizes: [{ size: 'A3', price: 112000 }, { size: 'A2', price: 168000 }] },
    }
  },
  {
    id: '106',
    title: '인사동 풍경',
    image: 'insadong-scene',
    artistId: '20',
    artist: artists[19],
    likes: 1089,
    saves: 512,
    comments: 79,
    isForSale: true,
    description: '인사동 거리의 활기찬 풍경.',
    tags: ['인사동', '거리', '풍경화']
  },
  {
    id: '107',
    title: '덕수궁 돌담길',
    image: 'deoksugung-stone-wall',
    artistId: '20',
    artist: artists[19],
    likes: 967,
    saves: 456,
    comments: 71,
    isForSale: true,
    description: '가을 단풍이 아름다운 덕수궁 돌담길.',
    tags: ['덕수궁', '돌담길', '가을']
  },
  {
    id: '108',
    title: '청계천',
    image: 'cheonggyecheon',
    artistId: '20',
    artist: artists[19],
    likes: 856,
    saves: 401,
    comments: 64,
    isForSale: true,
    description: '도심 속 휴식처 청계천의 평화로움.',
    tags: ['청계천', '도심', '물']
  },
  {
    id: '109',
    title: '한강 다리',
    image: 'hangang-bridge',
    artistId: '20',
    artist: artists[19],
    likes: 734,
    saves: 345,
    comments: 53,
    isForSale: true,
    description: '한강을 가로지르는 다리의 웅장함.',
    tags: ['한강', '다리', '풍경']
  },
  {
    id: '110',
    title: '남대문 시장',
    image: 'namdaemun-market',
    artistId: '20',
    artist: artists[19],
    likes: 623,
    saves: 289,
    comments: 45,
    isForSale: false,
    description: '활기 넘치는 남대문 시장의 일상.',
    tags: ['시장', '남대문', '일상']
  },
  
  // === 효과 적용 샘플 작품들 (Upload 페이지 8가지 효과 시연용) ===
  {
    id: '111',
    title: '에테르 - 우주의 빛',
    image: ['cosmic-light', 'nebula-dream', 'starfield'], // 3장 - 에테르 효과
    artistId: '1',
    artist: artists[0],
    likes: 891,
    saves: 423,
    comments: 67,
    isForSale: true,
    description: '우주의 빛과 유체가 작품을 감싸는 에테르 효과로 표현한 작품입니다.',
    tags: ['우주', '빛', '에테르효과', '환상'],
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '112',
    title: '리퀴드 팔레트',
    image: ['liquid-flow', 'color-wave', 'paint-stream', 'fluid-art'], // 4장 - 리퀴드 효과
    artistId: '3',
    artist: artists[2],
    likes: 1234,
    saves: 567,
    comments: 89,
    isForSale: true,
    description: '작품의 색상들이 녹아내려 환상적인 물결을 만드는 리퀴드 효과 작품입니다.',
    tags: ['액체', '색상', '리퀴드효과', '추상'],
    saleStatus: 'approved'
  },
  {
    id: '113',
    title: '사이버 인셉션',
    image: ['cyber-grid', 'digital-void'], // 2장 - 사이버 효과
    artistId: '5',
    artist: artists[4],
    likes: 1567,
    saves: 789,
    comments: 134,
    isForSale: true,
    description: '공간이 뒤틀리며 흐릿한 픽셀 속으로 잠기는 사이버 효과 작품입니다.',
    tags: ['사이버', '디지털', '사이버효과', '미래'],
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '114',
    title: '디지털 피버',
    image: ['digital-pulse', 'signal-art', 'data-flow', 'tech-wave', 'circuit-dream', 'neon-code'], // 6장 - 디지털 효과
    artistId: '7',
    artist: artists[6],
    likes: 2103,
    saves: 934,
    comments: 176,
    isForSale: true,
    description: '작품이 디지털 신호로 깨어나는 디지털 피버 효과 시리즈입니다.',
    tags: ['디지털', '신호', '디지털효과', '테크'],
    saleStatus: 'approved'
  },
  {
    id: '115',
    title: '네온 드림',
    image: ['neon-city', 'glow-art', 'luminous', 'bright-night', 'electric-art', 'radiant', 'light-play', 'neon-pulse'], // 8장 - 네온 효과
    artistId: '9',
    artist: artists[8],
    likes: 2876,
    saves: 1245,
    comments: 234,
    isForSale: true,
    description: '네온 불빛이 작품 주변을 감싸며 빛나는 네온 드림 효과 작품입니다.',
    tags: ['네온', '빛', '네온효과', '야경'],
    saleStatus: 'approved',
    editorsPick: true
  },
  {
    id: '116',
    title: '빈티지 필름',
    image: ['vintage-photo', 'old-memory', 'retro-art', 'film-grain', 'sepia-dream'], // 5장 - 빈티지 효과
    artistId: '11',
    artist: artists[10],
    likes: 1543,
    saves: 678,
    comments: 98,
    isForSale: true,
    description: '오래된 필름 카메라로 촬영한 듯한 따뜻한 감성의 빈티지 효과 작품입니다.',
    tags: ['빈티지', '필름', '빈티지효과', '레트로'],
    saleStatus: 'approved'
  },
  {
    id: '117',
    title: '프로스트 글래스',
    image: ['frost-window', 'icy-art', 'crystal-view', 'frozen-dream', 'winter-glass', 'cold-art', 'ice-pattern'], // 7장 - 프로스트 효과
    artistId: '13',
    artist: artists[12],
    likes: 1987,
    saves: 845,
    comments: 145,
    isForSale: true,
    description: '서리가 낀 유리창 너머로 보는 듯한 몽환적 느낌의 프로스트 글래스 효과 작품입니다.',
    tags: ['서리', '유리', '프로스트효과', '겨울'],
    saleStatus: 'approved'
  },
  {
    id: '118',
    title: '홀로그램',
    image: ['hologram-art', 'future-vision', 'projection', 'holo-effect', 'iridescent', 'rainbow-tech', 'prism-light', 'spectrum-art', 'chrome-dream', 'metallic-glow'], // 10장 - 홀로그램 효과 (최대)
    artistId: '15',
    artist: artists[14],
    likes: 3421,
    saves: 1567,
    comments: 287,
    isForSale: true,
    description: '미래적 홀로그램 투영 효과로 표현한 10장의 작품 시리즈입니다. 다양한 각도와 빛의 반사를 담았습니다.',
    tags: ['홀로그램', '미래', '홀로그램효과', '프리즘'],
    saleStatus: 'approved',
    editorsPick: true
  },
];

// 전시룸 더미 데이터
export const rooms: Room[] = [
  {
    id: '1',
    title: '봄빛의 기억',
    cover: 'spring-memory-room',
    description: '봄의 따뜻함과 기억을 담은 개인전입니다. 2024년 봄에 그린 작품들을 모았습니다.',
    artistId: '1',
    artist: artists[0],
    works: [works[0], works[5], works[10]],
    views: 2845,
    visitors: 312
  },
  {
    id: '2',
    title: '고요한 오후',
    cover: 'quiet-afternoon',
    description: '일상 속 고요한 순간들을 포착한 작품 모음.',
    artistId: '2',
    artist: artists[1],
    works: [works[1], works[6], works[11]],
    views: 3621,
    visitors: 428
  },
  {
    id: '3',
    title: '라인의 미학',
    cover: 'line-aesthetics',
    description: '라인과 형태로 표현하는 미니멀 드로잉 전시.',
    artistId: '3',
    artist: artists[2],
    works: [works[2], works[7]],
    views: 1923,
    visitors: 245
  },
  {
    id: '4',
    title: '리턴전 2026',
    cover: 'return-exhibition',
    description: '10년 만에 돌아온 재데뷔 전시. 새로운 시작을 알립니다.',
    artistId: '4',
    artist: artists[3],
    works: [works[3], works[8]],
    views: 5234,
    visitors: 687
  },
];

// 클래스 더미 데이터
export const classes: Class[] = [
  {
    id: '1',
    title: '디지털 수채의 색감',
    cover: 'watercolor-class',
    instructor: artists[0],
    price: 89000,
    level: '초급',
    students: 234,
    rating: 4.8,
    description: '디지털 수채화의 기본부터 색감 표현까지 배우는 클래스입니다.',
    curriculum: ['수채 브러시 이해하기', '색 혼합의 기초', '레이어 활용법', '실전 연습']
  },
  {
    id: '2',
    title: '인물 명암 빠르게 잡기',
    cover: 'portrait-shading',
    instructor: artists[1],
    price: 125000,
    level: '중급',
    students: 189,
    rating: 4.9,
    description: '인물화의 명암을 효과적으로 표현하는 기법을 배웁니다.',
    curriculum: ['빛의 방향 이해', '명암 단계 나누기', '얼굴 구조 파악', '실습 프로젝트']
  },
  {
    id: '3',
    title: '라인드로잉의 리듬',
    cover: 'line-drawing',
    instructor: artists[2],
    price: 75000,
    level: '초급',
    students: 312,
    rating: 4.7,
    description: '자유롭고 리듬감 있는 라인 드로잉을 배우는 클래스.',
    curriculum: ['선 긋기 연습', '리듬감 익히기', '형태 잡기', '응용 작품 만들기']
  },
  {
    id: '4',
    title: '풍경화 마스터 클래스',
    cover: 'landscape-master',
    instructor: artists[4],
    price: 158000,
    level: '고급',
    students: 127,
    rating: 4.9,
    description: '전문가 수준의 풍경화 기법을 심화 학습합니다.',
    curriculum: ['원근법 완성', '대기 원근', '디테일 표현', '최종 프로젝트']
  },
];

// Unsplash 검색 쿼리 매핑
export const imageQueries: Record<string, string> = {
  'window-light': 'window morning light painting',
  'wind-texture': 'abstract wind texture painting',
  'afternoon-bundang': 'urban park autumn painting',
  'old-garden': 'vintage garden textile art',
  'furniture-sketch': 'traditional furniture watercolor',
  'spring-memory': 'spring flowers pastel painting',
  'quiet-water': 'calm water ink painting',
  'evening-colors': 'sunset evening acrylic painting',
  'ceramic-still-life': 'white ceramic pottery art',
  'forest-light': 'forest sunlight watercolor',
  'abstract-harmony': 'abstract ink wash painting',
  'city-morning': 'city sunrise morning painting',
  'moonlight-garden': 'moonlit garden night painting',
  'end-of-summer': 'summer nostalgia painting',
  'between-clouds': 'clouds sky painting',
  'winter-walk': 'snowy winter path painting',
  'plum-blossom': 'plum blossom ink painting',
  'mountain-meditation': 'mountain landscape ink',
  'bamboo-forest': 'bamboo ink painting',
  'city-night': 'city night painting',
  'abstract-landscape': 'abstract landscape painting',
  'inner-landscape': 'abstract emotional painting',
  'embroidery-mandala': 'traditional embroidery mandala',
  'thread-poetry': 'textile fiber art',
  'celadon-study': 'celadon pottery art',
  'bojagi-pattern': 'traditional bojagi pattern',
  'teacup-series': 'teacup watercolor painting',
  'chair-history': 'chair design illustration',
  'hanok-window': 'hanok window watercolor',
  'royal-embroidery': 'royal embroidery art',
  'ramie-texture': 'ramie fabric texture',
  'knot-pattern': 'traditional knot pattern',
  'embroidered-screen': 'embroidered folding screen',
  'thread-color-study': 'thread color palette',
  'inner-resonance': 'abstract emotional painting',
  'layers-of-time': 'layered abstract painting',
  'color-of-silence': 'minimalist abstract painting',
  'flow': 'flowing abstract painting',
  'deep-place': 'deep abstract painting',
  'wood-grain-study': 'wood grain texture',
  'traditional-cabinet': 'traditional cabinet drawing',
  'furniture-blueprint': 'furniture blueprint sketch',
  'wood-and-time': 'aged wood texture',
  'white-porcelain-moon-jar': 'white porcelain moon jar',
  'buncheong-pattern': 'buncheong pottery pattern',
  'tea-bowl-aesthetic': 'tea bowl ceramic',
  'breath-of-clay': 'pottery making sketch',
  'blue-white-porcelain': 'blue white porcelain',
  'hanbok-lines': 'hanbok fashion illustration',
  'textile-pattern': 'textile pattern design',
  'grace-of-woman': 'elegant woman illustration',
  'traditional-saekdong': 'saekdong color pattern',
  'movement-of-fabric': 'fabric movement sketch',
  'ink-orchid': 'orchid ink painting',
  'calligraphy-painting': 'calligraphy ink painting',
  'ink-bleeding': 'ink wash bleeding',
  'plum-fragrance': 'plum blossom painting',
  'peony-still-life': 'peony still life painting',
  'seasonal-flowers': 'seasonal flowers watercolor',
  'fruit-basket': 'fruit basket still life',
  'lily-scent': 'white lily painting',
  // 봄날의화가
  'cherry-blossom-walk': 'cherry blossom path spring watercolor',
  'cafe-window': 'cafe window view digital painting',
  'spring-rain': 'spring rain window watercolor',
  'old-bookstore': 'vintage bookshop illustration',
  'garden-afternoon': 'peaceful garden afternoon painting',
  'first-snow': 'first snow winter watercolor',
  // 이종환
  'hangang-sunset': 'han river sunset seoul watercolor',
  'namsan-tower': 'namsan tower seoul painting',
  'gyeongbokgung-autumn': 'gyeongbokgung palace autumn watercolor',
  'countryside-view': 'korean countryside landscape painting',
  'morning-mist': 'morning mist mountain watercolor',
  'riverside-path': 'riverside walking path watercolor',
  'traditional-hanok': 'traditional hanok architecture watercolor',
  // 여백의미학
  'empty-space': 'minimalist empty space painting',
  'single-plum-blossom': 'single plum blossom minimalist ink',
  'trace-of-wind': 'wind trace abstract minimalist',
  'moon-minimalist': 'moon minimalist painting',
  'silence': 'silence minimalist art',
  // 송미희
  'morning-table': 'breakfast table morning scene watercolor',
  'laundry-day': 'laundry hanging sunny day illustration',
  'window-plant': 'window plant pot illustration',
  'neighborhood-bakery': 'local bakery storefront painting',
  'rainy-window': 'rain window drops illustration',
  'dinner-prep': 'dinner preparation cooking illustration',
  // 숲속작업실
  'deep-forest': 'deep forest nature digital painting',
  'mossy-rock': 'mossy rock texture nature',
  'tree-roots': 'tree roots nature detail',
  'forest-trail': 'forest trail path nature',
  'sunlight-through-leaves': 'sunlight through leaves forest',
  'forest-dawn': 'forest dawn mist nature',
  // 권순자
  'tiger-magpie': 'tiger magpie korean minhwa',
  'peony-minhwa': 'peony korean folk painting',
  'ten-symbols': 'ten symbols longevity korean art',
  'chaekgeori': 'chaekgeori korean books painting',
  'birds-flowers-minhwa': 'birds flowers korean minhwa',
  // 빛을그리다
  'window-shadow': 'window shadow light painting',
  'alley-light': 'alley sunlight urban painting',
  'evening-glow': 'evening glow city sunset',
  'tree-shadow': 'tree shadow pattern painting',
  'morning-sunlight': 'morning sunlight room interior',
  'under-streetlight': 'under streetlight night painting',
  // 오정림
  'seoul-four-seasons': 'seoul four seasons landscape watercolor',
  'bukchon-hanok': 'bukchon hanok village seoul',
  'insadong-scene': 'insadong street scene seoul',
  'deoksugung-stone-wall': 'deoksugung stone wall autumn',
  'cheonggyecheon': 'cheonggyecheon stream seoul watercolor',
  'hangang-bridge': 'han river bridge seoul painting',
  'namdaemun-market': 'namdaemun market seoul watercolor',
  'spring-memory-room': 'art gallery spring',
  'quiet-afternoon': 'peaceful afternoon art',
  'line-aesthetics': 'minimalist line art',
  'return-exhibition': 'art exhibition gallery',
  'watercolor-class': 'watercolor painting class',
  'portrait-shading': 'portrait shading drawing',
  'line-drawing': 'line drawing sketch',
  'landscape-master': 'landscape painting class',
};