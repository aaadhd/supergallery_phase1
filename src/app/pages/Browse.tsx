import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Eye, ThumbsUp, ChevronRight, ChevronLeft, ShoppingBag, Image as ImageIcon, X, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { artists } from '../data';
import { workStore } from '../store';
import { groupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { WorkDetailModal } from '../components/WorkDetailModal';
import React from 'react';
import { getFirstImage, getImageCount } from '../utils/imageHelper';

const categories = [
  { id: 'all', label: '전체', active: true, type: 'content' },
  { id: 'art', label: '미술', active: false, type: 'content' },
  { id: 'fashion', label: '패션', active: false, type: 'content' },
  { id: 'craft', label: '공예', active: false, type: 'content' },
  { id: 'product', label: '제품 디자인', active: false, type: 'content' },
  { id: 'divider', label: '', active: false, type: 'divider' },
  { id: 'individual', label: '개인 전시', active: false, type: 'owner' },
  { id: 'group', label: '그룹 전시', active: false, type: 'owner' },
];

const promotionBanners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '봄맞이 특별 전시',
    subtitle: '국내 작가 100인의 신작 공개',
    tag: 'NEW',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '디지털 아트 할인전',
    subtitle: '인기 작품 최대 30% 할인',
    tag: 'SALE',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1767706508363-b2a729df06fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMGV2ZW50JTIwcG9zdGVyfGVufDF8fHx8MTc3Mjc3MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '신인 작가 지원 프로그램',
    subtitle: '당신의 작품을 세상에 선보이세요',
    tag: 'EVENT',
  },
];

