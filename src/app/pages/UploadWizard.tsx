import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams, useBlocker } from 'react-router-dom';
import { Image as ImageIcon, Plus, X, Search, GripVertical, ArrowLeft, ChevronLeft, ChevronRight, Trash2, Replace, ArrowUpDown, Monitor, Users, Star, Check, CircleHelp } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore, useAuthStore } from '../store';
import { issueInviteToken, activateInviteToken, deactivateInviteToken } from '../utils/inviteTokenStore';
import { InviteShareButton } from '../components/InviteShareButton';
import { REJECTION_REASON_LABEL_KEY } from '../utils/reviewLabels';
import { buildVisibilityPatch } from '../utils/workVisibility';

/* ─── @dnd-kit 리오더 아이템 ─── */
function SortableReorderItem({ item, index, isDragOverlay }: { item: ContentItem; index: number; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`flex flex-col gap-2 p-3 border rounded-xl transition-all cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'border-primary bg-muted shadow-sm scale-105 z-10' : 'border-border/40 bg-white hover:border-border/80'
      }`}
    >
      <div className="relative flex aspect-square w-full items-center justify-center rounded-lg overflow-hidden">
        <BlurDominantBg src={item.url} />
        {item.url && <ImageWithFallback src={item.url} alt={item.title || ''} className="relative z-10 h-full w-full object-contain object-center" />}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
          <div className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">{index + 1}</div>
        </div>
        <div className="absolute top-2 right-2 z-20 bg-black/40 text-white p-1 rounded-md backdrop-blur-sm"><GripVertical className="h-4 w-4" /></div>
      </div>
      <span className="text-sm text-foreground truncate w-full text-center font-medium mt-1">
        {normalizeStoredPieceTitle(item.title) || `${index + 1}`}
      </span>
    </div>
  );
}

/** 작품 이미지를 통째로 blur해 톤이 자연스럽게 묻어나는 letterbox 배경. */
function BlurDominantBg({ src }: { src?: string }) {
  if (!src) return null;
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#f4f4f4]" aria-hidden>
      <img src={src} className="w-full h-full object-cover blur-[40px] opacity-[0.95] scale-[1.3]" alt="" />
      <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
    </div>
  );
}
import type { Work } from '../data';
import type { Draft } from '../store';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '../components/ImageWithFallback';

