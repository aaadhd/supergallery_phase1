import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, ArrowRight, X, Bell } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

const promotionBanners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '봄맞이 특별 전시',
    subtitle: '국내 작가 100인의 신작 공개',
    tag: 'NEW',
    description: '따뜻한 봄을 맞아 국내 유명 작가 100인의 새로운 작품을 선보입니다. 다양한 장르의 작품을 한 곳에서 만나보세요.',
    period: '2026.03.06 - 2026.04.30',
    location: 'Artier 온라인 갤러리',
    participants: '100명의 작가',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '디지털 아트 할인전',
    subtitle: '인기 작품 최대 30% 할인',
    tag: 'SALE',
    description: '디지털 아트의 매력에 빠져보세요. 엄선된 인기 작품들을 특별한 가격으로 만나실 수 있습니다.',
    period: '2026.03.10 - 2026.03.31',
    location: '전 작품',
    participants: '50개 작품',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1767706508363-b2a729df06fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMGV2ZW50JTIwcG9zdGVyfGVufDF8fHx8MTc3Mjc3MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '신인 작가 지원 프로그램',
    subtitle: '당신의 작품을 세상에 선보이세요',
    tag: 'EVENT',
    description: '재능있는 신인 작가를 발굴하고 지원합니다. 작품 업로드부터 마케팅까지 전폭적인 지원을 받으실 수 있습니다.',
    period: '2026.03.15 - 2026.05.15',
    location: '온라인 신청',
    participants: '선착순 30명',
  },
];

const upcomingEvents = [
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '수채화 작품전',
    description: '감성 넘치는 수채화 작가들의 작품을 만나보세요',
    date: '2026.04.01',
    status: 'upcoming',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1702325597300-f3d68b5b9499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBtdXNldW18ZW58MXx8fHwxNzcyNzIwMjk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'AI 아트 워크샵',
    description: 'AI를 활용한 창작 기법을 배워보세요',
    date: '2026.04.15',
    status: 'upcoming',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1764709125089-740593af301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBjb2xsZWN0aW9uJTIwZGlzcGxheXxlbnwxfHx8fDE3NzI3NzM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: '일러스트레이터 밋업',
    description: '작가들과 함께하는 네트워킹 시간',
    date: '2026.05.01',
    status: 'upcoming',
  },
];

export default function Events() {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  // 알림 모달
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % promotionBanners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + promotionBanners.length) % promotionBanners.length);
  };

  const currentEvent = promotionBanners[currentBanner];

  // 이벤트별 상세 동작
  const handleEventDetail = (event: typeof promotionBanners[0]) => {
    // 쿨레이터 심사 이벤트 신청: 업로드로
    if (event.tag === 'EVENT') {
      navigate('/upload');
    }
    // SALE 이벤트: 마켓 필터로
    else if (event.tag === 'SALE') {
      navigate('/browse?filter=for-sale');
    }
    // NEW 전시: 보라라보기
    else {
      navigate('/browse');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* 히어로 배너 섹션 */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1440px] px-6 py-12">
          <h1 className="text-[28px] font-bold text-[#191919] mb-2">이벤트</h1>
          <p className="text-[15px] text-[#767676] mb-8">
            Artier에서 진행 중인 다양한 이벤트와 프로모션을 확인하세요
          </p>

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
                    <div className="relative h-[400px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      {/* 오버레이 그라디언트 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

                      {/* 텍스트 콘텐츠 */}
                      <div className="absolute inset-0 flex flex-col justify-center px-12">
                        <div className="max-w-[700px]">
                          {banner.tag && (
                            <span className="inline-block px-4 py-1.5 text-[12px] font-bold tracking-wider text-white bg-[#0057FF] rounded-full mb-4">
                              {banner.tag}
                            </span>
                          )}
                          <h2 className="text-[40px] font-bold text-white mb-3 leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-[18px] text-white/95 font-normal mb-6">
                            {banner.subtitle}
                          </p>
                          <div className="flex items-center gap-6 text-[14px] text-white/90">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{banner.period}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{banner.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{banner.participants}</span>
                            </div>
                          </div>
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
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center bg-white/95 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6 text-[#191919]" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center bg-white/95 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-6 w-6 text-[#191919]" />
            </button>

            {/* 인디케이터 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {promotionBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2 rounded-full transition-all ${currentBanner === index
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 현재 이벤트 상세 정보 */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1440px] px-6 py-10">
          <div className="max-w-[800px]">
            <h3 className="text-[20px] font-bold text-[#191919] mb-4">
              {currentEvent.title}
            </h3>
            <p className="text-[15px] text-[#191919] leading-relaxed mb-6">
              {currentEvent.description}
            </p>
            <button
              onClick={() => handleEventDetail(currentEvent)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#191919] text-white rounded-lg text-[14px] font-medium hover:bg-[#000000] transition-colors"
            >
              {currentEvent.tag === 'SALE'
                ? '할인 작품 보러가기'
                : currentEvent.tag === 'EVENT'
                  ? '신청하기'
                  : '작품 보러가기'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 예정된 이벤트 */}
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <h2 className="text-[22px] font-bold text-[#191919] mb-6">예정된 이벤트</h2>

        <div className="grid grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-[#E5E5E5] hover:border-[#CCCCCC] hover:shadow-lg transition-all"
            >
              <div className="relative h-[200px] overflow-hidden">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-[11px] font-bold text-white bg-[#0057FF] rounded-full">
                    COMING SOON
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-[13px] text-[#767676] mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{event.date}</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#191919] mb-2">
                  {event.title}
                </h3>
                <p className="text-[14px] text-[#767676] leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="bg-[#191919] text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-16 text-center">
          <h2 className="text-[28px] font-bold mb-3">이벤트를 놓치지 마세요</h2>
          <p className="text-[15px] text-white/80 mb-8">
            새로운 이벤트와 프로모션 소식을 가장 먼저 받아보세요
          </p>
          <button
            onClick={() => setShowNotifyModal(true)}
            className="px-8 py-3 bg-white text-[#191919] rounded-lg text-[14px] font-bold hover:bg-gray-100 transition-colors"
          >
            알림 받기
          </button>
        </div>
      </div>
    </div>
  );
}