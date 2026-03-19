import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, X, Bell } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

const promotionBanners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    title: '나의 첫 디지털 캔버스',
    subtitle: '매일 그리는 나의 소확행',
    description: '신규 가입 후 첫 작품을 업로드해주신 선착순 100분께 스타벅스 아메리카노 기프티콘을 드립니다. 잠자고 있던 나의 첫 캔버스를 지금 채워보세요!',
    period: '2026.05.01 - 2026.05.31',
    participants: '선착순 100명',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '동호회 작품전 참여하기',
    subtitle: '우리 동호회 작품을 세상에 알려보세요',
    description: '동호회나 수업 작품을 올려주신 강사님 중 추첨을 통해 태블릿과 스타일러스를 선물로 드립니다. 수강생 작품을 올리고 함께 성장하세요!',
    period: '2026.05.01 - 2026.06.30',
    participants: '추첨 10명',
  },
];

const upcomingEvents = [
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '수채화 작품전',
    description: '감성 넘치는 수채화 작가들의 작품을 만나보세요',
    date: '2026.04.01',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1702325597300-f3d68b5b9499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBtdXNldW18ZW58MXx8fHwxNzcyNzIwMjk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '디지털 드로잉 워크샵',
    description: '처음 시작하는 디지털 드로잉 기초 과정',
    date: '2026.04.15',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1764709125089-740593af301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBjb2xsZWN0aW9uJTIwZGlzcGxheXxlbnwxfHx8fDE3NzI3NzM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '작가 네트워킹 데이',
    description: '작가들과 함께하는 소통의 시간',
    date: '2026.05.01',
  },
];

export default function Events() {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
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

  const handleNotifySubmit = () => {
    if (notifyEmail.trim()) {
      setNotifySubmitted(true);
      setTimeout(() => {
        setShowNotifyModal(false);
        setNotifySubmitted(false);
        setNotifyEmail('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* 히어로 배너 섹션 */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1440px] px-6 py-12">
          <h1 className="text-[32px] font-bold text-[#191919] mb-2">이벤트</h1>
          <p className="text-[17px] text-[#767676] mb-8">
            Artier에서 진행 중인 다양한 이벤트를 확인하세요
          </p>

          <div className="relative group">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {promotionBanners.map((banner) => (
                  <div key={banner.id} className="w-full shrink-0 relative">
                    <div className="relative h-[400px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

                      <div className="absolute inset-0 flex flex-col justify-center px-12">
                        <div className="max-w-[700px]">
                          <span className="inline-block px-4 py-1.5 text-[13px] font-bold tracking-wider text-white bg-[#0057FF] rounded-full mb-4">
                            EVENT
                          </span>
                          <h2 className="text-[40px] font-bold text-white mb-3 leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-[18px] text-white/95 font-normal mb-6">
                            {banner.subtitle}
                          </p>
                          <div className="flex items-center gap-6 text-[15px] text-white/90">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{banner.period}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 좌우 네비게이션 — 항상 보이게 (50대 UX) */}
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 flex items-center justify-center bg-white/95 hover:bg-white rounded-full shadow-lg transition-opacity"
            >
              <ChevronLeft className="h-7 w-7 text-[#191919]" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 flex items-center justify-center bg-white/95 hover:bg-white rounded-full shadow-lg transition-opacity"
            >
              <ChevronRight className="h-7 w-7 text-[#191919]" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {promotionBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2.5 rounded-full transition-all ${currentBanner === index
                    ? 'w-10 bg-white'
                    : 'w-2.5 bg-white/50 hover:bg-white/70'
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
            <h3 className="text-[22px] font-bold text-[#191919] mb-4">
              {currentEvent.title}
            </h3>
            <p className="text-[16px] text-[#191919] leading-relaxed mb-6">
              {currentEvent.description}
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#191919] text-white rounded-lg text-[15px] font-medium hover:bg-[#000000] transition-colors"
            >
              참여하기
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 예정된 이벤트 */}
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <h2 className="text-[24px] font-bold text-[#191919] mb-6">예정된 이벤트</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#E0E0E0] shadow-md hover:border-[#CCCCCC] hover:shadow-xl transition-all"
            >
              <div className="relative h-[220px] overflow-hidden">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1.5 text-[12px] font-bold text-white bg-[#0057FF] rounded-full">
                    COMING SOON
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-[15px] text-[#767676] mb-3">
                  <Calendar className="h-[18px] w-[18px]" />
                  <span>{event.date}</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#191919] mb-2">
                  {event.title}
                </h3>
                <p className="text-[16px] text-[#767676] leading-relaxed">
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
          <h2 className="text-[30px] font-bold mb-3">이벤트를 놓치지 마세요</h2>
          <p className="text-[16px] text-white/80 mb-8">
            새로운 이벤트 소식을 가장 먼저 받아보세요
          </p>
          <button
            onClick={() => setShowNotifyModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#191919] rounded-lg text-[15px] font-bold hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            알림 받기
          </button>
        </div>
      </div>

      {/* 알림 모달 */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative">
            <button
              onClick={() => { setShowNotifyModal(false); setNotifySubmitted(false); setNotifyEmail(''); }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            {notifySubmitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">&#10003;</div>
                <h3 className="text-[20px] font-bold text-[#191919] mb-2">신청 완료!</h3>
                <p className="text-[15px] text-[#767676]">새로운 이벤트 소식을 보내드릴게요</p>
              </div>
            ) : (
              <>
                <h3 className="text-[22px] font-bold text-[#191919] mb-2">이벤트 알림 신청</h3>
                <p className="text-[15px] text-[#767676] mb-6">
                  이메일을 입력하시면 새 이벤트 알림을 보내드립니다
                </p>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="이메일 주소 입력"
                  className="w-full px-4 py-3.5 text-[15px] border border-[#E5E5E5] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                  onKeyDown={(e) => e.key === 'Enter' && handleNotifySubmit()}
                />
                <button
                  onClick={handleNotifySubmit}
                  className="w-full py-3.5 bg-[#191919] text-white rounded-lg text-[15px] font-bold hover:bg-[#000000] transition-colors"
                >
                  알림 신청하기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
