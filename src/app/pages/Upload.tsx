import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useBlocker } from 'react-router-dom';
import { Image as ImageIcon, Plus, X, Search, GripVertical, ArrowLeft, ChevronLeft, ChevronRight, Trash2, Replace, ArrowUpDown, Monitor, Users, CalendarCheck, Star, Check, HelpCircle } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore } from '../store';
import type { Work } from '../data';
import type { Draft } from '../store';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

import { shouldBlockCameraPhoto } from '../utils/cameraExifBlock';
import {
  collectGroupNameSuggestions,
  getLastUsedGroupName,
  resolveCanonicalGroupName,
  setLastUsedGroupName,
} from '../utils/groupNameRegistry';
import { Button } from '../components/ui/button';
import { pointsOnWorkPublished } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { sendInviteToNonMember } from '../utils/inviteMessaging';
import { openConfirm } from '../components/ConfirmDialog';
import { RequiredMark } from '../components/RequiredMark';
import { containsProfanity } from '../utils/profanityFilter';
import { normalizeStoredPieceTitle } from '../utils/workDisplay';
import { WorkDetailModal } from '../components/WorkDetailModal';

/* ─── 상수 ─── */
const CONTENT_SPACING = 10; // px — Phase 1 고정값
const MIN_SHORT_SIDE = 800; // px — v1.7 단변 최소 해상도

/* ─── 타입 ─── */
type ContentItem = {
  id: string;
  type: 'image';
  url?: string;
  title?: string;
  artist?: { id: string; name: string; avatar: string };
  nonMemberArtist?: { displayName: string; phoneNumber: string };
  artistType?: 'member' | 'non-member' | 'self';
  fullWidth?: boolean; // default false (padded), true = 전폭 확장
};

