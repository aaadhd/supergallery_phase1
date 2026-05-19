# Upload Wizard 4-Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Upload.tsx` 캔버스+사이드바 구조를 4단계 linear wizard로 전면 교체해 시니어 친화 UX 제공.

**Architecture:** `Upload.tsx`가 전체 상태·핸들러를 유지하고 `wizardStep` 상태로 단계를 분기. 각 단계는 `src/app/components/upload/` 하위 컴포넌트로 추출. Step 3에만 `registeredArtists` 신규 상태 추가. 기존 데이터 모델(`ContentItem`, `imageArtists`)·핸들러(`handlePublish`, `handleFileSelect` 등) 변경 없음.

**Tech Stack:** React 18 · TypeScript · Tailwind CSS · shadcn/ui · Lucide icons · `useI18n()` (`t()`)

**스펙:** `docs/superpowers/specs/2026-05-19-upload-wizard-design.md`

---

## File Map

**신규 생성:**
- `src/app/components/upload/types.ts` — 공유 타입 (`RegisteredArtist`)
- `src/app/components/upload/WizardProgress.tsx` — 진행 표시바
- `src/app/components/upload/Step1Images.tsx` — 이미지 업로드 단계
- `src/app/components/upload/Step2Titles.tsx` — 제목 입력 단계
- `src/app/components/upload/Step3Artists.tsx` — 작가 등록(3A) + 이미지 배분(3B)
- `src/app/components/upload/Step4Submit.tsx` — 최종 확인·신청 단계

**수정:**
- `src/app/pages/Upload.tsx` — `wizardStep`·`registeredArtists` 추가, 렌더 교체
- `src/app/i18n/messages.ts` — 신규 카피 키 추가 (ko + en)

**기획 문서 (마지막 태스크):**
- `_planning/README.md` — 용어 사전 갱신
- `_planning/Copy_v1.md` — 용어 갱신

---

## Task 1: 신규 i18n 카피 키 추가

**Files:**
- Modify: `src/app/i18n/messages.ts`

- [ ] **Step 1: ko 섹션에 신규 키 추가**

`messages.ts` 내 한국어 `upload.*` 키 블록 끝에 다음을 추가:

```typescript
// === wizard 신규 키 ===
'upload.step1Title': '작품 파일을 올려주세요',
'upload.step1Subtitle': '디지털 드로잉 그림 파일 · 최대 10개 · JPG, PNG, WEBP',
'upload.step2Title': '전시 이름을 지어주세요',
'upload.step2Subtitle': '작품마다 이름도 따로 붙일 수 있어요',
'upload.step3Title': '이 전시에 참여한 작가를 알려주세요',
'upload.step3Subtitle': '이름은 여기서 한 번만 입력해요',
'upload.step3AssignTitle': '각 작품이 누구 그림인지 골라주세요',
'upload.step3AssignSubtitle': '작가마다 순서대로 진행해요',
'upload.step4Title': '거의 다 됐어요!',
'upload.step4Subtitle': '대표 이미지를 고르고 마지막으로 확인해주세요',
'upload.artistIsMember': '회원이에요',
'upload.artistIsMemberSub': '갤러리 닉네임으로 찾기',
'upload.artistIsNonMember': '아직 회원이 아니에요',
'upload.artistIsNonMemberSub': '이름만 입력하면 돼요',
'upload.nonMemberNameHint': '실명이든 별명이든 괜찮아요. 친구가 나중에 가입하면 자기 작품을 직접 찾아 연결해요.',
'upload.addArtist': '+ 작가 추가하기',
'upload.step3Progress': '작가 {current}/{total}',
'upload.step3AssignNext': '완료 → 다음 작가',
'upload.step3AssignComplete': '배분 완료',
'upload.unassignedWarning': '아직 배분되지 않은 작품이 있어요',
'upload.groupValidityError': '함께 올리기는 서로 다른 작가 {n}명 이상이 필요해요',
'upload.editModeImageChangeHint': '이미지를 바꾸면 다시 검수 대기로 돌아가요. 제목·그룹명만 고치는 건 즉시 반영돼요.',
'upload.pieceTitleNoneHint': "이름을 입력하지 않으면 '제목 없음'으로 표시돼요",
'upload.step3ReassignNotice': '이미지가 바뀌어서 작가 배분을 다시 확인해주세요',
'upload.wizardBack': '← 이전',
'upload.wizardNext': '다음',
'upload.step3aAddMemberNickname': '갤러리 닉네임 입력',
'upload.step3aUnknownKeep': '작가 미상 유지',
'upload.selectedCount': '{n}개 선택됨',
```

- [ ] **Step 2: en 섹션에 동일 키 영문 추가**

영문 `upload.*` 블록 끝에 추가:

```typescript
'upload.step1Title': 'Upload your artwork files',
'upload.step1Subtitle': 'Digital drawing files only · Up to 10 files · JPG, PNG, WEBP',
'upload.step2Title': 'Name your exhibition',
'upload.step2Subtitle': 'You can also name each work individually',
'upload.step3Title': 'Tell us who participated',
'upload.step3Subtitle': 'Enter each name just once here',
'upload.step3AssignTitle': 'Which work belongs to whom?',
'upload.step3AssignSubtitle': 'Go through each artist one by one',
'upload.step4Title': 'Almost there!',
'upload.step4Subtitle': 'Choose a cover image and do a final check',
'upload.artistIsMember': 'Already a member',
'upload.artistIsMemberSub': 'Search by gallery nickname',
'upload.artistIsNonMember': 'Not a member yet',
'upload.artistIsNonMemberSub': 'Just enter a name',
'upload.nonMemberNameHint': "Any name is fine — real name, nickname, whatever. When your friend signs up, they'll find and connect their own work.",
'upload.addArtist': '+ Add artist',
'upload.step3Progress': 'Artist {current}/{total}',
'upload.step3AssignNext': 'Done → Next artist',
'upload.step3AssignComplete': 'All assigned',
'upload.unassignedWarning': 'Some works have no artist yet',
'upload.groupValidityError': 'Together upload requires {n} or more different artists',
'upload.editModeImageChangeHint': 'Changing images will put the exhibition back into review. Title and group name changes apply immediately.',
'upload.pieceTitleNoneHint': "Works without a name will show as 'Untitled'",
'upload.step3ReassignNotice': 'Images changed — please re-check the artist assignments',
'upload.wizardBack': '← Back',
'upload.wizardNext': 'Next',
'upload.step3aAddMemberNickname': 'Enter gallery nickname',
'upload.step3aUnknownKeep': 'Keep as unknown artist',
'upload.selectedCount': '{n} selected',
```

