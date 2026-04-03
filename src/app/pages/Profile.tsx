import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Eye, EyeOff, X, ThumbsUp, Users, Folder, MoreHorizontal, Trash2, Tag, Flag, UserPlus, Camera } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import ProfileImageModal from '../components/ProfileImageModal';
import { artists, works as allWorksData, type Work } from '../data';
import { workStore, draftStore, profileStore, userInteractionStore, followStore, useFollowStore, authStore, useAuthStore, withdrawnArtistStore } from '../store';
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
import { toast } from 'sonner';
import { getFirstImage, getImageCount } from '../utils/imageHelper';
import { ReportModal } from '../components/ReportModal';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { isPublicInstructor, setPublicInstructor } from '../utils/instructorPublic';
import { getDisplayFollowerCount } from '../utils/artistFollowDelta';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';

function workHasStudentCredits(w: Work, instructorId: string): boolean {
  const ia = w.imageArtists;
  if (!ia?.length) return false;
  return ia.some((a) => {
    if (a.type === 'non-member') return true;
    if (a.type === 'member' && a.memberId && a.memberId !== instructorId) return true;
    return false;
  });
}

function firstStudentLabel(w: Work, instructorId: string): string {
  const ia = w.imageArtists;
  if (!ia?.length) return '';
  for (const a of ia) {
    if (a.type === 'non-member' && a.displayName) return a.displayName;
    if (a.type === 'member' && a.memberId && a.memberId !== instructorId && a.memberName) return a.memberName;
  }
  return '';
}

const LOCATION_VALUE_TO_KEY: Record<string, MessageKey> = {
  대한민국: 'profile.locKR',
  미국: 'profile.locUS',
  일본: 'profile.locJP',
  중국: 'profile.locCN',
  영국: 'profile.locGB',
  프랑스: 'profile.locFR',
  독일: 'profile.locDE',
  캐나다: 'profile.locCA',
  호주: 'profile.locAU',
  대만: 'profile.locTW',
  기타: 'profile.locOther',
};

function locationDisplayLabel(stored: string, tr: (k: MessageKey) => string): string {
  if (!stored) return '';
  const k = LOCATION_VALUE_TO_KEY[stored];
  return k ? tr(k) : stored;
}

