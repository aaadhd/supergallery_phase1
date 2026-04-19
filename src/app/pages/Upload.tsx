import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useBlocker } from 'react-router-dom';
import { Image as ImageIcon, Plus, X, Search, GripVertical, ArrowLeft, ChevronLeft, ChevronRight, Trash2, Replace, ArrowUpDown, Monitor, Users, CalendarCheck, Star, Check, CircleHelp, GraduationCap } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore, useAuthStore } from '../store';

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
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

import { shouldBlockCameraPhoto } from '../utils/cameraExifBlock';
import {
  collectGroupNameSuggestions,
  getLastUsedGroupName,
  setLastUsedGroupName,
} from '../utils/groupNameRegistry';
import { TITLE_FIELD_MAX_LEN } from '../utils/workDisplay';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { pointsOnWorkPublished } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
// sendInviteToNonMember moved to ContentReview — invites sent after approval
import { openConfirm } from '../components/ConfirmDialog';
import { RequiredMark } from '../components/RequiredMark';
import { containsProfanity } from '../utils/profanityFilter';
import { todayLocalIso } from '../utils/localDate';
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

/** 그룹 전시 — 강사 여부. `embedded`: 체크리스트 카드 내부(구분선 아래) */
function GroupInstructorSection({
  checkboxId,
  isInstructor,
  onInstructorChange,
  roleInfoOpen,
  onRoleInfoOpenChange,
  embedded = false,
}: {
  checkboxId: string;
  isInstructor: boolean;
  onInstructorChange: (v: boolean) => void;
  roleInfoOpen: boolean;
  onRoleInfoOpenChange: (open: boolean) => void;
  embedded?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div
      className={
        embedded
          ? 'relative'
          : 'relative rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {t('upload.groupRolePrompt')}
        </span>
        <Popover open={roleInfoOpen} onOpenChange={onRoleInfoOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 rounded-full p-1 text-muted-foreground/80 hover:bg-muted hover:text-foreground"
              aria-label={t('upload.roleInfoAria')}
            >
              <CircleHelp className={embedded ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(calc(100vw-2rem),20rem)] p-4 z-[60]"
            align="end"
            side="bottom"
            sideOffset={6}
          >
            <p className="text-sm font-semibold text-foreground mb-3">{t('upload.roleInfoTitle')}</p>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="font-medium text-foreground mb-1">{t('upload.roleParticipant')}</p>
                <p>{t('upload.roleParticipantHelp')}</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">{t('upload.roleInstructor')}</p>
                <p>{t('upload.roleInstructorHelp')}</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className={`flex items-start gap-2.5 ${embedded ? 'mt-2' : 'mt-2.5'}`}>
        <Checkbox
          id={checkboxId}
          checked={isInstructor}
          onCheckedChange={(v) => onInstructorChange(v === true)}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={checkboxId}
            className={`text-foreground cursor-pointer select-none text-left block text-sm leading-snug`}
          >
            {t('upload.instructorCheckboxLabel')}
          </label>
          <p
            className="text-muted-foreground/90 mt-1 text-xs leading-snug"
          >
            {t('upload.instructorRestrictionHint')}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Upload() {
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishedResult, setPublishedResult] = useState<{ workId: string; autoApproved: boolean; hasNonMemberInvites: boolean } | null>(null);
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
  const [artistInputTab, setArtistInputTab] = useState<'member' | 'non-member'>('member');
  /* ── 변환 프로그레스 ── */

  /* ── 강사 ── */
  const [isInstructor, setIsInstructor] = useState(false);
  const [roleInfoOpen, setRoleInfoOpen] = useState(false);
  const [groupSubStep, setGroupSubStep] = useState<'askRole' | null>(null);
  const [cameraBlockNotice, setCameraBlockNotice] = useState(false);

  /* ── 이벤트 연결 ── */
  const linkedEventId = searchParams.get('event');
  const linkedEventTitle = searchParams.get('eventTitle') ? decodeURIComponent(searchParams.get('eventTitle')!) : null;

  /* ── 이미지 선택 ── */
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
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
    setGroupSubStep(null);
    setExhibitionName('');
    setGroupName('');
    setIsOriginalWork(false);
    setIsInstructor(false);
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

  // 강사 모드 전환 시 본인(=artists[0]) 귀속 슬롯 초기화 — 강사 모드는 100% 수강생 귀속이어야 함
  useEffect(() => {
    if (!isInstructor) return;
    const selfId = artists[0]?.id;
    if (!selfId) return;
    const hasSelfSlot = contents.some((c) => c.artistType === 'member' && c.artist?.id === selfId);
    if (!hasSelfSlot) return;
    // 본인 슬롯이 있으면 확인 후 초기화
    openConfirm({
      title: t('upload.confirmInstructorClearSelf'),
      destructive: true,
    }).then((ok) => {
      if (ok) {
        setContents((prev) =>
          prev.map((c) =>
            c.artistType === 'member' && c.artist?.id === selfId
              ? { ...c, artist: undefined, artistType: undefined }
              : c,
          ),
        );
        toast.info(t('upload.roleInstructorSelfCleared'));
      } else {
        setIsInstructor(false);
      }
    });
  }, [isInstructor]);

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
    if (draft.isInstructor) setIsInstructor(true);
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
    if (work.customCoverUrl) setCustomCoverUrl(work.customCoverUrl);
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
        uploadType === 'group' ? t('upload.errCheckStudentConsent') : t('upload.errCheckOriginal'),
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

    // 그룹 업로드 시 작가 검증 (이름만 있으면 통과, 번호는 선택)
    if (uploadType === 'group') {
      const missingIndices = imageContents
        .map((c, i) => (!c.artist && !c.nonMemberArtist?.displayName ? i + 1 : -1))
        .filter((i) => i > 0);
      if (missingIndices.length > 0) {
        toast.error(t('upload.errMissingArtistAt').replace('{positions}', missingIndices.join(', ')));
        return;
      }
    }

    // 그룹 전시 + 강사 아님 → 본인 작품 최소 1점 포함 필수 (정책: 강사 체크 없으면 본인 작품 포함)
    if (uploadType === 'group' && !isInstructor) {
      const selfId = artists[0]?.id;
      const includesSelf = imageContents.some(
        (c) => c.artistType === 'member' && c.artist?.id === selfId,
      );
      if (!includesSelf) {
        toast.error(t('upload.errMustIncludeSelf'));
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
    const urls = imageContents.map((c) => c.url!);
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
      if (c.artistType === 'non-member' && c.nonMemberArtist) {
        return { type: 'non-member' as const, displayName: c.nonMemberArtist.displayName, phoneNumber: c.nonMemberArtist.phoneNumber };
      }
      if (c.artist) {
        return { type: 'member' as const, memberId: c.artist.id, memberName: c.artist.name, memberAvatar: c.artist.avatar };
      }
      return { type: 'member' as const, memberId: currentUser.id, memberName: currentUser.name, memberAvatar: currentUser.avatar };
    });

    /**
     * 비회원 초대 발송 직전 확인 모달 (실명 정확성 고지).
     * - 라벨로만 안내하면 "민수쌤" 같은 호칭 입력이 걸러지지 않아 가입 후 매칭 실패.
     * - 발송 시점에 한 번 더 실명임을 상기 + 수락/취소 선택지 제공.
     */
    const invitePreview = imageArtists
      .map((a) => (a.type === 'non-member' && a.displayName && a.phoneNumber ? a.displayName : null))
      .filter((v): v is string => !!v);
    if (invitePreview.length > 0) {
      const list = invitePreview.map((n) => `• ${n}`).join('\n');
      const ok = await openConfirm({
        title: t('upload.confirmInviteTitle'),
        description: `${t('upload.confirmInviteListIntro')}\n${list}\n\n${t('upload.confirmInviteHelper')}`,
        confirmLabel: t('upload.confirmInviteSend'),
      });
      if (!ok) return;
    }

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
      isInstructorUpload: uploadType === 'group' ? isInstructor : undefined,
      primaryExhibitionType,
      imageArtists,
      feedReviewStatus: import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true' ? 'approved' : 'pending',
      uploadedAt,
      linkedEventId: linkedEventId || undefined,
      coverImageIndex:
        customCoverUrl && coverImageIndex === -1
          ? -1
          : urls.length > 1
            ? Math.min(Math.max(0, coverImageIndex), urls.length - 1)
            : 0,
      customCoverUrl: customCoverUrl && coverImageIndex === -1 ? customCoverUrl : undefined,
    };

    // Prevent duplicate event participation (editing the same work is OK)
    if (linkedEventId && !editingWorkId) {
      const alreadySubmitted = workStore.getWorks().some(
        w => w.linkedEventId?.toString() === linkedEventId.toString() && w.artistId === artists[0]?.id
      );
      if (alreadySubmitted) {
        toast.error(t('upload.errDuplicateEvent'));
        return;
      }
    }

    setIsPublishing(true);
    const targetId = editingWorkId || newWork.id;
    const wasEditingExistingWork = Boolean(editingWorkId);

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
      const autoApprove = import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true';
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
      } else {
        nextStatus = originalStatus;
      }

      // rejectionReason 처리: 상태가 rejected로 유지될 때만 보존. 그 외 초기화.
      const nextRejectionReason: Work['rejectionReason'] | undefined =
        nextStatus === 'rejected' ? original?.rejectionReason : undefined;

      editDiff = { imageFieldsChanged, originalStatus };

      const editingUpdates: Partial<Work> = {
        title: newWork.title,
        image: newWork.image,
        exhibitionName: newWork.exhibitionName,
        groupName: newWork.groupName,
        imagePieceTitles: newWork.imagePieceTitles,
        isInstructorUpload: newWork.isInstructorUpload,
        primaryExhibitionType: newWork.primaryExhibitionType,
        imageArtists: newWork.imageArtists,
        linkedEventId: newWork.linkedEventId,
        coverImageIndex: newWork.coverImageIndex,
        customCoverUrl: newWork.customCoverUrl,
        feedReviewStatus: nextStatus,
        rejectionReason: nextRejectionReason,
      };
      workStore.updateWork(editingWorkId, editingUpdates);
    } else {
      workStore.addWork(newWork);
    }
    if (resolvedGroup) setLastUsedGroupName(resolvedGroup);
    if (!editingWorkId) pointsOnWorkPublished(newWork);
    setShowDetailsModal(false);

    // Clear draft that was used for this publish
    const loadedDraftId = searchParams.get('draft');
    if (loadedDraftId) {
      draftStore.deleteDraft(loadedDraftId);
    }

    // 비가입자 초대는 검수 승인 시점에 발송 (전화번호는 Work.imageArtists에 보관)
    const hasNonMemberInvites = imageArtists.some((a) => a.type === 'non-member' && a.phoneNumber);

    if (hasNonMemberInvites && !editingWorkId) {
      toast.info(t('upload.toastInvitePending'));
    } else if (editingWorkId && editDiff) {
      // 편집 저장 후 5 시나리오 분기 (Policy §12.1.2 토스트 문구).
      const { originalStatus, imageFieldsChanged } = editDiff;
      let toastKey: string;
      if (originalStatus === 'approved' && !imageFieldsChanged) {
        toastKey = 'upload.editModeToastApprovedKept';
      } else if (originalStatus === 'approved' && imageFieldsChanged) {
        toastKey = 'upload.editModeToastPendingFromApproved';
      } else if (originalStatus === 'rejected' && !imageFieldsChanged) {
        toastKey = 'upload.editModeToastRejectedKept';
      } else if (originalStatus === 'rejected' && imageFieldsChanged) {
        toastKey = 'upload.editModeToastResubmit';
      } else {
        // originalStatus === 'pending' (이미지든 메타든 pending 유지)
        toastKey = 'upload.editModeToast';
      }
      toast.success(t(toastKey as MessageKey));
    } else if (import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true') {
      toast.success(t('upload.toastPublishedImmediate'));
    } else {
      toast.success(t('upload.toastPublished'));
    }

    setTimeout(() => {
      setIsPublishing(false);
      publishedRef.current = true;
      const autoApproved = import.meta.env.VITE_UPLOAD_AUTO_APPROVE === 'true';
      // 이벤트 응모면 이벤트 상세로 복귀
      if (linkedEventId) {
        navigate(`/events/${linkedEventId}`);
      } else if (wasEditingExistingWork) {
        navigate('/me?tab=exhibition');
      } else {
        // 전시 완료 확인 화면 표시
        setPublishedResult({ workId: targetId, autoApproved, hasNonMemberInvites });
      }
    }, 600);
  };

  /* ━━━━━━ 초안 저장 (수동만) ━━━━━━ */
  const handleSaveDraft = () => {
    const firstUrl = contents.find((c) => c.url);
    const draft: Draft = {
      id: generateRandomId(),
      title: exhibitionName.trim() || firstUrl?.title?.trim() || '',
      exhibitionName: exhibitionName.trim(),
      uploadType: uploadType ?? undefined,
      groupName: groupName.trim() || undefined,
      isInstructor: uploadType === 'group' ? isInstructor : undefined,
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
    const hasImages = contents.length > 0;
    // 행동 순서: 전시 제목 → (그룹 전시) 그룹명 → 이미지 → (그룹 전시) 작가 지정
    const items: { key: string; label: string; done: boolean; disabled?: boolean }[] = [
      { key: 'title', label: t('upload.blockerExhibitionTitle'), done: !!exhibitionName.trim() },
    ];
    if (uploadType === 'group') {
      items.push({
        key: 'groupName',
        label: t('upload.blockerGroupName'),
        done: !!groupName.trim(),
      });
    }
    items.push({ key: 'image', label: t('upload.blockerImage'), done: hasImages });
    if (uploadType === 'group') {
      const allAssigned = hasImages && contents.filter((c) => c.url).every(
        (c) => c.artist || !!c.nonMemberArtist?.displayName,
      );
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
      feedReviewStatus: 'approved',
      customCoverUrl: customCoverUrl && coverImageIndex === -1 ? customCoverUrl : undefined,
      coverImageIndex: customCoverUrl && coverImageIndex === -1 ? -1 : Math.max(0, coverImageIndex),
    } satisfies Work;
  }, [previewMode, contents, exhibitionName, groupName, uploadType, customCoverUrl, coverImageIndex, t]);

  // ━━━━━━ 전시 완료 확인 화면 ━━━━━━
  if (publishedResult) {
    const { workId: pubWorkId, autoApproved: pubAutoApproved, hasNonMemberInvites: pubHasInvites } = publishedResult;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-3">
          {pubAutoApproved ? t('upload.publishedConfirmTitleApproved') : t('upload.publishedConfirmTitle')}
        </h2>
        <p className="text-base text-muted-foreground mb-2 max-w-md">
          {pubAutoApproved ? t('upload.publishedConfirmDescApproved') : t('upload.publishedConfirmDesc')}
        </p>
        {pubHasInvites && (
          <p className="text-sm text-primary mb-4">{t('upload.toastInvitePending')}</p>
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
              onClick={() => setGroupSubStep('askRole')}
              className="flex flex-col items-center text-center p-10 bg-white border-2 border-border/60 hover:border-foreground transition-all rounded-2xl group shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-foreground text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('upload.typeGroup')}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('upload.typeGroupDesc1')}</p>
            </button>
          </div>

          {/* 함께 올리기 — 역할 선택 모달 */}
          {groupSubStep === 'askRole' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setGroupSubStep(null)}>
              <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" />
              <div
                className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setGroupSubStep(null)}
                  className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">{t('upload.groupRoleTitle')}</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center">{t('upload.groupRoleSubtitle')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setIsInstructor(false); setGroupSubStep(null); setUploadType('group'); }}
                    className="flex flex-col items-center text-center p-6 sm:p-8 bg-white border-2 border-border/60 hover:border-foreground transition-all rounded-2xl group shadow-sm hover:shadow-md"
                  >
                    <div className="w-14 h-14 rounded-full bg-foreground text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t('upload.groupRoleParticipant')}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{t('upload.groupRoleParticipantDesc')}</p>
                  </button>
                  <button
                    onClick={() => { setIsInstructor(true); setGroupSubStep(null); setUploadType('group'); }}
                    className="flex flex-col items-center text-center p-6 sm:p-8 bg-white border-2 border-border/60 hover:border-foreground transition-all rounded-2xl group shadow-sm hover:shadow-md"
                  >
                    <div className="w-14 h-14 rounded-full bg-foreground text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t('upload.groupRoleInstructor')}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{t('upload.groupRoleInstructorDesc')}</p>
                  </button>
                </div>
              </div>
            </div>
          )}
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
                      <p className="text-sm font-medium text-foreground">{t('upload.coverSectionTitle')}</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {/* 커스텀 커버 (로컬 파일, 선택 시 전시 이미지 배열엔 포함되지 않음) */}
                        {customCoverUrl && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setCoverImageIndex(-1)}
                              className={`relative shrink-0 flex w-16 h-16 items-center justify-center rounded-lg overflow-hidden bg-muted/30 transition-all ${coverImageIndex === -1 ? 'ring-2 ring-primary ring-offset-2 shadow-md' : 'border-2 border-border/50 opacity-70 hover:opacity-100'}`}
                              aria-label={t('upload.customCoverLabel')}
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
                              onClick={clearCustomCover}
                              aria-label={t('upload.customCoverRemove')}
                              className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {/* 업로드한 작품 중에서 대표 이미지 선택 */}
                        {contents.filter(c => c.type === 'image' && c.url).map((c, i) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCoverImageIndex(i); }}
                            className={`relative shrink-0 flex w-16 h-16 items-center justify-center rounded-lg overflow-hidden bg-muted/30 transition-all ${coverImageIndex === i ? 'ring-2 ring-primary ring-offset-2 shadow-md' : 'border-2 border-border/50 opacity-70 hover:opacity-100'}`}
                          >
                            <ImageWithFallback src={c.url} alt="" className="w-full h-full object-contain object-center" />
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
                          aria-label={t('upload.coverUpload')}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-xs font-medium leading-tight">{t('upload.coverUpload')}</span>
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

                  </div>

                  {/* 푸터 */}
                  <div className="sticky bottom-0 z-10 border-t border-border px-6 py-4 bg-white">
                    {!isOriginalWork && !isPublishing && (
                      <p className="text-xs text-amber-600 text-center mb-2">{t('upload.hintCheckOriginal')}</p>
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="ghost" onClick={() => setShowDetailsModal(false)} className="px-5 py-2.5 text-sm min-h-[44px]">{t('upload.close')}</Button>
                      <Button disabled={isPublishing || !isOriginalWork} onClick={handlePublish} className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${isPublishing || !isOriginalWork ? 'bg-muted text-muted-foreground' : 'bg-primary text-white lg:hover:bg-primary/90'}`}>
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
                    
                    {/* 전시 유형 뱃지 */}
                    {uploadType === 'group' && (
                      <div className="w-full mb-4 flex justify-center md:justify-start animate-in fade-in duration-500">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {isInstructor ? <GraduationCap className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          {isInstructor ? t('upload.groupRoleDisplayInstructor') : t('upload.groupRoleDisplayParticipant')}
                        </span>
                      </div>
                    )}

                    {/* 제목 입력부 */}
                    <div className="w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
                      <div className="relative">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 md:text-left text-center">
                          {t('upload.exhibitionTitlePlaceholder')}<RequiredMark />
                        </label>
                        <input
                          type="text"
                          value={exhibitionName}
                          onChange={(e) => setExhibitionName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
                          autoComplete="off"
                          placeholder={t('upload.exhibitionTitleExample')}
                          maxLength={TITLE_FIELD_MAX_LEN}
                          className={`w-full bg-white text-xl sm:text-2xl md:text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 border-2 rounded-2xl px-5 py-4 transition-all leading-tight text-center md:text-left relative z-20 focus:outline-none focus:ring-0 ${
                            !exhibitionName.trim() && contents.length > 0
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-border/60 focus:border-primary'
                          }`}
                        />
                        <div className="flex justify-between mt-1.5 px-1">
                          <span className={`text-xs font-medium ${!exhibitionName.trim() && contents.length > 0 ? 'text-red-500' : 'text-transparent'}`}>
                            {t('upload.blockerExhibitionTitle')}
                          </span>
                          <span className="text-xs text-muted-foreground">{exhibitionName.length}/{TITLE_FIELD_MAX_LEN}</span>
                        </div>
                      </div>

                      {uploadType === 'group' && (
                        <div className="relative">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 md:text-left text-center">
                            {t('upload.groupNamePlaceholder2')}<RequiredMark />
                          </label>
                          <input
                            type="text"
                            value={groupName}
                            maxLength={TITLE_FIELD_MAX_LEN}
                            onChange={(e) => {
                              setGroupName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN));
                              setGroupSuggestOpen(true);
                            }}
                            onFocus={() => setGroupSuggestOpen(true)}
                            onBlur={() => window.setTimeout(() => setGroupSuggestOpen(false), 200)}
                            placeholder={t('upload.groupNameExample')}
                            className={`w-full bg-white text-base md:text-lg text-foreground placeholder:text-muted-foreground/30 border-2 rounded-2xl px-5 py-3.5 transition-all text-center md:text-left relative z-10 focus:outline-none focus:ring-0 ${
                              !groupName.trim() && contents.length > 0
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-border/60 focus:border-primary'
                            }`}
                          />
                          <div className="flex justify-between mt-1.5 px-1">
                            <span className={`text-xs font-medium ${!groupName.trim() && contents.length > 0 ? 'text-red-500' : 'text-transparent'}`}>
                              {t('upload.blockerGroupName')}
                            </span>
                            <span className="text-xs text-muted-foreground">{groupName.length}/{TITLE_FIELD_MAX_LEN}</span>
                          </div>
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
                      <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-input bg-white p-10 sm:p-12 text-center transition-all lg:hover:border-primary lg:hover:bg-primary/5">
                        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="mb-2 text-sm font-medium text-foreground">{t('upload.dropzoneTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('upload.dropzoneFormats')}</p>
                      </div>
                      {cameraBlockNotice && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 animate-in fade-in duration-300">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-amber-900">{t('upload.cameraBlockTitle')}</p>
                              <p className="text-sm text-amber-800 mt-1 leading-relaxed">{t('upload.cameraBlockDesc')}</p>
                            </div>
                            <button type="button" onClick={() => setCameraBlockNotice(false)} className="shrink-0 p-1.5 rounded-full text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full pb-20 z-10">
                      <div className="relative z-10 flex flex-col" style={{ gap: `${CONTENT_SPACING}px` }}>
                        {contents.map((content, index) => (
                          <div
                            key={content.id}
                            className="relative transition-all group/block"
                          >
                            {/* ── 콘텐츠 편집기 툴바 (항상 노출 — 터치 기기 호환) ── */}
                            {(
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-foreground/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 shadow-lg">
                                <button
                                  type="button"
                                  aria-label={t('upload.toolbarReplace')}
                                  onClick={(e) => { e.stopPropagation(); setReplaceTargetId(content.id); replaceFileInputRef.current?.click(); }}
                                  className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/20 active:bg-white/30 transition-colors"
                                >
                                  <Replace className="h-4.5 w-4.5" />
                                  <span className="text-xs font-medium leading-tight">{t('upload.toolbarReplace')}</span>
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
                                  <span className="text-xs font-medium leading-tight">{t('upload.toolbarDelete')}</span>
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
                            return (
                              <div
                                key={c.id}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${c.id === selectedContentId ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedContentId(c.id)}
                                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                                  aria-label={tn('upload.imageFallback', { n: String(idx + 1) })}
                                >
                                  <BlurDominantBg src={c.url} />
                                  <ImageWithFallback src={c.url} alt="" className="relative z-10 w-full h-full object-contain object-center" />
                                </button>
                                {assignedName && (
                                  <span className="pointer-events-none absolute bottom-1 left-1 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium pl-0.5 pr-1.5 py-0.5 rounded-full max-w-[calc(100%-2rem)]">
                                    {assignedAvatar
                                      ? <img src={assignedAvatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                      : <span className="w-4 h-4 rounded-full bg-white/30 shrink-0" />}
                                    <span className="truncate">{assignedName}</span>
                                  </span>
                                )}
                                <span className={`pointer-events-none absolute bottom-1 right-1 z-20 text-xs font-bold px-1.5 py-0.5 rounded-md ${c.id === selectedContentId ? 'bg-primary text-white' : 'bg-black/50 text-white/80'}`}>
                                  {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  aria-label={t('upload.toolbarDelete')}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!(await openConfirm({ title: t('upload.confirmDeleteImage'), destructive: true, confirmLabel: t('profile.delete') }))) return;
                                    const removeIdx = contents.findIndex((x) => x.id === c.id);
                                    setContents(contents.filter((x) => x.id !== c.id));
                                    if (selectedContentId === c.id) setSelectedContentId(null);
                                    setCoverImageIndex((prev) => {
                                      if (removeIdx < 0) return prev;
                                      if (prev === removeIdx) return 0;
                                      if (prev > removeIdx) return Math.max(0, prev - 1);
                                      return prev;
                                    });
                                  }}
                                  className="absolute top-1 right-1 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          {contents.length < 10 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1"
                            >
                              <Plus className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-medium">{contents.length}/10</span>
                            </button>
                          )}
                        </div>

                        {/* ── 카드 1: 개별 작품명 (선택) ── */}
                        <section
                          aria-labelledby={`card-title-${sc.id}`}
                          className="rounded-2xl border border-border/60 bg-white p-4 sm:p-5"
                        >
                          <header className="mb-3 flex items-center justify-between gap-2">
                            <label
                              htmlFor={`card-title-input-${sc.id}`}
                              id={`card-title-${sc.id}`}
                              className="text-sm font-semibold text-foreground truncate"
                            >
                              {t('upload.pieceTitleLabel')}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">{t('upload.labelOptional')}</span>
                            </label>
                            {sc.title?.trim() && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                                <Check className="h-3.5 w-3.5" aria-hidden />
                                {t('upload.cardDone')}
                              </span>
                            )}
                          </header>
                          <input
                            id={`card-title-input-${sc.id}`}
                            type="text" value={sc.title || ''} maxLength={TITLE_FIELD_MAX_LEN}
                            onChange={(e) => {
                              const v = e.target.value.slice(0, TITLE_FIELD_MAX_LEN);
                              setContents(contents.map((c) => c.id === selectedContentId ? { ...c, title: v } : c));
                            }}
                            placeholder={t('upload.pieceTitlePlaceholder')}
                            className="w-full min-h-[44px] px-4 py-3 bg-muted/20 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </section>

                        {/* ── 카드 2: 작가 지정 (함께 올리기 전용, 필수) ── */}
                        {uploadType === 'group' && (() => {
                          const artistDone = (sc.artistType === 'member' && !!sc.artist)
                            || (sc.artistType === 'non-member' && !!sc.nonMemberArtist?.displayName?.trim());
                          return (
                          <section
                            aria-labelledby={`card-artist-${sc.id}`}
                            className={`rounded-2xl border p-4 sm:p-5 ${artistDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-primary/30 bg-primary/[0.02]'}`}
                          >
                          <header className="mb-3 flex items-center justify-between gap-2">
                            <span id={`card-artist-${sc.id}`} className="text-sm font-semibold text-foreground truncate">
                              {t('upload.artistAssignRequired')}<RequiredMark />
                            </span>
                            {artistDone && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                                <Check className="h-3.5 w-3.5" aria-hidden />
                                {t('upload.cardDone')}
                              </span>
                            )}
                          </header>

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
                                        {artists.filter(a => (!isInstructor || a.id !== artists[0].id) && a.name.toLowerCase().includes(artistSearch.toLowerCase())).slice(0, 10).map(artist => (
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
                                  <label className="block text-xs font-bold text-amber-800 mb-1.5 px-1">{t('upload.nonMemberNameLabel2')}<RequiredMark /></label>
                                  <input
                                    type="text" value={sc.nonMemberArtist?.displayName || ''}
                                    onChange={(e) => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', nonMemberArtist: { ...c.nonMemberArtist, displayName: e.target.value, phoneNumber: c.nonMemberArtist?.phoneNumber || '' } } : c))}
                                    placeholder={t('upload.nonMemberNamePh')}
                                    className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-amber-800 mb-1.5 px-1">{t('upload.nonMemberPhoneLabel2')}</label>
                                  <input
                                    type="tel" value={sc.nonMemberArtist?.phoneNumber || ''}
                                    onChange={(e) => setContents(contents.map(c => c.id === selectedContentId ? { ...c, artistType: 'non-member', nonMemberArtist: { ...c.nonMemberArtist, displayName: c.nonMemberArtist?.displayName || '', phoneNumber: e.target.value } } : c))}
                                    placeholder={t('onboarding.phonePlaceholder')}
                                    className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
                                  />
                                  <p className="mt-2 text-xs text-amber-700/90 leading-relaxed px-1">
                                    {t('upload.nonMemberPhoneHelper')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </section>
                          );
                        })()}
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
                  <div className="p-5 md:p-7 border-t border-border/40 bg-white space-y-4 mt-auto">
                    <div className="space-y-2.5">
                      <div className={`rounded-xl p-3 border ${publishBlockers.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`} role="status" aria-live="polite">
                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${publishBlockers.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{t('upload.blockersTitle')}</p>
                        <ul className="space-y-1">
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
                        className="w-full py-6 rounded-2xl text-base font-semibold text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                      >
                        {t('upload.saveDraft')}
                      </Button>

                      {contents.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => setReorderMode(true)}
                          className="w-full py-5 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-50 transition-colors gap-2"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          {t('upload.reorderGridBtn')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        disabled={contents.length === 0}
                        onClick={() => setPreviewMode(true)}
                        className="w-full py-5 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-50 transition-colors disabled:opacity-40 gap-2"
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