- [ ] **Step 3: 타입 체크**

```bash
cd "/Users/im_1688/Documents/vibe/Supergallery 복사본" && npx tsc --noEmit
```

오류 없으면 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/app/i18n/messages.ts
git commit -m "feat(i18n): upload wizard 신규 카피 키 추가"
```

---

## Task 2: 공유 타입 + WizardProgress 컴포넌트

**Files:**
- Create: `src/app/components/upload/types.ts`
- Create: `src/app/components/upload/WizardProgress.tsx`

- [ ] **Step 1: `types.ts` 작성**

```typescript
// src/app/components/upload/types.ts

export interface RegisteredArtist {
  /** 클라이언트 임시 ID (uuid 대신 Math.random 가능) */
  id: string;
  type: 'member' | 'non-member';
  /** 회원인 경우 */
  memberId?: string;
  memberName?: string;
  memberAvatar?: string;
  /** 비회원인 경우 */
  displayName?: string;
}

export type WizardStep = 1 | 2 | 3 | 4;
```

- [ ] **Step 2: `WizardProgress.tsx` 작성**

```typescript
// src/app/components/upload/WizardProgress.tsx
import { Check } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import type { WizardStep } from './types';

interface Step {
  number: WizardStep;
  label: string;
  icon?: string; // 모바일 아이콘
}

interface Props {
  currentStep: WizardStep;
  isGroup: boolean;
  onStepClick: (step: WizardStep) => void;
}

