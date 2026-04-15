import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Eye, EyeOff, X, ThumbsUp, Users, Folder, MoreHorizontal, Trash2, Tag, UserPlus, Camera, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Image as ImageIcon, User as UserIcon } from 'lucide-react';
import ProfileImageModal from '../components/ProfileImageModal';
import { artists, type Work } from '../data';
import { workStore, draftStore, profileStore, userInteractionStore, followStore, useFollowStore, useAuthStore, withdrawnArtistStore } from '../store';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
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
import { getCoverImage, getImageCount, getThumbCover } from '../utils/imageHelper';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { ExternalLinksEditor, resolveExternalLinkUrl, getExternalLinkPlatformDisplay } from '../components/ExternalLinksEditor';
import { getDisplayFollowerCount } from '../utils/artistFollowDelta';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import {
  displayProminentHeadline,
  displayExhibitionTitle,
  displayPieceTitle,
  displayPieceTitleAtIndex,
  pieceTitlesEditableSnapshot,
} from '../utils/workDisplay';
import { REJECTION_REASON_LABEL_KEY } from '../utils/reviewLabels';
import { openConfirm } from '../components/ConfirmDialog';
import { containsProfanity } from '../utils/profanityFilter';
import { WorkDetailModal } from '../components/WorkDetailModal';
import { hydrateGroupWorks } from '../groupData';

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

type ProfileTabValue = 'exhibition' | 'works' | 'student-works' | 'likes' | 'saved' | 'drafts';