// Profile 페이지 — Phase 1 MVP
export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const follows = useFollowStore();
  const auth = useAuthStore();
  const [exhibitionFilter, setExhibitionFilter] = useState<'all' | 'solo' | 'group'>('all');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [showReportModal, setShowReportModal] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [profileIsInstructor, setProfileIsInstructor] = useState(false);

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
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [profileHeadline, setProfileHeadline] = useState(() => profileStore.getProfile().headline);
  const [profileBio, setProfileBio] = useState(() => profileStore.getProfile().bio);
  const [profileLocation, setProfileLocation] = useState(() => profileStore.getProfile().location);

  // 현재 프로필 아티스트
  const profileArtist = id ? artists.find(a => a.id === id) || artists[0] : artists[0];
  const isOwnProfile = !id || id === artists[0].id;

  useEffect(() => {
    if (!isOwnProfile) return;
    setPublicInstructor(profileArtist.id, !!savedProfile.isInstructor);
  }, [isOwnProfile, profileArtist.id, savedProfile.isInstructor]);

  // 사용자 이름: 탈퇴 익명화(정책) > 프로필 스토어 > 시드 데이터
  const displayName = withdrawnArtistStore.isWithdrawn(profileArtist.id)
    ? t('profile.deletedUser')
    : savedProfile.name || profileArtist.name;
  const [profileNickname, setProfileNickname] = useState(() => profileStore.getProfile().name || profileArtist.name);

  // 작품 필터링
  const artistWorks = storeWorks.filter(w => w.artistId === profileArtist.id);
  const likedWorks = storeWorks.filter(w => likedIds.includes(w.id) && w.artistId !== profileArtist.id);
  const savedWorks = storeWorks.filter(w => savedIds.includes(w.id) && w.artistId !== profileArtist.id);

  // 전시 유형 판별 — primaryExhibitionType 우선, 레거시 fallback
  const isGroupExhibition = (w: Work) => {
    if (w.primaryExhibitionType === 'group') return true;
    if (w.primaryExhibitionType === 'solo') return false;
    if (w.isInstructorUpload && w.groupName) return true;
    return false;
  };

  const filteredWorks = artistWorks.filter(work => {
    if (exhibitionFilter === 'all') return true;
    if (exhibitionFilter === 'solo') return !isGroupExhibition(work) || work.showInSoloTab;
    if (exhibitionFilter === 'group') return isGroupExhibition(work);
    return true;
  });

  const soloCount = artistWorks.filter(w => !isGroupExhibition(w)).length;
  const groupCount = artistWorks.filter(w => isGroupExhibition(w)).length;

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

  const instructorVisible = isPublicInstructor(profileArtist.id);

  const studentWorksList = useMemo(() => {
    if (!instructorVisible) return [];
    return storeWorks.filter(
      (w) =>
        w.isInstructorUpload &&
        w.artistId === profileArtist.id &&
        w.groupName &&
        (w.primaryExhibitionType === 'group' || isGroupExhibition(w)) &&
        workHasStudentCredits(w, profileArtist.id),
    );
  }, [storeWorks, profileArtist.id, instructorVisible]);

  return (
    <div className="min-h-screen bg-background">
      {/* 프로필 이미지 변경 모달 */}
      <ProfileImageModal
        open={showProfileImageModal}
        onClose={() => setShowProfileImageModal(false)}
        currentImage={profileArtist.avatar}
        onSave={(url) => {
          profileStore.updateProfile({ avatarUrl: url || undefined });
          setShowProfileImageModal(false);
        }}
      />

      {/* 프로필 편집 모달 */}
      {showProfileEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowProfileEditModal(false)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-5">
              <h2 className="text-lg font-semibold text-[#18181B]">{t('profile.edit')}</h2>
              <Button
                onClick={() => setShowProfileEditModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full lg:hover:bg-[#F4F4F5] transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            {/* 폼 */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* 사용자 이름 */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#18181B] mb-2">
                    {t('profile.formDisplayName')}
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
                      placeholder={t('profile.formDisplayNamePh')}
                      className="w-full px-4 py-3.5 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                      {profileNickname.length}/20
                    </span>
                  </div>
                </div>

                {/* 한 줄 프로필 */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#18181B] mb-2">
                    {t('profile.formHeadline')}
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
                      placeholder={t('profile.formHeadlinePh')}
                      className="w-full px-4 py-3.5 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                      {profileHeadline.length}/20
                    </span>
                  </div>
                </div>

                {/* 소개 */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#18181B] mb-2">
                    {t('profile.formBio')}
                  </label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder={t('profile.formBioPh')}
                    rows={5}
                    className="w-full px-4 py-3.5 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none leading-relaxed"
                  />
                </div>

                {/* 국가 */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#18181B] mb-2">
                    {t('profile.formCountry')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                      }}
                    >
                      <option value="">{t('profile.formCountryPlaceholder')}</option>
                      <option value="대한민국">{t('profile.locKR')}</option>
                      <option value="미국">{t('profile.locUS')}</option>
                      <option value="일본">{t('profile.locJP')}</option>
                      <option value="중국">{t('profile.locCN')}</option>
                      <option value="영국">{t('profile.locGB')}</option>
                      <option value="프랑스">{t('profile.locFR')}</option>
                      <option value="독일">{t('profile.locDE')}</option>
                      <option value="캐나다">{t('profile.locCA')}</option>
                      <option value="호주">{t('profile.locAU')}</option>
                      <option value="대만">{t('profile.locTW')}</option>
                      <option value="기타">{t('profile.locOther')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                  <input
                    id="instructor-toggle"
                    type="checkbox"
                    checked={profileIsInstructor}
                    onChange={(e) => setProfileIsInstructor(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-primary"
                  />
                  <label htmlFor="instructor-toggle" className="text-sm text-[#3F3F46] cursor-pointer">
                    <span className="font-semibold text-[#18181B]">{t('profile.instructorToggle')}</span>
                    <p className="text-xs text-[#71717A] mt-1">{t('profile.instructorHelp')}</p>
                  </label>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
              <Button
                onClick={() => setShowProfileEditModal(false)}
                className="px-6 py-3 text-[15px] text-gray-700 lg:hover:bg-[#F4F4F5] rounded-lg transition-colors"
              >
                {t('loginPrompt.cancel')}
              </Button>
              <Button
                onClick={() => {
                  profileStore.updateProfile({
                    name: profileNickname.trim() || displayName,
                    nickname: profileNickname.trim(),
                    headline: profileHeadline,
                    bio: profileBio,
                    location: profileLocation,
                    isInstructor: profileIsInstructor,
                  });
                  setPublicInstructor(profileArtist.id, profileIsInstructor);
                  setShowProfileEditModal(false);
                  toast.success(t('profile.toastProfileSaved'));
                }}
                className="px-8 py-3 bg-primary text-white text-[15px] font-medium rounded-lg lg:hover:bg-primary/90 transition-colors"
              >
                {t('profile.saveProfile')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 섹션 */}
      <div className="bg-white border-b pb-20 md:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="flex flex-col md:flex-row gap-5 md:gap-8">
            {/* 왼쪽: 프로필 정보 */}
            <div className="w-full md:w-[280px] flex-shrink-0 pt-8 md:pt-12">
              <div className="relative group">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                  <AvatarFallback className="text-lg sm:text-xl">{profileArtist.name[0]}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    onClick={() => setShowProfileImageModal(true)}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white border border-[#E4E4E7] shadow-sm flex items-center justify-center text-gray-600 lg:hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold">{displayName}</h1>
                {instructorVisible && (
                  <span className="inline-flex items-center rounded-full bg-muted text-foreground text-[11px] font-semibold px-2.5 py-0.5">
                    {t('profile.instructorBadge')}
                  </span>
                )}
              </div>

              {/* 한 줄 프로필 */}
              {savedProfile.headline && (
                <p className="mt-3 text-[15px] text-gray-600 font-medium">
                  {savedProfile.headline}
                </p>
              )}

              {/* 지역 */}
              {savedProfile.location && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationDisplayLabel(savedProfile.location, t)}</span>
                </div>
              )}

              {/* 소개글 */}
              {savedProfile.bio ? (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {savedProfile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  {profileArtist.bio || t('profile.bioPlaceholderEmpty')}
                </p>
              )}

              {/* 팔로워/팔로잉 */}
              <div className="mt-4 flex items-center gap-5 text-sm">
                <Button
                  onClick={() => { setFollowModalTab('followers'); setShowFollowersModal(true); }}
                  className="lg:hover:opacity-70 transition-opacity"
                >
                  <span className="font-semibold text-[#18181B]">
                    {getDisplayFollowerCount(profileArtist).toLocaleString()}
                  </span>
                  <span className="text-gray-500 ml-1">{t('profile.followModalFollowers')}</span>
                </Button>
                <Button
                  onClick={() => { setFollowModalTab('following'); setShowFollowersModal(true); }}
                  className="lg:hover:opacity-70 transition-opacity"
                >
                  <span className="font-semibold text-[#18181B]">{profileArtist.following?.toLocaleString() || '0'}</span>
                  <span className="text-gray-500 ml-1">{t('profile.followModalFollowing')}</span>
                </Button>
              </div>

              {/* 팔로우 + 신고 버튼 (타인 프로필) */}
              {!isOwnProfile && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant={follows.isFollowing(profileArtist.id) ? 'outline' : 'default'}
                    className="flex-1 text-sm py-3"
                    onClick={() => {
                      if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                      followStore.toggle(profileArtist.id);
                    }}
                  >
                    {follows.isFollowing(profileArtist.id) ? t('social.following') : t('social.follow')}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-gray-500 lg:hover:text-red-500 lg:hover:border-red-300"
                    onClick={() => {
                      if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                      setShowReportModal(true);
                    }}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* 프로필 편집 버튼 (본인 프로필) */}
              {isOwnProfile && (
                <Button
                  onClick={() => {
                    setProfileNickname(displayName);
                    setProfileHeadline(savedProfile.headline);
                    setProfileBio(savedProfile.bio);
                    setProfileLocation(savedProfile.location);
                    setProfileIsInstructor(!!savedProfile.isInstructor);
                    setShowProfileEditModal(true);
                  }}
                  className="mt-6 w-full bg-primary lg:hover:bg-primary/90 text-sm py-3"
                >
                  {t('profile.edit')}
                </Button>
              )}
            </div>

            {/* 오른쪽: 탭 컨텐츠 */}
            <div className="flex-1 py-4 sm:py-8">
              <Tabs defaultValue="exhibition" className="w-full">
                <TabsList className="h-auto p-0 bg-transparent border-b border-[#F0F0F0] rounded-none w-full justify-start gap-0 overflow-x-auto scrollbar-hide">
                  <TabsTrigger
                    value="exhibition"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                  >
                    {t('profile.exhibition')}
                  </TabsTrigger>
                  {instructorVisible && (
                    <TabsTrigger
                      value="student-works"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                    >
                      {t('profile.studentWorks')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="works"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                    >
                      {t('profile.tabWorkManage')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="likes"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                    >
                      {t('profile.tabLikes')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="saved"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                    >
                      {t('profile.tabSaves')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="drafts"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#18181B] data-[state=active]:bg-transparent data-[state=active]:text-[#18181B] pb-3 text-sm px-4 text-[#71717A]"
                    >
                      {t('profile.tabDrafts')}
                      {drafts.length > 0 ? ` (${drafts.length})` : ''}
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* ===== 전시 탭 ===== */}
                <TabsContent value="exhibition" className="mt-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      {(['all', 'solo', 'group'] as const).map((f) => {
                        const label =
                          f === 'all' ? t('profile.filterAll') : f === 'solo' ? t('profile.filterSolo') : t('profile.filterGroup');
                        const count = f === 'all' ? artistWorks.length : f === 'solo' ? soloCount : groupCount;
                        return (
                          <Button
                            key={f}
                            onClick={() => setExhibitionFilter(f)}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border ${
                              exhibitionFilter === f
                                ? 'border-[#18181B] text-[#18181B]'
                                : 'border-[#E5E7EB] text-[#71717A] lg:hover:border-[#A1A1AA]'
                            }`}
                          >
                            {label} {count}
                          </Button>
                        );
                      })}
                    </div>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/upload')}
                        size="sm"
                        className="text-[13px] gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('profile.newExhibition')}
                      </Button>
                    )}
                  </div>

                  {/* 작품 그리드 */}
                  {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                      {filteredWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer relative"
                          onClick={() => navigate(`/exhibitions/${work.id}`)}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <div className="relative w-full h-full flex items-center justify-center bg-white">
                              <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
                                <ImageWithFallback
                                  src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                  alt={work.title}
                                  className="w-full h-full min-w-0 min-h-0 object-contain object-center hover-scale"
                                />

                                {/* 삭제 메뉴 (본인 프로필) */}
                                {isOwnProfile && (
                                  <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          className="flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white lg:hover:bg-black/80 hover-action"
                                          aria-label={t('profile.workMenuA11y')}
                                        >
                                          <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" sideOffset={4}>
                                        <DropdownMenuItem
                                          className="text-[13px]"
                                          onSelect={(e) => e.preventDefault()}
                                          onClick={() => {
                                            workStore.updateWork(work.id, { isHidden: !work.isHidden });
                                            toast(
                                              work.isHidden
                                                ? t('profile.toastWorkPublic')
                                                : t('profile.toastWorkPrivate'),
                                            );
                                          }}
                                        >
                                            {work.isHidden ? (
                                            <><Eye className="h-4 w-4 mr-2" />{t('profile.menuMakePublic')}</>
                                          ) : (
                                            <><EyeOff className="h-4 w-4 mr-2" />{t('profile.menuSetPrivateShort')}</>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 text-[13px]"
                                          onSelect={(e) => e.preventDefault()}
                                          onClick={() => {
                                            if (
                                              confirm(
                                                t('profile.deleteWorkConfirm').replace('{title}', work.title),
                                              )
                                            ) {
                                              workStore.removeWork(work.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {t('profile.delete')}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}

                                {/* 비공개 배지 */}
                                {work.isHidden && (
                                  <div className="absolute right-3 top-3 z-10">
                                    <div className="flex items-center gap-1.5 rounded-full bg-orange-500/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                      <EyeOff className="h-3.5 w-3.5" />
                                      {t('profile.workPrivateBadge')}
                                    </div>
                                  </div>
                                )}

                                {/* 이미지 개수 배지 */}
                                {getImageCount(work.image) > 1 && (
                                  <div className="absolute left-3 top-3 z-10">
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      {getImageCount(work.image)}
                                    </div>
                                  </div>
                                )}

                                {/* 오버레이 — touch: 하단 그라데이션 항상 / lg:hover: 전체 오버레이 */}
                                <div className="absolute inset-0 z-10 touch-gradient-overlay flex flex-col justify-between p-3">
                                  <div className="flex items-start justify-end gap-2 hover-action">
                                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                                      <ThumbsUp className="h-3 w-3 text-white" />
                                      <span className="text-white text-xs font-medium">
                                        {work.likes >= 1000 ? Math.floor(work.likes / 1000) + 'k' : work.likes}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-white text-sm sm:text-[15px] font-bold leading-tight drop-shadow-lg mb-2">
                                      {work.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      {work.coOwners && work.coOwners.length > 0 && work.groupName ? (
                                        <>
                                          <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white/50 bg-white/20">
                                            <Users className="h-3 w-3 text-white" />
                                          </div>
                                          <span className="text-white/90 text-xs font-medium drop-shadow">
                                            {work.groupName}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Avatar className="h-6 w-6 border-2 border-white/50">
                                            <AvatarImage src={profileArtist.avatar} alt={profileArtist.name} />
                                            <AvatarFallback className="text-xs">{profileArtist.name[0]}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-white/90 text-xs font-medium drop-shadow">
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
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                        <ImageIcon className="h-6 w-6 text-[#A1A1AA]" />
                      </div>
                      <p className="text-[15px] text-[#71717A] mb-1">{t('profile.emptyExhibitions')}</p>
                      {isOwnProfile && (
                        <>
                          <p className="text-sm text-[#A1A1AA] mb-5">{t('profile.emptyExhibitionsOwnHint')}</p>
                          <Button
                            onClick={() => navigate('/upload')}
                            size="sm"
                            className="text-[13px] gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t('profile.firstUploadCta')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="student-works" className="mt-6">
                  {studentWorksList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] py-16 px-6 text-center">
                      <Users className="h-10 w-10 text-[#D4D4D8] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[#52525B]">{t('profile.studentWorksEmpty')}</p>
                      <p className="text-xs text-[#A1A1AA] mt-2 max-w-md mx-auto">{t('profile.studentWorksHint')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {studentWorksList.map((work) => {
                        const credit = firstStudentLabel(work, profileArtist.id);
                        return (
                          <Button
                            key={work.id}
                            type="button"
                            onClick={() => navigate(`/exhibitions/${work.id}`)}
                            className="group text-left rounded-xl border border-[#F0F0F0] overflow-hidden bg-white lg:hover:border-[#E4E4E7] transition-colors"
                          >
                            <div className="relative aspect-square bg-white">
                              <ImageWithFallback
                                src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                alt={work.title}
                                className="w-full h-full object-contain object-center"
                              />
                            </div>
                            <div className="p-3 sm:p-4">
                              <p className="text-sm font-semibold text-[#18181B] line-clamp-2">{work.title}</p>
                              {work.groupName && (
                                <p className="text-xs text-[#71717A] mt-1 flex items-center gap-1">
                                  <Folder className="h-3 w-3 shrink-0" />
                                  {work.groupName}
                                </p>
                              )}
                              {credit && (
                                <p className="text-xs text-muted-foreground mt-2 font-medium">
                                  {t('profile.studentCredit')}: {credit}
                                </p>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* ===== 작품 관리 탭 (내 업로드 + 태그된 작품 통합) ===== */}
                <TabsContent value="works" className="mt-6">
                  {(() => {
                    const allMyWorks = [...artistWorks, ...taggedWorks];
                    return allMyWorks.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {allMyWorks.map((work) => {
                          const isMyUpload = work.artistId === profileArtist.id;
                          return (
                            <div
                              key={work.id}
                              className="group cursor-pointer relative"
                              onClick={() => navigate(`/exhibitions/${work.id}`)}
                            >
                              <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                                <ImageWithFallback
                                  src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                                  alt={work.title}
                                  className="w-full h-full object-contain object-center"
                                />

                                {isMyUpload && (
                                  <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          className="flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white lg:hover:bg-black/80 hover-action"
                                          aria-label={t('profile.workMenuA11y')}
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" sideOffset={4}>
                                        <DropdownMenuItem
                                          className="text-[13px]"
                                          onSelect={(e) => e.preventDefault()}
                                          onClick={() => {
                                            workStore.updateWork(work.id, { isHidden: !work.isHidden });
                                            toast(
                                              work.isHidden
                                                ? t('profile.toastWorkPublic')
                                                : t('profile.toastWorkPrivate'),
                                            );
                                          }}
                                        >
                                          {work.isHidden ? (
                                            <><Eye className="h-4 w-4 mr-2" />{t('profile.menuMakePublic')}</>
                                          ) : (
                                            <><EyeOff className="h-4 w-4 mr-2" />{t('profile.menuMakePrivate')}</>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 text-[13px]"
                                          onSelect={(e) => e.preventDefault()}
                                          onClick={() => {
                                            if (
                                              confirm(
                                                t('profile.deleteWorkConfirm').replace('{title}', work.title),
                                              )
                                            ) {
                                              workStore.removeWork(work.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {t('profile.delete')}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}

                                {!isMyUpload && (
                                  <div className="absolute left-2 top-2 z-10">
                                    <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                                      <Tag className="h-3 w-3" />
                                      {t('profile.tagged')}
                                    </span>
                                  </div>
                                )}

                                {work.isHidden && (
                                  <div className="absolute left-2 bottom-2 z-10">
                                    <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[11px] text-white">
                                      <EyeOff className="h-3 w-3" />
                                      {t('profile.workPrivateBadge')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2">
                                <p className="text-sm font-medium text-[#18181B] truncate">{work.title}</p>
                                <p className="text-[12px] text-[#A1A1AA] mt-0.5">{work.artist?.name || profileArtist.name}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                          <Folder className="h-6 w-6 text-[#A1A1AA]" />
                        </div>
                        <p className="text-[15px] text-[#71717A] mb-1">{t('profile.emptyWorksManage')}</p>
                        <p className="text-sm text-[#A1A1AA] mb-5">{t('profile.emptyWorksManageHint')}</p>
                        <Button onClick={() => navigate('/upload')} size="sm" className="text-[13px] gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          {t('profile.firstUploadCta')}
                        </Button>
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* ===== 좋아요 탭 (본인만) ===== */}
                <TabsContent value="likes" className="mt-6">
                  {likedWorks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      {likedWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer"
                          onClick={() => navigate(`/exhibitions/${work.id}`)}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <ImageWithFallback
                              src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                              alt={work.title}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium text-[#18181B] truncate">{work.title}</p>
                            <p className="text-[12px] text-[#A1A1AA] mt-0.5">{work.artist?.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                        <ThumbsUp className="h-6 w-6 text-[#A1A1AA]" />
                      </div>
                      <p className="text-[15px] text-[#71717A] mb-1">{t('profile.emptyLikes')}</p>
                      <p className="text-sm text-[#A1A1AA] mb-5">{t('profile.emptyLikesHint')}</p>
                      <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-[13px]">
                        {t('profile.browseWorks')}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 저장 탭 (본인만) ===== */}
                <TabsContent value="saved" className="mt-6">
                  {savedWorks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      {savedWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer"
                          onClick={() => navigate(`/exhibitions/${work.id}`)}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <ImageWithFallback
                              src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                              alt={work.title}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium text-[#18181B] truncate">{work.title}</p>
                            <p className="text-[12px] text-[#A1A1AA] mt-0.5">{work.artist?.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                        <Folder className="h-6 w-6 text-[#A1A1AA]" />
                      </div>
                      <p className="text-[15px] text-[#71717A] mb-1">{t('profile.emptySaves')}</p>
                      <p className="text-sm text-[#A1A1AA] mb-5">{t('profile.emptySavesHint')}</p>
                      <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-[13px]">
                        {t('profile.browseWorks')}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 초안 탭 (본인만) ===== */}
                <TabsContent value="drafts" className="mt-6">
                  {drafts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      {drafts.map((draft) => {
                        const thumbUrl = draft.contents.find(c => c.type === 'image' && c.url)?.url;
                        return (
                          <div
                            key={draft.id}
                            className="group cursor-pointer relative"
                            onClick={() => navigate(`/upload?draft=${draft.id}`)}
                          >
                            <div className="relative aspect-square rounded-sm overflow-hidden bg-[#F4F4F5]">
                              {thumbUrl ? (
                                <img src={thumbUrl} alt={draft.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Folder className="h-8 w-8 text-[#D4D4D8]" />
                                </div>
                              )}
                              <div className="absolute left-2 top-2 z-10">
                                <span className="rounded-full bg-[#18181B]/70 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
                                  {t('profile.draftBadge')}
                                </span>
                              </div>
                              <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button className="flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white lg:hover:bg-black/80 hover-action">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem className="text-[13px]" onClick={() => navigate(`/upload?draft=${draft.id}`)}>
                                      {t('profile.continueEditDraft')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 text-[13px]"
                                      onSelect={(e) => e.preventDefault()}
                                      onClick={() => {
                                        if (confirm(t('profile.deleteDraftConfirm'))) draftStore.deleteDraft(draft.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('profile.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="pt-2">
                              <p className="text-sm font-medium text-[#18181B] truncate">
                                {draft.title || t('profile.draftNoTitle')}
                              </p>
                              <p className="text-[12px] text-[#A1A1AA] mt-0.5">
                                {new Date(draft.savedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR')} ·{' '}
                                {t('profile.draftImageCount').replace('{n}', String(draft.contents.length))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F4F5]">
                        <Folder className="h-6 w-6 text-[#A1A1AA]" />
                      </div>
                      <p className="text-[15px] text-[#71717A] mb-1">{t('profile.emptyDrafts')}</p>
                      <p className="text-sm text-[#A1A1AA] mb-5">{t('profile.emptyDraftsHint')}</p>
                      <Button onClick={() => navigate('/upload')} size="sm" className="text-[13px] gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        {t('profile.uploadWork')}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* 팔로워/팔로잉 목록 모달 */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFollowersModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl mx-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setFollowModalTab('followers')}
                  className={`text-[15px] font-semibold pb-1 transition-colors ${
                    followModalTab === 'followers' ? 'text-[#18181B] border-b-2 border-gray-900' : 'text-gray-400'
                  }`}
                >
                  {t('profile.followModalFollowers')}{' '}
                  {getDisplayFollowerCount(profileArtist).toLocaleString()}
                </Button>
                <Button
                  onClick={() => setFollowModalTab('following')}
                  className={`text-[15px] font-semibold pb-1 transition-colors ${
                    followModalTab === 'following' ? 'text-[#18181B] border-b-2 border-gray-900' : 'text-gray-400'
                  }`}
                >
                  {t('profile.followModalFollowing')} {profileArtist.following?.toLocaleString() || '0'}
                </Button>
              </div>
              <Button onClick={() => setShowFollowersModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full lg:hover:bg-[#F4F4F5]">
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {(() => {
                const sampleList = followModalTab === 'followers'
                  ? artists.filter(a => a.id !== profileArtist.id).slice(0, 5)
                  : artists.filter(a => a.id !== profileArtist.id).slice(2, 6);
                return sampleList.length === 0 ? (
                  <p className="text-center py-12 text-sm text-gray-400">
                    {followModalTab === 'followers'
                      ? t('profile.followListEmptyFollowers')
                      : t('profile.followListEmptyFollowing')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sampleList.map((artist) => (
                      <div key={artist.id} className="flex items-center gap-3 p-3 rounded-xl lg:hover:bg-[#FAFAFA] transition-colors">
                        <Avatar
                          className="h-11 w-11 cursor-pointer"
                          onClick={() => { setShowFollowersModal(false); navigate(`/profile/${artist.id}`); }}
                        >
                          <AvatarImage src={artist.avatar} alt={artist.name} />
                          <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Button
                            onClick={() => { setShowFollowersModal(false); navigate(`/profile/${artist.id}`); }}
                            className="text-sm font-semibold text-[#18181B] lg:hover:underline truncate block text-left"
                          >
                            {artist.name}
                          </Button>
                          {artist.bio && <p className="text-xs text-gray-500 truncate">{artist.bio}</p>}
                        </div>
                        <Button
                          variant={follows.isFollowing(artist.id) ? 'outline' : 'default'}
                          size="sm"
                          className="text-xs shrink-0"
                          onClick={() => {
                            if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                            followStore.toggle(artist.id);
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          {follows.isFollowing(artist.id) ? t('social.following') : t('social.follow')}
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 작가 신고 모달 (타인 프로필) */}
      {!isOwnProfile && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="artist"
          targetId={profileArtist.id}
          targetName={displayName}
        />
      )}

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="follow" />
    </div>
  );
}
