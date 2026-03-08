import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, MapPin, Plus, Eye, Edit, X, DollarSign, ThumbsUp, Users, Folder, MoreHorizontal, Trash2 } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { artists, works, rooms, classes } from '../data';
import { groupWorks } from '../groupData';
import { workStore, draftStore, profileStore, userInteractionStore } from '../store';
import { WorkCard } from '../components/WorkCard';
import { RoomCard } from '../components/RoomCard';
import { ClassCard } from '../components/ClassCard';
import { SaleStatusBadge } from '../components/SaleStatusBadge';
import { SaleStatusButton } from '../components/SaleStatusButton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { getFirstImage, getImageCount } from '../utils/imageHelper';

// Profile 페이지 - 작품, 통계, 좋아요, 저장 등을 관리
export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [exhibitionFilter, setExhibitionFilter] = useState<'all' | 'solo' | 'group'>('all');

  // 작품 데이터를 store에서 가져오기 위한 상태
  const [storeWorks, setStoreWorks] = useState(workStore.getWorks());
  const [drafts, setDrafts] = useState(draftStore.getDrafts());
  // 좋아요·저장 목록
  const [likedIds, setLikedIds] = useState(() => userInteractionStore.getLiked());
  const [savedIds, setSavedIds] = useState(() => userInteractionStore.getSaved());
  // 프로필 store
  const [savedProfile, setSavedProfile] = useState(() => profileStore.getProfile());

  useEffect(() => {
    // 페이지 진입 시 최상단으로 스크롤
    window.scrollTo(0, 0);

    const unsubWork = workStore.subscribe(() => setStoreWorks(workStore.getWorks()));
    const unsubDraft = draftStore.subscribe(() => setDrafts(draftStore.getDrafts()));
    const unsubInteraction = userInteractionStore.subscribe(() => {
      setLikedIds(userInteractionStore.getLiked());
      setSavedIds(userInteractionStore.getSaved());
    });
    const unsubProfile = profileStore.subscribe(() => setSavedProfile(profileStore.getProfile()));
    return () => { unsubWork(); unsubDraft(); unsubInteraction(); unsubProfile(); };
  }, []);

  // 배너 이미지: store 또는 로컬 미리보기
  const bannerImg = savedProfile.bannerImg;

  // 판매 심사 요청 모달
  const [saleRequestModalWorkId, setSaleRequestModalWorkId] = useState<string | null>(null);
  const [saleRequestDescription, setSaleRequestDescription] = useState('');
  const [saleRequestInterview, setSaleRequestInterview] = useState('');
  const [saleRequestPrice, setSaleRequestPrice] = useState('');
  const [saleRequestEditionSize, setSaleRequestEditionSize] = useState('50');

  // 제출한 심사 내용 확인 모달
  const [viewRequestWorkId, setViewRequestWorkId] = useState<string | null>(null);

  // 프로필 편집 모달
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileHeadline, setProfileHeadline] = useState(() => profileStore.getProfile().headline);
  const [profileBio, setProfileBio] = useState(() => profileStore.getProfile().bio);
  const [profileFields, setProfileFields] = useState<string[]>(() => profileStore.getProfile().fields);
  const [profileLocation, setProfileLocation] = useState(() => profileStore.getProfile().location);

  // id가 없으면 현재 로그인 사용자 (artists[0]) - 먼저 선언
  const profileArtist = id ? artists.find(a => a.id === id) || artists[0] : artists[0];
  const isOwnProfile = !id || id === artists[0].id;

  // 사용자 이름: store에 저장된 값 우선 사용
  const displayName = savedProfile.name || profileArtist.name;
  const [profileNickname, setProfileNickname] = useState(() => profileStore.getProfile().name || profileArtist.name);

  // 좋아요한 작품 — userInteractionStore 기반
  const likedWorks = storeWorks.filter(w => likedIds.includes(w.id) && w.artistId !== profileArtist.id);

  // 저장한 작품 — userInteractionStore 기반
  const savedWorks = storeWorks.filter(w => savedIds.includes(w.id) && w.artistId !== profileArtist.id);

  // store에서 최신 작품 데이터 가져오기
  const artistWorks = storeWorks.filter(w => w.artistId === profileArtist.id);
  const artistRooms = rooms.filter(r => r.artistId === profileArtist.id);
  const artistClasses = classes.filter(c => c.instructor.id === profileArtist.id);

  // 작품 필터링
  const filteredWorks = artistWorks.filter(work => {
    if (exhibitionFilter === 'all') return true;
    if (exhibitionFilter === 'solo') return !work.coOwners || work.coOwners.length === 0;
    if (exhibitionFilter === 'group') return work.coOwners && work.coOwners.length > 0;
    return true;
  });

  // 개인/그룹 작품 개수
  const soloCount = artistWorks.filter(w => !w.coOwners || w.coOwners.length === 0).length;
  const groupCount = artistWorks.filter(w => w.coOwners && w.coOwners.length > 0).length;

  // 작품 관리용: 개별 이미지 단위로 펼치기
  const individualImages = artistWorks.flatMap(work => {
    const images = Array.isArray(work.image) ? work.image : [work.image];
    return images.map((img, idx) => {
      // contents에서 개별 작품명 찾기
      const imageTitle = work.contents?.[idx]?.title || '무제';

      return {
        workId: work.id,
        workTitle: work.title, // 작품명
        imageTitle: imageTitle, // 개별 그림명
        imageUrl: img,
        imageIndex: idx,
        totalImages: images.length,
        likes: work.likes,
        saleStatus: work.saleStatus,
        saleRequest: work.saleRequest,
        saleRequestDate: work.saleRequestDate,
      };
    });
  });

  const handleBannerClick = () => {
    if (isOwnProfile) bannerInputRef.current?.click();
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        profileStore.updateProfile({ bannerImg: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 판매 심사 요청 모달 */}
      {saleRequestModalWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSaleRequestModalWorkId(null)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[18px] font-semibold text-gray-900">🎨 프리미엄 에디션 판매 심사 요청</h2>
              <button
                onClick={() => setSaleRequestModalWorkId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* 안내 배너 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-[24px]">✨</span>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                      프리미엄 에디션으로 판매하세요
                    </h3>
                    <p className="text-[13px] text-gray-700 leading-relaxed mb-3">
                      고품질 액자 프린트로 판매하고 싶은 작품을 선택하세요.
                      <span className="font-semibold"> artier 큐레이터</span>가 작품을 검토한 후,
                      프리미엄 마켓플레이스에 등록해드립니다.
                    </p>

                    {/* 혜택 항목 */}
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span className="text-gray-700">뮤지엄 퀄리티 프린트</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span className="text-gray-700">다양한 프레임 옵션</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span className="text-gray-700">전문 포장 & 배송</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">✓</span>
                        <span className="text-gray-700">판매 수익 70% 귀속</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* 작품 설명 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    작품 설명 <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    value={saleRequestDescription}
                    onChange={(e) => setSaleRequestDescription(e.target.value)}
                    placeholder="작품에 대한 상세한 설명을 작성해주세요. 제작 과정, 영감을 받은 배경, 작품이 전달하고자 하는 메시지 등을 포함하면 좋습니다."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                  />
                  <p className="text-[12px] text-gray-500 mt-2">
                    최소 100자 이상 작성해주세요. ({saleRequestDescription.length}/100)
                  </p>
                </div>

                {/* 작가 인터뷰 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    작가 인터뷰 <span className="text-amber-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[13px] text-gray-600 mb-2">Q. 이 작품을 통해 무엇을 표현하고 싶으셨나요?</p>
                      <textarea
                        value={saleRequestInterview}
                        onChange={(e) => setSaleRequestInterview(e.target.value)}
                        placeholder="작품에 담긴 의미와 메시지를 자유롭게 표현해주세요."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    구매자들이 작품을 더 잘 이해할 수 있도록 진솔한 이야기를 들려주세요.
                  </p>
                </div>

                {/* 구분선 */}
                <div className="border-t border-gray-200"></div>

                {/* 희망 판매 가격 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    희망 판매 가격 (액자 포함)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-500">₩</span>
                    <input
                      type="number"
                      value={saleRequestPrice}
                      onChange={(e) => setSaleRequestPrice(e.target.value)}
                      placeholder="예: 350000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    큐레이터가 시장 조사를 통해 최종 가격을 결정합니다. 일반적으로 ₩250,000 ~ ₩500,000 사이입니다.
                  </p>
                </div>

                {/* 에디션 사이즈 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-3">
                    에디션 사이즈 (한정판 수량)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['25', '50', '100', '무제한'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSaleRequestEditionSize(size)}
                        className={`py-3 rounded-lg border text-[14px] font-medium transition-colors ${saleRequestEditionSize === size
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2">
                    한정판은 희소성을 높여 더 높은 가격으로 판매될 수 있습니다.
                  </p>
                </div>

                {/* 심사 기준 안내 */}
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <p className="text-[12px] text-gray-600 leading-relaxed">
                    <span className="font-semibold">심사 기준:</span> 해상도 3000px 이상, 독창적 작품, 상업적 가치 평가 후 승인됩니다.
                    심사는 영업일 기준 3-5일 소요되며, 결과는 알림으로 안내드립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSaleRequestModalWorkId(null)}
                className="px-5 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // 유효성 검사
                  if (saleRequestDescription.length < 100) {
                    alert('작품 설명을 최소 100자 이상 작성해주세요.');
                    return;
                  }
                  if (!saleRequestInterview.trim()) {
                    alert('작가 인터뷰를 작성해주세요.');
                    return;
                  }

                  // 판매 심사 요청 제출
                  if (saleRequestModalWorkId) {
                    workStore.requestSale(saleRequestModalWorkId, {
                      description: saleRequestDescription,
                      interview: saleRequestInterview,
                      price: saleRequestPrice,
                      editionSize: saleRequestEditionSize
                    });
                  }

                  setSaleRequestModalWorkId(null);
                  alert('판매 심사 요청이 제출되었습니다! 검토 후 3-5일 내에 결과를 알려드리겠습니다.');

                  // 상태 초기화
                  setSaleRequestDescription('');
                  setSaleRequestInterview('');
                  setSaleRequestPrice('');
                  setSaleRequestEditionSize('50');
                }}
                className="px-6 py-2.5 bg-amber-500 text-white text-[14px] font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                심사 요청 제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제출한 심사 내용 확인 모달 */}
      {viewRequestWorkId && (() => {
        const work = storeWorks.find(w => w.id === viewRequestWorkId);
        const request = work?.saleRequest;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 배경 */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setViewRequestWorkId(null)}
            />

            {/* 모달 컨텐츠 */}
            <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl mx-4">
              {/* 헤더 */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-[18px] font-semibold text-gray-900">제출한 심사 내용</h2>
                  <p className="text-[13px] text-gray-500 mt-1">작품: {work?.title}</p>
                </div>
                <button
                  onClick={() => setViewRequestWorkId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* 컨텐츠 */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {request ? (
                  <div className="space-y-6">
                    {/* 상태 배너 */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[20px]">⏳</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[14px] font-semibold text-gray-900">심사 대기 중</h3>
                          <p className="text-[12px] text-gray-600 mt-0.5">
                            큐레이터가 작품을 검토 중입니다. 영업일 기준 3-5일 내에 결과를 알려드립니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 작품 설명 */}
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                        작품 설명
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-700 bg-gray-50 whitespace-pre-wrap">
                        {request.description || '내용 없음'}
                      </div>
                    </div>

                    {/* 작가 인터뷰 */}
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                        작가 인터뷰
                      </label>
                      <div className="space-y-2">
                        <p className="text-[13px] text-gray-600">Q. 이 작품을 통해 무엇을 표현하고 싶으셨나요?</p>
                        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-gray-700 bg-gray-50 whitespace-pre-wrap">
                          {request.interview || '내용 없음'}
                        </div>
                      </div>
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-gray-200"></div>

                    {/* 희망 판매 가격 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium text-gray-600 mb-1">
                          희망 판매 가격
                        </label>
                        <div className="text-[16px] font-semibold text-gray-900">
                          {request.price ? `₩${parseInt(request.price).toLocaleString()}` : '미정'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-gray-600 mb-1">
                          에디션 사이즈
                        </label>
                        <div className="text-[16px] font-semibold text-gray-900">
                          {request.editionSize || '50'}
                        </div>
                      </div>
                    </div>

                    {/* 제출 날짜 */}
                    {work?.saleRequestDate && (
                      <div>
                        <label className="block text-[13px] font-medium text-gray-600 mb-1">
                          제출 날짜
                        </label>
                        <div className="text-[14px] text-gray-700">
                          {new Date(work.saleRequestDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">제출한 내용이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setViewRequestWorkId(null)}
                  className="px-5 py-2.5 text-[14px] bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 프로필 편집 모달 */}
      {showProfileEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowProfileEditModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[18px] font-semibold text-gray-900">프로필 정보 편집</h2>
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* 사용자 이름 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    사용자 이름
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileNickname}
                      onChange={(e) => {
                        if (e.target.value.length <= 20) {
                          setProfileNickname(e.target.value);
                        }
                      }}
                      placeholder="화려한띠볼7802"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                      {profileNickname.length}/20
                    </span>
                  </div>
                </div>

                {/* 한 줄 프로필 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    한 줄 프로필
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileHeadline}
                      onChange={(e) => {
                        if (e.target.value.length <= 20) {
                          setProfileHeadline(e.target.value);
                        }
                      }}
                      placeholder="20자 이내로 입력해주세요."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                      {profileHeadline.length}/20
                    </span>
                  </div>
                </div>

                {/* 국가 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    국가
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <select
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                      }}
                    >
                      <option value="">국가를 선택해주세요</option>
                      <option value="대한민국">🇰🇷 대한민국</option>
                      <option value="미국">🇺🇸 미국</option>
                      <option value="일본">🇯🇵 일본</option>
                      <option value="중국">🇨🇳 중국</option>
                      <option value="영국">🇬🇧 영국</option>
                      <option value="프랑스">🇫🇷 프랑스</option>
                      <option value="독일">🇩🇪 독일</option>
                      <option value="이탈리아">🇮🇹 이탈리아</option>
                      <option value="스페인">🇪🇸 스페인</option>
                      <option value="캐나다">🇨🇦 캐나다</option>
                      <option value="호주">🇦🇺 호주</option>
                      <option value="뉴질랜드">🇳🇿 뉴질랜드</option>
                      <option value="대만">🇹🇼 대만</option>
                      <option value="싱가포르">🇸🇬 싱가포르</option>
                      <option value="태국">🇹🇭 태국</option>
                      <option value="베트남">🇻🇳 베트남</option>
                      <option value="인도">🇮🇳 인도</option>
                      <option value="네덜란드">🇳🇱 네덜란드</option>
                      <option value="스위스">🇨🇭 스위스</option>
                      <option value="스웨덴">🇸🇪 스웨덴</option>
                      <option value="노르웨이">🇳🇴 노르웨이</option>
                      <option value="덴마크">🇩🇰 덴마크</option>
                      <option value="핀란드">🇫🇮 핀란드</option>
                      <option value="벨기에">🇧🇪 벨기에</option>
                      <option value="오스트리아">🇦🇹 오스트리아</option>
                      <option value="포르투갈">🇵🇹 포르투갈</option>
                      <option value="그리스">🇬🇷 그리스</option>
                      <option value="러시아">🇷🇺 러시아</option>
                      <option value="브라질">🇧🇷 브라질</option>
                      <option value="멕시코">🇲🇽 멕시코</option>
                      <option value="아르헨티나">🇦🇷 아르헨티나</option>
                      <option value="칠레">🇨🇱 칠레</option>
                      <option value="남아프리카공화국">🇿🇦 남아프리카공화국</option>
                      <option value="이스라엘">🇮🇱 이스라엘</option>
                      <option value="터키">🇹🇷 터키</option>
                      <option value="기타">🌍 기타</option>
                    </select>
                  </div>
                </div>

                {/* 관심 분야 */}
                <div>
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    관심 분야
                  </label>
                  <p className="text-[13px] text-gray-500 mb-3">
                    관심 있는 분야를 선택해주세요. (최대 5개)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['파인아트', '일러스트', '수채화', '유화', '드로잉', '풍경화', '인물화', '정물화', '추상화', '사진', '디지털아트', '조각', '공예', '패션', '제품 디자인'].map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          if (profileFields.includes(field)) {
                            setProfileFields(profileFields.filter(f => f !== field));
                          } else if (profileFields.length < 5) {
                            setProfileFields([...profileFields, field]);
                          }
                        }}
                        className={`px-3 py-2 text-[13px] rounded-lg border transition-all ${profileFields.includes(field)
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-cyan-300'
                          }`}
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                  {profileFields.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[13px] text-gray-600">선택한 분야:</span>
                      {profileFields.map((field) => (
                        <div key={field} className="px-3 py-1 bg-cyan-50 text-cyan-700 text-[13px] rounded-full font-medium">
                          {field}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="border-t border-gray-100 my-6"></div>

                {/* 추가 정보 */}
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-4">추가 정보</h3>

                  {/* 소개 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-900 mb-2">
                      소개
                    </label>
                    <textarea
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="예) 호기심이 많고 고양이를 좋아하는 디자이너입니다."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="px-5 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // profileStore에 저장 → localStorage에 영속
                  profileStore.updateProfile({
                    name: profileNickname.trim() || displayName,
                    nickname: profileNickname.trim(),
                    headline: profileHeadline,
                    bio: profileBio,
                    location: profileLocation,
                    fields: profileFields,
                  });
                  setShowProfileEditModal(false);
                  alert('프로필이 저장되었습니다.');
                }}
                className="px-6 py-2.5 bg-[#0057FF] text-white text-[14px] font-medium rounded-lg hover:bg-[#0046CC] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배너 이미지 */}
      <div
        className={`relative ${bannerImg ? 'h-[240px]' : 'h-0'} bg-[#5C5C5C] overflow-hidden ${isOwnProfile ? 'cursor-pointer group' : ''}`}
        onClick={handleBannerClick}
      >
        {bannerImg && (
          <img src={bannerImg} alt="Profile Banner" className="w-full h-full object-cover" />
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />

        {isOwnProfile && bannerImg && (
          <>
            <button
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                bannerInputRef.current?.click();
              }}
            >
              <Edit className="h-4 w-4 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* 프로필 섹션 - 배너와 바로 붙이기 */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex gap-12">
            {/* 왼쪽: 프로필 정보 */}
            <div className={`w-[280px] flex-shrink-0 ${bannerImg ? 'pt-6' : 'pt-12'}`}>
              <Avatar className={`h-32 w-32 border-4 border-white shadow-lg ${bannerImg ? '-mt-22' : ''}`}>
                <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                <AvatarFallback className="text-3xl">{profileArtist.name[0]}</AvatarFallback>
              </Avatar>

              <h1 className="mt-6 text-2xl font-semibold">{displayName}</h1>

              {/* 한 줄 프로필 */}
              {profileHeadline && (
                <p className="mt-3 text-[15px] text-gray-600 font-medium">
                  {profileHeadline}
                </p>
              )}

              {/* 지역 */}
              {profileLocation && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profileLocation}</span>
                </div>
              )}

              {/* 소개글 */}
              {profileBio ? (
                <p className="mt-4 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profileBio}
                </p>
              ) : (
                <p className="mt-4 text-[14px] text-gray-700 leading-relaxed">
                  30년간 중학교 미술 교사로 근무하다 은퇴 후 본격적으로 작품 활동을 시작했습니다.
                  젊은 시절 꿈꿨던 화가의 삶을 지금 이루어가고 있습니다.
                  일상의 풍경과 사람들의 이야기를 담는 것을 좋아합니다.
                </p>
              )}

              {/* 관심 분야 */}
              {profileFields.length > 0 && (
                <div className="mt-4">
                  <div className="text-[13px] font-medium text-gray-900 mb-2">관심 분야</div>
                  <div className="flex flex-wrap gap-2">
                    {profileFields.map((field, index) => {
                      const colors = [
                        'bg-amber-50 text-amber-700',
                        'bg-green-50 text-green-700',
                        'bg-blue-50 text-blue-700',
                        'bg-purple-50 text-purple-700',
                        'bg-pink-50 text-pink-700',
                      ];
                      return (
                        <span key={field} className={`px-3 py-1 ${colors[index % colors.length]} text-[12px] rounded-full font-medium`}>
                          {field}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 팔로워/팔로잉 */}
              <div className="mt-5 flex items-center gap-6 text-[14px]">
                <div>
                  <span className="font-semibold text-gray-900">342</span>
                  <span className="text-gray-500 ml-1">팔로워</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">128</span>
                  <span className="text-gray-500 ml-1">팔로잉</span>
                </div>
              </div>

              {!isOwnProfile && (
                <>
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    className="w-full"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? '팔로잉' : '팔로우'}
                  </Button>
                  <Button variant="outline" className="mt-3 w-full">
                    메시지 보내기
                  </Button>
                </>
              )}

              {/* 사용 도구 */}
              <div className="mt-6 rounded-lg bg-gray-50 p-4">
                <div className="text-[13px] font-medium text-gray-900 mb-3">주요 작업 도구</div>
                <div className="space-y-2 text-[12px] text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <span>iPad (Procreate 입문 중)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>전통 수채화 도구</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>연필, 스케치북</span>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <Button
                  onClick={() => {
                    // 모달 열 때 현재 값으로 초기화
                    setProfileNickname(displayName);
                    // 현재 한 줄 프로필 값도 초기화 (있으면)
                    // 초기값은 빈 문자열이므로 입력한 값이 있으면 유지
                    setShowProfileEditModal(true);
                  }}
                  className="mt-6 w-full bg-[#0057FF] hover:bg-[#0046CC]"
                >
                  프로필 정보 편집
                </Button>
              )}
            </div>

            {/* 오른쪽: 탭 컨텐츠 */}
            <div className="flex-1 py-8">
              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="h-auto p-0 bg-transparent border-b rounded-none w-full justify-start gap-6">
                  <TabsTrigger
                    value="projects"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    작품
                  </TabsTrigger>
                  <TabsTrigger
                    value="works-management"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    작품 관리
                  </TabsTrigger>
                  <TabsTrigger
                    value="moodboards"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    좋아요
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    저장
                  </TabsTrigger>
                  <TabsTrigger
                    value="toolkit"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    내 통계
                  </TabsTrigger>
                  <TabsTrigger
                    value="drafts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3"
                  >
                    초안 ({drafts.length})
                  </TabsTrigger>
                </TabsList>

                {/* 프로젝트 탭 */}
                <TabsContent value="projects" className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">작품 ({artistWorks.length})</h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="bg-[#0057FF] hover:bg-[#0046CC]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 작품 업로드
                      </Button>
                    )}
                  </div>

                  {/* 작품 필터 */}
                  {artistWorks.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                      <button
                        onClick={() => setExhibitionFilter('all')}
                        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${exhibitionFilter === 'all'
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        전체 ({artistWorks.length})
                      </button>
                      <button
                        onClick={() => setExhibitionFilter('solo')}
                        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${exhibitionFilter === 'solo'
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        개인 ({soloCount})
                      </button>
                      <button
                        onClick={() => setExhibitionFilter('group')}
                        className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors ${exhibitionFilter === 'group'
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        그룹 ({groupCount})
                      </button>
                    </div>
                  )}

                  {/* Browse 스타일 그리드 레이아웃 */}
                  {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-6">
                      {filteredWorks.map((work, idx) => {
                        const likes = work.likes;
                        const views = work.views || (1234 + idx * 234);

                        return (
                          <div
                            key={work.id}
                            className="group cursor-pointer relative"
                            onClick={() => navigate(`/work/${work.id}`)}
                          >
                            {/* 이미지 영역 - 정사각형 */}
                            <div className="relative aspect-square rounded-lg bg-white overflow-hidden">
                              <div className="relative w-full h-full flex items-center justify-center bg-white p-8">
                                {/* 흰색 매트 배경 */}
                                <div className="relative w-full h-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
                                  {/* 작품 이미지 */}
                                  <ImageWithFallback
                                    src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                    alt={work.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                  />

                                  {/* 본인일 때: ⋯ 메뉴 (이미지 위 레이어) */}
                                  {isOwnProfile && (
                                    <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            className="flex items-center justify-center h-10 w-10 rounded-full bg-[#0057FF] text-white hover:bg-[#0046CC] shadow-lg"
                                            aria-label="작품 메뉴"
                                          >
                                            <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" sideOffset={4} className="z-[200]">
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onSelect={(e) => e.preventDefault()}
                                            onClick={() => {
                                              if (confirm(`"${work.title}" 작품을 삭제할까요?`)) {
                                                workStore.removeWork(work.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            삭제
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}

                                  {/* 이미지 개수 배지 - 2장 이상일 때만 표시 */}
                                  {getImageCount(work.image) > 1 && (
                                    <div className="absolute left-3 top-3 z-10">
                                      <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
                                        <ImageIcon className="h-3.5 w-3.5" />
                                        {getImageCount(work.image)}
                                      </div>
                                    </div>
                                  )}

                                  {/* 호버 오버레이 - 제목 + 통계 (z-10으로 ⋯ 버튼 아래에 두어 버튼이 보이도록) */}
                                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                                    {/* 상단: 통계 */}
                                    <div className="flex items-start justify-end gap-2">
                                      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                                        <ThumbsUp className="h-3 w-3 text-white" />
                                        <span className="text-white text-[11px] font-medium">
                                          {likes >= 1000 ? Math.floor(likes / 1000) + 'k' : likes}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                                        <Eye className="h-3 w-3 text-white" />
                                        <span className="text-white text-[11px] font-medium">
                                          {views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 하단: 제목 */}
                                    <div>
                                      <h3 className="text-white text-[16px] font-bold leading-tight drop-shadow-lg mb-2">
                                        {work.title}
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        {work.coOwners && work.coOwners.length > 0 && work.groupName ? (
                                          // 그룹 작품인 경우
                                          <>
                                            <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white/50 bg-white/20">
                                              <Users className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-white/90 text-[12px] font-medium drop-shadow">
                                              {work.groupName}
                                            </span>
                                          </>
                                        ) : (
                                          // 개인 작품인 경우
                                          <>
                                            <Avatar className="h-6 w-6 border-2 border-white/50">
                                              <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                                              <AvatarFallback className="text-[10px]">{profileArtist.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-white/90 text-[12px] font-medium drop-shadow">
                                              {profileArtist.name}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F0FF]">
                        <Plus className="h-10 w-10 text-[#0057FF]" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">첫 작품 업로드</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                        당신의 작품을 세상과 공유하고, 피드백과 영감을 받아보세요.
                      </p>
                      <Button
                        onClick={() => navigate('/upload')}
                        className="bg-[#0057FF] hover:bg-[#0046CC]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        작품 업로드 하기
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* 작품 관리 탭 (신규) */}
                <TabsContent value="works-management" className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">개별 이미지 관리 ({individualImages.length}개)</h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="bg-[#0057FF] hover:bg-[#0046CC]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 작품 업로드
                      </Button>
                    )}
                  </div>

                  {individualImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {individualImages.map((img, idx) => (
                        <div
                          key={`${img.workId}-${img.imageIndex}`}
                          className="group relative cursor-pointer"
                          onClick={() => navigate(`/work/${img.workId}`)}
                        >
                          {/* 본인일 때만: ⋯ 메뉴 (작품 삭제) */}
                          {isOwnProfile && (
                            <div
                              className="absolute right-2 top-2 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex items-center justify-center h-9 w-9 rounded-full bg-[#0057FF] text-white hover:bg-[#0046CC] shadow-md"
                                    aria-label="메뉴"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      if (confirm(`"${img.workTitle}" 작품을 삭제할까요?`)) {
                                        workStore.removeWork(img.workId);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    작품 삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                          {/* 이미지 */}
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all relative">
                            <ImageWithFallback
                              src={imageUrls[img.imageUrl] || img.imageUrl}
                              alt={`${img.workTitle} - ${img.imageIndex + 1}`}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* 호버 오버레이 - 정보 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-2.5">
                              {/* 상단: 통계 */}
                              <div className="flex items-start justify-end gap-1.5">
                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                                  <ThumbsUp className="h-2.5 w-2.5 text-white" />
                                  <span className="text-white text-[10px] font-medium">
                                    {img.likes}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                                  <Eye className="h-2.5 w-2.5 text-white" />
                                  <span className="text-white text-[10px] font-medium">
                                    {img.views || 0}
                                  </span>
                                </div>
                              </div>

                              {/* 하단: 작품명 */}
                              <div>
                                <h3 className="text-white text-[15px] font-bold leading-tight drop-shadow-lg">
                                  {img.imageTitle}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* 판매 상태 버튼 - 이미지 아래 */}
                          <div className="mt-2.5">
                            <SaleStatusButton
                              saleStatus={img.saleStatus}
                              onRequestSale={() => setSaleRequestModalWorkId(img.workId)}
                              onViewRequest={() => setViewRequestWorkId(img.workId)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F0FF]">
                        <Plus className="h-10 w-10 text-[#0057FF]" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">첫 작품 업로드</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                        당신의 작품을 세상과 공유하고, 피드백과 영감을 받아보세요.
                      </p>
                      <Button
                        onClick={() => navigate('/upload')}
                        className="bg-[#0057FF] hover:bg-[#0046CC]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        작품 업로드 하기
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* 다른 탭들 (빈 상태) */}
                <TabsContent value="moodboards" className="mt-8">
                  <div className="space-y-4">
                    {likedWorks.map((work) => (
                      <div key={work.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
                        {/* 썸네일 - 클릭 가능 */}
                        <div
                          className="w-32 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => navigate(`/work/${work.id}`)}
                        >
                          <WorkCard work={work} />
                        </div>

                        {/* 작품 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-[15px] font-semibold text-gray-900 truncate cursor-pointer hover:text-[#0057FF] transition-colors"
                            onClick={() => navigate(`/work/${work.id}`)}
                          >
                            {work.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {work.views?.toLocaleString()} 조회
                            </span>
                            <span>👍 {work.likes} 좋아요</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-8">
                  <div className="space-y-4">
                    {savedWorks.map((work) => (
                      <div key={work.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
                        {/* 썸네일 - 클릭 가능 */}
                        <div
                          className="w-32 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => navigate(`/work/${work.id}`)}
                        >
                          <WorkCard work={work} />
                        </div>

                        {/* 작품 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-[15px] font-semibold text-gray-900 truncate cursor-pointer hover:text-[#0057FF] transition-colors"
                            onClick={() => navigate(`/work/${work.id}`)}
                          >
                            {work.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {work.views?.toLocaleString()} 조회
                            </span>
                            <span>👍 {work.likes} 좋아요</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="toolkit" className="mt-8">
                  {isOwnProfile ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">판매 통계</h2>
                        <Button
                          onClick={() => navigate('/sales')}
                          size="sm"
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          상세 판매 관리
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <div className="text-[13px] text-gray-500 font-medium mb-2">이번 달 수익</div>
                          <div className="text-[24px] font-semibold text-gray-900">₩125,000</div>
                          <div className="text-[12px] text-green-600 mt-2">+12.5% 지난 달 대비</div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <div className="text-[13px] text-gray-500 font-medium mb-2">총 다운로드</div>
                          <div className="text-[24px] font-semibold text-gray-900">342</div>
                          <div className="text-[12px] text-gray-500 mt-2">누적</div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <div className="text-[13px] text-gray-500 font-medium mb-2">평균 전환율</div>
                          <div className="text-[24px] font-semibold text-gray-900">2.2%</div>
                          <div className="text-[12px] text-gray-500 mt-2">조회 → 다운로드</div>
                        </div>
                      </div>

                      <div className="mt-6 bg-cyan-50 rounded-xl p-6 border border-cyan-200">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-6 w-6 text-cyan-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[16px] font-semibold text-gray-900 mb-2">작품 가격 최적화 팁</h3>
                            <p className="text-[14px] text-gray-600 mb-4">
                              유사한 작품들의 평균 가격은 ₩5,000 ~ ₩15,000 입니다.
                              무료 작품으로 시작하여 팬층을 확보한 후 유료로 전환하는 것을 추천합니다.
                            </p>
                            <Button
                              onClick={() => navigate('/sales')}
                              variant="outline"
                              size="sm"
                              className="border-cyan-300 text-cyan-600 hover:bg-cyan-100"
                            >
                              자세히 보기 →
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-card p-12 text-center">
                      <p className="text-muted-foreground">통계는 본인만 볼 수 있습니다.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="drafts" className="mt-8">
                  {isOwnProfile ? (
                    <>
                      {drafts.length > 0 ? (
                        <div className="space-y-4">
                          {drafts.map((draft) => (
                            <div key={draft.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
                              {/* 썸네일 */}
                              {draft.contents.find(c => c.type === 'image' && c.url) && (
                                <div className="w-32 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={draft.contents.find(c => c.type === 'image' && c.url)?.url}
                                    alt={draft.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {/* 초안 정보 */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                                  {draft.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500">
                                  <span>{draft.contents.length}개 이미지</span>
                                  <span>{new Date(draft.savedAt).toLocaleDateString('ko-KR')}</span>
                                </div>
                                {draft.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {draft.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded">
                                        {tag}
                                      </span>
                                    ))}
                                    {draft.tags.length > 3 && (
                                      <span className="px-2 py-0.5 text-gray-500 text-[11px]">
                                        +{draft.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 액션 버튼 */}
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // 초안 불러와서 Upload 페이지로 이동
                                    // TODO: 초안 데이터를 Upload 페이지로 전달
                                    navigate('/upload');
                                  }}
                                  className="bg-[#0057FF] hover:bg-[#0046CC]"
                                >
                                  이어서 작성
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('이 초안을 삭제하시겠습니까?')) {
                                      draftStore.deleteDraft(draft.id);
                                    }
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  삭제
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F0FF]">
                            <Folder className="h-10 w-10 text-[#0057FF]" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">저장된 초안이 없습니다</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                            작품 업로드 중 "초안으로 저장"을 하면 여기에 표시됩니다.
                          </p>
                          <Button
                            onClick={() => navigate('/upload')}
                            className="bg-[#0057FF] hover:bg-[#0046CC]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            작품 업로드 하기
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border bg-card p-12 text-center">
                      <p className="text-muted-foreground">초안은 본인만 볼 수 있습니다.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 정보 아이콘 */}
      <div className="fixed bottom-6 right-6">
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0057FF] text-white shadow-lg hover:bg-[#0046CC] transition-colors">
          <Eye className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Profile page - v2.0