// 작가 ID 기반으로 카테고리 추론하는 헬퍼 함수
function getCategoryByArtist(artistId: string): 'art' | 'fashion' | 'craft' | 'product' {
  // 공예 작가: 4, 6, 9 (섬유, 자수, 도자)
  const craftArtists = ['4', '6', '9'];
  // 제품 디자인 작가: 5, 8 (가구, 제품)
  const productArtists = ['5', '8'];
  // 패션 일러스트 작가: 10
  const fashionArtists = ['10'];

  // 그룹 작가 (대부분 미술, g10 풍경화가모임 등)
  // g1~g11은 대부분 미술 관련 그룹
  const groupArtists = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10', 'g11'];

  if (craftArtists.includes(artistId)) return 'craft';
  if (productArtists.includes(artistId)) return 'product';
  if (fashionArtists.includes(artistId)) return 'fashion';
  if (groupArtists.includes(artistId)) return 'art';
  return 'art'; // 기본값
}

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMarketplace = searchParams.get('filter') === 'for-sale';
  const selectedArtistId = searchParams.get('artist'); // 작가 필터

  // workStore에서 작품 가져오기
  const [works, setWorks] = useState(workStore.getWorks());

  useEffect(() => {
    // store 변경사항 구독
    const unsubscribe = workStore.subscribe(() => {
      setWorks(workStore.getWorks());
    });
    return unsubscribe;
  }, []);

  const [activeCategory, setActiveCategory] = useState('all');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  // 팔로잉 중인 작가 ID 관리
  const [followingArtists, setFollowingArtists] = useState<Set<string>>(new Set());

  // 마켓플레이스 여부에 따라 다른 카테고리 사용
  const displayCategories = useMemo(() => {
    if (isMarketplace) {
      // 마켓플레이스: 개인 전시/그룹 전시 제외
      return categories.filter(cat => cat.type !== 'divider' && cat.type !== 'owner');
    }
    // 일반 모드: 전체 카테고리
    return categories;
  }, [isMarketplace]);

  // 팔로우/언팔로우 토글 함수
  const toggleFollow = (artistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowingArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  // 개인 작품 + 그룹 작품 합치기 + 랜덤 섞기
  const allWorks = useMemo(() => {
    // groupWorks에 groupName과 coOwners 추가
    const enhancedGroupWorks = groupWorks.map(work => {
      if (work.owner && work.owner.type === 'group') {
        const groupData = work.owner.data;
        // 해당 그룹에 속한 작가들을 랜덤으로 선택 (2-5명)
        const memberCount = Math.floor(Math.random() * 4) + 2; // 2-5명
        const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
        const coOwners = shuffledArtists.slice(0, memberCount).map(a => ({
          id: a.id,
          name: a.name,
          avatar: a.avatar,
          bio: a.bio
        }));

        return {
          ...work,
          groupName: groupData.name,
          coOwners: coOwners
        };
      }
      return work;
    });

    const combined = [...works, ...enhancedGroupWorks];

    // 마켓플레이스 필터링 (판매 중인 작품만)
    let finalWorks = combined;
    if (isMarketplace) {
      finalWorks = combined.filter(w => w.isForSale || w.saleStatus === 'approved');
    }

    // Fisher-Yates 셔플 알고리즘으로 랜덤하게 섞기
    const shuffled = [...finalWorks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, isMarketplace]);


  // 확장된 작가 작품 표시 - 클릭한 work.id를 저장
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);

  // 각 작품 카드의 현재 보기 모드 (0: 액자, 1: 실제 공간)
  const [cardViewModes, setCardViewModes] = useState<Record<string, number>>({});

  // 이미지 비율 저장 (가로/세로 비율)
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});

  // 호버된 작가 정보 (작품 ID 기반)
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null);

  // 실제 공간 배경 이미지 (하나만 사용)
  const roomBackground = 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200'; // 갤러리 화이트 큐브



  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % promotionBanners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + promotionBanners.length) % promotionBanners.length);
  };


  // 작가 필터링된 작품 목록
  const filteredWorks = useMemo(() => {
    let filtered = allWorks;

    // 작가 필터
    if (selectedArtistId) {
      filtered = filtered.filter(work => work.artist.id === selectedArtistId);
    }

    // 카테고리 필터
    if (activeCategory !== 'all') {
      if (activeCategory === 'individual') {
        // 개인 전시: owner가 없거나 owner.type이 'individual'인 작품만
        filtered = filtered.filter(work =>
          !(work as any).owner || (work as any).owner.type === 'individual'
        );
      } else if (activeCategory === 'group') {
        // 그룹 전시: owner.type이 'group'인 작품만
        filtered = filtered.filter(work =>
          (work as any).owner && (work as any).owner.type === 'group'
        );
      } else {
        // 카테고리 필터 (art, fashion, craft, product)
        filtered = filtered.filter(work => {
          // category가 없으면 작가 ID 기반으로 카테고리 추론
          const workCategory = (work as any).category || getCategoryByArtist(work.artist.id);
          return workCategory === activeCategory;
        });
      }
    }

    return filtered;
  }, [selectedArtistId, allWorks, activeCategory]);

  // 선택된 작가 정보
  const selectedArtist = selectedArtistId ? artists.find(a => a.id === selectedArtistId) : null;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* PROMOTION BANNER SECTION - 일반 모드에만 표시 */}
      {!isMarketplace && (
        <div className="bg-white border-b border-[#E5E5E5]">
          <div className="mx-auto max-w-[1440px] px-6 py-8">
            <div className="relative group">
              {/* 배너 슬라이더 */}
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                >
                  {promotionBanners.map((banner) => (
                    <div
                      key={banner.id}
                      className="w-full shrink-0 relative cursor-pointer"
                    >
                      <div className="relative h-[280px] overflow-hidden">
                        <ImageWithFallback
                          src={banner.image}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                        {/* 오버레이 그라디언트 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

                        {/* 텍스트 콘텐츠 */}
                        <div className="absolute inset-0 flex flex-col justify-center px-12">
                          <div className="max-w-[600px]">
                            {banner.tag && (
                              <span className="inline-block px-3 py-1 text-[11px] font-bold tracking-wider text-white bg-[#0057FF] rounded-full mb-3">
                                {banner.tag}
                              </span>
                            )}
                            <h2 className="text-[32px] font-bold text-white mb-2 leading-tight">
                              {banner.title}
                            </h2>
                            <p className="text-[16px] text-white/90 font-normal">
                              {banner.subtitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 좌우 네비게이션 버튼 */}
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-5 w-5 text-[#191919]" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-5 w-5 text-[#191919]" />
              </button>

              {/* 인디케이터 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {promotionBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`h-1.5 rounded-full transition-all ${currentBanner === index
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/50 hover:bg-white/70'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BAR — Category Tab Bar */}
      <div className="sticky top-[65px] z-40 border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center px-6">
          {/* 카테고리 탭 스크롤 */}
          <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
            {displayCategories.map((cat, idx) => {
              // 구분선인 경우
              if (cat.type === 'divider') {
                return (
                  <div key={cat.id} className="h-6 w-px bg-gray-300 mx-1 shrink-0" />
                );
              }

              // 일반 카테고리 버튼
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-5 py-2 text-[13px] font-medium transition-all ${activeCategory === cat.id
                    ? cat.id === 'all'
                      ? 'bg-[#0057FF] text-white shadow-sm' // 전체는 파란색
                      : 'bg-[#191919] text-white shadow-sm'
                    : 'bg-[#F3F3F3] text-[#191919] hover:bg-[#E8E8E8]'
                    }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub header - 추천 활동 / 피드 개인화 */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1440px] px-6 py-3 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[#191919]">
            {isMarketplace ? (
              selectedArtist ? (
                <span className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedArtist.avatar} alt={selectedArtist.name} />
                    <AvatarFallback>{selectedArtist.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900">{selectedArtist.name}의 아트 샵</div>
                    <div className="text-[11px] text-gray-600">총 {filteredWorks.length}개의 작품</div>
                  </div>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-cyan-500" />
                  판매 중인 작품
                </span>
              )
            ) : (
              '추천 항목'
            )}
          </h2>
          {isMarketplace ? (
            <div className="flex items-center gap-3">
              {selectedArtist && (
                <button
                  onClick={() => navigate('/browse?filter=for-sale')}
                  className="text-[13px] text-gray-600 hover:text-gray-900 underline transition-colors"
                >
                  모든 작품 보기
                </button>
              )}
              <select className="text-[13px] text-[#767676] bg-transparent border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors cursor-pointer">
                <option value="popular">인기순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
                <option value="recent">최신순</option>
              </select>
            </div>
          ) : (
            <button className="flex items-center gap-1.5 text-[13px] text-[#767676] hover:text-[#191919] transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              피드 개인화
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT — 3-Column Grid */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          {filteredWorks.flatMap((work, idx) => {
            const w = work as any;
            const artist = work.artist;
            const likes = work.likes;
            const views = 1234 + idx * 234; // 조회수 임시 데이터

            // 마켓플레이스용 추가 정보 - idx 기반으로 고정
            const basePrice = 10000 + idx * 5000;
            const hasDiscount = idx % 3 === 0;
            const discountPercent = hasDiscount ? [10, 20, 30][idx % 3] : 0;
            const finalPrice = hasDiscount ? Math.floor(basePrice * (1 - discountPercent / 100)) : basePrice;

            // 프리미엄 액자 유형
            const frameTypes: ('museum' | 'wood' | 'acrylic')[] = [];
            if (idx % 2 === 0) frameTypes.push('museum');
            if (idx % 3 === 0) frameTypes.push('wood');
            if (idx % 5 === 0) frameTypes.push('acrylic');
            if (frameTypes.length === 0) frameTypes.push('museum');

            // 현재 이 카드의 보기 모드 (0: 액자, 1: 실제 공간)
            const currentViewMode = cardViewModes[work.id] || 0;
            const totalViews = 2; // 0(액자) + 1(공간)

            // 다음/이전 보기 모드로 전환
            const handleNextView = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCardViewModes(prev => ({
                ...prev,
                [work.id]: ((prev[work.id] || 0) + 1) % totalViews
              }));
            };

            const handlePrevView = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCardViewModes(prev => ({
                ...prev,
                [work.id]: ((prev[work.id] || 0) - 1 + totalViews) % totalViews
              }));
            };

            // 이미지 비율에 따른 액자 크기 계산
            const ratio = imageRatios[work.id] || 1;
            const getFrameStyle = () => {
              const maxWidth = 95; // 최대 너비 (%) - 85에서 95로 증가
              const maxHeight = 95; // 최대 높이 (%) - 90에서 95로 증가

              if (ratio > 1.2) {
                // 가로가 긴 경우 (가로 > 세로)
                return {
                  width: `${maxWidth}%`,
                  height: `${maxWidth / ratio}%`
                };
              } else if (ratio < 0.8) {
                // 세로가 긴 경우 (세로 > 가로)
                return {
                  width: `${maxHeight * ratio}%`,
                  height: `${maxHeight}%`
                };
              } else {
                // 거의 정사각형인 경우
                return {
                  width: '90%', // 75%에서 90%로 증가
                  height: '90%' // 85%에서 90%로 증가
                };
              }
            };

            const frameStyle = getFrameStyle();

            // 이 카드 다음에 Society6 섹션을 표시할지 결정
            // 1. 이 행에 확장된 작품이 있고
            // 2. 이 카드가 행의 마지막이거나 전체 마지막인 경우
            const currentRow = Math.floor(idx / 3);
            const expandedWorkIndex = expandedWorkId ? filteredWorks.findIndex(w => w.id === expandedWorkId) : -1;
            const expandedRow = expandedWorkIndex >= 0 ? Math.floor(expandedWorkIndex / 3) : -1;
            const isRowEnd = (idx + 1) % 3 === 0 || idx === filteredWorks.length - 1;
            const showSectionAfterThis = expandedRow === currentRow && isRowEnd;

            const cardElement = (
              <div
                key={work.id}
                className="group transition-all duration-300"
              >
                {/* 이미지 영역 */}
                <div
                  className={`relative overflow-hidden ${isMarketplace ? 'aspect-square bg-[#F5F5F0] flex items-center justify-center p-8 mb-4 cursor-pointer' : 'aspect-square rounded-lg mb-3 bg-white cursor-pointer'}`}
                  onClick={() => {
                    if (isMarketplace) {
                      navigate(`/product/${work.id}`);
                    } else {
                      setSelectedWork(work.id);
                    }
                  }}
                >
                  {isMarketplace ? (
                    /* 마켓플레이스: 액자에 들어있는 모습 */
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* 이미지 비율 계산을 위한 숨김 이미지 */}
                      <img
                        src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                        alt=""
                        className="hidden"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          const ratio = img.naturalWidth / img.naturalHeight;
                          setImageRatios(prev => ({ ...prev, [work.id]: ratio }));
                        }}
                      />

                      {currentViewMode === 0 ? (
                        <>
                          {/* 모드 0: 액자 스타일 */}
                          <div className="absolute inset-0 bg-[#F5F5F0]" />

                          {/* 액자 프레임 - 이미지 비율에 맞게 조정 */}
                          <div
                            className="relative bg-white shadow-2xl transition-all duration-300"
                            style={frameStyle}
                          >
                            {/* 외부 프레임 (검은색) */}
                            <div className="absolute inset-0 bg-[#1a1a1a] p-[10px]">
                              {/* 내부 매트 (흰색 여백) */}
                              <div className="w-full h-full bg-white p-[14px] shadow-inner">
                                {/* 작품 이미지 */}
                                <div className="relative w-full h-full overflow-hidden">
                                  <ImageWithFallback
                                    src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                    alt={work.title}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* 모드 1: 실제 공간에 걸린 모습 */}
                          <div className="absolute inset-0">
                            <ImageWithFallback
                              src={roomBackground}
                              alt="Room background"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* 공간에 걸린 작품 (작게 표시) */}
                          <div className="relative w-[45%] h-[55%] shadow-2xl">
                            {/* 검은색 액자 */}
                            <div className="absolute inset-0 bg-[#1a1a1a] p-[12px]">
                              {/* 흰색 매트 */}
                              <div className="w-full h-full bg-white p-[16px] shadow-inner">
                                <div className="relative w-full h-full overflow-hidden">
                                  <ImageWithFallback
                                    src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                    alt={work.title}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* 좌우 네비게이션 버튼 */}
                      <button
                        onClick={handlePrevView}
                        className="absolute -left-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      >
                        <ChevronLeft className="h-2.5 w-2.5 text-gray-900" />
                      </button>
                      <button
                        onClick={handleNextView}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      >
                        <ChevronRight className="h-2.5 w-2.5 text-gray-900" />
                      </button>
                    </div>
                  ) : (
                    /* 일반 모드: 정사각 영역 + 원화 비율 유지(letterbox/pillarbox) */
                    <div className="relative w-full h-full flex items-center justify-center bg-white p-6">
                      <div className="relative w-full h-full flex items-center justify-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden rounded-sm">
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                          alt={work.title}
                          className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                        />

                        {/* 이미지 개수 배지 - 2장 이상일 때만 표시 */}
                        {getImageCount(work.image) > 1 && (
                          <div className="absolute left-3 top-3">
                            <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                              <ImageIcon className="h-3 w-3" />
                              {getImageCount(work.image)}
                            </div>
                          </div>
                        )}

                        {/* 호버 오버레이 + 제목 */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-5`}>
                          <h3 className="text-white text-[16px] font-semibold leading-tight drop-shadow-lg">
                            {work.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 마켓플레이스: 상세 정보 카드 */}
                {isMarketplace ? (
                  <div className="pb-4">
                    {/* 구분선 */}
                    <div className="w-full h-[1px] bg-gray-200 mb-4 mt-4" />

                    {/* 아티스트 + 배지 */}
                    <div className="flex items-center justify-between mb-2 min-h-[24px]">
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${artist.id}`);
                        }}
                      >
                        <span className="text-[11px] text-gray-500 uppercase tracking-wide">BY:</span>
                        <span className="text-[11px] text-gray-900 font-semibold uppercase tracking-wide hover:underline">
                          {artist.name}
                        </span>
                      </div>

                      {/* 판매 상태 배지 - 없을 때도 높이 유지 */}
                      <div className="h-[20px] flex items-center">
                        {/* 배지 제거됨 - 높이만 유지 */}
                      </div>
                    </div>

                    {/* 제목 */}
                    <div className="mb-3">
                      <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
                        {work.title}
                      </h3>
                    </div>

                    {/* 가격 */}
                    <div className="mb-3">
                      <span className="text-[14px] text-gray-700">
                        Starting at <span className="font-bold text-gray-900">₩{finalPrice.toLocaleString()}</span>
                      </span>
                    </div>

                    {/* 구분선 - 선택 상태에 따라 스타일 변경 */}
                    <div
                      className={`w-full mb-3 transition-all ${expandedWorkId === work.id
                        ? 'h-[2px] bg-gray-900'
                        : 'h-[1px] bg-gray-300'
                        }`}
                    />

                    {/* MORE BY THIS ARTIST 버튼 + 아이콘 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Clicked artist:', artist.id, 'Current expanded:', expandedWorkId);
                        if (expandedWorkId === work.id) {
                          setExpandedWorkId(null);
                        } else {
                          setExpandedWorkId(work.id);
                        }
                      }}
                      className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${expandedWorkId === work.id
                        ? 'text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                        }`}
                    >
                      <span>MORE BY THIS ARTIST</span>
                      {expandedWorkId === work.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  /* 일반 모드: 정보 바 */
                  <div className="flex items-center justify-between">
                    {/* 좌측: 아티스트 */}
                    <div className="flex items-center gap-2">
                      {/* 메인 작가 / 그룹명 */}
                      <div className="relative">
                        <div
                          className="flex items-center gap-1.5"
                          onMouseEnter={() => {
                            if (w.coOwners && w.coOwners.length > 0) {
                              setHoveredArtist(work.id);
                            }
                          }}
                          onMouseLeave={() => setHoveredArtist(null)}
                        >
                          {/* 그룹명이 있으면 그룹명 표시, 없으면 작가 이름 표시 */}
                          {w.groupName ? (
                            <>
                              <span className="text-[13px] text-[#696969] hover:text-[#191919] transition-colors font-medium">
                                {w.groupName}
                              </span>
                              <Users className="h-3 w-3 text-gray-500" />
                            </>
                          ) : (
                            <>
                              <Avatar className="h-6 w-6 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${artist.id}`);
                                }}
                              >
                                <AvatarImage src={artist.avatar} alt={artist.name} />
                                <AvatarFallback className="text-[11px]">{artist.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-1.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${artist.id}`);
                                }}
                              >
                                <span className="text-[13px] text-[#696969] hover:text-[#191919] transition-colors font-normal">
                                  {artist.name}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 호버 시 그룹 멤버/공동 작업자 목록 */}
                        {w.coOwners && w.coOwners.length > 0 && hoveredArtist === work.id && (
                          <div
                            className="absolute left-0 top-full mt-1 z-[100] w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
                            onMouseEnter={() => setHoveredArtist(work.id)}
                            onMouseLeave={() => setHoveredArtist(null)}
                          >
                            <div className="text-[11px] font-semibold text-gray-900 mb-3">{w.groupName ? '그룹 멤버' : '그룹 작업자'}</div>
                            <div className="space-y-2">
                              {/* 그룹이 아닐 때만 메인 작가 표시 */}
                              {!w.groupName && (
                                <div className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors">
                                  <div
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${artist.id}`);
                                    }}
                                  >
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={artist.avatar} alt={artist.name} />
                                      <AvatarFallback className="text-[10px]">{artist.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-[12px] font-medium text-gray-900">{artist.name}</div>
                                      <div className="text-[10px] text-gray-500">{artist.bio}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      toggleFollow(artist.id, e);
                                    }}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${followingArtists.has(artist.id)
                                      ? 'bg-gray-300 text-gray-600 cursor-default'
                                      : 'bg-gray-900 text-white hover:bg-gray-800'
                                      }`}
                                  >
                                    {followingArtists.has(artist.id) ? '팔로잉' : '팔로우'}
                                  </button>
                                </div>
                              )}
                              {/* 그룹 소유자들 */}
                              {w.coOwners.map((coOwner: any) => (
                                <div
                                  key={coOwner.id}
                                  className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors"
                                >
                                  <div
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${coOwner.id}`);
                                    }}
                                  >
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={coOwner.avatar} alt={coOwner.name} />
                                      <AvatarFallback className="text-[10px]">{coOwner.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-[12px] font-medium text-gray-900">{coOwner.name}</div>
                                      <div className="text-[10px] text-gray-500">{coOwner.bio}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      toggleFollow(coOwner.id, e);
                                    }}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${followingArtists.has(coOwner.id)
                                      ? 'bg-gray-300 text-gray-600 cursor-default'
                                      : 'bg-gray-900 text-white hover:bg-gray-800'
                                      }`}
                                  >
                                    {followingArtists.has(coOwner.id) ? '팔로잉' : '팔로우'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>


                      {/* 그룹 소유자 아바타 표시 (그룹명이 없을 때만) */}
                      {!w.groupName && w.coOwners && w.coOwners.length > 0 && (
                        <div className="flex items-center -space-x-2">
                          {w.coOwners.slice(0, 3).map((coOwner: any) => (
                            <Avatar key={coOwner.id} className="h-6 w-6 border-2 border-white">
                              <AvatarImage src={coOwner.avatar} alt={coOwner.name} />
                              <AvatarFallback className="text-[10px]">{coOwner.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {w.coOwners.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                              <span className="text-[9px] font-medium text-gray-600">
                                +{w.coOwners.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 우측: 통계 */}
                    <div className="flex items-center gap-3 text-[12px] text-[#696969]">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>
                          {likes >= 1000 ? Math.floor(likes / 1000) + 'k' : likes}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>
                          {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );

            // Society6 섹션 엘리먼트 (필요할 경우에만 생성)
            let society6Section = null;
            if (showSectionAfterThis && expandedWorkId) {
              // expandedWorkId에 해당하는 작품 찾기
              const expandedWork = filteredWorks.find(w => w.id === expandedWorkId);
              const expandedArtist = expandedWork ? artists.find(a => a.id === expandedWork.artist.id) : null;

              if (expandedArtist && expandedWork) {
                society6Section = (
                  <div key={`society6-${work.id}`} className="col-span-3 w-full bg-[#F5EFE7] py-16 px-12 my-8 rounded-lg">
                    {/* 헤더 - 상단 구분선 */}
                    <div className="w-full h-[1px] bg-gray-300 mb-8" />

                    {/* 타이틀과 닫기 버튼 */}
                    <div className="flex items-center justify-between mb-12">
                      <h2 className="text-[28px] font-light text-gray-900">
                        More from <span className="font-normal">{expandedArtist.name.toLowerCase()}</span>
                      </h2>
                      <button
                        onClick={() => setExpandedWorkId(null)}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    {/* 메인 컨텐츠: 왼쪽 작품들, 오른쪽 작가 카드 */}
                    <div className="grid grid-cols-12 gap-8">
                      {/* 왼쪽: 작품 그리드 (9컬럼) */}
                      <div className="col-span-9">
                        <div className="grid grid-cols-4 gap-6">
                          {works
                            .filter(ow => ow.artist.id === expandedArtist.id)
                            .slice(0, 4)
                            .map((otherWork) => {
                              return (
                                <div
                                  key={otherWork.id}
                                  className="cursor-pointer group/other"
                                  onClick={() => {
                                    setSelectedWork(otherWork.id);
                                    setExpandedWorkId(null);
                                  }}
                                >
                                  {/* 작품 이미지 */}
                                  <div className="relative aspect-square bg-white mb-4 overflow-hidden flex items-center justify-center">
                                    <ImageWithFallback
                                      src={imageUrls[getFirstImage(otherWork.image)] || getFirstImage(otherWork.image)}
                                      alt={otherWork.title}
                                      className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform group-hover/other:scale-105"
                                    />
                                  </div>

                                  {/* 작품 제목 */}
                                  <h5 className="text-[13px] font-normal text-gray-900 mb-1 leading-tight">
                                    {otherWork.title}
                                  </h5>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* 오른쪽: 작가 카드 (3컬럼) */}
                      <div className="col-span-3">
                        <div className="bg-gradient-to-br from-pink-200 via-orange-200 to-pink-300 p-6 rounded-lg flex flex-col justify-between">
                          {/* 장식 패턴 */}
                          <div className="mb-4">
                            <div className="w-16 h-16 rounded-full border-4 border-blue-400 opacity-70 mb-2" />
                            <div className="w-12 h-12 bg-yellow-300 rounded-full -mt-8 ml-10" />
                          </div>

                          {/* 작가 정보 */}
                          <div>
                            <p className="text-[12px] text-gray-800 mb-4 leading-relaxed">
                              {expandedArtist.name} is an artist based in Seoul. Creating beautiful digital artworks.
                            </p>

                            {/* VISIT ARTIST SHOP 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${expandedArtist.id}`);
                                setExpandedWorkId(null);
                              }}
                              className="w-full bg-black text-white text-[12px] font-bold uppercase tracking-wider py-2.5 px-5 rounded hover:bg-gray-800 transition-colors"
                            >
                              VISIT ARTIST SHOP
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            }

            // 배열로 반환 (Fragment 사용하지 않음)
            const elements = [cardElement];
            if (society6Section) {
              elements.push(society6Section);
            }
            return elements;
          })}
        </div>
      </div>

      {/* Work Detail Modal */}
      {selectedWork !== null && (
        <WorkDetailModal
          workId={selectedWork}
          onClose={() => setSelectedWork(null)}
          onNavigate={(newWorkId) => setSelectedWork(newWorkId)}
          allWorks={filteredWorks}
        />
      )}
    </div>
  );
}