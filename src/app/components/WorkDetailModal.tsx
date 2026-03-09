import { X, Heart, Bookmark, MessageCircle, Send, MoreHorizontal, ChevronLeft, ChevronRight, ShoppingBag, Plus, MapPin } from 'lucide-react';
import { Work, Comment, comments as allComments, works, artists } from '../data';
import { groupWorks } from '../groupData';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { getFirstImage, getImageCount } from '../utils/imageHelper';
import { userInteractionStore, workStore } from '../store';
import { CopyrightProtectedImage, PinCommentLayer } from './work';

interface WorkDetailModalProps {
  workId: string;
  onClose: () => void;
  onNavigate?: (workId: string) => void;
  allWorks?: any[]; // 셔플된 전체 작품 배열을 받을 수 있도록
}

export function WorkDetailModal({ workId, onClose, onNavigate, allWorks: providedWorks }: WorkDetailModalProps) {
  // works와 groupWorks 모두에서 찾기
  const defaultWorks = [...works, ...groupWorks];
  const allWorks = providedWorks || defaultWorks;
  const work = allWorks.find(w => w.id === workId);
  const [isLiked, setIsLiked] = useState(() => userInteractionStore.isLiked(workId));
  const [isSaved, setIsSaved] = useState(() => userInteractionStore.isSaved(workId));
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<'museum' | 'wood' | 'acrylic' | null>(null);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | null>(null);
  
  // 현재 보고 있는 이미지 인덱스 (여러 이미지인 경우)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 작품 목록 슬라이드 인덱스
  const [worksSlideIndex, setWorksSlideIndex] = useState(0);

  // Pin 코멘트 모드
  const [pinAddMode, setPinAddMode] = useState(false);

  // 이미지 컨테이너 ref (Pin 좌표 계산용) - 여러 장일 때 배열
  const imageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const singleImageContainerRef = useRef<HTMLDivElement>(null);
  
  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // workId가 변경되면 이미지 인덱스를 0으로 리셋하고 좋아요/저장 상태 동기화
  useEffect(() => {
    setCurrentImageIndex(0);
    setWorksSlideIndex(0);
    setIsLiked(userInteractionStore.isLiked(workId));
    setIsSaved(userInteractionStore.isSaved(workId));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [workId]);
  
  // 이미지 배열 가져오기
  const images = Array.isArray(work?.image) ? work.image : work?.image ? [work.image] : [];
  const totalImages = images.length;

  useEffect(() => {
    // 모달 열릴 때 스크롤 방지
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!work) return null;
  
  const firstImage = getFirstImage(work.image);

  const currentIndex = allWorks.findIndex(w => w.id === workId);
  const prevWork = currentIndex > 0 ? allWorks[currentIndex - 1] : null;
  const nextWork = currentIndex < allWorks.length - 1 ? allWorks[currentIndex + 1] : null;

  // 같은 작가의 다른 작품
  const relatedWorks = allWorks.filter(w => w.artistId === work.artistId && w.id !== work.id).slice(0, 8);
  
  // 작품 목록 네비게이션
  const canSlidePrev = worksSlideIndex > 0;
  const canSlideNext = worksSlideIndex < relatedWorks.length - 4;
  
  const handleWorksSlideNext = () => {
    if (canSlideNext) {
      setWorksSlideIndex(prev => prev + 1);
    }
  };
  
  const handleWorksSlidePrev = () => {
    if (canSlidePrev) {
      setWorksSlideIndex(prev => prev - 1);
    }
  };

  const handlePrev = () => {
    if (prevWork && onNavigate) {
      onNavigate(prevWork.id);
    }
  };

  const handleNext = () => {
    if (nextWork && onNavigate) {
      onNavigate(nextWork.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 딤 배경 */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* 메인 컨텐츠 */}
      <div className={`relative z-10 w-full h-full flex transition-all duration-300 ${
        showComments || showPurchase ? 'max-w-[1700px]' : 'max-w-[1300px]'
      }`} onClick={(e) => e.stopPropagation()}>
        {/* 좌측: 이미지 영역 */}
        <div className={`flex flex-col px-16 pt-[40px] transition-all duration-300 ${
          showComments || showPurchase ? 'w-[calc(100%-400px)]' : 'w-full'
        }`}>
          {/* 닫기 버튼 - 우측 상단 */}
          <button
            onClick={onClose}
            className="fixed right-6 top-6 flex h-10 w-10 items-center justify-center text-white hover:text-white/70 transition-colors z-50"
          >
            <X className="h-7 w-7" />
          </button>

          {/* 상단 헤더: 작품명 + 작가 정보 + 팔로우 */}
          <div className="w-full flex items-center justify-between mb-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <Avatar className="h-11 w-11 border-2 border-white/20">
                <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-3">
                <h2 className="text-white text-[18px] font-bold">{work.title}</h2>
                <span className="text-white/50">•</span>
                <span className="text-white/80 text-[15px]">{work.artist.name}</span>
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2 rounded-md text-[14px] font-medium transition-colors ${
                isFollowing
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white text-[#191919] hover:bg-white/90'
              }`}
            >
              {isFollowing ? '팔로잉' : '팔로우'}
            </button>
          </div>

          {/* 중앙 이미지 - 고정 높이 영역 */}
          <div 
            ref={scrollContainerRef}
            className={`relative w-full h-[calc(100vh-112px)] bg-black overflow-y-auto ${totalImages > 1 ? 'flex items-start justify-center' : 'flex items-center justify-center'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {totalImages > 1 ? (
              /* 여러 장인 경우: 세로 스크롤 레이아웃 */
              <div className="w-full py-8 space-y-8">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative w-full flex items-center justify-center transition-all duration-500 px-8 ${showPurchase && selectedOption === 'museum' ? '' : ''} ${showPurchase && selectedOption === 'wood' ? 'py-4' : ''} ${showPurchase && selectedOption === 'acrylic' ? 'py-3' : ''}`}
                  >
                    <div
                      className={`relative max-w-[900px] w-full transition-all duration-500 ${showPurchase && selectedOption === 'museum' ? '' : ''} ${showPurchase && selectedOption === 'wood' ? 'p-8 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded' : ''} ${showPurchase && selectedOption === 'acrylic' ? 'p-6' : ''}`}
                      style={{
                        ...(showPurchase && selectedOption === 'wood' ? {
                          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.5)',
                          borderRadius: '4px',
                        } : {}),
                        ...(showPurchase && selectedOption === 'acrylic' ? {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '2px',
                        } : {})
                      }}
                    >
                      <div
                        ref={(el) => { imageContainerRefs.current[index] = el; }}
                        className="relative"
                      >
                        <CopyrightProtectedImage
                          src={imageUrls[image] || image}
                          alt={`${work.title} - ${index + 1}`}
                          watermarkText={`© ${work.artist.name} · ${work.title}`}
                          showWatermark
                          preventRightClick
                          preventDrag
                          className={`w-full h-auto object-contain transition-all duration-500 ${showPurchase && selectedOption === 'wood' ? 'shadow-2xl' : ''}`}
                        />
                        <PinCommentLayer
                          workId={workId}
                          imageIndex={index}
                          containerRefs={imageContainerRefs}
                          containerIndex={index}
                          addMode={pinAddMode}
                          onAddModeChange={setPinAddMode}
                          currentUser={artists[0]}
                        />
                      </div>
                      
                      {/* 우드 프레임 내부 디테일 */}
                      {showPurchase && selectedOption === 'wood' && (
                        <>
                          <div className="absolute inset-0 pointer-events-none" style={{
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                            border: '2px solid rgba(139, 69, 19, 0.3)',
                            borderRadius: '4px',
                          }} />
                          {/* 우드 텍스처 느낌 */}
                          <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                          }} />
                        </>
                      )}
                      
                      {/* 아크릴 프레임 반사 효과 */}
                      {showPurchase && selectedOption === 'acrylic' && (
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)',
                          borderRadius: '2px',
                        }} />
                      )}
                    </div>
                    
                    {/* 이미지 번호 표시 */}
                    <div className="absolute top-4 right-12 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="text-white text-[12px] font-medium">{index + 1} / {totalImages}</span>
                    </div>
                  </div>
                ))}

                {/* 작가 프로필 섹션 - 여러 이미지 레이아웃에서 */}
                <div className="max-w-[900px] mx-auto px-8 py-12">
                  {work.coOwners && work.coOwners.length > 0 ? (
                    /* 그룹 작품: 참여 작가 리스트 */
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8">
                      {/* 그룹 헤더 */}
                      {work.groupName && (
                        <div className="text-center mb-8 pb-6 border-b border-white/10">
                          <h3 className="text-[24px] font-bold text-white mb-2">
                            {work.groupName}
                          </h3>
                          <p className="text-[14px] text-white/70">
                            참여 작가 {work.coOwners.length + 1}명
                          </p>
                        </div>
                      )}
                      
                      {/* 작가 리스트 */}
                      <div className="space-y-4">
                        {/* 메인 작가 */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <Avatar className="h-14 w-14 border-2 border-white/20">
                            <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                            <AvatarFallback className="text-[18px] font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-[16px] font-semibold text-white mb-1">
                              {work.artist.name}
                            </h4>
                            <p className="text-[13px] text-white/60">
                              {work.artist.bio}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-9 px-4 text-[13px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            팔로우
                          </Button>
                        </div>
                        
                        {/* 그룹 작가들 */}
                        {work.coOwners.map((coOwner) => (
                          <div key={coOwner.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <Avatar className="h-14 w-14 border-2 border-white/20">
                              <AvatarImage src={coOwner.avatar} alt={coOwner.name} />
                              <AvatarFallback className="text-[18px] font-semibold bg-white/10 text-white">{coOwner.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-[16px] font-semibold text-white mb-1">
                                {coOwner.name}
                              </h4>
                              <p className="text-[13px] text-white/60">
                                {coOwner.bio}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9 px-4 text-[13px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              팔로우
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 개인 작가: 기존 프로필 카드 */
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-12 text-center">
                      {/* 작가 아바타 */}
                      <div className="mb-6 flex justify-center">
                        <Avatar className="h-20 w-20 border-2 border-white/20">
                          <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                          <AvatarFallback className="text-[24px] font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* 작가 이름 */}
                      <h3 className="mb-2 text-[20px] font-semibold text-white">
                        {work.artist.name}
                      </h3>
                      
                      {/* 작가 소개 */}
                      <p className="mb-6 text-[14px] text-white/70">
                        {work.artist.bio}
                      </p>
                      
                      {/* 버튼 그룹 */}
                      <div className="flex items-center justify-center gap-3">
                        <Button 
                          variant="outline" 
                          className="h-10 px-6 text-[14px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          팔로우
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 모든 작업 목록 섹션 - 여러 이미지 레이아웃에서 */}
                {relatedWorks.length > 0 && (
                  <div className="max-w-[900px] mx-auto px-8 pb-12">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-[20px] font-semibold text-white">
                        모든 작업 목록
                      </h2>
                      <button className="text-[14px] text-white/60 hover:text-white transition-colors">
                        프로필 자세히 보기 &gt;
                      </button>
                    </div>
                    <div className="relative">
                      {/* 왼쪽 화살표 */}
                      {canSlidePrev && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorksSlidePrev();
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                          <ChevronLeft className="h-5 w-5 text-white" />
                        </button>
                      )}
                      
                      {/* 오른쪽 화살표 */}
                      {canSlideNext && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorksSlideNext();
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                          <ChevronRight className="h-5 w-5 text-white" />
                        </button>
                      )}
                      
                      <div className="overflow-hidden">
                        <div 
                          className="grid grid-cols-4 gap-4 transition-transform duration-300"
                          style={{ transform: `translateX(-${worksSlideIndex * 25}%)` }}
                        >
                          {relatedWorks.map((relatedWork) => (
                            <button
                              key={relatedWork.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigate) onNavigate(relatedWork.id);
                              }}
                              className="group cursor-pointer text-left"
                            >
                              <div className="relative mb-3 overflow-hidden rounded-lg bg-white/5 border border-white/10 aspect-square flex items-center justify-center">
                                <ImageWithFallback
                                  src={imageUrls[getFirstImage(relatedWork.image)] || getFirstImage(relatedWork.image)}
                                  alt={relatedWork.title}
                                  className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <div className="text-[14px] font-medium text-white group-hover:text-[#00BFA5] transition-colors mb-1">
                                {relatedWork.title}
                              </div>
                              <div className="text-[12px] text-white/60">
                                {work.artist.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 1장인 경우: 기존 레이아웃 */
              <div className="w-full h-full flex flex-col items-center justify-start overflow-y-auto">
                <div
                  className={`relative w-full flex-shrink-0 flex items-center justify-center transition-all duration-500 py-8 ${showPurchase && selectedOption === 'museum' ? 'p-0' : ''} ${showPurchase && selectedOption === 'wood' ? 'p-8 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950' : ''} ${showPurchase && selectedOption === 'acrylic' ? 'p-6' : ''}`}
                  style={{
                    ...(showPurchase && selectedOption === 'wood' ? {
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.5)',
                      borderRadius: '4px',
                    } : {}),
                    ...(showPurchase && selectedOption === 'acrylic' ? {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '2px',
                    } : {})
                  }}
                  >
                  <div ref={singleImageContainerRef} className="relative">
                    <CopyrightProtectedImage
                      src={imageUrls[images[0]] || images[0]}
                      alt={work.title}
                      watermarkText={`© ${work.artist.name} · ${work.title}`}
                      showWatermark
                      preventRightClick
                      preventDrag
                      className={`max-w-full max-h-[calc(100vh-300px)] object-contain transition-all duration-500 ${showPurchase && selectedOption === 'wood' ? 'shadow-2xl' : ''}`}
                    />
                    <PinCommentLayer
                      workId={workId}
                      imageIndex={0}
                      imageRef={singleImageContainerRef}
                      addMode={pinAddMode}
                      onAddModeChange={setPinAddMode}
                      currentUser={artists[0]}
                    />
                  </div>
                  
                  {/* 우드 프레임 내부 디테일 */}
                  {showPurchase && selectedOption === 'wood' && (
                    <>
                      <div className="absolute inset-0 pointer-events-none" style={{
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                        border: '2px solid rgba(139, 69, 19, 0.3)',
                        borderRadius: '4px',
                      }} />
                      {/* 우드 텍스처 느낌 */}
                      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                      }} />
                    </>
                  )}
                  
                  {/* 아크릴 프레임 반사 효과 */}
                  {showPurchase && selectedOption === 'acrylic' && (
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)',
                      borderRadius: '2px',
                    }} />
                  )}
                </div>

                {/* 작가 프로필 섹션 - 1장 레이아웃에서 */}
                <div className="max-w-[900px] w-full mx-auto px-8 py-12">
                  {work.coOwners && work.coOwners.length > 0 ? (
                    /* 그룹 작품: 참여 작가 리스트 */
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8">
                      {/* 그룹 헤더 */}
                      {work.groupName && (
                        <div className="text-center mb-8 pb-6 border-b border-white/10">
                          <h3 className="text-[24px] font-bold text-white mb-2">
                            {work.groupName}
                          </h3>
                          <p className="text-[14px] text-white/70">
                            참여 작가 {work.coOwners.length + 1}명
                          </p>
                        </div>
                      )}
                      
                      {/* 작가 리스트 */}
                      <div className="space-y-4">
                        {/* 메인 작가 */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                          <Avatar className="h-14 w-14 border-2 border-white/20">
                            <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                            <AvatarFallback className="text-[18px] font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-[16px] font-semibold text-white mb-1">
                              {work.artist.name}
                            </h4>
                            <p className="text-[13px] text-white/60">
                              {work.artist.bio}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-9 px-4 text-[13px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            팔로우
                          </Button>
                        </div>
                        
                        {/* 그룹 작가들 */}
                        {work.coOwners.map((coOwner) => (
                          <div key={coOwner.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <Avatar className="h-14 w-14 border-2 border-white/20">
                              <AvatarImage src={coOwner.avatar} alt={coOwner.name} />
                              <AvatarFallback className="text-[18px] font-semibold bg-white/10 text-white">{coOwner.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-[16px] font-semibold text-white mb-1">
                                {coOwner.name}
                              </h4>
                              <p className="text-[13px] text-white/60">
                                {coOwner.bio}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9 px-4 text-[13px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              팔로우
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 개인 작가: 기존 프로필 카드 */
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-12 text-center">
                      {/* 작가 아바타 */}
                      <div className="mb-6 flex justify-center">
                        <Avatar className="h-20 w-20 border-2 border-white/20">
                          <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                          <AvatarFallback className="text-[24px] font-semibold bg-white/10 text-white">{work.artist.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* 작가 이름 */}
                      <h3 className="mb-2 text-[20px] font-semibold text-white">
                        {work.artist.name}
                      </h3>
                      
                      {/* 작가 소개 */}
                      <p className="mb-6 text-[14px] text-white/70">
                        {work.artist.bio}
                      </p>
                      
                      {/* 버튼 그룹 */}
                      <div className="flex items-center justify-center gap-3">
                        <Button 
                          variant="outline" 
                          className="h-10 px-6 text-[14px] border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          팔로우
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 모든 작업 목록 섹션 - 1장 레이아웃에서 */}
                {relatedWorks.length > 0 && (
                  <div className="max-w-[900px] w-full mx-auto px-8 pb-12">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-[20px] font-semibold text-white">
                        모든 작업 목록
                      </h2>
                      <button className="text-[14px] text-white/60 hover:text-white transition-colors">
                        프로필 자세히 보기 &gt;
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {relatedWorks.slice(0, 4).map((relatedWork) => (
                        <button
                          key={relatedWork.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigate) onNavigate(relatedWork.id);
                          }}
                          className="group cursor-pointer text-left"
                        >
                          <div className="relative mb-3 overflow-hidden rounded-lg bg-white/5 border border-white/10 aspect-square flex items-center justify-center">
                            <ImageWithFallback
                              src={imageUrls[getFirstImage(relatedWork.image)] || getFirstImage(relatedWork.image)}
                              alt={relatedWork.title}
                              className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="text-[14px] font-medium text-white group-hover:text-[#00BFA5] transition-colors mb-1">
                            {relatedWork.title}
                          </div>
                          <div className="text-[12px] text-white/60">
                            {work.artist.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 작품 네비게이션 버튼 - 양 끝 배치 */}
          {prevWork && (
            <button
              onClick={handlePrev}
              className="fixed bottom-4 left-6 flex flex-col items-center gap-1 z-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronLeft className="h-6 w-6" />
              </div>
              <span className="text-white text-[11px]">이전</span>
            </button>
          )}

          {nextWork && (
            <button
              onClick={handleNext}
              className="fixed bottom-4 right-6 flex flex-col items-center gap-1 z-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                <ChevronRight className="h-6 w-6" />
              </div>
              <span className="text-white text-[11px]">다음</span>
            </button>
          )}

          {/* 우측 액션 버튼들 */}
          {!showComments && !showPurchase && (
            <div className="fixed top-1/2 -translate-y-1/2 right-6 flex flex-col items-center gap-6 z-50">
              {/* 팔로우 버튼 */}
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="relative flex h-11 w-11 items-center justify-center">
                  <Avatar className="h-11 w-11 border-2 border-white/20">
                    <AvatarImage src={work.artist.avatar} alt={work.artist.name} />
                    <AvatarFallback>{work.artist.name[0]}</AvatarFallback>
                  </Avatar>
                  {isFollowing && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF] border-2 border-black">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-white">{work.artist.name}</span>
              </button>

              {/* 좋아요 버튼 */}
              <button
                onClick={() => {
                  userInteractionStore.toggleLike(workId);
                  if (!isLiked) workStore.updateWork(workId, { likes: (work.likes || 0) + 1 });
                  else workStore.updateWork(workId, { likes: Math.max(0, (work.likes || 0) - 1) });
                  setIsLiked(!isLiked);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                  isLiked 
                    ? 'bg-[#FF2E63]' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}>
                  <Heart className={`h-5 w-5 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-white">좋아요</span>
                  <span className="text-[10px] text-white/70">{work.likes.toLocaleString()}</span>
                </div>
              </button>

              {/* 댓글 버튼 */}
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] text-white">댓글</span>
                  <span className="text-[10px] text-white/70">{work.comments}</span>
                </div>
              </button>

              {/* 저장 버튼 */}
              <button
                onClick={() => {
                  userInteractionStore.toggleSave(workId);
                  if (!isSaved) workStore.updateWork(workId, { saves: (work.saves || 0) + 1 });
                  else workStore.updateWork(workId, { saves: Math.max(0, (work.saves || 0) - 1) });
                  setIsSaved(!isSaved);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${
                  isSaved 
                    ? 'bg-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}>
                  <Bookmark className={`h-5 w-5 ${isSaved ? 'text-[#191919] fill-[#191919]' : 'text-white'}`} />
                </div>
                <span className="text-[11px] text-white">저장</span>
              </button>

              {/* 소장하기 버튼 */}
              <button 
                onClick={() => {
                  setShowPurchase(!showPurchase);
                  if (showComments) setShowComments(false);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="text-[11px] text-white">소장하기</span>
              </button>

              {/* Pin 코멘트 버튼 */}
              <button 
                onClick={() => {
                  setPinAddMode(!pinAddMode);
                }}
                className={`flex flex-col items-center gap-1.5 group ${pinAddMode ? 'ring-2 ring-cyan-400 rounded-full' : ''}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors backdrop-blur-sm ${pinAddMode ? 'bg-cyan-500/30' : 'bg-white/10 hover:bg-white/20'}`}>
                  <MapPin className={`h-5 w-5 ${pinAddMode ? 'text-cyan-400' : 'text-white'}`} />
                </div>
                <span className="text-[11px] text-white">핀 코멘트</span>
              </button>
            </div>
          )}
        </div>

        {/* 우측: 댓글 영역 */}
        {showComments && (
          <div className="w-[400px] bg-white flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
            {/* 댓글 섹션 헤더 */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-[16px] font-semibold text-gray-900">댓글(1)</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(false);
                  setReplyingTo(null);
                }}
                className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 댓글 작성란 - 상단 배치 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <Textarea
                placeholder="이 작품에 대한 댓글을 남겨보세요."
                className="w-full h-[100px] px-4 py-3 border border-gray-300 rounded-lg resize-none text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#191919] focus:border-transparent mb-3"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowComments(false);
                    setReplyingTo(null);
                  }}
                  className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  취소
                </button>
                <button className="px-5 py-2 bg-[#191919] text-white text-[14px] font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors">
                  댓글 작성
                </button>
              </div>
            </div>

            {/* 댓글 목록 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* 댓글 아이템 예시 */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-[13px]">자</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-gray-900">자우</span>
                      <span className="text-[12px] text-gray-400">2026.01.21</span>
                    </div>
                    <p className="text-[14px] text-gray-700 leading-relaxed mb-2">
                      썸네일의 포스하고 따듯한 무드에 이끌려 들어왔는데,<br />
                      반려식물의 죽음을 다룬 주제라니 마음이 숙연해지네요.
                    </p>
                    <p className="text-[14px] text-gray-700 leading-relaxed mb-2">
                      부고장을 연상시키는 심플한지 절감이<br />
                      주제와 잘이 있게 어우러지도록 수 있습니다.
                    </p>
                    <p className="text-[14px] text-gray-700 leading-relaxed mb-3">
                      잘 보고 갑니다
                    </p>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === 1 ? null : 1)}
                      className="text-[13px] text-gray-500 hover:text-gray-700"
                    >
                      답글 달기
                    </button>

                    {/* 답글 작성란 */}
                    {replyingTo === 1 && (
                      <div className="mt-4 pl-0">
                        <Textarea
                          placeholder="답글을 입력해주세요."
                          className="w-full h-[100px] px-4 py-3 border border-gray-300 rounded-lg resize-none text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#191919] focus:border-transparent mb-3"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                          >
                            취소
                          </button>
                          <button className="px-5 py-2 bg-[#191919] text-white text-[14px] font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors">
                            답글 작성
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 우측: 소장하기 영역 */}
        {showPurchase && (
          <div className="w-[400px] bg-white flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-[16px] font-semibold text-gray-900">소장 옵션</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPurchase(false);
                  setSelectedOption(null);
                  setSelectedSize(null);
                }}
                className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 작품 정보 */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <ImageWithFallback
                  src={imageUrls[firstImage] || firstImage}
                  alt={work.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h5 className="text-[15px] font-semibold text-gray-900 mb-1">{work.title}</h5>
                  <p className="text-[13px] text-gray-600">{work.artist.name}</p>
                </div>
              </div>
            </div>

            {/* 옵션 선택 */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {/* 뮤지엄 아트 프린트 */}
                <button
                  onClick={() => setSelectedOption('museum')}
                  className={`w-full p-4 bg-[#FAFAFA] border-2 rounded-xl text-left transition-all shadow-sm hover:shadow-md ${
                    selectedOption === 'museum'
                      ? 'border-amber-600 ring-2 ring-amber-100'
                      : 'border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-[15px] font-semibold text-gray-900">Museum Art Print</h5>
                    <span className="text-[18px] font-bold text-gray-900">₩89,000</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    아카이브 용지, 액자 미포함<br />
                    박물관 품질의 프리미엄 프린트
                  </p>
                </button>

                {/* 클래식 우드 액자 */}
                <div
                  onClick={() => setSelectedOption('wood')}
                  className={`w-full p-4 bg-[#FAFAFA] border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    selectedOption === 'wood'
                      ? 'border-amber-800 ring-2 ring-amber-100'
                      : 'border-amber-300 hover:border-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-[15px] font-semibold text-gray-900">Classic Wood Frame</h5>
                    <span className="text-[18px] font-bold text-gray-900">₩180,000~</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed mb-3">
                    캔버스 프린트 + 오크 원목 액자<br />
                    사이즈를 선택해주세요
                  </p>
                  
                  {/* 우드 액자 사이즈 선택 */}
                  {selectedOption === 'wood' && (
                    <div className="space-y-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize('small');
                        }}
                        className={`w-full p-3.5 bg-white border-2 rounded-lg text-left transition-all ${
                          selectedSize === 'small'
                            ? 'border-amber-800 ring-1 ring-amber-200'
                            : 'border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-gray-900">Small (40×60cm)</span>
                          <span className="text-[15px] font-bold text-gray-900">₩180,000</span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize('medium');
                        }}
                        className={`w-full p-3.5 bg-white border-2 rounded-lg text-left transition-all ${
                          selectedSize === 'medium'
                            ? 'border-amber-800 ring-1 ring-amber-200'
                            : 'border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-gray-900">Medium (60×90cm)</span>
                          <span className="text-[15px] font-bold text-gray-900">₩280,000</span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize('large');
                        }}
                        className={`w-full p-3.5 bg-white border-2 rounded-lg text-left transition-all ${
                          selectedSize === 'large'
                            ? 'border-amber-800 ring-1 ring-amber-200'
                            : 'border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-gray-900">Large (90×120cm)</span>
                          <span className="text-[15px] font-bold text-gray-900">₩450,000</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 모던 아크릴 액자 */}
                <button
                  onClick={() => setSelectedOption('acrylic')}
                  className={`w-full p-4 bg-[#FAFAFA] border-2 rounded-xl text-left transition-all shadow-sm hover:shadow-md ${
                    selectedOption === 'acrylic'
                      ? 'border-slate-600 ring-2 ring-slate-100'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-[15px] font-semibold text-gray-900">Modern Acrylic Frame</h5>
                    <span className="text-[18px] font-bold text-gray-900">₩320,000</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    액자 없는 갤러리 마감 (80×100cm)<br />
                    현대적이고 미니멀한 디자인
                  </p>
                </button>
              </div>

              {/* 안내 문구 */}
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[12px] text-gray-700 leading-relaxed">
                  • 모든 작품은 한정 수량으로 제작됩니다<br />
                  • 작가 서명 및 진품 인증서가 포함됩니다<br />
                  • 제작 기간은 주문 후 2-3주 소요됩니다<br />
                  • 전문 포장 및 보험 배송이 제공됩니다
                </p>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowPurchase(false);
                    setSelectedOption(null);
                    setSelectedSize(null);
                  }}
                  className="flex-1 px-4 py-3 text-[14px] font-semibold text-gray-700 hover:text-gray-900 transition-colors border-2 border-gray-300 rounded-lg hover:border-gray-400"
                >
                  취소
                </button>
                <button
                  disabled={!selectedOption || (selectedOption === 'wood' && !selectedSize)}
                  className="flex-1 px-4 py-3 bg-[#191919] text-white text-[14px] font-bold rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {selectedOption === 'museum' && '소장하기'}
                  {selectedOption === 'wood' && '소장하기'}
                  {selectedOption === 'acrylic' && '소장하기'}
                  {!selectedOption && '옵션을 선택해주세요'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}