// Profile 페이지 — Phase 1 MVP
export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useI18n();
  const follows = useFollowStore();
  const auth = useAuthStore();
  const [exhibitionFilter, setExhibitionFilter] = useState<'all' | 'solo' | 'group'>('all');
  const [onlyMyUploads, setOnlyMyUploads] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [detailWorkId, setDetailWorkId] = useState<string | null>(null);
  const [worksViewerIndex, setWorksViewerIndex] = useState<number | null>(null);
  const [pieceTitleEdit, setPieceTitleEdit] = useState<{ workId: string; imgIndex: number } | null>(null);
  const [pieceTitleDraft, setPieceTitleDraft] = useState('');
  const [profileTab, setProfileTab] = useState<ProfileTabValue>('exhibition');
  const [profileLinks, setProfileLinks] = useState<{ label: string; url: string }[]>([]);

  const [profileInterests, setProfileInterests] = useState<string[]>([]);

  // Store 상태
  const [storeWorks, setStoreWorks] = useState(workStore.getWorks());
  const [drafts, setDrafts] = useState(draftStore.getDrafts());
  const [likedIds, setLikedIds] = useState(() => userInteractionStore.getLiked());
  const [savedIds, setSavedIds] = useState(() => userInteractionStore.getSaved());
  const [savedProfile, setSavedProfile] = useState(() => profileStore.getProfile());
  const [rejectedModalWork, setRejectedModalWork] = useState<Work | null>(null);

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

  const closeProfileEdit = async () => {
    const p = profileStore.getProfile();
    const dirty = profileNickname !== (p.nickname || '') || profileHeadline !== (p.headline || '') || profileBio !== (p.bio || '') || profileLocation !== (p.location || '');
    if (dirty && !(await openConfirm({ title: t('profile.confirmDiscardEdit'), destructive: true }))) return;
    setShowProfileEditModal(false);
  };

  // 현재 프로필 아티스트
  const matchedArtist = id ? artists.find(a => a.id === id) : artists[0];
  const profileArtist = matchedArtist ?? artists[0];
  const isOwnProfile = !id || id === artists[0].id;
  const isProfileNotFound = !!id && !matchedArtist;


  // 사용자 이름: 내 프로필만 profileStore 참조, 다른 사람은 시드 데이터
  const displayName = withdrawnArtistStore.isWithdrawn(profileArtist.id)
    ? t('profile.deletedUser')
    : isOwnProfile
      ? (savedProfile.name || profileArtist.name)
      : profileArtist.name;

  const viewProfile = isOwnProfile ? savedProfile : {
    name: profileArtist.name,
    nickname: '',
    headline: profileArtist.bio || '',
    bio: '',
    location: '',
    externalLinks: [] as { label: string; url: string }[],
    interests: [] as string[],
  };
  const [profileNickname, setProfileNickname] = useState(() => profileStore.getProfile().name || profileArtist.name);

  // 작품 필터링 (강사 대리 업로드 작품은 전시/작품관리에서 제외 — 수강생 작품 탭에서만 노출)
  // + 그룹 전시에서 이 작가가 참여 작가로 포함된 작품도 합산
  const artistWorks = useMemo(() => {
    const own = storeWorks
      .filter(w => w.artistId === profileArtist.id)
      .filter(w => !w.isInstructorUpload)
      .filter(w => isOwnProfile || (w.feedReviewStatus !== 'pending' && w.feedReviewStatus !== 'rejected'));
    const ownIds = new Set(own.map(w => w.id));

    const hydrated = hydrateGroupWorks(artists) as Work[];
    const participating = hydrated.filter(gw => {
      if (ownIds.has(gw.id)) return false;
      if (gw.artistId === profileArtist.id) return true;
      return gw.imageArtists?.some(ia => ia.type === 'member' && ia.memberId === profileArtist.id) ?? false;
    });

    return [...own, ...participating];
  }, [storeWorks, profileArtist.id, isOwnProfile]);

  const storeWorkIdSet = useMemo(() => new Set(storeWorks.map((w) => w.id)), [storeWorks]);

  // 좋아요/저장 탭용 — storeWorks + groupWorks 통합 검색
  const allWorksPool = useMemo(() => {
    const hydrated = hydrateGroupWorks(artists) as Work[];
    const combined = [...storeWorks, ...hydrated];
    const seen = new Set<string>();
    return combined.filter(w => { if (seen.has(w.id)) return false; seen.add(w.id); return true; });
  }, [storeWorks]);
  const likedWorks = useMemo(() => allWorksPool.filter(w => likedIds.includes(w.id) && w.artistId !== profileArtist.id), [allWorksPool, likedIds, profileArtist.id]);
  const savedWorks = useMemo(() => allWorksPool.filter(w => savedIds.includes(w.id) && w.artistId !== profileArtist.id), [allWorksPool, savedIds, profileArtist.id]);

  // 전시 유형 판별 — primaryExhibitionType 우선, 레거시 fallback
  const isGroupExhibition = (w: Work) => {
    if (w.primaryExhibitionType === 'group') return true;
    if (w.primaryExhibitionType === 'solo') return false;
    if (w.isInstructorUpload && w.groupName) return true;
    return false;
  };

  const filteredWorks = artistWorks.filter(work => {
    if (onlyMyUploads && isOwnProfile && work.artistId !== profileArtist.id) return false;
    if (exhibitionFilter === 'all') return true;
    if (exhibitionFilter === 'solo') return !isGroupExhibition(work) || work.showInSoloTab;
    if (exhibitionFilter === 'group') return isGroupExhibition(work);
    return true;
  });

  const soloCount = artistWorks.filter(w => !isGroupExhibition(w)).length;
  const groupCount = artistWorks.filter(w => isGroupExhibition(w)).length;

  const profileAllWorksForModal = useMemo(() => {
    const hydrated = hydrateGroupWorks(artists) as Work[];
    const combined = [...storeWorks, ...hydrated];
    const seen = new Set<string>();
    const deduped = combined.filter(w => { if (seen.has(w.id)) return false; seen.add(w.id); return true; });
    return deduped
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  }, [storeWorks]);

  // 태그된 작품: 현재 사용자가 coOwner로 등록된 다른 작가의 작품
  const taggedWorks = useMemo(() => storeWorks.filter(w =>
    w.artistId !== profileArtist.id &&
    w.coOwners?.some(co => co.id === profileArtist.id)
  ), [storeWorks, profileArtist.id]);

  // 작품 관리 탭용 — 내 그림만 이미지 단위 flat
  type FlatImage = { work: Work; imgSrc: string; imgIndex: number; pieceTitle: string };
  const worksManageFlatImages: FlatImage[] = useMemo(() => {
    const allMyWorks = [...artistWorks, ...taggedWorks];
    const myId = profileArtist.id;
    return allMyWorks.flatMap((work) => {
      const imgs = Array.isArray(work.image) ? work.image : [work.image];
      const ias = work.imageArtists;
      const myIndices: number[] = [];
      if (ias && ias.length > 0) {
        ias.forEach((ia, idx) => {
          if (ia.type === 'member' && ia.memberId === myId) myIndices.push(idx);
        });
        if (myIndices.length === 0 && work.artistId === myId) {
          imgs.forEach((_, idx) => myIndices.push(idx));
        }
      } else {
        imgs.forEach((_, idx) => myIndices.push(idx));
      }
      return myIndices
        .filter(idx => idx < imgs.length)
        .map((idx) => ({
          work,
          imgSrc: imageUrls[imgs[idx]] || imgs[idx],
          imgIndex: idx,
          pieceTitle: displayPieceTitleAtIndex(work, idx, t('work.untitled')),
        }));
    });
  }, [artistWorks, taggedWorks, profileArtist.id, imageUrls, t]);

  useEffect(() => {
    if (!pieceTitleEdit) {
      setPieceTitleDraft('');
      return;
    }
    const w = workStore.getWork(pieceTitleEdit.workId);
    if (!w) {
      setPieceTitleEdit(null);
      return;
    }
    const snap = pieceTitlesEditableSnapshot(w);
    setPieceTitleDraft(snap[pieceTitleEdit.imgIndex] ?? '');
  }, [pieceTitleEdit]);

  const savePieceTitleFromModal = () => {
    if (!pieceTitleEdit) return;
    const w = workStore.getWork(pieceTitleEdit.workId);
    if (!w) {
      setPieceTitleEdit(null);
      return;
    }
    const trimmed = pieceTitleDraft.trim().slice(0, 120);
    if (containsProfanity(trimmed)) {
      toast.error(t('profile.worksManagePieceTitleProfanity'));
      return;
    }
    const snap = pieceTitlesEditableSnapshot(w);
    const next = [...snap];
    const { imgIndex } = pieceTitleEdit;
    if (imgIndex < 0 || imgIndex >= next.length) {
      setPieceTitleEdit(null);
      return;
    }
    next[imgIndex] = trimmed;
    const updates: Partial<Work> = { imagePieceTitles: next };
    if (next.length === 1 || imgIndex === 0) {
      updates.title = next[0] ?? '';
    }
    workStore.updateWork(pieceTitleEdit.workId, updates);
    toast.success(t('profile.worksManagePieceTitleToast'));
    setPieceTitleEdit(null);
  };

  // 작품 관리 뷰어 키보드 네비게이션
  useEffect(() => {
    if (worksViewerIndex === null) return;
    const total = worksManageFlatImages.length;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWorksViewerIndex(null);
      if (e.key === 'ArrowLeft') setWorksViewerIndex(i => i !== null && i > 0 ? i - 1 : i);
      if (e.key === 'ArrowRight') setWorksViewerIndex(i => i !== null && i < total - 1 ? i + 1 : i);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [worksViewerIndex, worksManageFlatImages.length]);

  // 강사 여부는 업로드 이력에서 자동 파생 (isInstructorUpload === true 인 작품이 1건이라도 있으면 강사)
  const instructorVisible = useMemo(
    () => storeWorks.some((w) => w.artistId === profileArtist.id && w.isInstructorUpload === true),
    [storeWorks, profileArtist.id],
  );

  const allowedProfileTabs = useMemo((): ProfileTabValue[] => {
    const tabs: ProfileTabValue[] = ['exhibition'];
    if (isOwnProfile) tabs.push('works', 'likes', 'saved', 'drafts');
    if (instructorVisible) tabs.push('student-works');
    return tabs;
  }, [isOwnProfile, instructorVisible]);

  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && allowedProfileTabs.includes(q as ProfileTabValue)) {
      setProfileTab(q as ProfileTabValue);
    }
  }, [searchParams, allowedProfileTabs]);

  // 발행 직후 도착 시 검수 공개 안내 배너 (dismissible)
  const [publishedBannerDismissed, setPublishedBannerDismissed] = useState(false);
  const publishedFlag = searchParams.get('published');
  const publishedWorkId = searchParams.get('workId');
  const showPublishedBanner =
    isOwnProfile && !publishedBannerDismissed && publishedFlag === 'pending' && !!publishedWorkId;

  useEffect(() => {
    setProfileTab((prev) => (allowedProfileTabs.includes(prev) ? prev : 'exhibition'));
  }, [allowedProfileTabs]);

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

  if (isProfileNotFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">{t('profile.notFound')}</h1>
          <Button variant="outline" onClick={() => navigate('/')}>{t('error.goHome')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
            onClick={closeProfileEdit}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* 헤더 — sticky so close button is always reachable on mobile */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-6 py-5 bg-white rounded-t-2xl shrink-0">
              <h2 className="text-lg font-semibold text-foreground">{t('profile.edit')}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeProfileEdit}
                className="h-10 w-10 rounded-full"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* 폼 */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* 사용자 이름 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-2">
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
                      className="w-full px-4 py-3.5 border border-input rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                      {profileNickname.length}/20
                    </span>
                  </div>
                </div>

                {/* 한 줄 프로필 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-2">
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
                      className="w-full px-4 py-3.5 border border-input rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      maxLength={20}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                      {profileHeadline.length}/20
                    </span>
                  </div>
                </div>

                {/* 소개 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-2">
                    {t('profile.formBio')}
                  </label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder={t('profile.formBioPh')}
                    rows={5}
                    className="w-full px-4 py-3.5 border border-input rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none leading-relaxed"
                  />
                </div>

                {/* 국가 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-2">
                    {t('profile.formCountry')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <select
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 border border-input rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none bg-white cursor-pointer"
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

                {/* 관심 화풍 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-2">
                    {t('profile.formInterests')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['painting', 'drawing', 'digitalArt', 'watercolor', 'oil', 'acrylic', 'printmaking', 'sculpture', 'photo', 'illustration', 'calligraphy', 'ceramics', 'craft', 'textile', 'other'].map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setProfileInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          profileInterests.includes(id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground lg:hover:border-foreground/40'
                        }`}
                      >
                        {t(`onboarding.tag.${id}` as any)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 외부 링크 (SNS·라우드소싱 연동) — 플랫폼 고정 행 방식 */}
                <div>
                  <label className="block text-[15px] font-semibold text-foreground mb-1">
                    {t('profile.formLinks')}
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('profile.formLinksHint')}
                  </p>
                  <ExternalLinksEditor links={profileLinks} onChange={setProfileLinks} />
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 shrink-0">
              <Button
                variant="ghost"
                onClick={closeProfileEdit}
                className="px-6 py-3 text-[15px]"
              >
                {t('loginPrompt.cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (containsProfanity(profileNickname) || containsProfanity(profileHeadline) || containsProfanity(profileBio)) {
                    toast.error(t('profile.errProfanity'));
                    return;
                  }
                  profileStore.updateProfile({
                    name: profileNickname.trim() || displayName,
                    nickname: profileNickname.trim(),
                    headline: profileHeadline,
                    bio: profileBio,
                    location: profileLocation,
                    interests: profileInterests,
                    externalLinks: profileLinks.filter(l => l.url.trim()),
                  });
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
                    variant="outline"
                    size="icon"
                    onClick={() => setShowProfileImageModal(true)}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white border border-border shadow-sm"
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
              {viewProfile.headline && (
                <p className="mt-3 text-[15px] text-muted-foreground font-medium">
                  {viewProfile.headline}
                </p>
              )}

              {/* 지역 */}
              {viewProfile.location && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationDisplayLabel(viewProfile.location, t)}</span>
                </div>
              )}

              {/* 소개글 */}
              {viewProfile.bio ? (
                <p className="mt-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {viewProfile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-foreground leading-relaxed">
                  {profileArtist.bio || t('profile.bioPlaceholderEmpty')}
                </p>
              )}

              {/* 외부 링크 — 플랫폼 아이콘 버튼 */}
              {viewProfile.externalLinks && viewProfile.externalLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {viewProfile.externalLinks.map((link) => {
                    const href = resolveExternalLinkUrl(link);
                    if (!href) return null;
                    const u = href.toLowerCase();
                    if (u.startsWith('javascript:') || u.startsWith('data:')) return null;
                    const display = getExternalLinkPlatformDisplay(link.label);
                    if (!display) return null;
                    return (
                      <a
                        key={link.label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={display.name}
                        aria-label={`${display.name} 프로필 열기`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white lg:hover:border-foreground/40 lg:hover:bg-muted/50 transition-colors"
                      >
                        {display.icon}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* 팔로워/팔로잉 */}
              <div className="mt-4 flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => { setFollowModalTab('followers'); setShowFollowersModal(true); }}
                  className="flex items-center gap-1 lg:hover:underline underline-offset-2 transition-opacity lg:hover:opacity-80 cursor-pointer"
                >
                  <span className="font-semibold text-foreground">
                    {getDisplayFollowerCount(profileArtist).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">{t('profile.followModalFollowers')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setFollowModalTab('following'); setShowFollowersModal(true); }}
                  className="flex items-center gap-1 lg:hover:underline underline-offset-2 transition-opacity lg:hover:opacity-80 cursor-pointer"
                >
                  <span className="font-semibold text-foreground">{profileArtist.following?.toLocaleString() || '0'}</span>
                  <span className="text-muted-foreground">{t('profile.followModalFollowing')}</span>
                </button>
              </div>

              {/* 팔로우 버튼 (타인 프로필) */}
              {!isOwnProfile && (
                <div className="mt-4">
                  <Button
                    variant={follows.isFollowing(profileArtist.id) ? 'outline' : 'default'}
                    className="w-full text-sm py-3"
                    onClick={() => {
                      if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                      followStore.toggle(profileArtist.id);
                    }}
                  >
                    {follows.isFollowing(profileArtist.id) ? t('social.following') : t('social.follow')}
                  </Button>
                </div>
              )}

              {/* 프로필 편집 + 설정/로그아웃 (본인 프로필) */}
              {isOwnProfile && (
                <Button
                  onClick={() => {
                    setProfileNickname(displayName);
                    setProfileHeadline(savedProfile.headline);
                    setProfileBio(savedProfile.bio);
                    setProfileLocation(savedProfile.location);
                    setProfileLinks(savedProfile.externalLinks || []);
                    setProfileInterests(savedProfile.interests || []);
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
              <Tabs value={profileTab} onValueChange={(v) => setProfileTab(v as ProfileTabValue)} className="w-full">
                <TabsList className="h-auto p-0 bg-transparent border-b border-border/40 rounded-none w-full justify-start gap-0 overflow-x-auto scrollbar-hide">
                  <TabsTrigger
                    value="exhibition"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                  >
                    {t('profile.exhibition')}
                  </TabsTrigger>
                  {isOwnProfile && (
                    <TabsTrigger
                      value="works"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                    >
                      {t('profile.tabWorkManage')}
                    </TabsTrigger>
                  )}
                  {instructorVisible && (
                    <TabsTrigger
                      value="student-works"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                    >
                      {t('profile.studentWorks')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="likes"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                    >
                      {t('profile.tabLikes')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="saved"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                    >
                      {t('profile.tabSaves')}
                    </TabsTrigger>
                  )}
                  {isOwnProfile && (
                    <TabsTrigger
                      value="drafts"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground pb-3 text-sm px-4 text-muted-foreground"
                    >
                      {t('profile.tabDrafts')}
                      {drafts.length > 0 ? ` (${drafts.length})` : ''}
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* ===== 전시 탭 ===== */}
                <TabsContent value="exhibition" className="mt-6">
                  {showPublishedBanner && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-[12px] font-bold" aria-hidden>✓</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900">
                          {t('profile.publishedBannerTitle')}
                        </p>
                        <p className="text-[13px] text-amber-800 mt-1 leading-relaxed">
                          {t('profile.publishedBannerDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPublishedBannerDismissed(true)}
                        aria-label={t('profile.publishedBannerDismiss')}
                        className="shrink-0 p-1 -m-1 rounded text-amber-700 lg:hover:text-amber-900 lg:hover:bg-amber-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    {(['all', 'solo', 'group'] as const).map((f) => {
                      const label =
                        f === 'all' ? t('profile.filterAll') : f === 'solo' ? t('profile.filterSolo') : t('profile.filterGroup');
                      const count = f === 'all' ? artistWorks.length : f === 'solo' ? soloCount : groupCount;
                      return (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setExhibitionFilter(f)}
                          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border ${
                            exhibitionFilter === f
                              ? 'border-foreground bg-foreground/5 text-foreground'
                              : 'border-border text-muted-foreground lg:hover:border-foreground/50'
                          }`}
                        >
                          {label} {count}
                        </button>
                      );
                    })}
                    {isOwnProfile && (
                      <label className="ml-auto flex min-h-[36px] items-center gap-2 rounded-full border border-border/60 px-3.5 py-1.5 text-[13px] text-foreground cursor-pointer select-none lg:hover:border-foreground/50">
                        <input
                          type="checkbox"
                          checked={onlyMyUploads}
                          onChange={(e) => setOnlyMyUploads(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        {t('profile.filterOnlyMine')}
                      </label>
                    )}
                  </div>

                  {/* 작품 그리드 */}
                  {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {filteredWorks.map((work) => {
                        const isMyUpload = isOwnProfile && work.artistId === profileArtist.id;
                        return (
                        <div
                          key={work.id}
                          className="cursor-pointer relative"
                          onClick={() => {
                            if (isMyUpload && work.feedReviewStatus === 'rejected') {
                              setRejectedModalWork(work);
                              return;
                            }
                            setDetailWorkId(work.id);
                          }}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <ImageWithFallback
                              src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                              alt={displayExhibitionTitle(work, t('work.untitled'))}
                              className="w-full h-full object-contain object-center"
                            />

                            {/* 옵션 메뉴 (본인이 업로드한 작품만 수정/삭제 가능) */}
                            {isMyUpload && (
                              <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 p-0 text-white shadow-none hover:bg-black/75 hover:text-white"
                                      aria-label={t('profile.workMenuA11y')}
                                    >
                                      <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem
                                      className="text-[13px]"
                                      onSelect={(e) => e.preventDefault()}
                                      onClick={() => navigate(`/upload?edit=${work.id}`)}
                                    >
                                      <Tag className="h-4 w-4 mr-2" />
                                      {t('profile.editWork')}
                                    </DropdownMenuItem>
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
                                      className="text-destructive focus:text-destructive text-[13px]"
                                      onSelect={(e) => e.preventDefault()}
                                      onClick={async () => {
                                        const ok = await openConfirm({
                                          title: t('profile.deleteWorkConfirm').replace('{title}', displayExhibitionTitle(work, t('work.untitled'))),
                                          destructive: true,
                                          confirmLabel: t('profile.delete'),
                                        });
                                        if (ok) workStore.removeWork(work.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('profile.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}

                            {/* 이미지 개수 배지 */}
                            {getImageCount(work.image) > 1 && (
                              <div className="absolute left-2 top-2 z-10">
                                <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                  <ImageIcon className="h-3 w-3" />
                                  {getImageCount(work.image)}
                                </div>
                              </div>
                            )}

                            {/* 하단 배지 (비공개 · 검수 상태) */}
                            {(work.isHidden || (isMyUpload && (work.feedReviewStatus === 'pending' || work.feedReviewStatus === 'rejected'))) && (
                              <div className="absolute left-2 bottom-2 z-10 flex flex-col gap-1">
                                {work.isHidden && (
                                  <div className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm w-fit">
                                    <EyeOff className="h-3 w-3" />
                                    {t('profile.workPrivateBadge')}
                                  </div>
                                )}
                                {isMyUpload && work.feedReviewStatus === 'pending' && (
                                  <span
                                    className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted/95 text-foreground border border-border backdrop-blur-sm w-fit"
                                    title={t('review.badgePendingHint')}
                                    aria-label={`${t('review.badgePending')} · ${t('review.badgePendingHint')}`}
                                  >
                                    {t('review.badgePending')}
                                  </span>
                                )}
                                {isMyUpload && work.feedReviewStatus === 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setRejectedModalWork(work); }}
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-500/95 text-white backdrop-blur-sm w-fit lg:hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-colors"
                                    title={t('review.badgeRejectedHint')}
                                    aria-label={`${t('review.badgeRejected')} — ${t('review.badgeRejectedClickHint')}`}
                                  >
                                    {t('review.badgeRejected')}
                                    <span aria-hidden className="text-white/80">›</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 이미지 하단 정보 */}
                          <div className="pt-2">
                            <p className="text-sm font-medium text-foreground truncate">{displayExhibitionTitle(work, t('work.untitled'))}</p>
                            {isGroupExhibition(work) && work.groupName && (
                              <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Users className="h-3 w-3 shrink-0" />
                                {work.groupName}
                              </p>
                            )}
                            {isOwnProfile && !isMyUpload && (() => {
                              const uploader = artists.find((a) => a.id === work.artistId);
                              return (
                                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground truncate">
                                  <UserIcon className="h-3 w-3 shrink-0" aria-hidden />
                                  <span className="truncate">
                                    {t('profile.uploaderLabel')} · {uploader?.name ?? t('work.unknownUploader')}
                                  </span>
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-[15px] text-muted-foreground mb-1">{t('profile.emptyExhibitions')}</p>
                      {isOwnProfile && (
                        <>
                          <p className="text-sm text-muted-foreground mb-5">{t('profile.emptyExhibitionsOwnHint')}</p>
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
                    <div className="rounded-xl border border-dashed border-border bg-muted/50 py-16 px-6 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">{t('profile.studentWorksEmpty')}</p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">{t('profile.studentWorksHint')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {studentWorksList.map((work) => {
                        const credit = firstStudentLabel(work, profileArtist.id);
                        return (
                          <div
                            key={work.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setDetailWorkId(work.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setDetailWorkId(work.id);
                              }
                            }}
                            className="group cursor-pointer text-left rounded-xl border border-border/40 overflow-hidden bg-white lg:hover:border-border transition-colors flex flex-col relative"
                          >
                            <div className="relative aspect-square bg-white w-full">
                              <ImageWithFallback
                                src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                                alt={displayProminentHeadline(work, t('work.untitled'))}
                                className="w-full h-full object-contain object-center"
                              />

                              {isOwnProfile && (
                                <div className="absolute right-2 top-2 z-20" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 p-0 text-white shadow-none hover:bg-black/75 hover:text-white"
                                        aria-label={t('profile.workMenuA11y')}
                                      >
                                        <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" sideOffset={4}>
                                      <DropdownMenuItem
                                        className="text-[13px]"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => navigate(`/upload?edit=${work.id}`)}
                                      >
                                        <Tag className="h-4 w-4 mr-2" />
                                        {t('profile.editWork')}
                                      </DropdownMenuItem>
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
                                        className="text-destructive focus:text-destructive text-[13px]"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={async () => {
                                          const ok = await openConfirm({
                                            title: t('profile.deleteWorkConfirm').replace(
                                              '{title}',
                                              displayProminentHeadline(work, t('work.untitled')),
                                            ),
                                            destructive: true,
                                            confirmLabel: t('profile.delete'),
                                          });
                                          if (ok) workStore.removeWork(work.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('profile.delete')}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}

                              {getImageCount(work.image) > 1 && (
                                <div className="absolute left-2 top-2 z-10">
                                  <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                    <ImageIcon className="h-3 w-3" />
                                    {getImageCount(work.image)}
                                  </div>
                                </div>
                              )}

                              {work.isHidden && (
                                <div className="absolute left-2 bottom-2 z-10">
                                  <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[11px] font-medium text-white">
                                    <EyeOff className="h-3 w-3" />
                                    {t('profile.workPrivateBadge')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 sm:p-4 w-full">
                              <p className="text-sm font-semibold text-foreground line-clamp-2">{displayProminentHeadline(work, t('work.untitled'))}</p>
                              {work.groupName && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* ===== 작품 관리 탭 — 개별 이미지(그림) 단위 ===== */}
                <TabsContent value="works" className="mt-6">
                  {worksManageFlatImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {worksManageFlatImages.map((fi, flatIdx) => {
                        const canEditPieceTitle = storeWorkIdSet.has(fi.work.id);
                        return (
                        <div
                          key={`${fi.work.id}-img-${fi.imgIndex}`}
                          className="group relative"
                        >
                          <div
                            className="relative aspect-square rounded-sm overflow-hidden bg-white cursor-pointer"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('[data-works-manage-menu]')) return;
                              setWorksViewerIndex(flatIdx);
                            }}
                          >
                            <ImageWithFallback
                              src={fi.imgSrc}
                              alt={fi.pieceTitle}
                              className="w-full h-full object-contain object-center"
                            />
                            {canEditPieceTitle && (
                              <div
                                className="absolute right-2 top-2 z-20"
                                data-works-manage-menu
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 p-0 text-white shadow-none hover:bg-black/75 hover:text-white"
                                      aria-label={t('profile.worksManageMenuAria')}
                                    >
                                      <MoreHorizontal className="h-4 w-4" strokeWidth={2.5} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem
                                      className="text-[13px]"
                                      onSelect={() =>
                                        setPieceTitleEdit({ workId: fi.work.id, imgIndex: fi.imgIndex })
                                      }
                                    >
                                      {t('profile.worksManageRenamePiece')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                            {fi.work.isHidden && (
                              <div className="absolute left-2 bottom-2 z-10">
                                <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[11px] text-white">
                                  <EyeOff className="h-3 w-3" />
                                  {t('profile.workPrivateBadge')}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="w-full text-left pt-2 cursor-pointer"
                            onClick={() => setWorksViewerIndex(flatIdx)}
                          >
                            <p className="text-sm font-medium text-foreground truncate">{fi.pieceTitle}</p>
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Folder className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-[15px] text-muted-foreground mb-1">{t('profile.emptyWorksManage')}</p>
                      <p className="text-sm text-muted-foreground mb-5">{t('profile.emptyWorksManageHint')}</p>
                      <Button variant="outline" onClick={() => navigate('/upload')} size="sm" className="text-[13px] gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        {t('profile.firstUploadCta')}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 좋아요 탭 (본인만) ===== */}
                <TabsContent value="likes" className="mt-6">
                  {likedWorks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {likedWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer"
                          onClick={() => setDetailWorkId(work.id)}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <ImageWithFallback
                              src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                              alt={displayProminentHeadline(work, t('work.untitled'))}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium text-foreground truncate">{displayProminentHeadline(work, t('work.untitled'))}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">{work.artist?.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <ThumbsUp className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-[15px] text-muted-foreground mb-1">{t('profile.emptyLikes')}</p>
                      <p className="text-sm text-muted-foreground mb-5">{t('profile.emptyLikesHint')}</p>
                      <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-[13px]">
                        {t('profile.browseWorks')}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 저장 탭 (본인만) ===== */}
                <TabsContent value="saved" className="mt-6">
                  {savedWorks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {savedWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group cursor-pointer"
                          onClick={() => setDetailWorkId(work.id)}
                        >
                          <div className="relative aspect-square rounded-sm overflow-hidden bg-white">
                            <ImageWithFallback
                              src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                              alt={displayProminentHeadline(work, t('work.untitled'))}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                          <div className="pt-2">
                            <p className="text-sm font-medium text-foreground truncate">{displayProminentHeadline(work, t('work.untitled'))}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">{work.artist?.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Folder className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-[15px] text-muted-foreground mb-1">{t('profile.emptySaves')}</p>
                      <p className="text-sm text-muted-foreground mb-5">{t('profile.emptySavesHint')}</p>
                      <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-[13px]">
                        {t('profile.browseWorks')}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* ===== 초안 탭 (본인만) ===== */}
                <TabsContent value="drafts" className="mt-6">
                  {drafts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                      {drafts.map((draft) => {
                        const thumbUrl = draft.contents.find(c => c.type === 'image' && c.url)?.url;
                        return (
                          <div
                            key={draft.id}
                            className="group cursor-pointer relative"
                            onClick={() => navigate(`/upload?draft=${draft.id}`)}
                          >
                            <div className="relative flex aspect-square items-center justify-center rounded-sm overflow-hidden bg-muted/30">
                              {thumbUrl ? (
                                <img src={thumbUrl} alt={draft.title} className="w-full h-full object-contain object-center" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Folder className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                              )}
                              <div className="absolute left-2 top-2 z-10">
                                <span className="rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
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
                                      className="text-destructive focus:text-destructive text-[13px]"
                                      onSelect={(e) => e.preventDefault()}
                                      onClick={async () => {
                                        const ok = await openConfirm({ title: t('profile.deleteDraftConfirm'), destructive: true, confirmLabel: t('profile.delete') });
                                        if (ok) draftStore.deleteDraft(draft.id);
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
                              <p className="text-sm font-medium text-foreground truncate">
                                {draft.title || t('profile.draftNoTitle')}
                              </p>
                              <p className="text-[12px] text-muted-foreground mt-0.5">
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
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Folder className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-[15px] text-muted-foreground mb-1">{t('profile.emptyDrafts')}</p>
                      <p className="text-sm text-muted-foreground mb-5">{t('profile.emptyDraftsHint')}</p>
                      <Button variant="outline" onClick={() => navigate('/upload')} size="sm" className="text-[13px] gap-1.5">
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
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setFollowModalTab('followers')}
                  className={`text-[15px] font-semibold pb-1 rounded-none px-1 transition-colors ${
                    followModalTab === 'followers' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t('profile.followModalFollowers')}{' '}
                  {getDisplayFollowerCount(profileArtist).toLocaleString()}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setFollowModalTab('following')}
                  className={`text-[15px] font-semibold pb-1 rounded-none px-1 transition-colors ${
                    followModalTab === 'following' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t('profile.followModalFollowing')} {profileArtist.following?.toLocaleString() || '0'}
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowFollowersModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full lg:hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {(() => {
                const sampleList = followModalTab === 'followers'
                  ? artists.filter(a => a.id !== profileArtist.id).slice(0, 5)
                  : artists.filter(a => a.id !== profileArtist.id).slice(2, 6);
                return sampleList.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">
                    {followModalTab === 'followers'
                      ? t('profile.followListEmptyFollowers')
                      : t('profile.followListEmptyFollowing')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sampleList.map((artist) => (
                      <div key={artist.id} className="flex items-center gap-3 p-3 rounded-xl lg:hover:bg-muted/50 transition-colors">
                        <Avatar
                          className="h-11 w-11 cursor-pointer"
                          onClick={() => { setShowFollowersModal(false); navigate(`/profile/${artist.id}`); }}
                        >
                          <AvatarImage src={artist.avatar} alt={artist.name} />
                          <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Button
                            variant="ghost"
                            onClick={() => { setShowFollowersModal(false); navigate(`/profile/${artist.id}`); }}
                            className="h-auto p-0 text-sm font-semibold text-foreground lg:hover:bg-transparent lg:hover:underline truncate block text-left"
                          >
                            {artist.name}
                          </Button>
                          {artist.bio && <p className="text-xs text-muted-foreground truncate">{artist.bio}</p>}
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


      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="follow" />

      {detailWorkId && (
        <WorkDetailModal
          workId={detailWorkId}
          onClose={() => setDetailWorkId(null)}
          onNavigate={(newId) => setDetailWorkId(newId)}
          allWorks={profileAllWorksForModal}
        />
      )}

      {/* 작품 관리 전용 이미지 뷰어 */}
      {worksViewerIndex !== null && worksManageFlatImages.length > 0 && (() => {
        const fi = worksManageFlatImages[worksViewerIndex];
        if (!fi) return null;
        const hasPrev = worksViewerIndex > 0;
        const hasNext = worksViewerIndex < worksManageFlatImages.length - 1;
        const viewerArtist = (() => {
          const ias = fi.work.imageArtists;
          if (ias && ias[fi.imgIndex]?.type === 'member' && ias[fi.imgIndex].memberId) {
            const found = artists.find(a => a.id === ias[fi.imgIndex].memberId);
            if (found) return found;
          }
          return fi.work.artist;
        })();
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={() => setWorksViewerIndex(null)}
          >
            {/* 배경 딤 */}
            <div className="absolute inset-0 bg-black/80" />

            {/* 모달 컨테이너 — WorkDetailModal과 동일 폭 */}
            <div
              className="relative z-10 w-full max-w-[1280px] mx-auto h-[100dvh] sm:h-[96vh] sm:my-[2vh] flex flex-col bg-zinc-900 sm:rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 상단 바: 닫기 + 공유 */}
              <div className="flex items-center justify-end gap-2 px-4 py-3">
                <button
                  type="button"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white lg:hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/exhibitions/${fi.work.id}?from=work`;
                    navigator.clipboard.writeText(url).then(() => toast(t('workDetail.toastLinkCopied')));
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white lg:hover:bg-white/20"
                  onClick={() => setWorksViewerIndex(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 이미지 영역 */}
              <div className="relative flex-1 flex items-center justify-center px-16">
                {/* 이전 버튼 */}
                {hasPrev && (
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-11 w-11 rounded-full bg-white/10 text-white lg:hover:bg-white/20"
                    onClick={() => setWorksViewerIndex(worksViewerIndex - 1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* 다음 버튼 */}
                {hasNext && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-11 w-11 rounded-full bg-white/10 text-white lg:hover:bg-white/20"
                    onClick={() => setWorksViewerIndex(worksViewerIndex + 1)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                <img
                  src={fi.imgSrc}
                  alt={fi.pieceTitle}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>

              {/* 하단: 아바타+이름 · 제목 */}
              <div className="px-6 pb-5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={viewerArtist.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="text-white text-sm font-medium">{viewerArtist.name}</span>
                  </div>
                  <p className="text-white text-[15px] font-semibold">{fi.pieceTitle}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <Dialog
        open={pieceTitleEdit !== null}
        onOpenChange={(open) => {
          if (!open) setPieceTitleEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('profile.worksManagePieceTitleDialogTitle')}</DialogTitle>
            <DialogDescription>{t('profile.worksManagePieceTitleDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label htmlFor="profile-piece-title-input" className="text-sm font-medium text-foreground">
              {t('upload.pieceTitleLabel')}{' '}
              <span className="font-normal text-muted-foreground">{t('upload.labelOptional')}</span>
            </label>
            <Input
              id="profile-piece-title-input"
              value={pieceTitleDraft}
              onChange={(e) => setPieceTitleDraft(e.target.value.slice(0, 120))}
              maxLength={120}
              placeholder={t('work.untitled')}
              className="min-h-[44px] text-[15px]"
              autoComplete="off"
            />
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="min-h-[44px] w-full sm:w-auto" onClick={() => setPieceTitleEdit(null)}>
              {t('profile.worksManagePieceTitleCancel')}
            </Button>
            <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={savePieceTitleFromModal}>
              {t('profile.worksManagePieceTitleSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rejectedModalWork && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setRejectedModalWork(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-foreground mb-1">
              {t('review.rejectedModalTitle')}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('review.rejectedModalDesc')}
            </p>
            {rejectedModalWork.rejectionReason && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
                {t(REJECTION_REASON_LABEL_KEY[rejectedModalWork.rejectionReason])}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                onClick={() => setRejectedModalWork(null)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border"
              >
                {t('review.rejectedModalClose')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const id = rejectedModalWork.id;
                  setRejectedModalWork(null);
                  navigate(`/upload?edit=${id}`);
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white lg:hover:bg-primary/90"
              >
                {t('review.rejectedModalEdit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