/* ─── 헬퍼 ─── */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/** 이미지 단변 해상도를 검사합니다 */
function checkMinResolution(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
      resolve(shortSide >= MIN_SHORT_SIDE);
    };
    img.onerror = () => resolve(true); // 로드 실패 시 통과 (업로드 자체에서 걸림)
    img.src = dataUrl;
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useI18n();

  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };

  /* ── 모드 ── */
  const [reorderMode, setReorderMode] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  /* ── 업로드 진행률 (WebP 변환 + 검증 시간 피드백) ── */
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  /* ── 이미지 교체 ── */
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  /* ── 콘텐츠 ── */
  const [contents, setContents] = useState<ContentItem[]>([]);

  /* ── 유형 선택 (Step 0) ── */
  const [uploadType, setUploadType] = useState<'solo' | 'group' | null>(null);

  /* ── 대표(커버) 이미지 ── */
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomCoverUrl(reader.result as string);
      setCoverImageIndex(-1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── 세부 정보 ── */
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exhibitionName, setExhibitionName] = useState('');
  const [exhibitionSuggestOpen, setExhibitionSuggestOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSuggestOpen, setGroupSuggestOpen] = useState(false);
  const [workTick, setWorkTick] = useState(0);
  const [isOriginalWork, setIsOriginalWork] = useState(false);
  const [artistInputTab, setArtistInputTab] = useState<'member' | 'non-member'>('member');
  /* ── 변환 프로그레스 ── */

  /* ── 강사 / 개인전시 탭 ── */
  const [isInstructor, setIsInstructor] = useState(false);
  const [showInSoloTab, setShowInSoloTab] = useState(true);

  /* ── 이벤트 연결 ── */
  const linkedEventId = searchParams.get('event');
  const linkedEventTitle = searchParams.get('eventTitle') ? decodeURIComponent(searchParams.get('eventTitle')!) : null;

  /* ── 이미지 선택 ── */
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  const [guideSeen, setGuideSeen] = useState(() => !!localStorage.getItem('artier_upload_guide_seen'));
  const [smsSentPhones, setSmsSentPhones] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 이탈 방지 ── */
  const hasUnsavedWork = contents.length > 0 || exhibitionName.trim() !== '' || groupName.trim() !== '';
  const publishedRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedWork && !publishedRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      openConfirm({
        title: t('upload.leaveConfirmTitle'),
        description: t('upload.leaveConfirmDesc'),
        destructive: true,
      }).then((confirmed) => {
        if (confirmed) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      });
    }
  }, [blocker, t]);

  useEffect(() => {
    if (!hasUnsavedWork || publishedRef.current) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedWork]);

  /* ━━━━━━ Effects ━━━━━━ */

  const newKey = searchParams.get('new');
  useEffect(() => {
    if (!newKey) return;
    setContents([]);
    setUploadType(null);
    setExhibitionName('');
    setGroupName('');
    setIsOriginalWork(false);
    setIsInstructor(false);
    setShowInSoloTab(true);
    setSelectedContentId(null);
    setCoverImageIndex(0);
    setCustomCoverUrl(null);
    setPreviewMode(false);
    setReorderMode(false);
    setShowDetailsModal(false);
    setArtistSearch('');
    setSmsSentPhones(new Set());
  }, [newKey]);

  useEffect(() => {
    return workStore.subscribe(() => setWorkTick((x) => x + 1));
  }, []);

  useEffect(() => {
    if (uploadType === 'group' && isInstructor) {
      if (groupName.trim()) return;
      const last = getLastUsedGroupName();
      if (last) setGroupName(last);
    }
  }, [uploadType, isInstructor]);

  // 함께 올리기 시 첫 이미지 자동 선택
  useEffect(() => {
    if (uploadType === 'group' && contents.length > 0 && !selectedContentId) {
      setSelectedContentId(contents[0].id);
    }
  }, [uploadType, contents.length, selectedContentId]);

  // 선택된 이미지의 작가 타입에 맞춰 탭 자동 전환
  useEffect(() => {
    if (!selectedContentId) return;
    const sc = contents.find((c) => c.id === selectedContentId);
    if (!sc) return;
    if (sc.artistType === 'non-member') setArtistInputTab('non-member');
    else setArtistInputTab('member');
  }, [selectedContentId, contents]);

  const groupSuggestions = useMemo(() => {
    const names = ([] as string[]).concat(
      ...workStore.getWorks().map((w) => (w.groupName?.trim() ? [w.groupName.trim()] : [])),
    );
    return collectGroupNameSuggestions(groupName, names);
  }, [groupName, workTick]);

  const exhibitionSuggestions = useMemo(() => {
    const q = exhibitionName.trim().toLowerCase();
    const set = new Set<string>();
    for (const w of workStore.getWorks()) {
      if (w.exhibitionName?.trim()) set.add(w.exhibitionName.trim());
    }
    const list = [...set].sort((a, b) => a.localeCompare(b, 'ko'));
    if (!q) return list.slice(0, 24);
    return list.filter((n) => n.toLowerCase().includes(q)).slice(0, 24);
  }, [exhibitionName, workTick]);

  const uploadedImageCount = useMemo(
    () => contents.filter((c) => c.type === 'image' && c.url).length,
    [contents],
  );

  const prevDetailsModalOpen = useRef(false);
  useEffect(() => {
    const justOpened = showDetailsModal && !prevDetailsModalOpen.current;
    prevDetailsModalOpen.current = showDetailsModal;
    if (!justOpened) return;
    if (uploadedImageCount !== 1) return;
    const first = contents.find((c) => c.type === 'image' && c.url);
    const pt = first?.title?.trim();
    if (!pt) return;
    setExhibitionName((prev) => (prev.trim() ? prev : pt.slice(0, 50)));
  }, [showDetailsModal, uploadedImageCount, contents]);

  /* ── 초안 복원 ── */
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (!draftId) return;
    const draft = draftStore.getDraft(draftId);
    if (!draft) return;
    setUploadType(draft.uploadType ?? 'solo');
    setExhibitionName((draft.exhibitionName ?? draft.title ?? '').trim());
    if (draft.groupName) setGroupName(draft.groupName);
    if (draft.isInstructor) setIsInstructor(true);
    if (typeof draft.showInSoloTab === 'boolean') setShowInSoloTab(draft.showInSoloTab);
    if (typeof draft.coverImageIndex === 'number') setCoverImageIndex(draft.coverImageIndex);
    let restored = draft.contents.map((c) => ({
      id: c.id,
      type: 'image' as const,
      url: c.url,
      title: c.title,
      artist: c.artist,
      nonMemberArtist: c.nonMemberArtist,
      artistType: c.artistType,
      fullWidth: c.fullWidth,
    }));
    const withUrl = restored.filter((c) => c.url);
    const ex = (draft.exhibitionName ?? draft.title ?? '').trim();
    if (withUrl.length === 1 && ex && !withUrl[0]?.title?.trim()) {
      restored = restored.map((c) => (c.id === withUrl[0]!.id ? { ...c, title: ex.slice(0, 120) } : c));
    }
    setContents(restored);
    toast.success(t('upload.toastDraftLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 기존 작품 수정 모드 ── */
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const work = workStore.getWork(editId);
    if (!work) return;
    setEditingWorkId(editId);
    setUploadType(work.primaryExhibitionType === 'group' ? 'group' : 'solo');
    setExhibitionName(work.exhibitionName || '');
    const images = Array.isArray(work.image) ? work.image : [work.image];
    setContents(images.filter(Boolean).map((url, i) => {
      const ia = work.imageArtists?.[i];
      const item: ContentItem = {
        id: `edit-${i}-${Date.now()}`,
        type: 'image' as const,
        url: url as string,
        title: work.imagePieceTitles?.[i] || '',
      };
      if (ia?.type === 'member' && ia.memberId) {
        item.artist = { id: ia.memberId, name: ia.memberName || '', avatar: ia.memberAvatar || '' };
        item.artistType = 'member';
      } else if (ia?.type === 'non-member' && ia.displayName) {
        item.nonMemberArtist = { displayName: ia.displayName, phoneNumber: ia.phoneNumber || '' };
        item.artistType = 'non-member';
      }
      return item;
    }));
    if (work.groupName) setGroupName(work.groupName);
    if (work.isInstructorUpload) setIsInstructor(true);
    if (typeof work.coverImageIndex === 'number') setCoverImageIndex(work.coverImageIndex);
    if (typeof work.showInSoloTab === 'boolean') setShowInSoloTab(work.showInSoloTab);
    toast.success(t('upload.toastEditLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ━━━━━━ 파일 핸들러 ━━━━━━ */

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxAdd = 10 - contents.length;
    if (maxAdd <= 0) {
      toast.error(t('upload.errMaxImages'));
      e.target.value = '';
      return;
    }
    const total = Math.min(files.length, maxAdd);
    setUploadProgress({ current: 0, total });
    const incoming: ContentItem[] = [];
    for (let i = 0; i < files.length && incoming.length < maxAdd; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total });
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

        // v1.7: 단변 800px 검증
        const passRes = await checkMinResolution(url);
        if (!passRes) {
          toast.error(t('upload.errMinShortSide800'));
          continue;
        }

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
    setUploadProgress(null);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    const dt = new DataTransfer();
    for (let i = 0; i < files.length; i++) dt.items.add(files[i]);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  /* ── 이미지 교체 핸들러 ── */
  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replaceTargetId || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) { toast.error(tn('upload.errFileTooBig', { name: file.name })); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error(tn('upload.errFileType', { name: file.name })); return; }
    setUploadProgress({ current: 1, total: 1 });
    try {
      const { convertImageFileToWebpDataUrlIfPossible } = await import('../utils/imageToWebp');
      const url = await convertImageFileToWebpDataUrlIfPossible(file);
      const passRes = await checkMinResolution(url);
      if (!passRes) { toast.error(t('upload.errMinShortSide800')); return; }
      setContents(contents.map((c) => c.id === replaceTargetId ? { ...c, url } : c));
      toast.success(t('upload.toastImageReplaced'));
    } catch { toast.error(tn('upload.errFileRead', { name: file.name })); }
    finally {
      setUploadProgress(null);
    }
    e.target.value = '';
    setReplaceTargetId(null);
  };




  /* ━━━━━━ 발행 ━━━━━━ */

  const commitExhibitionValue = useCallback(
    (raw: string, opts?: { fromSuggestion?: boolean }) => {
      const v = raw.slice(0, 50);
      setExhibitionName(v);
      if (opts?.fromSuggestion) setExhibitionSuggestOpen(false);
      else setExhibitionSuggestOpen(true);
    },
    [],
  );

  const handleOpenDetails = () => {
    if (!exhibitionName.trim()) {
      toast.error(t('upload.errExhibitionNameRequired'));
      return;
    }
    setShowDetailsModal(true);
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    const imageContents = contents.filter((c) => c.type === 'image' && c.url);
    if (imageContents.length === 0) {
      toast.error(t('upload.errMinOneImage'));
      return;
    }
    if (!isOriginalWork) {
      toast.error(
        uploadType === 'group' ? t('upload.errCheckStudentConsent') : t('upload.errCheckOriginal'),
      );
      return;
    }

    // 비속어 검증
    const profanityTarget = [exhibitionName, groupName].find((s) => s && containsProfanity(s));
    if (profanityTarget) {
      toast.error(t('upload.errProfanity'));
      return;
    }

    // 그룹 업로드 시 작가 검증
    if (uploadType === 'group') {
      const missingArtist = imageContents.some(
        (c) => !c.artist && (!c.nonMemberArtist?.displayName || !c.nonMemberArtist?.phoneNumber),
      );
      if (missingArtist) {
        toast.error(t('upload.errMissingArtist'));
        return;
      }
    }

    // 그룹 전시 + 강사 아님 + 유니크 작가 1명 → 개인 전시 전환 제안
    if (uploadType === 'group' && !isInstructor) {
      const unique = new Set(
        imageContents.map((c) => c.artist?.id || c.nonMemberArtist?.displayName || 'self'),
      );
      if (unique.size <= 1) {
        const switchToSolo = await openConfirm({
          title: t('upload.soloSuggestionTitle'),
          description: t('upload.soloSuggestionDesc'),
          confirmLabel: t('upload.soloSuggestionConfirm'),
        });
        if (switchToSolo) {
          setUploadType('solo');
          setGroupName('');
          setContents((prev) => prev.map((p) => ({ ...p, artist: undefined, nonMemberArtist: undefined, artistType: undefined })));
          setShowDetailsModal(false);
          toast.success(t('upload.soloSuggestionSwitched'));
          return;
        }
      }
    }

    const currentUser = artists[0];
    const rawUrls = imageContents.map((c) => c.url!);
    const hasCustomCover = customCoverUrl && coverImageIndex === -1;
    const urls = hasCustomCover ? [customCoverUrl, ...rawUrls] : rawUrls;
    const exFinal = exhibitionName.trim().slice(0, 50);

    // v1.7: 작품명 자동생성
    const imagePieceTitles = imageContents.map((c, i) => {
      if (c.title?.trim()) return c.title.trim().slice(0, 120);
      if (uploadType === 'group') {
        const artistName = c.artist?.name || c.nonMemberArtist?.displayName || '';
        return artistName
          ? tn('work.autoTitleArtist', { name: artistName, n: String(i + 1) })
          : tn('work.autoTitleNumbered', { n: String(i + 1) });
      }
      if (imageContents.length === 1) return exFinal || t('work.untitled');
      return t('work.untitled');
    });

    if (hasCustomCover) imagePieceTitles.unshift(exFinal || t('work.untitled'));
    const resolvedPieceTitle = imagePieceTitles[0] ?? '';
    const resolvedGroup = groupName.trim()
      ? resolveCanonicalGroupName(groupName.trim())
      : uploadType === 'group' ? t('upload.groupNameDefault') : undefined;

    // v1.7: 그룹전시 자동 분류
    const uniqueArtists = new Set(
      imageContents.map((c) => c.artist?.id || c.nonMemberArtist?.displayName || 'self'),
    );
    const primaryExhibitionType = uploadType === 'group' && uniqueArtists.size >= 2 ? 'group' : uploadType === 'group' ? 'group' : 'solo';

    const imageArtists = imageContents.map((c) => {
      if (c.artistType === 'non-member' && c.nonMemberArtist) {
        return { type: 'non-member' as const, displayName: c.nonMemberArtist.displayName, phoneNumber: c.nonMemberArtist.phoneNumber };
      }
      if (c.artist) {
        return { type: 'member' as const, memberId: c.artist.id, memberName: c.artist.name, memberAvatar: c.artist.avatar };
      }
      return { type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar };
    });
    if (hasCustomCover) imageArtists.unshift({ type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar });

    const uploadedAt = new Date().toISOString().slice(0, 10);
    const newWork: Work = {
      id: `user-${Date.now()}`,
      title: resolvedPieceTitle,
      image: urls.length === 1 ? urls[0] : urls,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      comments: 0,
      description: '',
      tags: [],
      category: 'art',
      exhibitionName: exFinal,
      groupName: resolvedGroup,
      imagePieceTitles,
      isInstructorUpload: uploadType === 'group' ? isInstructor : undefined,
      primaryExhibitionType,
      showInSoloTab: primaryExhibitionType === 'group' ? showInSoloTab : undefined,
      imageArtists,
      feedReviewStatus: import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true' ? 'approved' : 'pending',
      uploadedAt,
      linkedEventId: linkedEventId || undefined,
      coverImageIndex: hasCustomCover ? 0 : (urls.length > 1 ? Math.min(coverImageIndex, urls.length - 1) : 0),
    };

    setIsPublishing(true);
    const targetId = editingWorkId || newWork.id;
    const wasEditingExistingWork = Boolean(editingWorkId);
    if (editingWorkId) {
      workStore.updateWork(editingWorkId, newWork);
    } else {
      workStore.addWork(newWork);
    }
    if (resolvedGroup) setLastUsedGroupName(resolvedGroup);
    if (!editingWorkId) pointsOnWorkPublished(newWork);
    setShowDetailsModal(false);

    // 비가입자 초대 모의 발송
    const nonMemberRecipients = imageArtists
      .map((a, idx) => (a.type === 'non-member' && a.phoneNumber && a.displayName ? { idx, phoneNumber: a.phoneNumber, displayName: a.displayName } : null))
      .filter((v): v is { idx: number; phoneNumber: string; displayName: string } => v !== null);
    let inviteSent = 0;
    let inviteFailed = 0;
    if (nonMemberRecipients.length > 0) {
      const exhibitionUrl = `${window.location.origin}/exhibitions/${targetId}`;
      const inviteLocale = locale === 'en' ? 'en' : 'ko';
      for (const r of nonMemberRecipients) {
        const result = sendInviteToNonMember({ phoneNumber: r.phoneNumber, displayName: r.displayName, workId: targetId, exhibitionUrl, locale: inviteLocale });
        if (result.success) inviteSent++;
        else inviteFailed++;
      }
      const scrubbedImageArtists = imageArtists.map((a) =>
        a.type === 'non-member' ? { ...a, phoneNumber: undefined } : a,
      );
      workStore.updateWork(targetId, { imageArtists: scrubbedImageArtists });
    }

    if (inviteSent > 0 || inviteFailed > 0) {
      if (inviteFailed === 0) toast.success(tn('upload.toastNonMemberInviteSent', { n: String(inviteSent) }));
      else toast.success(tn('upload.toastNonMemberInviteMixed', { sent: String(inviteSent), failed: String(inviteFailed) }));
    } else if (editingWorkId) {
      toast.success(t('upload.editModeToast'));
    } else if (import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true') {
      toast.success(t('upload.toastPublishedImmediate'));
    } else {
      toast.success(t('upload.toastPublished'));
    }

    setTimeout(() => {
      setIsPublishing(false);
      publishedRef.current = true;
      navigate(wasEditingExistingWork ? '/me?tab=exhibition' : `/exhibitions/${targetId}`);
    }, 600);
  };

  /* ━━━━━━ 초안 저장 ━━━━━━ */
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);

  const handleSaveDraft = () => {
    const firstUrl = contents.find((c) => c.url);
    const draft: Draft = {
      id: generateRandomId(),
      title: exhibitionName.trim() || firstUrl?.title?.trim() || '',
      exhibitionName: exhibitionName.trim(),
      uploadType: uploadType ?? undefined,
      groupName: groupName.trim() || undefined,
      isInstructor: uploadType === 'group' ? isInstructor : undefined,
      showInSoloTab: uploadType === 'group' ? showInSoloTab : undefined,
      coverImageIndex,
      contents: contents.map((c) => ({
        id: c.id,
        type: 'image' as const,
        url: c.url,
        title: c.title,
        artist: c.artist,
        nonMemberArtist: c.nonMemberArtist,
        artistType: c.artistType,
        fullWidth: c.fullWidth,
      })),
      tags: [],
      categories: [],
      savedAt: new Date().toISOString(),
    };
    draftStore.saveDraft(draft);
    toast.success(t('upload.toastDraftSaved'));
    publishedRef.current = true;
    navigate('/me');
  };

  // 자동 저장
  const hasContent = contents.some((c) => c.url);
  useEffect(() => {
    if (!hasContent) return;
    const interval = setInterval(() => {
      const firstUrl = contents.find((c) => c.url);
      const draft: Draft = {
        id: 'autosave',
        title: exhibitionName.trim() || firstUrl?.title?.trim() || '',
        exhibitionName: exhibitionName.trim(),
        uploadType: uploadType ?? undefined,
        groupName: groupName.trim() || undefined,
        isInstructor: uploadType === 'group' ? isInstructor : undefined,
        showInSoloTab: uploadType === 'group' ? showInSoloTab : undefined,
        coverImageIndex,
        contents: contents.map((c) => ({
          id: c.id,
          type: 'image' as const,
          url: c.url,
          title: c.title,
          artist: c.artist,
          nonMemberArtist: c.nonMemberArtist,
          artistType: c.artistType,
          fullWidth: c.fullWidth,
        })),
        tags: [],
        categories: [],
        savedAt: new Date().toISOString(),
      };
      draftStore.saveDraft(draft);
      setLastAutoSavedAt(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [hasContent, contents, exhibitionName, uploadType, groupName, isInstructor, showInSoloTab, coverImageIndex]);

  useEffect(() => {
    if (!hasContent) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasContent]);

  /* ━━━━━━ 재정렬 핸들러 ━━━━━━ */

  const handleDragStart = useCallback((index: number) => { setDragIndex(index); }, []);
  const handleDragEnter = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setContents((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    // 커버 인덱스도 순서 이동에 맞춰 재계산
    setCoverImageIndex((prev) => {
      if (prev === dragIndex) return index;
      if (dragIndex < prev && index >= prev) return prev - 1;
      if (dragIndex > prev && index <= prev) return prev + 1;
      return prev;
    });
    setDragIndex(index);
  }, [dragIndex]);
  const handleDragEnd = useCallback(() => { setDragIndex(null); }, []);

  /* ━━━━━━ 패널 이전/다음 (v1.7) ━━━━━━ */

  const selectedIndex = contents.findIndex((c) => c.id === selectedContentId);
  const goToPrevContent = () => {
    if (selectedIndex > 0) setSelectedContentId(contents[selectedIndex - 1].id);
  };
  const goToNextContent = () => {
    if (selectedIndex < contents.length - 1) setSelectedContentId(contents[selectedIndex + 1].id);
  };

  /* ━━━━━━ 렌더링 ━━━━━━ */

  const confirmLabel = useMemo(
    () => uploadType === 'group' ? t('upload.confirmStudent') : t('upload.confirmOriginal'),
    [uploadType, t],
  );

  /* ━━━━━━ 발행 조건 체크리스트 (전체 항목 고정, done 플래그) ━━━━━━ */
  const publishChecklist = useMemo(() => {
    const hasImages = contents.length > 0;
    const items: { key: string; label: string; done: boolean; disabled?: boolean }[] = [
      { key: 'image', label: t('upload.blockerImage'), done: hasImages },
      { key: 'title', label: t('upload.blockerExhibitionTitle'), done: !!exhibitionName.trim() },
    ];
    if (uploadType === 'group') {
      const allAssigned = hasImages && contents.filter((c) => c.url).every(
        (c) => c.artist || (c.nonMemberArtist?.displayName && c.nonMemberArtist?.phoneNumber),
      );
      items.push({ key: 'artist', label: t('upload.blockerArtist'), done: allAssigned, disabled: !hasImages });
    }
    return items;
  }, [contents, exhibitionName, uploadType, t]);
  const publishBlockers = publishChecklist.filter((i) => !i.done);

  // ===== 미리보기 모드 =====
  const previewWork = useMemo<Work | null>(() => {
    if (!previewMode) return null;
    const currentUser = artists[0];
    const urls = contents.filter(c => c.url).map(c => c.url!);
    if (urls.length === 0) return null;
    const imageArtists = contents.filter(c => c.url).map(c => {
      if (c.artistType === 'member' && c.artist) {
        return { type: 'member' as const, memberId: c.artist.id, memberName: c.artist.name, memberAvatar: c.artist.avatar };
      }
      if (c.artistType === 'non-member' && c.nonMemberArtist?.displayName) {
        return { type: 'non-member' as const, displayName: c.nonMemberArtist.displayName };
      }
      return { type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar };
    });
    const pieceTitles = contents.filter(c => c.url).map(c => c.title || '');
    return {
      id: '__preview__',
      title: exhibitionName || t('upload.previewExhibitionFallback'),
      image: urls.length === 1 ? urls[0] : urls,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      comments: 0,
      exhibitionName: exhibitionName || t('upload.previewExhibitionFallback'),
      groupName: groupName || undefined,
      primaryExhibitionType: uploadType === 'group' ? 'group' : 'solo',
      imageArtists,
      imagePieceTitles: pieceTitles,
      feedReviewStatus: 'approved',
    } satisfies Work;
  }, [previewMode, contents, exhibitionName, groupName, uploadType, t]);

  if (previewMode && previewWork) {
    return (
      <>
        <WorkDetailModal
          workId="__preview__"
          onClose={() => setPreviewMode(false)}
          allWorks={[previewWork]}
          isPreview
        />
      </>
    );
  }

  // ===== 재정렬 모드 =====
  if (reorderMode) {
    return (
      <div className="min-h-screen bg-white">
        <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">{t('upload.reorderMode')}</span>
          <Button onClick={() => { setReorderMode(false); toast.success(t('upload.toastOrderSaved')); }} className="px-5 py-2 bg-foreground text-white text-sm rounded-lg lg:hover:bg-black transition-colors">
            {t('upload.reorderDone')}
          </Button>
        </div>
        <div className="max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {contents.map((c, i) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex flex-col gap-2 p-3 border rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                dragIndex === i ? 'border-primary bg-muted shadow-sm scale-105 z-10' : 'border-border/40 bg-white hover:border-border/80'
              }`}
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted/50">
                {c.url && <ImageWithFallback src={c.url} alt={c.title || ''} className="h-full w-full object-cover" />}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <div className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">{i + 1}</div>
                </div>
                <div className="absolute top-2 right-2 bg-black/40 text-white p-1 rounded-md backdrop-blur-sm"><GripVertical className="h-4 w-4" /></div>
              </div>
              <span className="text-sm text-foreground truncate w-full text-center font-medium mt-1">
                {normalizeStoredPieceTitle(c.title) || tn('upload.imageFallback', { n: String(i + 1) })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== 메인 렌더 =====
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />

      {/* ── Step 0: 유형 선택 ── */}
      {uploadType === null ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 animate-in fade-in zoom-in-95 duration-500">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 text-center">{t('upload.typePromptTitle')}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
            <button
              onClick={() => setUploadType('solo')}
              className="flex flex-col items-center text-center p-10 bg-white border-2 border-border/60 hover:border-foreground transition-all rounded-2xl group shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-foreground text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('upload.typeSolo')}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('upload.typeSoloDesc1')}</p>
            </button>
            <button
              onClick={() => setUploadType('group')}
              className="flex flex-col items-center text-center p-10 bg-white border-2 border-border/60 hover:border-foreground transition-all rounded-2xl group shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-foreground text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('upload.typeGroup')}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('upload.typeGroupDesc1')}</p>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 파일 인풋 (숨김) ── */}
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleFileSelect} className="hidden" multiple />
          <input ref={replaceFileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleReplaceImage} className="hidden" />



          {/* 상단 바 제거됨 — 네비게이션은 헤더의 작품올리기 버튼으로 대체 */}

          {/* ── 업로드 진행률 바 (WebP 변환/검증 피드백) ── */}
          {uploadProgress && !showDetailsModal && (
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/40 px-4 py-2.5" role="status" aria-live="polite">
              <div className="flex items-center gap-3 max-w-4xl mx-auto">
                <span className="text-xs font-semibold text-foreground shrink-0">
                  {tn('upload.uploadingProgress', { current: String(uploadProgress.current), total: String(uploadProgress.total) })}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${Math.round((uploadProgress.current / Math.max(1, uploadProgress.total)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 메인 레이아웃 ── */}
          <div className="md:flex md:h-[calc(100vh-136px)] bg-zinc-50/30 overflow-hidden">

            {/* ── Step 2: 세부 정보 모달 ── */}
            {showDetailsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDetailsModal(false)}>
                <div className="absolute inset-0 bg-black/50" />
                <div
                  className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 헤더 */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">{t('upload.detailsModalTitle')}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)} className="h-9 w-9 rounded-full">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* 본문 */}
                  <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* 커버 이미지 */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('upload.coverSectionTitle')}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{t('upload.coverSectionDesc')}</p>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {/* 커스텀 커버 (업로드된 경우) */}
                        {customCoverUrl && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setCoverImageIndex(-1)}
                              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${coverImageIndex === -1 ? 'ring-2 ring-primary ring-offset-2 shadow-md' : 'border-2 border-border/50 opacity-70 hover:opacity-100'}`}
                            >
                              <img src={customCoverUrl} alt="" className="w-full h-full object-cover" />
                              {coverImageIndex === -1 && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="bg-primary text-white rounded-full p-0.5">
                                    <Star className="h-2.5 w-2.5 fill-white" />
                                  </div>
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setCustomCoverUrl(null); if (coverImageIndex === -1) setCoverImageIndex(0); }}
                              className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* 기존 작품 이미지 */}
                        {contents.filter(c => c.type === 'image' && c.url).map((c, i) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCoverImageIndex(i); }}
                            className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${coverImageIndex === i ? 'ring-2 ring-primary ring-offset-2 shadow-md' : 'border-2 border-border/50 opacity-70 hover:opacity-100'}`}
                          >
                            <ImageWithFallback src={c.url} alt="" className="w-full h-full object-cover" />
                            {coverImageIndex === i && (
                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                <div className="bg-primary text-white rounded-full p-0.5">
                                  <Star className="h-2.5 w-2.5 fill-white" />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                        {/* 로컬 파일 업로드 버튼 */}
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-[9px] font-medium leading-tight">{t('upload.coverUpload')}</span>
                        </button>
                        <input
                          ref={coverFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverFileChange}
                        />
                      </div>
                    </div>

                    {/* 원작 확인 */}
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={isOriginalWork} onChange={(e) => setIsOriginalWork(e.target.checked)} className="mt-1 flex-shrink-0 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary transition-all group-hover:border-primary/50 cursor-pointer" />
                        <span className="text-sm font-medium text-foreground leading-snug cursor-pointer select-none">
                          {confirmLabel}<RequiredMark />
                        </span>
                      </label>
                    </div>

                    {/* 이벤트 연결 표시 */}
                    {linkedEventId && linkedEventTitle && (
                      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-green-200 rounded-xl">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{t('upload.eventWorkTitle')}</p>
                          <p className="text-sm text-primary">{linkedEventTitle}</p>
                        </div>
                      </div>
                    )}

                    {/* 강사 체크박스 (함께 올리기 전용) */}
                    {uploadType === 'group' && (
                      <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-xl">
                        <div className="flex-1 mr-4">
                          <p className="text-sm font-medium text-foreground">{t('upload.instructorLabel')}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{t('upload.instructorDesc')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsInstructor(!isInstructor)}
                          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${isInstructor ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isInstructor ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    )}

                    {/* 개인전시 탭 노출 (함께 올리기 전용) */}
                    {uploadType === 'group' && (
                      <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-xl">
                        <div className="flex-1 mr-4">
                          <p className="text-sm font-medium text-foreground">{t('upload.soloTabTitle')}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{t('upload.soloTabDesc')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInSoloTab(!showInSoloTab)}
                          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${showInSoloTab ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${showInSoloTab ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 푸터 */}
                  <div className="border-t border-border px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="ghost" onClick={() => setShowDetailsModal(false)} className="px-5 py-2.5 text-sm min-h-[44px]">{t('upload.close')}</Button>
                      <Button disabled={isPublishing || !isOriginalWork} onClick={handlePublish} className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg lg:hover:bg-primary/90 transition-colors min-h-[44px] disabled:opacity-60">
                        {isPublishing
                          ? (editingWorkId ? t('upload.editModeSaving') : t('upload.publishing'))
                          : editingWorkId ? t('upload.editModeSave') : t('upload.publish')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: 메인 캔버스 영역 ── */}
            {!showDetailsModal && (
              <>
                <div
                  className={`relative flex-1 flex flex-col md:overflow-y-auto px-4 sm:px-8 md:px-12 py-10 lg:py-16 ${
                    !contents.length ? 'items-center justify-center min-h-[50vh] md:min-h-0' : 'items-center justify-start'
                  }`}
                >
                  <div className="w-full max-w-4xl flex flex-col items-center">
                    
                    {/* 제목 입력부 */}
                    <div className="w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
                      <div className="relative">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 md:text-left text-center">
                          {t('upload.exhibitionTitlePlaceholder')}<RequiredMark />
                        </label>
                        <input
                          type="text"
                          value={exhibitionName}
                          onChange={(e) => commitExhibitionValue(e.target.value)}
                          onFocus={() => setExhibitionSuggestOpen(true)}
                          onBlur={() => window.setTimeout(() => setExhibitionSuggestOpen(false), 200)}
                          placeholder={t('upload.exhibitionTitlePlaceholder')}
                          maxLength={50}
                          className={`w-full bg-white text-xl sm:text-2xl md:text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 border-2 rounded-2xl px-5 py-4 transition-all leading-tight text-center md:text-left relative z-20 focus:outline-none focus:ring-0 ${
                            !exhibitionName.trim() && contents.length > 0
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-border/60 focus:border-primary'
                          }`}
                        />
                        <div className="flex justify-between mt-1.5 px-1">
                          <span className={`text-[11px] font-medium ${!exhibitionName.trim() && contents.length > 0 ? 'text-red-500' : 'text-transparent'}`}>
                            {t('upload.blockerExhibitionTitle')}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{exhibitionName.length}/50</span>
                        </div>
                        {exhibitionSuggestOpen && exhibitionSuggestions.length > 0 && (
                          <ul className="absolute z-30 top-full mt-1 w-full max-h-48 overflow-auto rounded-xl border border-border bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] py-2 text-sm">
                            {exhibitionSuggestions.map((name) => (
                              <li key={name}>
                                <Button variant="ghost" type="button" className="w-full text-left px-5 py-3 lg:hover:bg-muted text-foreground font-medium rounded-none"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => { commitExhibitionValue(name, { fromSuggestion: true }); setExhibitionSuggestOpen(false); }}
                                >{name}</Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {uploadType === 'group' && (
                        <div className="relative">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 md:text-left text-center">
                            {t('upload.groupNamePlaceholder2')}
                          </label>
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => { setGroupName(e.target.value); setGroupSuggestOpen(true); }}
                            onFocus={() => setGroupSuggestOpen(true)}
                            onBlur={() => window.setTimeout(() => setGroupSuggestOpen(false), 200)}
                            placeholder={t('upload.groupNamePlaceholder2')}
                            className="w-full bg-white text-base md:text-lg text-foreground placeholder:text-muted-foreground/30 border-2 border-border/60 rounded-2xl px-5 py-3.5 transition-all text-center md:text-left relative z-10 focus:outline-none focus:ring-0 focus:border-primary"
                          />
                          {groupSuggestOpen && groupSuggestions.length > 0 && (
                            <ul className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-auto rounded-xl border border-border bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] py-2 text-sm">
                              {groupSuggestions.map((name) => (
                                <li key={name}>
                                  <Button variant="ghost" type="button" className="w-full text-left px-5 py-3 lg:hover:bg-muted text-foreground rounded-none"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setGroupName(name); setGroupSuggestOpen(false); }}
                                  >{name}</Button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                  {!contents.length ? (
                    <div className="w-full space-y-6">
                      {guideSeen && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => { setGuideSeen(false); localStorage.removeItem('artier_upload_guide_seen'); }}
                            aria-label={t('upload.guideReopenLabel')}
                            title={t('upload.guideReopenLabel')}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-3 text-[13px] text-muted-foreground lg:hover:border-foreground/40 lg:hover:text-foreground transition-colors"
                          >
                            <HelpCircle className="h-4 w-4" aria-hidden />
                            {t('upload.guideReopen')}
                          </button>
                        </div>
                      )}
                      {/* 가이드 */}
                      {!guideSeen && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-400">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground mb-1">{t('upload.guideStep1')}</p>
                              <p className="text-xs text-muted-foreground">{t('upload.guideStep1Hint')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setGuideSeen(true); localStorage.setItem('artier_upload_guide_seen', '1'); }}
                              aria-label={t('upload.guideCloseBtn')}
                              className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-input bg-white p-10 sm:p-12 text-center transition-all lg:hover:border-primary lg:hover:bg-primary/5">
                        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="mb-2 text-sm font-medium text-foreground">{t('upload.dropzoneTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('upload.dropzoneFormats')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full pb-20 z-10">
                      <div className="relative z-10 flex flex-col" style={{ gap: `${CONTENT_SPACING}px` }}>
                        {contents.map((content, index) => (
                          <div
                            key={content.id}
                            className={`relative transition-all group/block ${dragIndex === index ? 'opacity-50 scale-95' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onMouseEnter={() => setHoveredBlockId(content.id)}
                            onMouseLeave={() => setHoveredBlockId(null)}
                          >
                            {/* ── 콘텐츠 편집기 툴바 (호버 또는 선택 시 표시 — 터치 환경 지원) ── */}
                            {(hoveredBlockId === content.id || selectedContentId === content.id) && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-foreground/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  type="button"
                                  aria-label={t('upload.toolbarReplace')}
                                  onClick={(e) => { e.stopPropagation(); setReplaceTargetId(content.id); replaceFileInputRef.current?.click(); }}
                                  className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors"
                                >
                                  <Replace className="h-4.5 w-4.5" />
                                  <span className="text-[10px] font-medium leading-tight">{t('upload.toolbarReplace')}</span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={t('upload.toolbarDelete')}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!(await openConfirm({ title: t('upload.confirmDeleteImage'), destructive: true, confirmLabel: t('profile.delete') }))) return;
                                    const removeIdx = contents.findIndex((c) => c.id === content.id);
                                    setContents(contents.filter((c) => c.id !== content.id));
                                    if (selectedContentId === content.id) setSelectedContentId(null);
                                    setCoverImageIndex((prev) => {
                                      if (removeIdx < 0) return prev;
                                      if (prev === removeIdx) return 0;
                                      if (prev > removeIdx) return Math.max(0, prev - 1);
                                      return prev;
                                    });
                                  }}
                                  className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-red-300 hover:text-red-400 hover:bg-white/20 active:bg-white/30 transition-colors"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                  <span className="text-[10px] font-medium leading-tight">{t('upload.toolbarDelete')}</span>
                                </button>
                              </div>
                            )}

                            {/* ── 콘텐츠 블록 렌더링 ── */}
                            <div
                              onClick={() => setSelectedContentId(content.id)}
                              className={`relative w-full cursor-pointer transition-all overflow-hidden rounded-xl py-8 sm:py-10 ${selectedContentId === content.id ? 'ring-4 ring-ring ring-offset-2' : ''}`}
                            >
                              {/* Dynamic Color Extracted Background (Blur Effect) 동일하게 적용 */}
                              <div className="absolute inset-0 z-0 bg-[#f4f4f4] pointer-events-none overflow-hidden">
                                <img src={content.url} className="w-full h-full object-cover blur-[120px] opacity-[0.95] scale-[1.3]" alt="" />
                                <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
                              </div>

                              <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6">
                                <div className="relative w-full max-w-[1000px] flex justify-center text-center shadow-[0_15px_50px_rgba(0,0,0,0.2)] bg-black/5">
                                  <ImageWithFallback 
                                    src={content.url} 
                                    alt={normalizeStoredPieceTitle(content.title) || tn('upload.imageFallback', { n: String(index + 1) })} 
                                    className="mx-auto block max-w-full w-auto h-auto object-contain max-h-[85vh]"
                                  />
                                </div>
                              </div>
                              <div className="absolute top-4 left-4 flex items-center gap-2 z-20 pointer-events-none">
                                <div className="bg-black/60 text-white rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm shadow-md">
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 이미지 추가 */}
                        {contents.length < 10 && (
                          <div className="pt-8 w-full flex justify-center">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center w-full max-w-md py-10 border-2 border-dashed border-input rounded-[2rem] bg-white/50 backdrop-blur-sm lg:hover:bg-white lg:hover:border-primary lg:hover:shadow-md transition-all duration-300">
                              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                {tn('upload.addImageProgress', { n: String(contents.length) })}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* ── 우측 사이드바 (데스크탑: 고정 / 모바일: 이미지 선택 시 풀스크린 오버레이) ── */}
                <div
                  className={`${selectedContentId ? 'fixed inset-0 z-[55] bg-white flex flex-col md:static md:inset-auto md:z-30 md:w-[380px]' : 'hidden md:flex md:w-[380px]'} md:bg-white md:border-l md:border-border md:flex-col md:shrink-0 md:shadow-[-10px_0_40px_rgba(0,0,0,0.03)]`}
                >
                  {selectedContentId && (
                    <div className="px-6 py-2 border-b border-border/40 flex items-center md:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedContentId(null)}
                        aria-label={t('upload.close')}
                        className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-full shrink-0"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col">
                  {/* ── 선택된 이미지 편집 패널 ── */}
                  {selectedContentId ? (() => {
                    const si = contents.findIndex((c) => c.id === selectedContentId);
                    const sc = contents[si];
                    if (!sc) return null;

                    return (
                      <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* 2열 이미지 그리드 */}
                        <div className="grid grid-cols-2 gap-2">
                          {contents.map((c, idx) => {
                            const assignedName = c.artist?.name || c.nonMemberArtist?.displayName || '';
                            const assignedAvatar = c.artist?.avatar || '';
                            const showStatus = uploadType === 'group';
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedContentId(c.id)}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${c.id === selectedContentId ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                              >
                                <ImageWithFallback src={c.url} alt="" className="w-full h-full object-cover" />
                                {showStatus && assignedName && (
                                  <span className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium pl-0.5 pr-1.5 py-0.5 rounded-full max-w-[calc(100%-2rem)]">
                                    {assignedAvatar
                                      ? <img src={assignedAvatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                      : <span className="w-4 h-4 rounded-full bg-white/30 shrink-0" />}
                                    <span className="truncate">{assignedName}</span>
                                  </span>
                                )}
                                <span className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${c.id === selectedContentId ? 'bg-primary text-white' : 'bg-black/50 text-white/80'}`}>
                                  {idx + 1}
                                </span>
                              </button>
                            );
                          })}
                          {contents.length < 10 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1"
                            >
                              <Plus className="h-5 w-5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground font-medium">{contents.length}/10</span>
                            </button>
                          )}
                        </div>

                        {/* 개별 작품명 */}
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {t('upload.pieceTitleLabel')} <span className="font-normal lowercase normal-case">{t('upload.labelOptional')}</span>
                          </label>
                          <input
                            type="text" value={sc.title || ''} maxLength={120}
                            onChange={(e) => {
                              const v = e.target.value.slice(0, 120);
                              setContents(contents.map((c) => c.id === selectedContentId ? { ...c, title: v } : c));
                            }}
                            placeholder={t('upload.pieceTitlePlaceholder')}
                            className="w-full px-4 py-3 bg-muted/20 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>

                        {/* ── 작가 지정 (함께 올리기 전용) ── */}
                        {uploadType === 'group' && (
                          <div className="space-y-3 pt-4 border-t border-border/40">
                            <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                              {t('upload.artistAssignRequired')} *
                            </label>

                            {/* 탭 헤더 */}
                            <div className="flex bg-muted/40 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setArtistInputTab('member')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${artistInputTab === 'member' ? 'bg-white shadow border border-border/40 text-foreground' : 'text-muted-foreground'}`}
                              >{t('upload.tabMemberSearch')}</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setArtistInputTab('non-member');
                                  if (sc.artistType !== 'non-member') {
                                    setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', artist: undefined, nonMemberArtist: { displayName: '', phoneNumber: '' } } : c));
                                  }
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${artistInputTab === 'non-member' ? 'bg-white shadow border border-border/40 text-foreground' : 'text-muted-foreground'}`}
                              >{t('upload.tabDirectInput')}</button>
                            </div>

                            {/* 탭 콘텐츠 */}
                            {artistInputTab === 'member' ? (
                              <div className="space-y-3 mt-4">
                                {sc.artist && sc.artistType === 'member' ? (
                                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-3">
                                      <img src={sc.artist.avatar} alt={sc.artist.name} className="h-10 w-10 rounded-full object-cover border border-white shadow-sm" />
                                      <span className="text-sm font-bold text-foreground">{sc.artist.name}</span>
                                    </div>
                                    <Button size="icon" variant="ghost" aria-label={t('upload.close')} onClick={() => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artist: undefined, artistType: undefined } : c))} className="text-muted-foreground min-h-[44px] min-w-[44px] h-11 w-11 rounded-full hover:bg-white/50"><X className="h-4 w-4" /></Button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                      type="text" value={artistSearch} onChange={(e) => setArtistSearch(e.target.value)}
                                      placeholder={t('upload.memberSearchPh')}
                                      className="w-full pl-11 pr-4 py-3.5 bg-muted/20 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                    />
                                    {artistSearch && (
                                      <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                                        {artists.filter(a => a.name.toLowerCase().includes(artistSearch.toLowerCase())).slice(0, 10).map(artist => (
                                          <button key={artist.id}
                                            type="button"
                                            onClick={() => {
                                              setContents(contents.map(c => c.id === selectedContentId ? { ...c, artist: { id: artist.id, name: artist.name, avatar: artist.avatar }, artistType: 'member' } : c));
                                              setArtistSearch('');
                                            }}
                                            className="w-full min-h-[56px] text-left px-5 py-3 flex items-center gap-4 lg:hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none border-b border-border/30 last:border-b-0 transition-colors"
                                          >
                                            <img src={artist.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-border/50" />
                                            <div>
                                              <div className="text-sm font-bold text-foreground">{artist.name}</div>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4 p-5 bg-amber-50/60 border border-amber-200/60 rounded-2xl mt-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-amber-800 mb-1.5 px-1">{t('upload.nonMemberNameLabel2')}<RequiredMark /></label>
                                  <input
                                    type="text" value={sc.nonMemberArtist?.displayName || ''}
                                    onChange={(e) => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', nonMemberArtist: { ...c.nonMemberArtist, displayName: e.target.value, phoneNumber: c.nonMemberArtist?.phoneNumber || '' } } : c))}
                                    placeholder={t('upload.nonMemberNamePh')}
                                    className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-amber-800 mb-1.5 px-1">{t('upload.nonMemberPhoneLabel2')}</label>
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="tel" value={sc.nonMemberArtist?.phoneNumber || ''}
                                      onChange={(e) => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', nonMemberArtist: { ...c.nonMemberArtist, displayName: c.nonMemberArtist?.displayName || '', phoneNumber: e.target.value } } : c))}
                                      placeholder="010-0000-0000"
                                      className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
                                    />
                                    <Button
                                      type="button"
                                      disabled={
                                        !sc.nonMemberArtist?.phoneNumber ||
                                        sc.nonMemberArtist.phoneNumber.replace(/[^0-9]/g, '').length < 10 ||
                                        smsSentPhones.has(sc.nonMemberArtist.phoneNumber.trim())
                                      }
                                      onClick={() => {
                                        const phone = sc.nonMemberArtist?.phoneNumber?.trim() || '';
                                        if (!phone || smsSentPhones.has(phone)) return;
                                        setSmsSentPhones((prev) => new Set(prev).add(phone));
                                        toast.success(tn('upload.toastSmsInviteSent', { phone }));
                                      }}
                                      className="w-full bg-amber-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
                                    >
                                      {smsSentPhones.has(sc.nonMemberArtist?.phoneNumber?.trim() || '')
                                        ? `✓ ${t('upload.smsInviteSent')}`
                                        : t('upload.smsInviteBtn')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-input rounded-2xl bg-white/50 hover:bg-white hover:border-primary hover:shadow-md transition-all duration-300">
                        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2.5">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {tn('upload.addImageProgress', { n: String(contents.length) })}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* 하단 최종 제출 박스 (통합 스크롤 영역에 포함) */}
                  <div className="p-6 md:p-8 border-t border-border/40 bg-white space-y-5 mt-auto">
                    <div className="space-y-3">
                      <div className={`rounded-xl p-3.5 border ${publishBlockers.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`} role="status" aria-live="polite">
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${publishBlockers.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{t('upload.blockersTitle')}</p>
                        <ul className="space-y-1.5">
                          {publishChecklist.map((item) => (
                            <li key={item.key} className={`flex items-center gap-2 text-xs ${item.disabled ? 'text-muted-foreground/50' : item.done ? 'text-green-600' : 'text-red-700'}`}>
                              <span className={`font-bold text-base leading-none ${item.disabled ? 'text-muted-foreground/40' : item.done ? 'text-green-500' : 'text-red-500'}`}>{item.disabled ? '—' : item.done ? '✓' : '✕'}</span>
                              <span className={`font-medium ${item.disabled ? 'opacity-40' : item.done ? 'line-through opacity-60' : ''}`}>{item.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        disabled={isPublishing || publishBlockers.length > 0}
                        aria-label={publishBlockers.length > 0 ? `${t('upload.blockersTitle')}: ${publishBlockers.map((b) => b.label).join(', ')}` : undefined}
                        onClick={handleOpenDetails}
                        className={`w-full py-6 rounded-2xl text-base font-extrabold transition-all duration-300 ${
                          publishBlockers.length === 0 ? 'bg-foreground text-background shadow-xl hover:scale-[1.02]' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPublishing
                          ? (editingWorkId ? t('upload.editModeSaving') : t('upload.publishing'))
                          : editingWorkId
                            ? t('upload.editModeSave')
                            : `${t('upload.nextStep')} →`}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        className="w-full py-6 rounded-2xl text-[15px] font-semibold text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                      >
                        {t('upload.saveDraft')}
                      </Button>

                      {contents.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => setReorderMode(true)}
                          className="w-full py-5 rounded-2xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-50 transition-colors gap-2"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          {t('upload.reorderGridBtn')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        disabled={contents.length === 0}
                        onClick={() => setPreviewMode(true)}
                        className="w-full py-5 rounded-2xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-50 transition-colors disabled:opacity-40 gap-2"
                      >
                        <Monitor className="w-4 h-4" />
                        {t('upload.screenPreview')}
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>

                {/* ── 모바일 하단 고정 바 ── */}
                <div className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 space-y-2">
                  {contents.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-1 text-xs min-h-[44px]" aria-label={t('upload.addImage')}>
                        <Plus className="h-4 w-4" />
                        <span className="truncate">{t('upload.addImage')}</span>
                      </Button>
                      {contents.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => setReorderMode(true)} className="flex-1 gap-1 text-xs min-h-[44px]" aria-label={t('upload.reorderGridBtn')}>
                          <ArrowUpDown className="h-4 w-4" />
                          <span className="truncate">{t('upload.reorderGridBtn')}</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} className="flex-1 gap-1 text-xs min-h-[44px]" aria-label={t('upload.screenPreview')}>
                        <Monitor className="h-4 w-4" />
                        <span className="truncate">{t('upload.screenPreview')}</span>
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!contents.length && (
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-2 text-sm min-h-[44px]">
                        <ImageIcon className="h-4 w-4" />{t('upload.addImage')}
                      </Button>
                    )}
                    {contents.length > 0 && (
                      <Button
                        disabled={publishBlockers.length > 0 || isPublishing}
                        aria-label={publishBlockers.length > 0 ? `${t('upload.blockersTitle')}: ${publishBlockers.map((b) => b.label).join(', ')}` : undefined}
                        onClick={handleOpenDetails}
                        className="flex-1 text-sm min-h-[44px]"
                      >
                        {isPublishing
                          ? (editingWorkId ? t('upload.editModeSaving') : t('upload.publishing'))
                          : editingWorkId
                            ? t('upload.editModeSave')
                            : `${t('upload.nextStep')} →`}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

    </div>
  );
}