export function WizardProgress({ currentStep, isGroup, onStepClick }: Props) {
  const { t } = useI18n();

  const allSteps: Step[] = [
    { number: 1, label: t('upload.step1Title').split(' ').slice(0, 2).join(' '), icon: '🖼' },
    { number: 2, label: '제목 짓기', icon: '✏️' },
    { number: 3, label: '작가 연결', icon: '👥' },
    { number: 4, label: '전시 신청', icon: '📋' },
  ];

  // 내 작품 올리기: step 3 숨김
  const steps = isGroup ? allSteps : allSteps.filter((s) => s.number !== 3);

  return (
    <div className="flex items-center justify-center gap-0 py-3 px-4 border-b border-border/40 bg-white">
      {steps.map((step, idx) => {
        const isDone = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isClickable = isDone;

        return (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.number)}
              className="flex flex-col items-center gap-1 min-w-[44px]"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
              </div>
              {/* 데스크탑: 텍스트 / 모바일: 현재만 텍스트 */}
              <span
                className={`text-[9px] font-semibold whitespace-nowrap hidden sm:block ${
                  isDone ? 'text-emerald-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              <span
                className={`text-[9px] font-semibold whitespace-nowrap sm:hidden ${
                  isCurrent ? 'text-primary' : 'text-transparent'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-0.5 ${
                  step.number < currentStep ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/components/upload/types.ts src/app/components/upload/WizardProgress.tsx
git commit -m "feat(upload): WizardProgress 컴포넌트 + 공유 타입"
```

---

## Task 3: Upload.tsx — wizardStep 상태·네비게이션 추가

기존 `showDetailsModal` 상태 기반 흐름을 `wizardStep` 기반으로 전환. 기존 핸들러는 유지.

**Files:**
- Modify: `src/app/pages/Upload.tsx`

- [ ] **Step 1: 신규 import 추가**

Upload.tsx 상단 import 블록에 추가:

```typescript
import { WizardProgress } from '../components/upload/WizardProgress';
import { Step1Images } from '../components/upload/Step1Images';
import { Step2Titles } from '../components/upload/Step2Titles';
import { Step3Artists } from '../components/upload/Step3Artists';
import { Step4Submit } from '../components/upload/Step4Submit';
import type { RegisteredArtist, WizardStep } from '../components/upload/types';
```

- [ ] **Step 2: 신규 상태 추가**

`Upload()` 함수 내 기존 상태 선언 블록(약 L174 근처)에 추가:

```typescript
// 마법사 단계 (Step 0 = uploadType 선택 화면, 이후 1~4)
const [wizardStep, setWizardStep] = useState<WizardStep>(1);

// Step 3 전용: 등록된 작가 목록
const [registeredArtists, setRegisteredArtists] = useState<RegisteredArtist[]>([]);

// Step 3B 전용: 현재 배분 중인 작가 인덱스
const [assigningArtistIdx, setAssigningArtistIdx] = useState(0);

// Step 1에서 이미지 변경 후 Step 3을 다시 봐야 하는지 플래그
const [step3NeedsReview, setStep3NeedsReview] = useState(false);
```

- [ ] **Step 3: 네비게이션 헬퍼 추가**

같은 컴포넌트 내 핸들러 블록에 추가:

```typescript
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
```

- [ ] **Step 4: `uploadType` 선택 시 step 리셋**

기존 Step 0의 `setUploadType('solo')` / `setUploadType('group')` 호출 직후에 추가:

```typescript
// Step 0 버튼의 onClick 내에서:
onClick={() => { setUploadType('solo'); setWizardStep(1); setRegisteredArtists([]); }}
// 그룹 버튼:
onClick={() => { setUploadType('group'); setWizardStep(1); setRegisteredArtists([]); }}
```

- [ ] **Step 5: 편집 모드 진입 시 registeredArtists 복원**

기존 편집 모드 복원 블록(L389~435) 끝에 추가:

```typescript
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
// contents가 복원된 직후 한 번만 실행
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [editingWorkId]);
```

- [ ] **Step 6: 메인 렌더 교체**

기존 `uploadType !== null` 분기 내의 캔버스+사이드바 전체를 다음으로 교체:

```tsx
) : (
  <div className="min-h-screen bg-white pb-20">
    <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />

    {/* 진행 표시바 */}
    <WizardProgress
      currentStep={wizardStep}
      isGroup={uploadType === 'group'}
      onStepClick={goToStep}
    />

    {/* 업로드 진행률 (WebP 변환) */}
    {uploadProgress && (
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border/40 px-4 py-2.5" role="status" aria-live="polite">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-foreground shrink-0">
            {tn('upload.uploadingProgress', { current: String(uploadProgress.current), total: String(uploadProgress.total) })}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((uploadProgress.current / Math.max(1, uploadProgress.total)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    )}

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

    {/* 숨김 파일 인풋 */}
    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleFileSelect} className="hidden" multiple />
    <input ref={replaceFileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" onChange={handleReplaceImage} className="hidden" />
    <input ref={coverFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />
  </div>
```

> **주의:** 기존 `showDetailsModal`, `setShowDetailsModal` 상태와 세부 정보 모달 JSX(약 L1242~L1402)는 Step4Submit으로 이동되므로 Upload.tsx에서 제거. `handleOpenDetails`는 `handlePublish`를 직접 호출하도록 단순화:
> ```typescript
> const handleOpenDetails = () => handlePublish();
> ```

- [ ] **Step 7: 타입 체크**

```bash
npx tsc --noEmit
```

컴포넌트 파일들이 아직 없으므로 모듈 못 찾는 에러 예상 — Task 4~8 완료 후 재확인.

- [ ] **Step 8: 커밋**

```bash
git add src/app/pages/Upload.tsx
git commit -m "feat(upload): wizardStep 상태·네비게이션 추가, 렌더 교체 골격"
```

---

## Task 4: Step1Images 컴포넌트

**Files:**
- Create: `src/app/components/upload/Step1Images.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/app/components/upload/Step1Images.tsx
import { useRef } from 'react';
import { Plus, X, Replace, Trash2, ArrowUpDown } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../ImageWithFallback';
import { openConfirm } from '../ConfirmDialog';
import type { ContentItem } from '../../pages/Upload'; // Upload.tsx에서 export 필요 (Step 6 참고)

interface Props {
  contents: ContentItem[];
  uploadType: 'solo' | 'group';
  editingRejectedWork: { rejectionReason?: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  replaceFileInputRef: React.RefObject<HTMLInputElement>;
  replaceTargetId: string | null;
  setReplaceTargetId: (id: string | null) => void;
  cameraBlockNotice: boolean;
  setCameraBlockNotice: (v: boolean) => void;
  reorderMode: boolean;
  setReorderMode: (v: boolean) => void;
  coverImageIndex: number;
  setCoverImageIndex: (idx: number) => void;
  setContents: (c: ContentItem[]) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  hasImages: boolean;
  step3NeedsReview: boolean;
  setStep3NeedsReview: (v: boolean) => void;
}

export function Step1Images({
  contents, uploadType, editingRejectedWork, fileInputRef, replaceFileInputRef,
  replaceTargetId, setReplaceTargetId, cameraBlockNotice, setCameraBlockNotice,
  reorderMode, setReorderMode, coverImageIndex, setCoverImageIndex,
  setContents, onNext, onSaveDraft, onPreview, hasImages,
  step3NeedsReview, setStep3NeedsReview,
}: Props) {
  const { t, tn } = useI18n();
  const validContents = contents.filter((c) => c.url);
  const minImages = uploadType === 'group' ? 2 : 1;
  const canNext = validContents.length >= minImages;

  const handleDelete = async (id: string) => {
    if (!(await openConfirm({ title: t('upload.confirmDeleteImage'), destructive: true, confirmLabel: t('profile.delete') }))) return;
    const removeIdx = contents.findIndex((c) => c.id === id);
    setContents(contents.filter((c) => c.id !== id));
    setCoverImageIndex((prev: number) => {
      if (removeIdx < 0) return prev;
      if (prev === removeIdx) return 0;
      if (prev > removeIdx) return Math.max(0, prev - 1);
      return prev;
    });
    // 이미지 변경 → Step 3 재검토 필요
    setStep3NeedsReview(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 수정 모드 안내 */}
      {editingRejectedWork && (
        <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 leading-relaxed">
          {/* 기존 반려 배너 JSX 그대로 이동 */}
        </div>
      )}

      {/* 수정 모드 이미지 변경 경고 */}
      {editingRejectedWork === null && hasImages && (
        <p className="text-xs text-muted-foreground mb-4">{t('upload.editModeImageChangeHint')}</p>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step1Title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('upload.step1Subtitle')}</p>

      {/* 드롭존 (이미지 없을 때) */}
      {validContents.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-input bg-white p-12 text-center transition-all hover:border-primary hover:bg-primary/5"
        >
          <p className="mb-2 text-sm font-medium text-foreground">{t('upload.dropzoneTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('upload.dropzoneFormats')}</p>
          <Button className="mt-4">{t('upload.step1Title')}</Button>
        </div>
      ) : (
        // 이미지 그리드
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {validContents.map((c, idx) => (
            <div key={c.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <ImageWithFallback src={c.url!} alt="" className="w-full h-full object-contain" />
              <div className="absolute top-2 left-2 bg-black/60 text-white rounded-full px-2 py-0.5 text-xs font-bold">{idx + 1}</div>
              {/* 교체 버튼 */}
              <button
                type="button"
                onClick={() => { setReplaceTargetId(c.id); replaceFileInputRef.current?.click(); }}
                className="absolute bottom-2 left-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-black/60 rounded-full text-white"
                aria-label={t('upload.toolbarReplace')}
              >
                <Replace className="h-4 w-4" />
              </button>
              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="absolute bottom-2 right-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-red-500/80 rounded-full text-white"
                aria-label={t('upload.toolbarDelete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {validContents.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border/60 hover:border-primary flex flex-col items-center justify-center gap-1 min-h-[44px]"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{validContents.length}/10</span>
            </button>
          )}
        </div>
      )}

      {/* 카메라 사진 차단 안내 */}
      {cameraBlockNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 flex items-start gap-3">
          <p className="text-sm text-amber-800 flex-1">{t('upload.cameraBlockDesc')}</p>
          <button type="button" onClick={() => setCameraBlockNotice(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 mt-6">
        <Button
          disabled={!canNext}
          onClick={onNext}
          className="w-full py-6 text-base font-bold rounded-2xl"
        >
          {t('upload.wizardNext')} →
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">
            {t('upload.saveDraft')}
          </Button>
          {hasImages && (
            <Button variant="ghost" onClick={onPreview} className="flex-1 min-h-[44px]">
              <Monitor className="h-4 w-4 mr-1.5" />
              {t('upload.screenPreview')}
            </Button>
          )}
          {validContents.length >= 2 && (
            <Button variant="ghost" onClick={() => setReorderMode(true)} className="flex-1 min-h-[44px]">
              <ArrowUpDown className="h-4 w-4 mr-1.5" />
              {t('upload.reorderGridBtn')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

> **주의:** `ContentItem` 타입을 Upload.tsx에서 `export type { ContentItem }` 로 내보내야 한다. Upload.tsx 상단에 `export type { ContentItem };` 추가.

- [ ] **Step 2: Upload.tsx에서 ContentItem export 추가**

```typescript
// Upload.tsx의 ContentItem 타입 선언 앞에 export 추가
export type ContentItem = {
  id: string;
  type: 'image';
  // ... (기존 필드 그대로)
};
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/components/upload/Step1Images.tsx src/app/pages/Upload.tsx
git commit -m "feat(upload): Step1Images 컴포넌트"
```

---

## Task 5: Step2Titles 컴포넌트

**Files:**
- Create: `src/app/components/upload/Step2Titles.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/app/components/upload/Step2Titles.tsx
import { Monitor } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { RequiredMark } from '../RequiredMark';
import { TITLE_FIELD_MAX_LEN } from '../../utils/workDisplay';
import type { ContentItem } from '../../pages/Upload';

interface Props {
  contents: ContentItem[];
  setContents: (c: ContentItem[]) => void;
  uploadType: 'solo' | 'group';
  exhibitionName: string;
  setExhibitionName: (v: string) => void;
  groupName: string;
  setGroupName: (v: string) => void;
  groupSuggestions: string[];
  groupSuggestOpen: boolean;
  setGroupSuggestOpen: (v: boolean) => void;
  workTick: number;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  hasImages: boolean;
}

export function Step2Titles({
  contents, setContents, uploadType, exhibitionName, setExhibitionName,
  groupName, setGroupName, groupSuggestions, groupSuggestOpen, setGroupSuggestOpen,
  onNext, onBack, onSaveDraft, onPreview, hasImages,
}: Props) {
  const { t } = useI18n();
  const validContents = contents.filter((c) => c.url);

  const canNext =
    exhibitionName.trim().length > 0 &&
    (uploadType !== 'group' || groupName.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step2Title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('upload.step2Subtitle')}</p>

      {/* 전시 이름 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t('upload.exhibitionTitlePlaceholder')}<RequiredMark />
        </label>
        <input
          type="text"
          value={exhibitionName}
          onChange={(e) => setExhibitionName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
          placeholder={t('upload.exhibitionTitleExample')}
          maxLength={TITLE_FIELD_MAX_LEN}
          className="w-full text-xl font-bold border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-0 focus:border-primary border-border/60 min-h-[44px]"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">{exhibitionName.length}/{TITLE_FIELD_MAX_LEN}</span>
        </div>
      </div>

      {/* 그룹 이름 (여러 작가만) */}
      {uploadType === 'group' && (
        <div className="mb-6 relative">
          <label className="block text-sm font-bold text-foreground mb-2">
            {t('upload.groupNamePlaceholder2')}<RequiredMark />
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value.slice(0, TITLE_FIELD_MAX_LEN))}
            onFocus={() => setGroupSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setGroupSuggestOpen(false), 200)}
            placeholder={t('upload.groupNameExample')}
            maxLength={TITLE_FIELD_MAX_LEN}
            className="w-full border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-0 focus:border-primary border-border/60 min-h-[44px]"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">{groupName.length}/{TITLE_FIELD_MAX_LEN}</span>
          </div>
          {groupSuggestOpen && groupSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
              {groupSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={() => setGroupName(name)}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-muted min-h-[44px]"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 작품별 이름 */}
      {validContents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              {t('upload.pieceTitleLabel')}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{t('upload.labelOptional')}</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-3">
            💡 {t('upload.pieceTitleNoneHint')}
          </p>
          <div className="flex flex-col gap-3">
            {validContents.map((c, idx) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={c.title || ''}
                    maxLength={TITLE_FIELD_MAX_LEN}
                    onChange={(e) => {
                      const v = e.target.value.slice(0, TITLE_FIELD_MAX_LEN);
                      setContents(contents.map((item) => item.id === c.id ? { ...item, title: v } : item));
                    }}
                    placeholder={t('upload.pieceTitlePlaceholder')}
                    className="w-full min-h-[44px] px-4 py-3 bg-muted/20 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{(c.title || '').length}/{TITLE_FIELD_MAX_LEN}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 mt-8">
        <Button disabled={!canNext} onClick={onNext} className="w-full py-6 text-base font-bold rounded-2xl">
          {t('upload.wizardNext')} →
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1 min-h-[44px]">{t('upload.wizardBack')}</Button>
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">{t('upload.saveDraft')}</Button>
          {hasImages && (
            <Button variant="ghost" onClick={onPreview} className="flex-1 min-h-[44px]">
              <Monitor className="h-4 w-4 mr-1" />
              {t('upload.screenPreview')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/components/upload/Step2Titles.tsx
git commit -m "feat(upload): Step2Titles 컴포넌트"
```

---

## Task 6: Step3Artists 컴포넌트 (3A 작가 등록 + 3B 이미지 배분)

**Files:**
- Create: `src/app/components/upload/Step3Artists.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/app/components/upload/Step3Artists.tsx
import { useState } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../ImageWithFallback';
import { artists as allArtists } from '../../data';
import { useAuthStore } from '../../store';
import type { ContentItem } from '../../pages/Upload';
import type { RegisteredArtist } from './types';

type SubStep = 'register' | 'assign';

interface Props {
  contents: ContentItem[];
  setContents: (c: ContentItem[]) => void;
  registeredArtists: RegisteredArtist[];
  setRegisteredArtists: (a: RegisteredArtist[]) => void;
  assigningArtistIdx: number;
  setAssigningArtistIdx: (i: number) => void;
  step3NeedsReview: boolean;
  setStep3NeedsReview: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

export function Step3Artists({
  contents, setContents, registeredArtists, setRegisteredArtists,
  assigningArtistIdx, setAssigningArtistIdx,
  step3NeedsReview, setStep3NeedsReview,
  onNext, onBack, onSaveDraft,
}: Props) {
  const { t, tn } = useI18n();
  const auth = useAuthStore();
  const validContents = contents.filter((c) => c.url);

  // 3A / 3B 내부 서브스텝
  const [subStep, setSubStep] = useState<SubStep>('register');

  // 3A: 새 작가 추가 폼 상태
  const [addingType, setAddingType] = useState<'member' | 'non-member' | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [nonMemberName, setNonMemberName] = useState('');

  // 그룹 성립 조건 계산
  const currentUserId = auth.currentUser()?.id ?? '';
  const selfImages = validContents.filter((c) => c.artistType === 'self' || c.artist?.id === currentUserId);
  const hasSelfWork = selfImages.length > 0;
  const requiredOthers = hasSelfWork ? 1 : 2;
  const otherArtists = registeredArtists.filter((a) => a.memberId !== currentUserId);
  const groupValid = otherArtists.length >= requiredOthers;

  // 3B: 현재 작가에게 선택된 이미지 셋
  const currentArtist = registeredArtists[assigningArtistIdx];
  const selectedForCurrent = new Set(
    validContents
      .filter((c) => {
        if (!currentArtist) return false;
        if (currentArtist.type === 'member') return c.artist?.id === currentArtist.memberId;
        return c.nonMemberArtist?.displayName === currentArtist.displayName;
      })
      .map((c) => c.id)
  );

  // 3B: 미배분 이미지
  const unassigned = validContents.filter(
    (c) => c.artistType !== 'unknown' && !c.artist && !c.nonMemberArtist?.displayName
  );

  const toggleImageForArtist = (contentId: string) => {
    if (!currentArtist) return;
    setContents(
      contents.map((c) => {
        if (c.id !== contentId) return c;
        if (selectedForCurrent.has(contentId)) {
          // 선택 해제 → artist 정보 제거
          return { ...c, artist: undefined, artistType: undefined, nonMemberArtist: undefined };
        }
        // 선택 → artist 정보 설정
        if (currentArtist.type === 'member') {
          return {
            ...c,
            artistType: 'member' as const,
            artist: { id: currentArtist.memberId!, name: currentArtist.memberName!, avatar: currentArtist.memberAvatar! },
            nonMemberArtist: undefined,
          };
        }
        return {
          ...c,
          artistType: 'non-member' as const,
          artist: undefined,
          nonMemberArtist: { displayName: currentArtist.displayName! },
        };
      })
    );
  };

  const addMember = (artist: typeof allArtists[number]) => {
    if (registeredArtists.some((a) => a.memberId === artist.id)) return;
    setRegisteredArtists([...registeredArtists, {
      id: Math.random().toString(36).slice(2),
      type: 'member',
      memberId: artist.id,
      memberName: artist.name,
      memberAvatar: artist.avatar,
    }]);
    setAddingType(null);
    setMemberSearch('');
  };

  const addNonMember = () => {
    const name = nonMemberName.trim();
    if (!name) return;
    setRegisteredArtists([...registeredArtists, {
      id: Math.random().toString(36).slice(2),
      type: 'non-member',
      displayName: name,
    }]);
    setAddingType(null);
    setNonMemberName('');
  };

  const removeArtist = (id: string) => {
    setRegisteredArtists(registeredArtists.filter((a) => a.id !== id));
    // 해당 작가의 image 배분 초기화
    const artist = registeredArtists.find((a) => a.id === id);
    if (!artist) return;
    setContents(contents.map((c) => {
      const isThis = artist.type === 'member'
        ? c.artist?.id === artist.memberId
        : c.nonMemberArtist?.displayName === artist.displayName;
      return isThis ? { ...c, artist: undefined, artistType: undefined, nonMemberArtist: undefined } : c;
    }));
  };

  // ── 3A 렌더 ──
  if (subStep === 'register') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {step3NeedsReview && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('upload.step3ReassignNotice')}
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step3Title')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('upload.step3Subtitle')}</p>

        {/* 등록된 작가 목록 */}
        <div className="flex flex-col gap-3 mb-4">
          {registeredArtists.map((artist) => (
            <div key={artist.id} className="flex items-center gap-3 px-4 py-3 border border-emerald-200 bg-emerald-50/40 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {artist.type === 'member' && artist.memberAvatar
                  ? <img src={artist.memberAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : (artist.memberName ?? artist.displayName ?? '?')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{artist.memberName ?? artist.displayName}</p>
                <p className="text-xs text-muted-foreground">{artist.type === 'member' ? t('upload.artistIsMember') : t('upload.artistIsNonMember')}</p>
              </div>
              <button type="button" onClick={() => removeArtist(artist.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* 작가 추가 폼 */}
        {addingType === null ? (
          <button
            type="button"
            onClick={() => setAddingType('member')}
            className="w-full min-h-[44px] border-2 border-dashed border-border/60 rounded-xl text-sm font-bold text-primary hover:border-primary hover:bg-primary/5 transition-all py-3"
          >
            {t('upload.addArtist')}
          </button>
        ) : (
          <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary/[0.02]">
            {/* 회원 / 비회원 선택 탭 */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setAddingType('member')}
                className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${addingType === 'member' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                {t('upload.artistIsMember')}
              </button>
              <button
                type="button"
                onClick={() => setAddingType('non-member')}
                className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${addingType === 'non-member' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                {t('upload.artistIsNonMember')}
              </button>
            </div>

            {addingType === 'member' ? (
              // 회원 검색
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t('upload.step3aAddMemberNickname')}
                    className="w-full pl-10 pr-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    autoFocus
                  />
                </div>
                {memberSearch && (
                  <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {allArtists
                      .filter((a) => a.name.toLowerCase().includes(memberSearch.toLowerCase()))
                      .filter((a) => !registeredArtists.some((r) => r.memberId === a.id))
                      .slice(0, 8)
                      .map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => addMember(a)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left min-h-[44px]"
                        >
                          <img src={a.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="text-sm font-medium">{a.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              // 비회원 이름 직접 입력
              <div>
                <input
                  type="text"
                  value={nonMemberName}
                  onChange={(e) => setNonMemberName(e.target.value)}
                  placeholder="이름 (실명·별명 아무거나 OK)"
                  className="w-full px-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] mb-2"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mb-3">{t('upload.nonMemberNameHint')}</p>
                <Button onClick={addNonMember} disabled={!nonMemberName.trim()} className="w-full min-h-[44px]">
                  추가하기
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setAddingType(null); setMemberSearch(''); setNonMemberName(''); }}
              className="w-full text-sm text-muted-foreground mt-3 min-h-[44px]"
            >
              취소
            </button>
          </div>
        )}

        {/* 그룹 성립 조건 안내 */}
        {registeredArtists.length > 0 && !groupValid && (
          <p className="text-xs text-amber-700 mt-3">
            {tn('upload.groupValidityError', { n: String(requiredOthers) })}
          </p>
        )}

        {/* 하단 버튼 */}
        <div className="flex flex-col gap-3 mt-8">
          <Button
            disabled={registeredArtists.length === 0 || !groupValid}
            onClick={() => { setSubStep('assign'); setAssigningArtistIdx(0); setStep3NeedsReview(false); }}
            className="w-full py-6 text-base font-bold rounded-2xl"
          >
            {t('upload.wizardNext')} →
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack} className="flex-1 min-h-[44px]">{t('upload.wizardBack')}</Button>
            <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">{t('upload.saveDraft')}</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3B 렌더 ──
  const isLastArtist = assigningArtistIdx === registeredArtists.length - 1;
  const allAssigned = unassigned.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 진행 인디케이터 */}
      <div className="flex gap-1 mb-4">
        {registeredArtists.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= assigningArtistIdx ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-4 text-center">
        {tn('upload.step3Progress', { current: String(assigningArtistIdx + 1), total: String(registeredArtists.length) })}
      </p>

      {/* 현재 작가 카드 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border-2 border-primary rounded-xl mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold flex-shrink-0">
          {currentArtist?.type === 'member' && currentArtist.memberAvatar
            ? <img src={currentArtist.memberAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            : (currentArtist?.memberName ?? currentArtist?.displayName ?? '?')[0]}
        </div>
        <div>
          <p className="font-bold text-primary">{currentArtist?.memberName ?? currentArtist?.displayName}</p>
          <p className="text-xs text-muted-foreground">{t('upload.step3AssignTitle')}</p>
        </div>
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {validContents.map((c) => {
          const isSelected = selectedForCurrent.has(c.id);
          const isAssignedElsewhere = !isSelected && (c.artist || c.nonMemberArtist?.displayName || c.artistType === 'unknown');
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !isAssignedElsewhere && toggleImageForArtist(c.id)}
              disabled={isAssignedElsewhere}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all min-h-[80px] ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : isAssignedElsewhere
                  ? 'border-border/30 opacity-40'
                  : 'border-border/60 hover:border-primary/50'
              }`}
            >
              <ImageWithFallback src={c.url!} alt="" className="w-full h-full object-contain" />
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-primary font-semibold text-center mb-6">
        {tn('upload.selectedCount', { n: String(selectedForCurrent.size) })}
      </p>

      {/* 미배분 경고 */}
      {isLastArtist && !allAssigned && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
          {t('upload.unassignedWarning')}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3">
        {isLastArtist ? (
          <Button
            disabled={!allAssigned}
            onClick={onNext}
            className="w-full py-6 text-base font-bold rounded-2xl"
          >
            {t('upload.step3AssignComplete')} →
          </Button>
        ) : (
          <Button
            onClick={() => setAssigningArtistIdx(assigningArtistIdx + 1)}
            className="w-full py-6 text-base font-bold rounded-2xl"
          >
            {t('upload.step3AssignNext')}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => { setSubStep('register'); setAssigningArtistIdx(0); }}
          className="w-full min-h-[44px]"
        >
          {t('upload.wizardBack')} (작가 목록으로)
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/components/upload/Step3Artists.tsx
git commit -m "feat(upload): Step3Artists 컴포넌트 (3A 작가 등록 + 3B 이미지 배분)"
```

---

## Task 7: Step4Submit 컴포넌트

기존 `showDetailsModal` JSX(Upload.tsx L1242~L1402)를 이 컴포넌트로 이동·재구성.

**Files:**
- Create: `src/app/components/upload/Step4Submit.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/app/components/upload/Step4Submit.tsx
import { Monitor } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { RequiredMark } from '../RequiredMark';
import { ImageWithFallback } from '../ImageWithFallback';
import type { ContentItem } from '../../pages/Upload';

interface Props {
  contents: ContentItem[];
  uploadType: 'solo' | 'group';
  coverImageIndex: number;
  setCoverImageIndex: (i: number) => void;
  customCoverUrl: string | null;
  setCustomCoverUrl: (url: string | null) => void;
  coverFileInputRef: React.RefObject<HTMLInputElement>;
  isOriginalWork: boolean;
  setIsOriginalWork: (v: boolean) => void;
  consentCuration: boolean;
  setConsentCuration: (v: boolean) => void;
  isPublishing: boolean;
  editingWorkId: string | null;
  editingRejectedWork: { rejectionReason?: string } | null;
  onPublish: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
}

export function Step4Submit({
  contents, uploadType, coverImageIndex, setCoverImageIndex,
  customCoverUrl, setCustomCoverUrl, coverFileInputRef,
  isOriginalWork, setIsOriginalWork, consentCuration, setConsentCuration,
  isPublishing, editingWorkId, editingRejectedWork,
  onPublish, onBack, onSaveDraft, onPreview,
}: Props) {
  const { t } = useI18n();
  const validContents = contents.filter((c) => c.url);

  const confirmLabel = uploadType === 'group'
    ? t('upload.confirmStudent')
    : t('upload.confirmOriginal');

  const publishLabel = isPublishing
    ? (editingWorkId ? t('upload.editModeSaving') : t('upload.publishing'))
    : editingRejectedWork
    ? t('review.editCtaResubmit')
    : editingWorkId
    ? t('upload.editModeSave')
    : t('upload.publish');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step4Title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('upload.step4Subtitle')}</p>

      {/* 커버 이미지 */}
      <div className="mb-8">
        <p className="text-sm font-bold text-foreground mb-3">{t('upload.coverSectionTitle')}</p>

        {/* 작품 중 선택 */}
        <p className="text-xs text-muted-foreground mb-2">올린 작품 중 선택</p>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {validContents.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCoverImageIndex(i); setCustomCoverUrl(null); }}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                coverImageIndex === i && !customCoverUrl ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 opacity-70'
              }`}
            >
              <ImageWithFallback src={c.url!} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>

        {/* 또는 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 별도 파일 */}
        {customCoverUrl ? (
          <div className="relative inline-block">
            <img src={customCoverUrl} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-primary" />
            <button
              type="button"
              onClick={() => { setCustomCoverUrl(null); setCoverImageIndex(0); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center"
              aria-label={t('upload.customCoverRemove')}
            >✕</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverFileInputRef.current?.click()}
            className="w-full min-h-[44px] border-2 border-dashed border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all py-4"
          >
            {t('upload.coverUpload')}
          </button>
        )}
      </div>

      {/* 동의 체크박스 */}
      <div className="flex flex-col gap-4 mb-8">
        {/* 필수 */}
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-red-200 bg-red-50/50">
          <input
            type="checkbox"
            checked={isOriginalWork}
            onChange={(e) => setIsOriginalWork(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-red-300 text-primary focus:ring-primary flex-shrink-0"
          />
          <span className="text-sm font-semibold text-foreground leading-snug">
            {confirmLabel}<RequiredMark />
          </span>
        </label>

        {/* 선택 */}
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-border/60">
          <input
            type="checkbox"
            checked={consentCuration}
            onChange={(e) => setConsentCuration(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary flex-shrink-0"
          />
          <span className="text-sm text-foreground leading-snug">
            {t('upload.consentCurationLabel')}
          </span>
        </label>
      </div>

      {/* 검수 안내 인라인 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
        <p className="text-xs font-bold text-slate-600 mb-2">📋 {t('upload.reviewInfoTitle')}</p>
        <ul className="space-y-1.5 text-xs text-slate-500">
          <li>• {t('upload.reviewInfoTimeline')}</li>
          <li>• {t('upload.reviewInfoEditImg')}</li>
          <li>• {t('upload.reviewInfoReject')}</li>
        </ul>
      </div>

      {/* 발행 버튼 */}
      <div className="flex flex-col gap-3">
        <Button
          disabled={isPublishing || !isOriginalWork}
          onClick={onPublish}
          className={`w-full py-6 text-base font-bold rounded-2xl ${
            !isPublishing && isOriginalWork ? 'bg-foreground text-background' : ''
          }`}
        >
          {publishLabel}
        </Button>
        {!isOriginalWork && (
          <p className="text-xs text-red-500 text-center">{t('upload.hintCheckOriginal')}</p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1 min-h-[44px]">{t('upload.wizardBack')}</Button>
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">{t('upload.saveDraft')}</Button>
          <Button variant="ghost" onClick={onPreview} className="flex-1 min-h-[44px]">
            <Monitor className="h-4 w-4 mr-1" />
            {t('upload.screenPreview')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/components/upload/Step4Submit.tsx
git commit -m "feat(upload): Step4Submit 컴포넌트"
```

---

## Task 8: Upload.tsx 정리 — 기존 세부 정보 모달·사이드바 제거

Task 3~7로 기능이 컴포넌트로 이동됐으므로 Upload.tsx에서 구 코드를 제거.

**Files:**
- Modify: `src/app/pages/Upload.tsx`

- [ ] **Step 1: 제거할 상태 목록 확인 후 삭제**

다음 상태는 Step4Submit으로 이동됐으므로 Upload.tsx에서 제거:
- `showDetailsModal`, `setShowDetailsModal`
- `artistInputTab`, `setArtistInputTab`
- `artistSearch`, `setArtistSearch`
- `artistSearchRef`
- `selectedContentId`, `setSelectedContentId`

다음은 Step3Artists로 이동됐으나 `registeredArtists`는 Upload.tsx에 유지 (Task 3에서 추가).

- [ ] **Step 2: 제거할 JSX 범위 확인 후 삭제**

삭제 대상 JSX 블록:
- L1242~L1402: `showDetailsModal` 세부 정보 모달 전체
- L1634~L1998: 기존 사이드바 전체 (선택된 이미지 편집 패널)
- L1900~L1998: 기존 하단 제출 박스 (publishBlockers 체크리스트 + 4개 버튼)

> **주의:** 삭제 전 `previewMode` 오버레이(L1088~L1096)와 `reorderMode` 오버레이(L1157~L1176)는 유지. 이들은 전체 화면 오버레이로 모든 단계에서 동작.

- [ ] **Step 3: handleOpenDetails 단순화**

```typescript
// 기존 handleOpenDetails는 wizard에서 불필요 (검증은 단계별로)
// Step4Submit의 onPublish prop으로 handlePublish 직접 연결됐으므로:
const handleOpenDetails = () => handlePublish();
```

- [ ] **Step 4: 전체 타입 체크**

```bash
npx tsc --noEmit
```

오류 없으면 통과.

- [ ] **Step 5: 개발 서버에서 전체 플로우 수동 확인**

```bash
npm run dev
```

확인 항목:
- [ ] Step 0 → 내 작품 올리기 선택 → Step 1 진입
- [ ] 이미지 업로드 → 다음 → Step 2
- [ ] 전시 이름 입력 → 다음 → Step 4 (내 작품)
- [ ] Step 0 → 여러 작가 함께 올리기 → Step 1 → 2 → 3 → 4
- [ ] 3A 작가 등록 (회원 검색 + 비회원 입력)
- [ ] 3B 이미지 배분 → 전시 신청
- [ ] 완료된 단계 클릭 → 해당 단계로 이동
- [ ] 초안 저장 버튼
- [ ] 화면 미리보기 버튼

- [ ] **Step 6: 커밋**

```bash
git add src/app/pages/Upload.tsx
git commit -m "feat(upload): 구 캔버스+사이드바+모달 제거, wizard 완성"
```

---

## Task 9: 편집·반려·초안 모드 최종 확인

**Files:**
- Modify: `src/app/pages/Upload.tsx` (필요 시)

- [ ] **Step 1: 편집 모드 진입 테스트**

```bash
# 개발 서버 실행 중 상태에서:
# 1. 작품 발행 후 마이페이지에서 수정 버튼 클릭
# 2. Step 1로 진입, 기존 이미지 로드 확인
# 3. Step 4에서 버튼 텍스트 "수정 저장" 확인
```

확인 항목:
- [ ] 수정 모드 Step 1 상단에 `upload.editModeImageChangeHint` 표시
- [ ] Step 4 버튼 텍스트 "수정 저장"
- [ ] Step 3 진입 시 기존 registeredArtists 복원 확인 (Task 3 Step 5 useEffect)

- [ ] **Step 2: 반려 재제출 모드 확인**

```bash
# 검수 반려 작품에서 수정 버튼 클릭
```

확인 항목:
- [ ] Step 1 상단에 반려 사유 배너
- [ ] Step 4 버튼 텍스트 "다시 검수 요청하기"

- [ ] **Step 3: 초안 복원 모드 확인**

```bash
# 초안 저장 후 새 업로드 진입 시 토스트 안내
# /upload?draft=id 진입 시 Step 0 건너뛰고 Step 1 시작 + 기존 데이터 복원
```

- [ ] **Step 4: 비회원 확인 모달 확인**

```bash
# 3A에서 비회원 작가 추가 → 4단계 신청 → 비회원 확인 모달 등장 확인
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: 커밋 (수정 있을 경우)**

```bash
git add src/app/pages/Upload.tsx
git commit -m "fix(upload): 편집·반려·초안 모드 wizard 연결 보완"
```

---

## Task 10: 기획 문서 용어 갱신

**Files:**
- Modify: `_planning/README.md`
- Modify: `_planning/Copy_v1.md`

> **필수:** `_planning/*.md` 수정 전 `_planning/README.md` 「문서 갱신 규칙」 재확인.

- [ ] **Step 1: README.md 용어 사전 갱신**

`_planning/README.md` §5 "업로드 유형·역할" 표에서:

```markdown
# 변경 전
| **혼자 올리기** | 본인 작품만 있는 단일 작가 전시 | — |
| **함께 올리기** | 여러 작가가 같이 올리는 그룹 전시 | ~~그룹 업로드~~ |

# 변경 후
| **내 작품 올리기** | 본인 작품만 있는 단일 작가 전시 | ~~혼자 올리기~~ |
| **여러 작가 함께 올리기** | 여러 작가가 같이 올리는 그룹 전시 | ~~함께 올리기~~, ~~그룹 업로드~~ |
```

`## 문서 이력` 갱신 — 버전 규칙 확인 후 현재 행에 append 또는 새 행 추가.

- [ ] **Step 2: Copy_v1.md 동일 용어 grep 후 갱신**

```bash
grep -n "혼자 올리기\|함께 올리기" "_planning/Copy_v1.md"
```

검색된 모든 인스턴스를 신규 표준어로 교체:
- `혼자 올리기` → `내 작품 올리기`
- `함께 올리기` → `여러 작가 함께 올리기`

Copy_v1.md `## 문서 이력`도 갱신.

- [ ] **Step 3: 전체 grep으로 잔재 확인**

```bash
grep -rn "혼자 올리기\|함께 올리기" "_planning/"
```

결과 없으면 정합 완료.

- [ ] **Step 4: 커밋 (docs → code 규칙: 문서 먼저)**

```bash
git add "_planning/README.md" "_planning/Copy_v1.md"
git commit -m "docs(planning): 업로드 모드 용어 갱신 — 내 작품 올리기·여러 작가 함께 올리기"
```

---

## 셀프 리뷰

### 스펙 커버리지

| 스펙 요구사항 | 구현 태스크 |
|---|---|
| 4단계 wizard 구조 | Task 3 |
| WizardProgress + 완료 단계 클릭 | Task 2, 3 |
| Step 1: 이미지 업로드, 재정렬, 교체·삭제 | Task 4 |
| Step 1: 모드별 최소 이미지 수 | Task 4 |
| Step 1: 수정 모드 이미지 변경 안내 | Task 4 |
| Step 2: 전시명·그룹명·작품별 이름, 카운터 | Task 5 |
| Step 2: 그룹명 자동완성 | Task 5 |
| Step 2: '제목 없음' 힌트 | Task 5 |
| Step 3 숨김 (내 작품 올리기) | Task 2, 3 |
| Step 3A: 작가 등록 (회원/비회원) | Task 6 |
| Step 3A: 그룹 성립 조건 검증 | Task 6 |
| Step 3B: 작가별 이미지 배분 | Task 6 |
| Step 3B: 미배분 이미지 경고 | Task 6 |
| Step 3B: unknown 슬롯 (수정 모드) | Task 6 |
| Step 3: 수정 모드 기존 배분 복원 | Task 3 |
| Step 4: 커버 이미지 (작품 + 별도 파일) | Task 7 |
| Step 4: 동의 체크박스 모드별 분기 | Task 7 |
| Step 4: 검수 안내 인라인 | Task 7 |
| Step 4: 버튼 텍스트 4갈래 분기 | Task 7 |
| 비회원 확인 모달 (기존 유지) | Task 8 (기존 코드 유지) |
| 초안 저장·미리보기 상시 접근 | Task 4, 5, 7 |
| 이탈 방지 (기존 유지) | Task 8 (기존 코드 유지) |
| 편집 모드 전체 | Task 3, 9 |
| 반려 모드 전체 | Task 4, 9 |
| 기획 문서 용어 갱신 | Task 10 |
| i18n 신규 키 | Task 1 |

**누락 없음 확인.**

### 타입 일관성

- `ContentItem` — Upload.tsx에서 `export type`으로 내보내고 Step1/2/3/4 모두 동일 경로에서 import
- `RegisteredArtist`, `WizardStep` — `types.ts` 단일 소스
- `setContents` prop 시그니처 — 모든 컴포넌트에서 `(c: ContentItem[]) => void` 일치
- 버튼 텍스트 분기 — Task 7에서 기존 코드의 조건 순서(`isPublishing → editingRejectedWork → editingWorkId → 신규`) 그대로 유지