import { shouldBlockCameraPhoto } from '../utils/cameraExifBlock';
import {
  collectGroupNameSuggestions,
  getLastUsedGroupName,
  setLastUsedGroupName,
} from '../utils/groupNameRegistry';
import { TITLE_FIELD_MAX_LEN } from '../utils/workDisplay';
import { Button } from '../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { pointsOnWorkPublished } from '../utils/pointsBackground';
import { pushDemoNotification } from '../utils/pushDemoNotification';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { openConfirm } from '../components/ConfirmDialog';
import { RequiredMark } from '../components/RequiredMark';
import { containsProfanity } from '../utils/profanityFilter';
import { todayLocalIso } from '../utils/localDate';
import { generatePieceId, reconcilePieceIds } from '../utils/pieceId';
import { normalizeStoredPieceTitle } from '../utils/workDisplay';
import { WorkDetailModal } from '../components/WorkDetailModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WizardProgress } from '../components/upload/WizardProgress';
import { Step1Images } from '../components/upload/Step1Images';
import { Step2Titles } from '../components/upload/Step2Titles';
import { Step3Artists } from '../components/upload/Step3Artists';
import { Step4Submit } from '../components/upload/Step4Submit';
import type { RegisteredArtist, WizardStep } from '../components/upload/types';

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
  nonMemberArtist?: { displayName: string };
  artistType?: 'member' | 'non-member' | 'self' | 'unknown';
  fullWidth?: boolean; // default false (padded), true = 전폭 확장
  /** piece 안정 식별자(Policy §15.4 / §32.1 #8b). 초안·편집·발행 전 과정에서 보존.
   *  새 이미지 추가·이미지 교체 시 새로 발급. 발행 시 work.imagePieceIds[i]로 직결. */
  pieceId?: string;
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
export default function UploadWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useI18n();
  const auth = useAuthStore();

  // 비로그인 시 로그인 화면으로 (URL 직접 진입 차단)
  useEffect(() => {
    if (!auth.isLoggedIn()) {
      const fullPath = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(fullPath)}`, { replace: true });
    }
  }, [auth, navigate]);

  // 기존 초안 감지 — 빈 양식으로 진입했을 때 저장된 초안이 있으면 안내
  useEffect(() => {
    const hasDraftParam = searchParams.get('draft');
    const hasEditParam = searchParams.get('edit');
    if (hasDraftParam || hasEditParam) return;
    const drafts = draftStore.getDrafts();
    if (drafts.length === 0) return;
    const latest = drafts[0];
    toast(t('upload.existingDraftNotice'), {
      duration: 8000,
      action: {
        label: t('upload.existingDraftResume'),
        onClick: () => navigate(`/upload?draft=${latest.id}`, { replace: true }),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };

  /* ── 모드 ── */
  const [reorderMode, setReorderMode] = useState(false);
  // ── Wizard 단계 ──
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [registeredArtists, setRegisteredArtists] = useState<RegisteredArtist[]>([]);
  const [assigningArtistIdx, setAssigningArtistIdx] = useState(0);
  const [step3NeedsReview, setStep3NeedsReview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  // USR-UPL-08: 비회원 슬롯 발행 전 확인 모달 (Policy §3 v2.14)
  const [nonMemberPreviewModal, setNonMemberPreviewModal] = useState<string[] | null>(null);
  const nonMemberModalConfirmed = useRef(false);
  const [publishedResult, setPublishedResult] = useState<{ workId: string; autoApproved: boolean; hasNonMemberInvites: boolean; resubmittedFromRejected?: boolean } | null>(null);
  /* dragIndex 삭제됨 — @dnd-kit이 드래그 상태를 자체 관리 */
  /* hoveredBlockId 삭제됨 — 툴바를 항상 노출하므로 호버 추적 불필요 */

  /* ── 업로드 진행률 (WebP 변환 + 검증 시간 피드백) ── */
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  /* ── 이미지 교체 ── */
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  /* ── 콘텐츠 ── */
  const [contents, setContents] = useState<ContentItem[]>([]);

  /* ── 유형 선택 (Step 0) ── */
  const [uploadType, setUploadType] = useState<'solo' | 'group' | null>(null);

  /* ── 대표(커버) 이미지 ──
   * - coverImageIndex 0+ : 업로드한 작품 중 인덱스. 이 경우 customCoverUrl 무시
   * - customCoverUrl 세팅 + coverImageIndex = -1 : 로컬 파일로 올린 별도 커버 (작품 배열엔 포함 안 됨)
   */
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(tn('upload.errFileType', { name: file.name }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(tn('upload.errFileTooBig', { name: file.name }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setCustomCoverUrl(reader.result);
      setCoverImageIndex(-1);
    };
    reader.readAsDataURL(file);
  };

  const clearCustomCover = () => {
    setCustomCoverUrl(null);
    if (coverImageIndex === -1) setCoverImageIndex(0);
  };

  /* ── 세부 정보 ── */
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exhibitionName, setExhibitionName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupSuggestOpen, setGroupSuggestOpen] = useState(false);
  const [workTick, setWorkTick] = useState(0);
  const [isOriginalWork, setIsOriginalWork] = useState(false);
  const [consentCuration, setConsentCuration] = useState(true);
  const [artistInputTab, setArtistInputTab] = useState<'member' | 'non-member'>('member');
  /* ── 변환 프로그레스 ── */

  const [cameraBlockNotice, setCameraBlockNotice] = useState(false);

  /* ── 이벤트 응모는 USR-EVT-04 응모 모달 단일 진입점 (Policy §25.2). ?event= 진입은
   *    routes.ts redirectUploadEventToEntry loader가 /events/<id>?entry=open으로 redirect.
   */

  /* ── 이미지 선택 ── */

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  const artistSearchRef = useRef<HTMLDivElement>(null);
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
    setSelectedContentId(null);
    setCoverImageIndex(0);
    setCustomCoverUrl(null);
    setPreviewMode(false);
    setReorderMode(false);
    setShowDetailsModal(false);
    setArtistSearch('');
  }, [newKey]);

  useEffect(() => {
    return workStore.subscribe(() => setWorkTick((x) => x + 1));
  }, []);

  useEffect(() => {
    if (uploadType !== 'group') return;
    if (groupName.trim()) return;
    const last = getLastUsedGroupName();
    if (last) setGroupName(last);
  }, [uploadType]);

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
    if (typeof draft.coverImageIndex === 'number') setCoverImageIndex(draft.coverImageIndex);
    if (draft.customCoverUrl) setCustomCoverUrl(draft.customCoverUrl);
    let restored = draft.contents.map((c) => ({
      id: c.id,
      type: 'image' as const,
      url: c.url,
      title: c.title,
      artist: c.artist,
      nonMemberArtist: c.nonMemberArtist,
      artistType: c.artistType,
      fullWidth: c.fullWidth,
      // 초안 저장 시점에 발급된 pieceId 보존(부재 시 발행 단계에서 발급).
      pieceId: c.pieceId,
    }));
    const withUrl = restored.filter((c) => c.url);
    const ex = (draft.exhibitionName ?? draft.title ?? '').trim();
    if (withUrl.length === 1 && ex && !withUrl[0]?.title?.trim()) {
      restored = restored.map((c) => (c.id === withUrl[0]!.id ? { ...c, title: ex.slice(0, TITLE_FIELD_MAX_LEN) } : c));
    }
    setContents(restored);
    toast.success(t('upload.toastDraftLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 기존 작품 수정 모드 ── */
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  // 반려된 전시를 편집 중인지 (Policy §12.1.2 / IA USR-UPL-03 — 빨강 인라인 배너 + CTA 라벨 변경 트리거)
  const editingRejectedWork = useMemo(() => {
    if (!editingWorkId) return null;
    const w = workStore.getWork(editingWorkId);
    return w?.feedReviewStatus === 'rejected' ? w : null;
  }, [editingWorkId]);
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const work = workStore.getWork(editId);
    if (!work) {
      toast.error(t('upload.errWorkNotFound'));
      navigate('/upload', { replace: true });
      return;
    }
    setEditingWorkId(editId);
    setUploadType(work.primaryExhibitionType === 'group' ? 'group' : 'solo');
    setExhibitionName(work.exhibitionName || '');
    const images = Array.isArray(work.image) ? work.image : [work.image];
    // piece 안정 ID — 기존 work에 부재하면(레거시) 즉석 발급해 편집 후 publish 시점에 work.imagePieceIds로 반영.
    const reconciledIds = reconcilePieceIds(images.filter(Boolean).length, work.imagePieceIds);
    setContents(images.filter(Boolean).map((url, i) => {
      const ia = work.imageArtists?.[i];
      const item: ContentItem = {
        id: `edit-${i}-${Date.now()}`,
        type: 'image' as const,
        url: url as string,
        title: work.imagePieceTitles?.[i] || '',
        pieceId: reconciledIds[i],
      };
      if (ia?.type === 'member' && ia.memberId) {
        item.artist = { id: ia.memberId, name: ia.memberName || '', avatar: ia.memberAvatar || '' };
        item.artistType = 'member';
      } else if (ia?.type === 'non-member' && ia.displayName) {
        item.nonMemberArtist = { displayName: ia.displayName };
        item.artistType = 'non-member';
      } else if (ia?.type === 'unknown') {
        // 초대 자동 연결 후 disavow된 슬롯(Policy §3.5) — 'unknown' 유지. 편집 시 사용자가 수동으로 재지정 가능.
        item.artistType = 'unknown';
      }
      return item;
    }));
    if (work.groupName) setGroupName(work.groupName);
    if (typeof work.coverImageIndex === 'number') setCoverImageIndex(work.coverImageIndex);
    if (work.customCoverUrl) setCustomCoverUrl(work.customCoverUrl);
    toast.success(t('upload.toastEditLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 편집 모드: 기존 imageArtists에서 registeredArtists 재구성
  useEffect(() => {
    if (!editingWorkId || contents.length === 0) return;
    const seen = new Map<string, RegisteredArtist>();
    contents.forEach((c) => {
      if (c.artistType === 'member' && c.artist) {
        if (!seen.has(c.artist.id)) {
          seen.set(c.artist.id, {
            id: Math.random().toString(36).slice(2),
            type: 'member',
            memberId: c.artist.id,
            memberName: c.artist.name,
            memberAvatar: c.artist.avatar,
          });
        }
      } else if (c.artistType === 'non-member' && c.nonMemberArtist?.displayName) {
        const key = `nm_${c.nonMemberArtist.displayName}`;
        if (!seen.has(key)) {
          seen.set(key, {
            id: Math.random().toString(36).slice(2),
            type: 'non-member',
            displayName: c.nonMemberArtist.displayName,
          });
        }
      }
    });
    if (seen.size > 0) setRegisteredArtists([...seen.values()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingWorkId]);

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
          setCameraBlockNotice(true);
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
          pieceId: generatePieceId(),
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
      // 이미지 교체 = 새 piece. 기존 pieceId가 큐레이션에 박혀 있다면 발행 시 cascade로 stale 정리됨.
      setContents(contents.map((c) => c.id === replaceTargetId ? { ...c, url, pieceId: generatePieceId() } : c));
      toast.success(t('upload.toastImageReplaced'));
    } catch { toast.error(tn('upload.errFileRead', { name: file.name })); }
    finally {
      setUploadProgress(null);
    }
    e.target.value = '';
    setReplaceTargetId(null);
  };




  /* ━━━━━━ 전시 생성 ━━━━━━ */

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
    if (!exhibitionName.trim()) {
      toast.error(t('upload.errExhibitionNameRequired'));
      return;
    }
    if (!isOriginalWork) {
      toast.error(
        uploadType === 'group' ? t('upload.errCheckGroupConsent') : t('upload.errCheckOriginal'),
      );
      return;
    }

    // 비속어 검증 (필드별)
    if (exhibitionName && containsProfanity(exhibitionName)) {
      toast.error(t('upload.errProfanityExhibitionName'));
      return;
    }
    if (groupName && containsProfanity(groupName)) {
      toast.error(t('upload.errProfanityGroupName'));
      return;
    }

    if (uploadType === 'group' && !groupName.trim()) {
      toast.error(t('upload.errGroupNameRequired'));
      return;
    }

    // 그룹 업로드 시 작가 검증 (이름만 있으면 통과, 번호는 선택). 'unknown'(작가 미상) 슬롯은 유효한 상태로 허용.
    if (uploadType === 'group') {
      const missingIndices = imageContents
        .map((c, i) => (c.artistType !== 'unknown' && !c.artist && !c.nonMemberArtist?.displayName ? i + 1 : -1))
        .filter((i) => i > 0);
      if (missingIndices.length > 0) {
        toast.error(t('upload.errMissingArtistAt').replace('{positions}', missingIndices.join(', ')));
        return;
      }
    }

    const currentUser = artists[0];
    const urls = imageContents.map((c) => c.url!);
    // piece 안정 ID — content 순서·정체성을 그대로 work.imagePieceIds로 보존(Policy §15.4 / §32.1 #8b).
    // 부재 시 이 시점에 발급(레거시 work 편집·정상 흐름 미스 모두 커버).
    const imagePieceIds = imageContents.map((c) => c.pieceId ?? generatePieceId());
    const exFinal = exhibitionName.trim().slice(0, TITLE_FIELD_MAX_LEN);

    // v1.7: 작품명 자동생성 (저장값은 항상 TITLE_FIELD_MAX_LEN 이하)
    const imagePieceTitles = imageContents.map((c, i) => {
      const raw = (() => {
        if (c.title?.trim()) return c.title.trim();
        if (uploadType === 'group') {
          const artistName = c.artist?.name || c.nonMemberArtist?.displayName || '';
          return artistName
            ? tn('work.autoTitleArtist', { name: artistName, n: String(i + 1) })
            : tn('work.autoTitleNumbered', { n: String(i + 1) });
        }
        if (imageContents.length === 1) return exFinal || t('work.untitled');
        return t('work.untitled');
      })();
      return raw.slice(0, TITLE_FIELD_MAX_LEN);
    });

    const resolvedPieceTitle = imagePieceTitles[0] ?? '';
    const resolvedGroup =
      uploadType === 'group'
        ? groupName.trim().slice(0, TITLE_FIELD_MAX_LEN)
        : undefined;

    // v1.7: 그룹전시 자동 분류
    const uniqueArtists = new Set(
      imageContents.map((c) => c.artist?.id || c.nonMemberArtist?.displayName || 'self'),
    );
    const primaryExhibitionType = uploadType === 'group' && uniqueArtists.size >= 2 ? 'group' : uploadType === 'group' ? 'group' : 'solo';

    const imageArtists = imageContents.map((c) => {
      if (c.artistType === 'unknown') {
        // 이전 disavow로 생성된 '작가 미상' 슬롯 유지 (Policy §3.5). 업로더가 수정하지 않으면 그대로 보존.
        return { type: 'unknown' as const };
      }
      if (c.artistType === 'non-member' && c.nonMemberArtist) {
        return { type: 'non-member' as const, displayName: c.nonMemberArtist.displayName };
      }
      if (c.artist) {
        return { type: 'member' as const, memberId: c.artist.id, memberName: c.artist.name, memberAvatar: c.artist.avatar };
      }
      return { type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar };
    });

    const uploadedAt = todayLocalIso();
    const newWork: Work = {
      id: `user-${crypto.randomUUID()}`,
      title: resolvedPieceTitle,
      image: urls.length === 1 ? urls[0] : urls,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      description: '',
      tags: [],
      exhibitionName: exFinal,
      groupName: resolvedGroup,
      imagePieceTitles,
      imagePieceIds,
      primaryExhibitionType,
      imageArtists,
      ...buildVisibilityPatch(!import.meta.env.PROD && import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true' ? 'public' : 'pending_review'),
      uploadedAt,
      // 이벤트 응모는 USR-EVT-04 응모 모달에서 직접 발행 — USR-UPL-02 발행에 linkedEventId 부여 X
      coverImageIndex:
        customCoverUrl && coverImageIndex === -1
          ? -1
          : urls.length > 1
            ? Math.min(Math.max(0, coverImageIndex), urls.length - 1)
            : 0,
      customCoverUrl: customCoverUrl && coverImageIndex === -1 ? customCoverUrl : undefined,
    };

    // 이벤트 응모는 USR-EVT-04 응모 모달 단일 진입점 (Policy §25.2).
    // USR-UPL-02 일반 업로드 경로에서는 이벤트 연결을 받지 않음.

    // USR-UPL-08: 비회원 슬롯이 있으면 발행 전 확인 모달 인터셉트 (Policy §3 v2.14).
    if (!nonMemberModalConfirmed.current) {
      const nonMemberNames = contents
        .filter((c) => c.artistType === 'non-member' && (c.nonMemberArtist?.displayName ?? '').trim().length > 0)
        .map((c) => c.nonMemberArtist!.displayName);
      if (nonMemberNames.length > 0) {
        setNonMemberPreviewModal(nonMemberNames);
        return;
      }
    }
    nonMemberModalConfirmed.current = false;

    // Policy §13.6.1 — 수정 모드에서 원래 그룹 전시를 게시자 단독으로 전환하는 경우 확인 다이얼로그.
    if (editingWorkId) {
      const originalWork = workStore.getWork(editingWorkId);
      if (originalWork?.primaryExhibitionType === 'group') {
        const hasOtherArtists = imageArtists.some(
          (ia) =>
            (ia.type === 'member' && ia.memberId !== currentUser.id) ||
            ia.type === 'non-member',
        );
        if (!hasOtherArtists) {
          const confirmed = await openConfirm({
            title: t('upload.editSoloConvertTitle'),
            description: t('upload.editSoloConvertDesc'),
            confirmLabel: t('upload.editSoloConvertConfirm'),
          });
          if (!confirmed) return;
        }
      }
    }

    setIsPublishing(true);
    const targetId = editingWorkId || newWork.id;
    const wasEditingExistingWork = Boolean(editingWorkId);
    // PROD 빌드에선 자동 승인 비활성 (CLAUDE.md 환경 변수 가드 정합).
    // env 켜져 있어도 실서비스 빌드에서 사용자에게 검수 우회되지 않도록 강제.
    const autoApprove = !import.meta.env.PROD && import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true';

    // 편집 모드 차별 재검수: 이미지 계열 변경 여부를 먼저 판정해 둔다(토스트 분기에도 사용).
    // Policy §12.1.2 / PRD_User USR-UPL-02 D.
    let editDiff: {
      imageFieldsChanged: boolean;
      originalStatus: 'pending' | 'approved' | 'rejected';
    } | null = null;

    if (editingWorkId) {
      // 전시 수정: id·likes·saves·uploadedAt·artistId·artist·rejectionHistory 등 불변 필드는 보존하고
      // 편집 가능 필드만 갱신한다. Policy §12.1.2 · PRD_User USR-UPL-02 D.
      //
      // feedReviewStatus 결정 규칙:
      //  - 이미지 계열(image 배열·imageArtists·customCoverUrl) 변경 시 → pending 재설정(재검수 필요)
      //  - 메타만 변경(전시명·그룹명·작품명·커버 인덱스·이벤트 연결) 시 → 원본 상태 유지
      //    (approved 유지 = 즉시 반영 · pending 유지 = 큐 안에서 갱신 · rejected 유지 = 반려 사유 미해소)
      //  - auto-approve 환경은 기존 동작 유지(즉시 approved).
      //
      // rejectionReason:
      //  - 상태가 rejected에서 바뀌면 초기화(빈 값). 같은 rejected로 유지되면 원본 사유 보존.
      //
      // rejectionHistory: 명시적으로 전달하지 않아 updateWork 머지 규칙상 원본 이력 그대로 보존됨.
      const original = workStore.getWork(editingWorkId);
      const originalStatus: 'pending' | 'approved' | 'rejected' = original?.feedReviewStatus ?? 'pending';

      // 이미지 계열 변경 판정
      const origImages: string[] = original
        ? (Array.isArray(original.image) ? original.image : [original.image])
        : [];
      const newImages: string[] = Array.isArray(newWork.image) ? newWork.image : [newWork.image];
      const imagesArrayChanged =
        origImages.length !== newImages.length || origImages.some((u, i) => u !== newImages[i]);
      const artistsJsonChanged =
        JSON.stringify(original?.imageArtists ?? []) !== JSON.stringify(newWork.imageArtists ?? []);
      const coverChanged = (original?.customCoverUrl || null) !== (newWork.customCoverUrl || null);
      const imageFieldsChanged = imagesArrayChanged || artistsJsonChanged || coverChanged;

      let nextStatus: 'pending' | 'approved' | 'rejected';
      if (autoApprove) {
        nextStatus = 'approved';
      } else if (imageFieldsChanged) {
        nextStatus = 'pending';
      } else if (originalStatus === 'rejected') {
        // Policy §12.1.2 예외: rejected 메타-only 수정 발행은 사용자 의도가
        // "재검수 요청"이므로 강제 pending 전이 + rejectionReason 초기화.
        nextStatus = 'pending';
      } else {
        nextStatus = originalStatus;
      }

      // rejectionReason 처리: Policy §12.1.2 예외 적용으로 rejected 편집 발행은 항상 pending 전이 →
      // 모든 편집 발행 결과는 rejected가 아니므로 rejectionReason은 항상 초기화.
      const nextRejectionReason: Work['rejectionReason'] | undefined = undefined;

      editDiff = { imageFieldsChanged, originalStatus };

      // piece ID — contents.pieceId가 편집 진입 시 reconcile로 채워졌고, 이미지 추가/교체 시점에
      // 새 ID가 발급되므로 newWork.imagePieceIds(=imageContents 매핑)를 그대로 사용한다.
      // workStore.updateWork가 imagePieceIds 변경을 감지해 stale piece의 큐레이션 참조를 자동 cascade.

      const editingUpdates: Partial<Work> = {
        title: newWork.title,
        image: newWork.image,
        exhibitionName: newWork.exhibitionName,
        groupName: newWork.groupName,
        imagePieceTitles: newWork.imagePieceTitles,
        imagePieceIds: newWork.imagePieceIds,
        primaryExhibitionType: newWork.primaryExhibitionType,
        imageArtists: newWork.imageArtists,
        coverImageIndex: newWork.coverImageIndex,
        customCoverUrl: newWork.customCoverUrl,
        ...buildVisibilityPatch(
          nextStatus === 'approved' ? 'public' : nextStatus === 'pending' ? 'pending_review' : 'rejected',
        ),
        rejectionReason: nextRejectionReason,
      };
      workStore.updateWork(editingWorkId, editingUpdates);
      // G14: 편집으로 pending 회귀 시 토큰 deactivate (work feedReviewStatus와 정합).
      // 친구 측 invite 흐름에서 active 토큰이 pending work를 가리키는 모순 방지.
      if (nextStatus === 'pending') {
        deactivateInviteToken(editingWorkId);
      }
    } else {
      workStore.addWork(newWork);
    }
    if (resolvedGroup) setLastUsedGroupName(resolvedGroup);
    if (!editingWorkId) pointsOnWorkPublished(newWork);

    // Policy §3 v2.14: 비회원 슬롯이 1개 이상이면 초대 토큰 발급 (inactive 상태로 시작).
    // 검수 승인 시점에 activate, 자동 승인 환경(VITE_UPLOAD_AUTO_APPROVE)이면 즉시 active.
    const targetWorkId = editingWorkId || newWork.id;
    const hasNonMemberSlots = imageArtists.some((ia) => ia.type === 'non-member' && (ia.displayName ?? '').trim().length > 0);
    if (hasNonMemberSlots) {
      issueInviteToken(targetWorkId, newWork.artistId);
      if (autoApprove) {
        activateInviteToken(targetWorkId);
      }
    } else if (editingWorkId) {
      // 편집으로 비회원 슬롯이 0개가 되면 기존 토큰 영구 무효화 (Policy §3 — "비회원 자리 0 시 취소")
      import('../utils/inviteTokenStore').then(({ revokeInviteToken }) => revokeInviteToken(editingWorkId));
    }

    /**
     * 발행 알림 (그룹 전시 한정 · 신규 발행만):
     * 참여 멤버 작가 각각에게 "내 작품이 공개됐어요" 시스템 알림 push.
     * - 본인(`currentUser.id`)은 제외.
     * - 멤버(`type: 'member'`) 슬롯만 대상. 비회원(`type: 'non-member'`)은 SMS 발송이
     *   별도 (`hasNonMemberInvites` 분기) — 백엔드 연동 후 통합 예정.
     * - Phase 1 데모 환경: `pushDemoNotification`은 현재 세션(데모 사용자)의 알림함에만
     *   쌓이므로 단일 사용자 관점에서 "강사 발행 → 본인 알림함에 멤버 수만큼 새 알림"
     *   으로 동작 확인 가능. 백엔드 연동 시 `targetArtistId` 라우팅으로 진짜 수강생에게 전달.
     */
    // 그룹 전시 게시 시점 알림 제거 — 검수 중 상태에서 알림이 와 혼란을 줄 수 있음.
    // 참여 작가는 검수 승인 시점(ContentReview.tsx review.notifApprovedForParticipant)에만 알림 수신.

    setShowDetailsModal(false);

    // Clear draft that was used for this publish
    const loadedDraftId = searchParams.get('draft');
    if (loadedDraftId) {
      draftStore.deleteDraft(loadedDraftId);
    }

    // 비회원 슬롯이 있으면 발행 완료 화면에서 InviteShareButton 노출 (Policy §3 v2.14 토큰 모델)
    const hasNonMemberInvites = imageArtists.some((a) => a.type === 'non-member' && (a.displayName ?? '').trim().length > 0);

    if (editingWorkId && editDiff) {
      // 편집 저장 후 5 시나리오 분기 (Policy §12.1.2 토스트 문구).
      const { originalStatus, imageFieldsChanged } = editDiff;
      let toastKey: string;
      if (originalStatus === 'approved' && !imageFieldsChanged) {
        toastKey = 'upload.editModeToastApprovedKept';
      } else if (originalStatus === 'approved' && imageFieldsChanged) {
        toastKey = 'upload.editModeToastPendingFromApproved';
      } else if (originalStatus === 'rejected' && !imageFieldsChanged) {
        // Policy §12.1.2 예외: rejected 메타-only 수정 발행도 강제 pending 전이.
        toastKey = 'review.editToastResubmitted';
      } else if (originalStatus === 'rejected' && imageFieldsChanged) {
        toastKey = 'review.editToastResubmitted';
      } else {
        // originalStatus === 'pending' (이미지든 메타든 pending 유지)
        toastKey = 'upload.editModeToast';
      }
      toast.success(t(toastKey as MessageKey));
    } else if (!import.meta.env.PROD && import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true') {
      toast.success(t('upload.toastPublishedImmediate'));
    } else {
      toast.success(t('upload.toastPublished'));
    }

    setTimeout(() => {
      setIsPublishing(false);
      publishedRef.current = true;
      const autoApproved = !import.meta.env.PROD && import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true';
      const wasRejectedResubmit = Boolean(editDiff && editDiff.originalStatus === 'rejected');
      // Policy §12.2.1 SLA 안내는 Profile 검수 대기 배지 tooltip + publishedConfirmDesc 카피로 충분.
      if (wasEditingExistingWork && !wasRejectedResubmit) {
        // 일반 편집(approved/pending 메타-only)은 기존대로 토스트 + 프로필 복귀
        navigate('/me?tab=exhibition');
      } else {
        // 신규 발행 또는 반려 → 재검수: USR-UPL-10 완료 화면 표시
        setPublishedResult({
          workId: targetId,
          autoApproved,
          hasNonMemberInvites,
          resubmittedFromRejected: wasRejectedResubmit,
        });
      }
    }, 600);
  };

  /* ━━━━━━ Wizard 네비게이션 ━━━━━━ */
  const goToStep = useCallback((step: WizardStep) => {
    setWizardStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    setWizardStep((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return uploadType === 'group' ? 3 : 4;
      if (prev === 3) return 4;
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [uploadType]);

  const goBack = useCallback(() => {
    setWizardStep((prev) => {
      if (prev === 4) return uploadType === 'group' ? 3 : 2;
      if (prev === 3) return 2;
      if (prev === 2) return 1;
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [uploadType]);

  /* ━━━━━━ 초안 저장 (수동만) ━━━━━━ */
  const handleSaveDraft = () => {
    const firstUrl = contents.find((c) => c.url);
    const draft: Draft = {
      id: generateRandomId(),
      title: exhibitionName.trim() || firstUrl?.title?.trim() || '',
      exhibitionName: exhibitionName.trim(),
      uploadType: uploadType ?? undefined,
      groupName: groupName.trim() || undefined,
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
        pieceId: c.pieceId,
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

  const hasContent = contents.some((c) => c.url);

  useEffect(() => {
    if (!hasContent) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasContent]);

  /* ━━━━━━ 재정렬 핸들러 (@dnd-kit 터치 호환) ━━━━━━ */

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDndDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = contents.findIndex((c) => c.id === active.id);
    const newIndex = contents.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setContents((prev) => arrayMove(prev, oldIndex, newIndex));
    setCoverImageIndex((prev) => {
      if (prev === oldIndex) return newIndex;
      if (oldIndex < prev && newIndex >= prev) return prev - 1;
      if (oldIndex > prev && newIndex <= prev) return prev + 1;
      return prev;
    });
  }, [contents]);

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

  /* ━━━━━━ 전시 생성 조건 체크리스트 (전체 항목 고정, done 플래그) ━━━━━━ */
  const publishChecklist = useMemo(() => {
    const validContents = contents.filter((c) => c.url);
    const hasImages = validContents.length > 0;
    const isGroup = uploadType === 'group';
    const hasEnoughImages = isGroup ? validContents.length >= 2 : hasImages;

    // 행동 순서: 전시 제목 → (그룹) 그룹명 → 이미지 → (그룹) 작가 2명 이상 → (그룹) 모든 작품 작가 지정
    const items: { key: string; label: string; done: boolean; disabled?: boolean }[] = [
      { key: 'title', label: t('upload.blockerExhibitionTitle'), done: !!exhibitionName.trim() },
    ];
    if (isGroup) {
      items.push({ key: 'groupName', label: t('upload.blockerGroupName'), done: !!groupName.trim() });
    }
    items.push({
      key: 'image',
      label: isGroup ? t('upload.blockerGroupMinImages') : t('upload.blockerImage'),
      done: hasEnoughImages,
    });
    if (isGroup) {
      const assignedIds = new Set(
        validContents.map((c) =>
          c.artist?.id ?? (c.nonMemberArtist?.displayName ? `nm::${c.nonMemberArtist.displayName}` : null)
        ).filter(Boolean)
      );
      const hasTwoArtists = hasImages && assignedIds.size >= 2;
      const allAssigned = hasImages && validContents.every(
        (c) => c.artistType === 'unknown' || c.artist || !!c.nonMemberArtist?.displayName,
      );
      items.push({ key: 'twoArtists', label: t('upload.blockerTwoArtists'), done: hasTwoArtists, disabled: !hasImages });
      items.push({ key: 'artist', label: t('upload.blockerArtist'), done: allAssigned, disabled: !hasImages });
    }
    return items;
  }, [contents, exhibitionName, uploadType, groupName, t]);
  const publishBlockers = publishChecklist.filter((i) => !i.done);

  // ===== 미리보기 모드 =====
  const previewWork = useMemo<Work | null>(() => {
    if (!previewMode) return null;
    const currentUser = artists[0];
    const urls = contents.filter(c => c.url).map(c => c.url!);
    if (urls.length === 0) return null;
    const imageArtists = contents.filter(c => c.url).map(c => {
      if (c.artistType === 'unknown') {
        return { type: 'unknown' as const };
      }
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
      exhibitionName: exhibitionName || t('upload.previewExhibitionFallback'),
      groupName: groupName || undefined,
      primaryExhibitionType: uploadType === 'group' ? 'group' : 'solo',
      imageArtists,
      imagePieceTitles: pieceTitles,
      ...buildVisibilityPatch('public'),
      customCoverUrl: customCoverUrl && coverImageIndex === -1 ? customCoverUrl : undefined,
      coverImageIndex: customCoverUrl && coverImageIndex === -1 ? -1 : Math.max(0, coverImageIndex),
    } satisfies Work;
  }, [previewMode, contents, exhibitionName, groupName, uploadType, customCoverUrl, coverImageIndex, t]);

  // ━━━━━━ 전시 완료 확인 화면 ━━━━━━
  if (publishedResult) {
    const { autoApproved: pubAutoApproved, hasNonMemberInvites: pubHasInvites, resubmittedFromRejected: pubResubmit, workId: pubWorkId } = publishedResult;
    // Policy §12.1.2 / IA USR-UPL-10 — 4종 분기 메시지
    let titleKey: MessageKey;
    let descKey: MessageKey;
    if (pubResubmit) {
      titleKey = 'upload.publishedConfirmTitleResubmit';
      descKey = 'upload.publishedConfirmDescResubmit';
    } else if (pubAutoApproved) {
      titleKey = 'upload.publishedConfirmTitleApproved';
      descKey = 'upload.publishedConfirmDescApproved';
    } else {
      titleKey = 'upload.publishedConfirmTitle';
      descKey = 'upload.publishedConfirmDescPending';
    }
    const publishedWork = workStore.getWork(pubWorkId);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-3">{t(titleKey)}</h2>
        <p className="text-base text-muted-foreground mb-2 max-w-md whitespace-pre-line leading-relaxed">
          {t(descKey)}
        </p>
        {pubHasInvites && (
          <p className="text-sm text-primary mb-4 max-w-md">{t('upload.publishedConfirmInviteNote')}</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground max-w-md">
          {t('upload.publishedConfirmSlaNote')}
        </p>
        {pubHasInvites && publishedWork && (
          <div className="mt-6">
            <InviteShareButton
              workId={pubWorkId}
              workTitle={publishedWork.exhibitionName || publishedWork.title || ''}
              inviterName={publishedWork.artist?.name || ''}
              variant="default"
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button onClick={() => navigate('/me?tab=exhibition')} className="min-h-[44px] px-6">
            {t('upload.publishedConfirmGoProfile')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="min-h-[44px] px-6">
            {t('upload.publishedConfirmGoBrowse')}
          </Button>
        </div>
      </div>
    );
  }

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

  // USR-UPL-08: 비회원 슬롯 발행 전 확인 모달
  if (nonMemberPreviewModal !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
          <h2 className="text-lg font-bold text-foreground mb-1.5">{t('upload.nonMemberPreviewTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t('upload.nonMemberPreviewSubtitle')}</p>

          <div className="bg-muted/40 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">
              {t('upload.nonMemberPreviewListLabel').replace('{n}', String(nonMemberPreviewModal.length))}
            </p>
            <div className="flex flex-col gap-2.5">
              {nonMemberPreviewModal.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">👤</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{t('upload.nonMemberPreviewSlotHint')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 mb-6 text-sm text-blue-800 leading-relaxed">
            📬 {t('upload.nonMemberPreviewInfo')}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-h-[44px] text-sm"
              onClick={() => setNonMemberPreviewModal(null)}
            >
              {t('upload.nonMemberPreviewBack')}
            </Button>
            <Button
              type="button"
              className="flex-[1.3] min-h-[44px] text-sm font-semibold"
              onClick={() => {
                nonMemberModalConfirmed.current = true;
                setNonMemberPreviewModal(null);
                handlePublish();
              }}
            >
              {t('upload.nonMemberPreviewConfirm')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 재정렬 모드 =====
  if (reorderMode) {
    return (
      <div className="min-h-screen bg-white">
        <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">{t('upload.reorderMode')}</span>
          <Button onClick={() => { setReorderMode(false); toast.success(t('upload.toastOrderSaved')); }} className="px-5 py-2 min-h-[44px] bg-foreground text-white text-sm rounded-lg lg:hover:bg-black transition-colors">
            {t('upload.reorderDone')}
          </Button>
        </div>
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDndDragEnd}>
          <SortableContext items={contents.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contents.map((c, i) => (
                <SortableReorderItem key={c.id} item={c} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
              onClick={() => { setUploadType('solo'); setWizardStep(1); setRegisteredArtists([]); }}
              className="flex flex-col items-center text-center p-10 bg-white border-2 border-border/60 hover:border-primary transition-all rounded-2xl group shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                <Monitor className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('upload.typeSolo')}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('upload.typeSoloDesc1')}</p>
            </button>
            <button
              onClick={() => { setUploadType('group'); setWizardStep(1); setRegisteredArtists([]); }}
              className="flex flex-col items-center text-center p-10 bg-white border-2 border-border/60 hover:border-primary transition-all rounded-2xl group shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('upload.typeGroup')}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('upload.typeGroupDesc1')}</p>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 파일 인풋 (숨김) */}
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleFileSelect} className="hidden" multiple />
          <input ref={replaceFileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleReplaceImage} className="hidden" />
          <input ref={coverFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />

          {/* 업로드 진행률 바 (WebP 변환) */}
          {uploadProgress && (
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/40 px-4 py-2.5" role="status" aria-live="polite">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
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

          {/* 진행 표시바 */}
          <WizardProgress
            currentStep={wizardStep}
            isGroup={uploadType === 'group'}
            onStepClick={goToStep}
          />

          {/* 단계별 렌더 */}
          {wizardStep === 1 && (
            <Step1Images
              contents={contents}
              uploadType={uploadType}
              editingRejectedWork={editingRejectedWork}
              fileInputRef={fileInputRef}
              replaceFileInputRef={replaceFileInputRef}
              replaceTargetId={replaceTargetId}
              setReplaceTargetId={setReplaceTargetId}
              cameraBlockNotice={cameraBlockNotice}
              setCameraBlockNotice={setCameraBlockNotice}
              reorderMode={reorderMode}
              setReorderMode={setReorderMode}
              coverImageIndex={coverImageIndex}
              setCoverImageIndex={setCoverImageIndex}
              setContents={setContents}
              onNext={goNext}
              onSaveDraft={handleSaveDraft}
              onPreview={() => setPreviewMode(true)}
              hasImages={contents.filter((c) => c.url).length > 0}
              step3NeedsReview={step3NeedsReview}
              setStep3NeedsReview={setStep3NeedsReview}
            />
          )}
          {wizardStep === 2 && (
            <Step2Titles
              contents={contents}
              setContents={setContents}
              uploadType={uploadType}
              exhibitionName={exhibitionName}
              setExhibitionName={setExhibitionName}
              groupName={groupName}
              setGroupName={setGroupName}
              groupSuggestions={groupSuggestions}
              groupSuggestOpen={groupSuggestOpen}
              setGroupSuggestOpen={setGroupSuggestOpen}
              workTick={workTick}
              onNext={goNext}
              onBack={goBack}
              onSaveDraft={handleSaveDraft}
              onPreview={() => setPreviewMode(true)}
              hasImages={contents.filter((c) => c.url).length > 0}
            />
          )}
          {wizardStep === 3 && uploadType === 'group' && (
            <Step3Artists
              contents={contents}
              setContents={setContents}
              registeredArtists={registeredArtists}
              setRegisteredArtists={setRegisteredArtists}
              assigningArtistIdx={assigningArtistIdx}
              setAssigningArtistIdx={setAssigningArtistIdx}
              step3NeedsReview={step3NeedsReview}
              setStep3NeedsReview={setStep3NeedsReview}
              onNext={goNext}
              onBack={goBack}
              onSaveDraft={handleSaveDraft}
            />
          )}
          {wizardStep === 4 && (
            <Step4Submit
              contents={contents}
              uploadType={uploadType}
              coverImageIndex={coverImageIndex}
              setCoverImageIndex={setCoverImageIndex}
              customCoverUrl={customCoverUrl}
              setCustomCoverUrl={setCustomCoverUrl}
              coverFileInputRef={coverFileInputRef}
              isOriginalWork={isOriginalWork}
              setIsOriginalWork={setIsOriginalWork}
              consentCuration={consentCuration}
              setConsentCuration={setConsentCuration}
              isPublishing={isPublishing}
              editingWorkId={editingWorkId}
              editingRejectedWork={editingRejectedWork}
              onPublish={handleOpenDetails}
              onBack={goBack}
              onSaveDraft={handleSaveDraft}
              onPreview={() => setPreviewMode(true)}
            />
          )}
        </>
      )}

    </div>
  );
}
