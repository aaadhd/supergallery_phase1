import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Image as ImageIcon, Plus, X, Info, Search, Mail, GripVertical, Eye, ArrowLeft, Grid2X2, Grid3X3, LayoutList } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore } from '../store';
import type { Work } from '../data';
import type { Draft } from '../store';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { CoachMark } from '../components/CoachMark';
import { shouldBlockCameraPhoto } from '../utils/cameraExifBlock';
import {
  collectGroupNameSuggestions,
  getLastUsedGroupName,
  resolveCanonicalGroupName,
  setLastUsedGroupName,
} from '../utils/groupNameRegistry';
import { pointsOnWorkPublished } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

type LayoutMode = 'list' | 'grid-2' | 'grid-3';

const UPLOAD_CATEGORIES: { value: string; labelKey: MessageKey }[] = [
  { value: '미술', labelKey: 'upload.catArt' },
  { value: '패션', labelKey: 'upload.catFashion' },
  { value: '공예', labelKey: 'upload.catCraft' },
  { value: '제품 디자인', labelKey: 'upload.catProduct' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();

  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };

  // --- 레이아웃/모드 ---
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [reorderMode, setReorderMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // --- 콘텐츠 (이미지별 작가: 1이미지 = 1작가) ---
  const [contents, setContents] = useState<
    Array<{
      id: string;
      type: 'image';
      url?: string;
      title?: string;
      artist?: { id: string; name: string; avatar: string };
      // 비회원 작가 정보
      nonMemberArtist?: { displayName: string; phoneNumber: string };
      artistType?: 'member' | 'non-member' | 'self';
    }>
  >([]);

  // --- 캔버스 설정 ---
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [contentSpacing, setContentSpacing] = useState(16);

  // --- 세부 정보 ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailTags, setDetailTags] = useState<string[]>([]);
  const [detailTagInput, setDetailTagInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupSuggestOpen, setGroupSuggestOpen] = useState(false);
  const [workTick, setWorkTick] = useState(0);
  const [isOriginalWork, setIsOriginalWork] = useState(false);

  // --- 강사 대리 업로드 ---
  const [isInstructorUpload, setIsInstructorUpload] = useState(false);
  const [taggedEmails, setTaggedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  // --- 개인전시 탭 추가 노출 (강사 업로드 시) ---
  const [showInSoloTab, setShowInSoloTab] = useState(true);

  // --- 이벤트 연결 ---
  const linkedEventId = searchParams.get('event');
  const linkedEventTitle = searchParams.get('eventTitle') ? decodeURIComponent(searchParams.get('eventTitle')!) : null;

  // --- 이미지 선택 상태 ---
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return workStore.subscribe(() => setWorkTick((x) => x + 1));
  }, []);

  useEffect(() => {
    if (!isInstructorUpload) return;
    if (groupName.trim()) return;
    const last = getLastUsedGroupName();
    if (last) setGroupName(last);
  }, [isInstructorUpload]);

  const groupSuggestions = useMemo(() => {
    const names = workStore.getWorks().map((w) => w.groupName).filter(Boolean) as string[];
    return collectGroupNameSuggestions(groupName, names);
  }, [groupName, workTick]);

  // --- 초안 복원 ---
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (!draftId) return;
    const draft = draftStore.getDraft(draftId);
    if (!draft) return;
    setTitle(draft.title || '');
    setDetailTags(draft.tags || []);
    setSelectedCategories(draft.categories || []);
    const restored = draft.contents.map((c) => ({
      id: c.id,
      type: 'image' as const,
      url: c.url,
      title: c.title,
      artist: c.artist,
    }));
    setContents(restored);
    toast.success(t('upload.toastDraftLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- 파일 핸들러 -----

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxAdd = 20 - contents.length;
    if (maxAdd <= 0) {
      toast.error(t('upload.errMaxImages'));
      e.target.value = '';
      return;
    }
    const incoming: typeof contents = [];
    for (let i = 0; i < files.length && incoming.length < maxAdd; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(tn('upload.errFileTooBig', { name: file.name }));
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error(tn('upload.errFileType', { name: file.name }));
        continue;
      }
      try {
        if (await shouldBlockCameraPhoto(file)) {
          toast.error(t('upload.cameraBlocked'));
          continue;
        }
        const { convertImageFileToWebpDataUrlIfPossible } = await import('../utils/imageToWebp');
        const url = await convertImageFileToWebpDataUrlIfPossible(file);
        incoming.push({
          id: `${file.name}-${Date.now()}-${i}`,
          type: 'image',
          url,
        });
      } catch {
        toast.error(tn('upload.errFileRead', { name: file.name }));
      }
    }
    if (incoming.length) setContents((prev) => [...prev, ...incoming]);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    // 가상 input 이벤트로 위임
    const dt = new DataTransfer();
    for (let i = 0; i < files.length; i++) dt.items.add(files[i]);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // ----- 태그 핸들러 -----

  const handleAddDetailTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && detailTagInput.trim()) {
      e.preventDefault();
      if (!detailTags.includes(detailTagInput.trim())) {
        setDetailTags([...detailTags, detailTagInput.trim()]);
      }
      setDetailTagInput('');
    }
  };

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(t('upload.errEmailInvalid'));
        return;
      }
      if (taggedEmails.includes(email)) {
        toast.error(t('upload.errEmailDuplicate'));
        return;
      }
      setTaggedEmails([...taggedEmails, email]);
      setEmailInput('');
    }
  };

  // ----- 발행 -----

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error(t('upload.errTitleRequired'));
      return;
    }
    const imageContents = contents.filter((c) => c.type === 'image' && c.url);
    if (imageContents.length === 0) {
      toast.error(t('upload.errMinOneImage'));
      return;
    }
    if (!isOriginalWork) {
      toast.error(
        isInstructorUpload
          ? t('upload.errCheckStudentConsent')
          : t('upload.errCheckOriginal')
      );
      return;
    }

    // 강사 업로드 시 추가 검증
    if (isInstructorUpload) {
      if (!groupName.trim()) {
        toast.error(t('upload.errGroupNameRequired'));
        return;
      }
      const missingArtist = imageContents.some(
        (c) => !c.artist && !c.nonMemberArtist && c.artistType !== 'self'
      );
      if (missingArtist) {
        toast.error(t('upload.errArtistPerImage'));
        return;
      }
      // 비회원 작가 정보 완전성 체크
      const incompleteNonMember = imageContents.some(
        (c) => c.artistType === 'non-member' && (!c.nonMemberArtist?.displayName || !c.nonMemberArtist?.phoneNumber)
      );
      if (incompleteNonMember) {
        toast.error(t('upload.errNonMemberIncomplete'));
        return;
      }
    }

    const currentUser = artists[0];
    const urls = imageContents.map((c) => c.url!);

    const categoryMap: Record<string, Work['category']> = {
      '미술': 'art',
      '패션': 'fashion',
      '공예': 'craft',
      '제품 디자인': 'product',
    };

    // 전시 유형 결정
    const rawGroup = groupName.trim();
    const resolvedGroup = rawGroup ? resolveCanonicalGroupName(rawGroup) : undefined;
    const primaryExhibitionType = isInstructorUpload && resolvedGroup ? 'group' : 'solo';

    // 이미지별 작가 정보 구성
    const imageArtists = imageContents.map((c) => {
      if (c.artistType === 'non-member' && c.nonMemberArtist) {
        return { type: 'non-member' as const, displayName: c.nonMemberArtist.displayName, phoneNumber: c.nonMemberArtist.phoneNumber };
      }
      if (c.artist) {
        return { type: 'member' as const, memberId: c.artist.id, memberName: c.artist.name, memberAvatar: c.artist.avatar };
      }
      return { type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar };
    });

    const uploadedAt = new Date().toISOString().slice(0, 10);
    const newWork: Work = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      image: urls.length === 1 ? urls[0] : urls,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      comments: 0,
      description: '',
      tags: detailTags,
      category: categoryMap[selectedCategories[0]] || 'art',
      groupName: resolvedGroup,
      isInstructorUpload: isInstructorUpload || undefined,
      primaryExhibitionType,
      showInSoloTab: primaryExhibitionType === 'group' ? showInSoloTab : undefined,
      imageArtists,
      feedReviewStatus: 'pending',
      uploadedAt,
    };

    workStore.addWork(newWork);
    if (resolvedGroup) setLastUsedGroupName(resolvedGroup);
    pointsOnWorkPublished(newWork);
    setShowDetailsModal(false);

    if (isInstructorUpload && taggedEmails.length > 0) {
      toast.success(tn('upload.toastInviteSent', { n: String(taggedEmails.length) }));
    } else {
      toast.success(t('upload.toastPublished'));
    }

    setTimeout(() => navigate('/profile'), 600);
  };

  // ----- 초안 저장 -----

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error(t('upload.errTitleRequired'));
      return;
    }

    const draft: Draft = {
      id: generateRandomId(),
      title: title.trim(),
      contents: contents.map((c) => ({
        id: c.id,
        type: 'image' as const,
        url: c.url,
        title: c.title,
        artist: c.artist,
      })),
      tags: detailTags,
      categories: selectedCategories,
      savedAt: new Date().toISOString(),
    };

    draftStore.saveDraft(draft);
    toast.success(t('upload.toastDraftSaved'));
    navigate('/profile');
  };

  // ----- 재정렬 핸들러 -----

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setContents((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  // ----- 렌더링 -----

  const confirmLabel = useMemo(
    () =>
      isInstructorUpload ? t('upload.confirmStudent') : t('upload.confirmOriginal'),
    [isInstructorUpload, t],
  );

  // ----- 미리보기 모드 -----
  if (previewMode) {
    const gridClass = layoutMode === 'grid-3' ? 'grid grid-cols-3 gap-2' : layoutMode === 'grid-2' ? 'grid grid-cols-2 gap-2' : 'flex flex-col';
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-[#F0F0F0]">
          <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t('upload.previewBack')}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Eye className="h-4 w-4" /> {t('upload.previewTitle')}
          </span>
          <button
            onClick={() => {
              setPreviewMode(false);
              setShowDetailsModal(true);
            }}
            className="px-4 py-2 bg-[#18181B] text-white text-sm rounded-lg hover:bg-black transition-colors"
          >
            {t('upload.publish')}
          </button>
        </div>
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
          <div className={gridClass} style={layoutMode === 'list' ? { gap: `${contentSpacing}px` } : undefined}>
            {contents.filter(c => c.url).map((c, i) => (
              <div key={c.id} className="overflow-hidden rounded-lg">
                <ImageWithFallback
                  src={c.url}
                  alt={c.title || tn('upload.imageFallback', { n: String(i + 1) })}
                  className="w-full h-auto object-cover block"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----- 재정렬 모드 -----
  if (reorderMode) {
    return (
      <div className="min-h-screen bg-white">
        <Toaster position="top-center" richColors />
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-[#F0F0F0]">
          <span className="text-base font-semibold text-[#18181B]">{t('upload.reorderMode')}</span>
          <button
            onClick={() => {
              setReorderMode(false);
              toast.success(t('upload.toastOrderSaved'));
            }}
            className="px-5 py-2 bg-[#18181B] text-white text-sm rounded-lg hover:bg-black transition-colors"
          >
            {t('upload.reorderDone')}
          </button>
        </div>
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
          {contents.map((c, i) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-3 p-3 border rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                dragIndex === i ? 'border-[#6366F1] bg-indigo-50 shadow-sm' : 'border-[#F0F0F0] bg-white'
              }`}
            >
              <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-400 w-6">{i + 1}</span>
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {c.url && <ImageWithFallback src={c.url} alt={c.title || ''} className="h-full w-full object-cover" />}
              </div>
              <span className="text-sm text-[#18181B] truncate flex-1">
                {c.title || tn('upload.imageFallback', { n: String(i + 1) })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <Toaster position="top-center" richColors />
      <CoachMark id="upload" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* ===== 세부 정보 설정 모달 ===== */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-8 py-5">
              <h2 className="text-xl font-semibold text-[#18181B]">{t('upload.detailsModalTitle')}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F4F4F5] transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* 강사 대리 업로드 토글 */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div>
                  <p className="text-base font-medium text-indigo-900">
                    {t('upload.instructorToggleTitle')}
                  </p>
                  <p className="text-sm text-indigo-600 mt-0.5">{t('upload.instructorToggleDesc')}</p>
                </div>
                <button
                  onClick={() => {
                    setIsInstructorUpload(!isInstructorUpload);
                    setIsOriginalWork(false);
                  }}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    isInstructorUpload ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      isInstructorUpload ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 수강생 이메일 태그 (강사 모드) */}
              {isInstructorUpload && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <label className="block text-base font-medium text-[#18181B]">
                    <Mail className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                    {t('upload.studentEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleAddEmail}
                    placeholder={t('upload.studentEmailPlaceholder')}
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  {taggedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {taggedEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                        >
                          {email}
                          <button
                            onClick={() =>
                              setTaggedEmails(taggedEmails.filter((e) => e !== email))
                            }
                            className="hover:text-indigo-950"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">{t('upload.studentEmailHint')}</p>
                </div>
              )}

              {/* 제목 */}
              <div>
                <label className="block text-base font-medium text-[#18181B] mb-2">
                  {t('upload.fieldTitle')} <span className="text-cyan-500">{t('upload.labelRequired')}</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('upload.titlePlaceholder')}
                  className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-base font-medium text-[#18181B] mb-2">
                  {t('upload.categoryLabel')}{' '}
                  <span className="text-cyan-500">{t('upload.labelRequired')}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {UPLOAD_CATEGORIES.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      onClick={() => {
                        if (selectedCategories.includes(value)) {
                          setSelectedCategories(selectedCategories.filter((c) => c !== value));
                        } else {
                          setSelectedCategories([...selectedCategories, value]);
                        }
                      }}
                      className={`px-3 py-3 text-base rounded-lg border transition-colors min-h-[44px] ${
                        selectedCategories.includes(value)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-[#D1D5DB] hover:border-gray-400'
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-base font-medium text-[#18181B] mb-2">
                  {t('upload.tagsLabel')}
                </label>
                <input
                  type="text"
                  value={detailTagInput}
                  onChange={(e) => setDetailTagInput(e.target.value)}
                  onKeyDown={handleAddDetailTag}
                  placeholder={t('upload.tagsPlaceholder')}
                  className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                {detailTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {detailTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#F4F4F5] text-gray-700 text-sm rounded-full flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() =>
                            setDetailTags(detailTags.filter((_, i) => i !== index))
                          }
                          className="hover:text-[#18181B]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 그룹명 (자동완성·정규화) */}
              <div className="relative">
                <label className="block text-base font-medium text-[#18181B] mb-2">
                  {t('upload.groupLabel')}{' '}
                  {isInstructorUpload ? (
                    <span className="text-cyan-500">{t('upload.labelRequired')}</span>
                  ) : (
                    <span className="text-gray-500 font-normal text-sm">{t('upload.labelOptional')}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setGroupSuggestOpen(true);
                  }}
                  onFocus={() => setGroupSuggestOpen(true)}
                  onBlur={() => window.setTimeout(() => setGroupSuggestOpen(false), 180)}
                  placeholder={t('upload.groupPlaceholder')}
                  autoComplete="off"
                  className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent ${
                    isInstructorUpload && !groupName.trim() ? 'border-red-300' : 'border-[#D1D5DB]'
                  }`}
                />
                {groupSuggestOpen && groupSuggestions.length > 0 && (
                  <ul
                    className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-[#E5E7EB] bg-white shadow-lg py-1 text-sm"
                    role="listbox"
                  >
                    {groupSuggestions.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-[#F4F4F5] text-[#18181B]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setGroupName(name);
                            setGroupSuggestOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {isInstructorUpload && !groupName.trim() && (
                  <p className="text-sm text-red-500 mt-1">{t('upload.groupRequiredWarn')}</p>
                )}
                <p className="text-xs text-[#A1A1AA] mt-1.5">{t('upload.groupHint')}</p>
              </div>

              {/* 이벤트 연결 표시 */}
              {linkedEventId && linkedEventTitle && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-lg font-bold">E</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-green-900">{t('upload.eventWorkTitle')}</p>
                    <p className="text-sm text-green-600">{linkedEventTitle}</p>
                  </div>
                </div>
              )}

              {/* 개인전시 탭에도 노출 (강사 업로드 시) */}
              {isInstructorUpload && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div>
                    <p className="text-base font-medium text-indigo-900">{t('upload.soloTabTitle')}</p>
                    <p className="text-sm text-indigo-600 mt-0.5">{t('upload.soloTabDesc')}</p>
                  </div>
                  <button
                    onClick={() => setShowInSoloTab(!showInSoloTab)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      showInSoloTab ? 'bg-indigo-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        showInSoloTab ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* 창작물 확인 체크박스 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOriginalWork}
                    onChange={(e) => setIsOriginalWork(e.target.checked)}
                    className="mt-1 w-5 h-5 text-cyan-500 border-[#D1D5DB] rounded focus:ring-cyan-500"
                  />
                  <div>
                    <span className="block text-base font-medium text-[#18181B]">
                      {confirmLabel} <span className="text-cyan-500">{t('upload.labelRequired')}</span>
                    </span>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {isInstructorUpload ? t('upload.disclaimerStudent') : t('upload.disclaimerOriginal')}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-8 py-5">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 text-base text-gray-700 hover:bg-[#F4F4F5] rounded-lg transition-colors min-h-[44px]"
              >
                {t('upload.close')}
              </button>
              <button
                onClick={handlePublish}
                className="px-8 py-3 bg-cyan-500 text-white text-base font-medium rounded-lg hover:bg-cyan-600 transition-colors min-h-[44px]"
              >
                {t('upload.publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 좌측: 업로드 & 프리뷰 영역 ===== */}
      <div
        className={`relative flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 lg:p-12 ${
          !contents.length
            ? 'items-center justify-center'
            : 'items-center justify-start pt-6 sm:pt-12'
        }`}
        style={contents.length > 0 ? { backgroundColor } : undefined}
      >
        {!contents.length ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-white p-10 sm:p-12 text-center transition-all hover:border-cyan-400 hover:bg-cyan-50/30"
          >
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-cyan-100 flex items-center justify-center">
              <ImageIcon className="h-7 w-7 text-cyan-500" />
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700">{t('upload.dropzoneTitle')}</p>
            <p className="text-base text-gray-500">{t('upload.dropzoneFormats')}</p>
          </div>
        ) : (
          <div className="relative w-full pb-20 z-10">
            <div
              className={`relative z-10 ${
                layoutMode === 'grid-2' ? 'grid grid-cols-2' : layoutMode === 'grid-3' ? 'grid grid-cols-3' : 'flex flex-col'
              }`}
              style={{ gap: `${contentSpacing}px` }}
            >
              {contents.map((content, index) => (
                <div key={content.id} className="relative">
                  <div
                    onClick={() => setSelectedContentId(content.id)}
                    className={`relative w-full cursor-pointer transition-all overflow-hidden rounded-lg ${
                      selectedContentId === content.id
                        ? 'ring-4 ring-cyan-400'
                        : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={content.url}
                      alt={content.title || tn('upload.imageFallback', { n: String(index + 1) })}
                      className="w-full h-auto object-cover block"
                    />
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContents(contents.filter((c) => c.id !== content.id));
                        if (selectedContentId === content.id) {
                          setSelectedContentId(null);
                        }
                      }}
                      className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 z-10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 이미지 추가 버튼 */}
              {contents.length < 20 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#D1D5DB] rounded-2xl text-base text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-white/50 backdrop-blur-sm min-h-[44px]"
                >
                  <Plus className="h-5 w-5 inline-block mr-1 -mt-0.5" />
                  {tn('upload.addImageProgress', { n: String(contents.length) })}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== 우측: 설정 사이드바 ===== */}
      <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-[#E5E7EB] p-4 sm:p-6 overflow-y-auto flex flex-col shrink-0 max-h-[40vh] md:max-h-none">
        {/* 이미지 추가 & 레이아웃 */}
        <div className="mb-6 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-[#E5E7EB] rounded-xl hover:border-[#6366F1] transition-colors min-h-[44px]"
          >
            <ImageIcon className="h-5 w-5 text-gray-700" />
            <span className="text-base font-medium text-gray-700">{t('upload.addImage')}</span>
          </button>
          <p className="text-[11px] text-[#A1A1AA] leading-snug">{t('upload.cameraHint')}</p>

          {contents.length > 0 && (
            <>
              {/* 레이아웃 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">{t('upload.layoutLabel')}</label>
                <div className="flex gap-1 p-1 bg-[#F4F4F5] rounded-lg">
                  {(
                    [
                      ['list', LayoutList, 'upload.layoutList'],
                      ['grid-2', Grid2X2, 'upload.layoutGrid2'],
                      ['grid-3', Grid3X3, 'upload.layoutGrid3'],
                    ] as const
                  ).map(([mode, Icon, labelKey]) => (
                    <button
                      key={mode}
                      onClick={() => setLayoutMode(mode as LayoutMode)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm transition-colors ${
                        layoutMode === mode ? 'bg-white text-[#18181B] shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 재정렬 & 미리보기 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReorderMode(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-gray-700 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                >
                  <GripVertical className="h-4 w-4" />
                  {t('upload.reorder')}
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-gray-700 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {t('upload.preview')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 선택된 이미지 제목/작업자 편집 */}
        {selectedContentId &&
          (() => {
            const selectedIndex = contents.findIndex(
              (c) => c.id === selectedContentId
            );
            const selectedContent = contents[selectedIndex];
            if (!selectedContent) return null;

            return (
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-base font-semibold text-[#18181B] mb-2">
                    {tn('upload.slideTitle', { n: String(selectedIndex + 1) })}{' '}
                    <span className="text-gray-500 font-normal text-sm">
                      {t('upload.labelOptionalShort')}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={selectedContent.title || ''}
                    onChange={(e) => {
                      setContents(
                        contents.map((c) =>
                          c.id === selectedContentId
                            ? { ...c, title: e.target.value }
                            : c
                        )
                      );
                    }}
                    placeholder={t('upload.titleIfEmptyHint')}
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>

                {/* 작가 지정 (1이미지 = 1작가) */}
                <div>
                  <label className="block text-base font-semibold text-[#18181B] mb-2">
                    {t('upload.artistField')}{' '}
                    {isInstructorUpload ? (
                      <span className="text-cyan-500 font-normal text-sm">{t('upload.labelRequired')}</span>
                    ) : (
                      <span className="text-gray-500 font-normal text-sm">
                        {t('upload.labelOptionalShort')}
                      </span>
                    )}
                  </label>
                  <p className="text-sm text-gray-500 mb-2">{t('upload.artistDefaultNote')}</p>

                  {/* 회원/비회원 탭 */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'member', nonMemberArtist: undefined } : c))}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        (!selectedContent.artistType || selectedContent.artistType === 'member' || selectedContent.artistType === 'self')
                          ? 'bg-gray-900 text-white' : 'bg-[#F4F4F5] text-gray-600'
                      }`}
                    >
                      {t('upload.artistTabMember')}
                    </button>
                    <button
                      onClick={() => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', artist: undefined } : c))}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedContent.artistType === 'non-member'
                          ? 'bg-gray-900 text-white' : 'bg-[#F4F4F5] text-gray-600'
                      }`}
                    >
                      {t('upload.artistTabNonMember')}
                    </button>
                  </div>

                  {selectedContent.artistType === 'non-member' ? (
                    /* 비회원 작가 입력 */
                    <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('upload.nonMemberNameLabel')}
                        </label>
                        <input
                          type="text"
                          value={selectedContent.nonMemberArtist?.displayName || ''}
                          onChange={(e) => setContents(contents.map(c =>
                            c.id === selectedContentId
                              ? { ...c, nonMemberArtist: { ...c.nonMemberArtist, displayName: e.target.value, phoneNumber: c.nonMemberArtist?.phoneNumber || '' } }
                              : c
                          ))}
                          placeholder={t('upload.artistNamePh')}
                          className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('upload.nonMemberPhoneLabel')}
                        </label>
                        <input
                          type="tel"
                          value={selectedContent.nonMemberArtist?.phoneNumber || ''}
                          onChange={(e) => setContents(contents.map(c =>
                            c.id === selectedContentId
                              ? { ...c, nonMemberArtist: { ...c.nonMemberArtist, displayName: c.nonMemberArtist?.displayName || '', phoneNumber: e.target.value } }
                              : c
                          ))}
                          placeholder={t('upload.phonePh')}
                          className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <p className="text-xs text-amber-700">{t('upload.nonMemberLinkHint')}</p>
                    </div>
                  ) : selectedContent.artist ? (
                    <div className="flex items-center justify-between px-3 py-3 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <img src={selectedContent.artist.avatar} alt={selectedContent.artist.name} className="h-8 w-8 rounded-full object-cover" />
                        <span className="text-base font-medium text-[#18181B]">{selectedContent.artist.name}</span>
                      </div>
                      <button
                        onClick={() => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artist: undefined } : c))}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={artistSearch}
                          onChange={(e) => setArtistSearch(e.target.value)}
                          placeholder={t('upload.artistSearchPh')}
                          className="w-full pl-10 pr-4 py-3 border border-[#D1D5DB] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      {artistSearch && (
                        <div className="border border-[#E5E7EB] rounded-lg max-h-40 overflow-y-auto mt-2">
                          {artists
                            .filter((a) => a.name.toLowerCase().includes(artistSearch.toLowerCase()))
                            .slice(0, 5)
                            .map((artist) => (
                              <button
                                key={artist.id}
                                onClick={() => {
                                  setContents(contents.map(c =>
                                    c.id === selectedContentId
                                      ? { ...c, artist: { id: artist.id, name: artist.name, avatar: artist.avatar }, artistType: 'member' }
                                      : c
                                  ));
                                  setArtistSearch('');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#FAFAFA] transition-colors text-left min-h-[44px]"
                              >
                                <img src={artist.avatar} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                                <div>
                                  <div className="text-base font-medium text-[#18181B]">{artist.name}</div>
                                  <div className="text-sm text-gray-500">{artist.bio}</div>
                                </div>
                              </button>
                            ))}
                          {artists.filter(a => a.name.toLowerCase().includes(artistSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-base text-gray-500 text-center">
                              {t('upload.noSearchResults')}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        {/* 하단 설정 영역 */}
        <div className="mt-auto pt-6 space-y-5">
          {/* 배경색상 설정 */}
          <div>
            <label className="block text-base font-semibold text-[#18181B] mb-2">{t('upload.bgColor')}</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-[#D1D5DB] cursor-pointer flex-shrink-0"
                style={{ backgroundColor }}
                onClick={() =>
                  document.getElementById('bg-color-input')?.click()
                }
              />
              <input
                id="bg-color-input"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="hidden"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setBackgroundColor(value);
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1 px-4 py-3 border border-[#D1D5DB] rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 콘텐츠 간격 설정 */}
          <div>
            <label className="block text-base font-semibold text-[#18181B] mb-3">{t('upload.contentSpacing')}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={contentSpacing}
                onChange={(e) => setContentSpacing(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${contentSpacing}%, #e5e7eb ${contentSpacing}%, #e5e7eb 100%)`,
                }}
              />
              <div className="w-16 px-2 py-2 border border-[#D1D5DB] rounded-lg text-base text-center font-medium">
                {contentSpacing}
              </div>
            </div>
          </div>

          {/* 세부 정보 설정 버튼 */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors min-h-[44px]"
          >
            <Info className="h-5 w-5 text-green-600" />
            <span className="text-base font-semibold text-green-700">{t('upload.openDetails')}</span>
          </button>

          {/* 창작물 확인 */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOriginalWork}
                onChange={(e) => setIsOriginalWork(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-[#D1D5DB] text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span className="text-base text-amber-900 leading-relaxed select-none">
                <strong>{confirmLabel}</strong>
              </span>
            </label>
          </div>

          {/* 발행 버튼 */}
          <button
            disabled={contents.length === 0 || !isOriginalWork}
            onClick={() => setShowDetailsModal(true)}
            className={`w-full py-3.5 rounded-full text-base font-semibold transition-all min-h-[44px] ${
              contents.length > 0 && isOriginalWork
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('upload.publish')}
          </button>

          {/* 초안 저장 */}
          <button
            disabled={contents.length === 0}
            onClick={handleSaveDraft}
            className={`w-full py-3.5 rounded-full text-base font-semibold transition-all min-h-[44px] ${
              contents.length > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('upload.saveDraft')}
          </button>
        </div>
      </div>
    </div>
  );
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}
