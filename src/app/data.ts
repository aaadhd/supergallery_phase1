// 더미 데이터 및 타입 정의
import localGalleryManifest from './data/localGalleryManifest.json';
import { buildLocalPublicWorks } from './data/localPublicGalleryWorks';

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  followers?: number;
  following?: number;
}

// 이미지별 작가 지정 (1 이미지 = 1 작가)
export interface ImageArtistAssignment {
  type: 'member' | 'non-member';
  // member인 경우
  memberId?: string;
  memberName?: string;
  memberAvatar?: string;
  // non-member인 경우 (향후 초대/가입 연동용)
  displayName?: string;
  phoneNumber?: string;
}

export interface Work {
  id: string;
  title: string;
  image: string | string[]; // 1~20장의 이미지 지원
  artistId: string;
  artist: Artist;
  likes: number;
  saves: number;
  comments: number;
  description?: string;
  tags?: string[];
  category?: 'art' | 'fashion' | 'craft' | 'product';
  coOwners?: Artist[]; // 레거시 호환용
  groupName?: string; // 그룹전시 시 그룹명
  owner?: any; // groupData.ts WorkOwner 타입 호환
  taggedEmails?: string[]; // 강사가 태그한 수강생 이메일
  isInstructorUpload?: boolean; // 강사 대리 업로드 여부
  pick?: boolean; // Artier's Pick
  editorsPick?: boolean;
  // Phase 1 신규 필드
  primaryExhibitionType?: 'solo' | 'group'; // 전시 유형 (강사+그룹명 → group, 그 외 → solo)
  showInSoloTab?: boolean; // 그룹전시이지만 개인전시 탭에도 노출
  imageArtists?: ImageArtistAssignment[]; // 이미지별 작가 지정 (인덱스 = 이미지 인덱스)
  isHidden?: boolean; // 비공개 여부
  /** 컬렉터블/판매 배지 등 (UI 데모) */
  isForSale?: boolean;
  /** 둘러보기 피드 편입 — 미지정·승인 = 피드 노출, 대기·반려 = 피드 제외 (콘텐츠 운영 정책) */
  feedReviewStatus?: 'pending' | 'approved' | 'rejected';
  /** 업로드일 (검수 목록용, 선택) */
  uploadedAt?: string;
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
  // public/images 로컬 갤러리 전용 (localPublicGalleryWorks.ts와 id 공유)
  { id: 'local-ahn', name: '안창홍', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop', bio: '디지털 펜 · 패션·유령 시리즈', followers: 1840, following: 92 },
  { id: 'local-botanical', name: '윤서연', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop', bio: '디지털 식물·화훼 드로잉', followers: 2230, following: 140 },
  { id: 'local-surreal', name: '정민재', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', bio: '단색 공간과 조형의 붕괴', followers: 990, following: 61 },
  { id: 'local-pop', name: '김영희', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', bio: '팝 컬러 일러스트', followers: 756, following: 48 },
  { id: 'local-sketch', name: '오한결', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', bio: '일상 디지털 스케치', followers: 412, following: 112 },
  { id: 'local-abstract', name: '최파랑', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', bio: '붓터치 추상 초상', followers: 1320, following: 88 },
  { id: 'local-studio', name: '스튜디오 로컬', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop', bio: '기타 로컬 에셋', followers: 100, following: 20 },
];

// 둘러보기 시드: public/images (localGalleryManifest.json, 갱신: generate-local-gallery-manifest.mjs)
export const works: Work[] = buildLocalPublicWorks(localGalleryManifest.paths, artists);