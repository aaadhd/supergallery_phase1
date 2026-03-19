import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Eye, X, ThumbsUp, Users, Folder, MoreHorizontal, Trash2, Tag } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { artists, works as allWorksData } from '../data';
import { workStore, draftStore, profileStore, userInteractionStore } from '../store';
import { WorkCard } from '../components/WorkCard';
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

// Profile 페이지 — Phase 1 MVP
export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [exhibitionFilter, setExhibitionFilter] = useState<'all' | 'solo' | 'group'>('all');

  // Store 상태
  const [storeWorks, setStoreWorks] = useState(workStore.getWorks());
  const [drafts, setDrafts] = useState(draftStore.getDrafts());
  const [likedIds, setLikedIds] = useState(() => userInteractionStore.getLiked());
  const [savedIds, setSavedIds] = useState(() => userInteractionStore.getSaved());
  const [savedProfile, setSavedProfile] = useState(() => profileStore.getProfile());

  useEffect(() => {
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

  // 프로필 편집 모달
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileHeadline, setProfileHeadline] = useState(() => profileStore.getProfile().headline);
  const [profileBio, setProfileBio] = useState(() => profileStore.getProfile().bio);
  const [profileLocation, setProfileLocation] = useState(() => profileStore.getProfile().location);

  // 현재 프로필 아티스트
  const profileArtist = id ? artists.find(a => a.id === id) || artists[0] : artists[0];
  const isOwnProfile = !id || id === artists[0].id;

  // 사용자 이름: store에 저장된 값 우선 사용
  const displayName = savedProfile.name || profileArtist.name;
  const [profileNickname, setProfileNickname] = useState(() => profileStore.getProfile().name || profileArtist.name);

  // 작품 필터링
  const artistWorks = storeWorks.filter(w => w.artistId === profileArtist.id);
  const likedWorks = storeWorks.filter(w => likedIds.includes(w.id) && w.artistId !== profileArtist.id);
  const savedWorks = storeWorks.filter(w => savedIds.includes(w.id) && w.artistId !== profileArtist.id);

  const filteredWorks = artistWorks.filter(work => {
    if (exhibitionFilter === 'all') return true;
    if (exhibitionFilter === 'solo') return !work.coOwners || work.coOwners.length === 0;
    if (exhibitionFilter === 'group') return work.coOwners && work.coOwners.length > 0;
    return true;
  });

  const soloCount = artistWorks.filter(w => !w.coOwners || w.coOwners.length === 0).length;
  const groupCount = artistWorks.filter(w => w.coOwners && w.coOwners.length > 0).length;

  // 태그된 작품: 현재 사용자가 coOwner로 등록된 다른 작가의 작품
  const taggedWorks = storeWorks.filter(w =>
    w.artistId !== profileArtist.id &&
    w.coOwners?.some(co => co.id === profileArtist.id)
  );

  // 태그된 작품을 groupName별로 그룹핑
  const taggedByGroup = taggedWorks.reduce<Record<string, typeof taggedWorks>>((acc, work) => {
    const group = work.groupName || '기타';
    if (!acc[group]) acc[group] = [];
    acc[group].push(work);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* 프로필 편집 모달 */}
      {showProfileEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowProfileEditModal(false)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[20px] font-semibold text-gray-900">프로필 정보 편집</h2>
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* 사용자 이름 */}
                <div>
                  <label className="block text-[16px] font-semibold text-gray-900 mb-2">
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
                      placeholder="이름을 입력해주세요"
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">
                      {profileNickname.length}/20
                    </span>
                  </div>
                </div>

                {/* 한 줄 프로필 */}
                <div>
                  <label className="block text-[16px] font-semibold text-gray-900 mb-2">
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
                      placeholder="20자 이내로 입력해주세요"
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">
                      {profileHeadline.length}/20
                    </span>
                  </div>
                </div>

                {/* 소개 */}
                <div>
                  <label className="block text-[16px] font-semibold text-gray-900 mb-2">
                    소개
                  </label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="자기소개를 작성해주세요"
                    rows={5}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none leading-relaxed"
                  />
                </div>

                {/* 국가 */}
                <div>
                  <label className="block text-[16px] font-semibold text-gray-900 mb-2">
                    국가
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                      }}
                    >
                      <option value="">국가를 선택해주세요</option>
                      <option value="대한민국">대한민국</option>
                      <option value="미국">미국</option>
                      <option value="일본">일본</option>
                      <option value="중국">중국</option>
                      <option value="영국">영국</option>
                      <option value="프랑스">프랑스</option>
                      <option value="독일">독일</option>
                      <option value="캐나다">캐나다</option>
                      <option value="호주">호주</option>
                      <option value="대만">대만</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowProfileEditModal(false)}
                className="px-6 py-3 text-[16px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  profileStore.updateProfile({
                    name: profileNickname.trim() || displayName,
                    nickname: profileNickname.trim(),
                    headline: profileHeadline,
                    bio: profileBio,
                    location: profileLocation,
                  });
                  setShowProfileEditModal(false);
                  alert('프로필이 저장되었습니다.');
                }}
                className="px-8 py-3 bg-[#0057FF] text-white text-[16px] font-medium rounded-lg hover:bg-[#0046CC] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 섹션 */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex gap-12">
            {/* 왼쪽: 프로필 정보 */}
            <div className="w-[280px] flex-shrink-0 pt-12">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                <AvatarFallback className="text-3xl">{profileArtist.name[0]}</AvatarFallback>
              </Avatar>

              <h1 className="mt-6 text-[26px] font-semibold">{displayName}</h1>

              {/* 한 줄 프로필 */}
              {savedProfile.headline && (
                <p className="mt-3 text-[16px] text-gray-600 font-medium">
                  {savedProfile.headline}
                </p>
              )}

              {/* 지역 */}
              {savedProfile.location && (
                <div className="mt-3 flex items-center gap-2 text-[15px] text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{savedProfile.location}</span>
                </div>
              )}

              {/* 소개글 */}
              {savedProfile.bio ? (
                <p className="mt-4 text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {savedProfile.bio}
                </p>
              ) : (
                <p className="mt-4 text-[15px] text-gray-700 leading-relaxed">
                  {profileArtist.bio || '아직 소개가 없습니다.'}
                </p>
              )}

              {/* 팔로워/팔로잉 */}
              <div className="mt-5 flex items-center gap-6 text-[15px]">
                <div>
                  <span className="font-semibold text-gray-900">{profileArtist.followers?.toLocaleString() || '0'}</span>
                  <span className="text-gray-500 ml-1">팔로워</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{profileArtist.following?.toLocaleString() || '0'}</span>
                  <span className="text-gray-500 ml-1">팔로잉</span>
                </div>
              </div>

              {/* 팔로우 버튼 (타인 프로필) */}
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  className="w-full mt-4 text-[15px] py-3"
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </Button>
              )}

              {/* 프로필 편집 버튼 (본인 프로필) */}
              {isOwnProfile && (
                <Button
                  onClick={() => {
                    setProfileNickname(displayName);
                    setProfileHeadline(savedProfile.headline);
                    setProfileBio(savedProfile.bio);
                    setProfileLocation(savedProfile.location);
                    setShowProfileEditModal(true);
                  }}
                  className="mt-6 w-full bg-[#0057FF] hover:bg-[#0046CC] text-[15px] py-3"
                >
                  프로필 정보 편집
                </Button>
              )}
            </div>

            {/* 오른쪽: 탭 컨텐츠 */}
            <div className="flex-1 py-8">
              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="h-auto p-0 bg-transparent border-b rounded-none w-full justify-start gap-4">
                  <TabsTrigger
                    value="projects"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3 text-[15px] px-3"
                  >
                    작품
                  </TabsTrigger>
                  <TabsTrigger
                    value="likes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3 text-[15px] px-3"
                  >
                    좋아요
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3 text-[15px] px-3"
                  >
                    저장
                  </TabsTrigger>
                  {isOwnProfile && (
                    <TabsTrigger
                      value="drafts"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3 text-[15px] px-3"
                    >
                      초안 ({drafts.length})
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="tagged"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057FF] data-[state=active]:bg-transparent pb-3 text-[15px] px-3"
                  >
                    태그된 작품
                  </TabsTrigger>
                </TabsList>

                {/* ===== 작품 탭 ===== */}
                <TabsContent value="projects" className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[20px] font-semibold">작품 ({artistWorks.length})</h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="bg-[#0057FF] hover:bg-[#0046CC] text-[15px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 작품 올리기
                      </Button>
                    )}
                  </div>

                  {/* 개인/그룹 필터 */}
                  {artistWorks.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                      <button
                        onClick={() => setExhibitionFilter('all')}
                        className={`px-5 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                          exhibitionFilter === 'all'
                            ? 'bg-[#0057FF] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        전체 ({artistWorks.length})
                      </button>
                      <button
                        onClick={() => setExhibitionFilter('solo')}
                        className={`px-5 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                          exhibitionFilter === 'solo'
                            ? 'bg-[#0057FF] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        개인 ({soloCount})
                      </button>
                      <button
                        onClick={() => setExhibitionFilter('group')}
                        className={`px-5 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                          exhibitionFilter === 'group'
                            ? 'bg-[#0057FF] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        그룹 ({groupCount})
                      </button>
                    </div>
                  )}

                  {/* 작품 그리드 */}
                  {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-8">
                      {filteredWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer relative"
                          onClick={() => navigate(`/work/${work.id}`)}
                        >
                          <div className="relative aspect-square rounded-xl bg-[#F0F0F0] overflow-hidden border border-[#E0E0E0]">
                            <div className="relative w-full h-full flex items-center justify-center bg-white p-8">
                              <div className="relative w-full h-full flex items-center justify-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] overflow-hidden">
                                <ImageWithFallback
                                  src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                  alt={work.title}
                                  className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                                />

                                {/* 삭제 메뉴 (본인 프로필) */}
                                {isOwnProfile && (
                                  <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-700/90 text-white hover:bg-slate-800 shadow-md backdrop-blur-sm"
                                          aria-label="작품 메뉴"
                                        >
                                          <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" sideOffset={4} className="z-[200]">
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 text-[14px]"
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

                                {/* 이미지 개수 배지 */}
                                {getImageCount(work.image) > 1 && (
                                  <div className="absolute left-3 top-3 z-10">
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      {getImageCount(work.image)}
                                    </div>
                                  </div>
                                )}

                                {/* 호버 오버레이 */}
                                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                                  <div className="flex items-start justify-end gap-2">
                                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                                      <ThumbsUp className="h-3 w-3 text-white" />
                                      <span className="text-white text-[12px] font-medium">
                                        {work.likes >= 1000 ? Math.floor(work.likes / 1000) + 'k' : work.likes}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-white text-[17px] font-bold leading-tight drop-shadow-lg mb-2">
                                      {work.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      {work.coOwners && work.coOwners.length > 0 && work.groupName ? (
                                        <>
                                          <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white/50 bg-white/20">
                                            <Users className="h-3 w-3 text-white" />
                                          </div>
                                          <span className="text-white/90 text-[13px] font-medium drop-shadow">
                                            {work.groupName}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Avatar className="h-6 w-6 border-2 border-white/50">
                                            <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                                            <AvatarFallback className="text-[10px]">{profileArtist.name[0]}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-white/90 text-[13px] font-medium drop-shadow">
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
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F0FF]">
                        <Plus className="h-10 w-10 text-[#0057FF]" />
                      </div>
                      <h3 className="text-[18px] font-semibold mb-2">첫 작품 업로드</h3>
                      <p className="text-[15px] text-muted-foreground max-w-md mx-auto mb-6">
                        당신의 작품을 세상과 공유하고, 피드백과 영감을 받아보세요.
                      </p>
                      <Button
                        onClick={() => navigate('/upload')}
                        className="bg-[#0057FF] hover:bg-[#0046CC] text-[15px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        작품 업로드 하기
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 좋아요 탭 ===== */}
                <TabsContent value="likes" className="mt-8">
                  <h2 className="text-[20px] font-semibold mb-6">좋아요한 작품</h2>
                  {likedWorks.length > 0 ? (
                    <div className="space-y-4">
                      {likedWorks.map((work) => (
                        <div key={work.id} className="flex gap-5 p-5 border border-[#E0E0E0] rounded-xl hover:border-[#CCCCCC] hover:shadow-md transition-all bg-white">
                          <div
                            className="w-36 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => navigate(`/work/${work.id}`)}
                          >
                            <WorkCard work={work} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-[16px] font-semibold text-gray-900 truncate cursor-pointer hover:text-[#0057FF] transition-colors"
                              onClick={() => navigate(`/work/${work.id}`)}
                            >
                              {work.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-[14px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {work.likes} 좋아요
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <p className="text-[16px] text-muted-foreground">아직 좋아요한 작품이 없습니다.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 저장 탭 ===== */}
                <TabsContent value="saved" className="mt-8">
                  <h2 className="text-[20px] font-semibold mb-6">저장한 작품</h2>
                  {savedWorks.length > 0 ? (
                    <div className="space-y-4">
                      {savedWorks.map((work) => (
                        <div key={work.id} className="flex gap-5 p-5 border border-[#E0E0E0] rounded-xl hover:border-[#CCCCCC] hover:shadow-md transition-all bg-white">
                          <div
                            className="w-36 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => navigate(`/work/${work.id}`)}
                          >
                            <WorkCard work={work} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-[16px] font-semibold text-gray-900 truncate cursor-pointer hover:text-[#0057FF] transition-colors"
                              onClick={() => navigate(`/work/${work.id}`)}
                            >
                              {work.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-[14px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {work.likes} 좋아요
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <p className="text-[16px] text-muted-foreground">아직 저장한 작품이 없습니다.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 초안 탭 ===== */}
                <TabsContent value="drafts" className="mt-8">
                  {isOwnProfile ? (
                    <>
                      <h2 className="text-[20px] font-semibold mb-6">초안 ({drafts.length})</h2>
                      {drafts.length > 0 ? (
                        <div className="space-y-4">
                          {drafts.map((draft) => (
                            <div key={draft.id} className="flex gap-5 p-5 border border-[#E0E0E0] rounded-xl hover:border-[#CCCCCC] hover:shadow-md transition-all bg-white">
                              {/* 썸네일 */}
                              {draft.contents.find(c => c.type === 'image' && c.url) && (
                                <div className="w-36 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={draft.contents.find(c => c.type === 'image' && c.url)?.url}
                                    alt={draft.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {/* 초안 정보 */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[16px] font-semibold text-gray-900 truncate">
                                  {draft.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-[14px] text-gray-500">
                                  <span>{draft.contents.length}개 이미지</span>
                                  <span>{new Date(draft.savedAt).toLocaleDateString('ko-KR')}</span>
                                </div>
                                {draft.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {draft.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[12px] rounded">
                                        {tag}
                                      </span>
                                    ))}
                                    {draft.tags.length > 3 && (
                                      <span className="px-2 py-0.5 text-gray-500 text-[12px]">
                                        +{draft.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 액션 버튼 */}
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => navigate('/upload')}
                                  className="bg-[#0057FF] hover:bg-[#0046CC] text-[14px]"
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
                                  className="text-red-600 border-red-200 hover:bg-red-50 text-[14px]"
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
                          <h3 className="text-[18px] font-semibold mb-2">저장된 초안이 없습니다</h3>
                          <p className="text-[15px] text-muted-foreground max-w-md mx-auto mb-6">
                            작품 업로드 중 "초안으로 저장"을 하면 여기에 표시됩니다.
                          </p>
                          <Button
                            onClick={() => navigate('/upload')}
                            className="bg-[#0057FF] hover:bg-[#0046CC] text-[15px]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            작품 업로드 하기
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border bg-card p-12 text-center">
                      <p className="text-[16px] text-muted-foreground">초안은 본인만 볼 수 있습니다.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 태그된 작품 탭 ===== */}
                <TabsContent value="tagged" className="mt-8">
                  <h2 className="text-[20px] font-semibold mb-2">다른 작가가 태그한 작품</h2>
                  <p className="text-[15px] text-gray-500 mb-6">
                    공동 작업자로 태그된 작품이 여기에 표시됩니다.
                  </p>

                  {taggedWorks.length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(taggedByGroup).map(([groupName, groupWorks]) => (
                        <div key={groupName}>
                          {/* 그룹명 헤더 */}
                          <div className="flex items-center gap-2 mb-4">
                            <Tag className="h-4 w-4 text-[#0057FF]" />
                            <h3 className="text-[17px] font-semibold text-gray-800">{groupName}</h3>
                            <span className="text-[14px] text-gray-400">({groupWorks.length})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                            {groupWorks.map((work) => {
                              const uploader = artists.find(a => a.id === work.artistId);
                              return (
                                <div
                                  key={work.id}
                                  className="group cursor-pointer"
                                  onClick={() => navigate(`/work/${work.id}`)}
                                >
                                  <div className="relative aspect-square rounded-xl bg-[#F0F0F0] overflow-hidden border border-[#E0E0E0] shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-shadow">
                                    <div className="w-full h-full flex items-center justify-center bg-white p-6">
                                      <ImageWithFallback
                                        src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                        alt={work.title}
                                        className="w-full h-full min-w-0 min-h-0 object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                                      />
                                    </div>

                                    {/* 그룹명 배지 */}
                                    {work.groupName && (
                                      <div className="absolute left-3 top-3 z-10">
                                        <div className="flex items-center gap-1.5 rounded-full bg-[#0057FF]/90 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm">
                                          <Users className="h-3 w-3" />
                                          {work.groupName}
                                        </div>
                                      </div>
                                    )}

                                    {/* 호버 오버레이 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                      <h4 className="text-white text-[16px] font-bold leading-tight mb-1">
                                        {work.title}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        {uploader && (
                                          <>
                                            <Avatar className="h-5 w-5 border border-white/50">
                                              <AvatarImage src={uploader.avatar} alt={uploader.name} />
                                              <AvatarFallback className="text-[8px]">{uploader.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-white/90 text-[13px]">
                                              업로드: {uploader.name}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1.5">
                                        <ThumbsUp className="h-3 w-3 text-white/80" />
                                        <span className="text-white/80 text-[12px]">{work.likes}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-white p-16 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <Tag className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-[18px] font-semibold mb-2 text-gray-700">아직 태그된 작품이 없습니다</h3>
                      <p className="text-[15px] text-muted-foreground max-w-md mx-auto">
                        다른 작가가 공동 작업자로 태그하면 여기에 표시됩니다.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
