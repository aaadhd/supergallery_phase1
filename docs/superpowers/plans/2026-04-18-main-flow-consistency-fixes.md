# Main Flow Consistency Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all data/state/policy inconsistencies affecting the main flows: Browse (둘러보기), Upload (작품 올리기), My Profile (마이프로필), and related Admin pages.

**Architecture:** All fixes are surgical edits to existing stores, pages, and utils. No new files created. Each task targets one specific inconsistency, ordered by severity and impact on the main user flows.

**Tech Stack:** React 19, TypeScript, Zustand-like custom stores (localStorage-backed), Vite

---

## Task 1: toggleLike/toggleSave must update Work.likes/Work.saves counts

The feed ordering algorithm (`feedOrdering.ts`) uses `Work.likes` and `Work.saves` for scoring, but `toggleLike`/`toggleSave` only update the user's interaction arrays — the numeric counts on the Work object never change. This means user interactions have zero effect on feed ranking.

**Files:**
- Modify: `src/app/store.ts:434-448` (toggleLike, toggleSave functions)

- [ ] **Step 1: Modify `toggleLike` to also update `Work.likes`**

In `src/app/store.ts`, replace the `toggleLike` method:

```typescript
toggleLike: (id: string) => {
  const alreadyLiked = currentInteractions.liked.includes(id);
  if (alreadyLiked) {
    currentInteractions.liked = currentInteractions.liked.filter(i => i !== id);
  } else {
    currentInteractions.liked = [...currentInteractions.liked, id];
  }
  saveInteractions();
  // Sync Work.likes count
  const w = currentWorks.find(w => w.id === id);
  if (w) {
    const delta = alreadyLiked ? -1 : 1;
    workStore.updateWork(id, { likes: Math.max(0, (w.likes ?? 0) + delta) });
  }
},
```

- [ ] **Step 2: Modify `toggleSave` to also update `Work.saves`**

In `src/app/store.ts`, replace the `toggleSave` method:

```typescript
toggleSave: (id: string) => {
  const alreadySaved = currentInteractions.saved.includes(id);
  if (alreadySaved) {
    currentInteractions.saved = currentInteractions.saved.filter(i => i !== id);
  } else {
    currentInteractions.saved = [...currentInteractions.saved, id];
  }
  saveInteractions();
  // Sync Work.saves count
  const w = currentWorks.find(w => w.id === id);
  if (w) {
    const delta = alreadySaved ? -1 : 1;
    workStore.updateWork(id, { saves: Math.max(0, (w.saves ?? 0) + delta) });
  }
},
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
1. Open Browse, like a work, refresh — the like count on the Work should persist.
2. Unlike it — count should decrement.
3. Same for save/unsave.

- [ ] **Step 4: Commit**

```bash
git add src/app/store.ts
git commit -m "fix: sync Work.likes/saves counts on toggleLike/toggleSave

toggleLike/toggleSave only updated the user interaction arrays, leaving
Work.likes and Work.saves static. This broke feed ranking in feedOrdering.ts
which scores by log1p(likes)*2.2 + log1p(saves)*3.2."
```

---

## Task 2: Filter `isHidden` works on other users' profiles and direct URL access

Admin can mark works as `isHidden: true` via ReportManagement. Browse and Search correctly filter these out, but viewing another user's profile or accessing a work via direct URL still shows hidden works.

**Files:**
- Modify: `src/app/pages/Profile.tsx:199-203` (artistWorks filter)
- Modify: `src/app/components/WorkDetailModal.tsx:42` (work lookup)

- [ ] **Step 1: Add `isHidden` filter to Profile.tsx `artistWorks` memo**

In `src/app/pages/Profile.tsx`, find the `artistWorks` useMemo (around line 199-214). The `.filter(w => isOwnProfile || ...)` line currently checks `feedReviewStatus` but not `isHidden`. Add `!w.isHidden` to the non-own-profile filter:

```typescript
const artistWorks = useMemo(() => {
  const own = storeWorks
    .filter(w => w.artistId === profileArtist.id)
    .filter(w => !w.isInstructorUpload)
    .filter(w => isOwnProfile || (!w.isHidden && w.feedReviewStatus !== 'pending' && w.feedReviewStatus !== 'rejected'));
  const ownIds = new Set(own.map(w => w.id));

  const hydrated = hydrateGroupWorks(artists) as Work[];
  const participating = hydrated.filter(gw => {
    if (ownIds.has(gw.id)) return false;
    if (!isOwnProfile && gw.isHidden) return false;
    if (gw.artistId === profileArtist.id) return true;
    return gw.imageArtists?.some(ia => ia.type === 'member' && ia.memberId === profileArtist.id) ?? false;
  });

  return [...own, ...participating];
}, [storeWorks, profileArtist.id, isOwnProfile]);
```

- [ ] **Step 2: Add `isHidden` guard in WorkDetailModal**

In `src/app/components/WorkDetailModal.tsx`, after line 42 (`const work = allWorks.find(...)`), add a hidden-work check. If the work is hidden and the current user is not the owner, show a "not found" state instead of the work:

```typescript
const work = allWorks.find(w => w.id === workId);
const isOwner = work?.artistId === artists[0]?.id; // demo user = artists[0]
const blockedByHidden = work?.isHidden && !isOwner;
```

Then in the early return (where `!work` is checked), also return for `blockedByHidden`:

```typescript
if (!work || blockedByHidden) {
  return (
    <motion.div ...>
      {/* existing not-found UI */}
    </motion.div>
  );
}
```

- [ ] **Step 3: Verify in browser**

1. In admin (`/admin/reports`), mark a work as "비공개" (hidden).
2. Visit the artist's profile as another user — the hidden work should NOT appear.
3. Access `/exhibitions/{hiddenWorkId}` directly — should show not-found state.
4. Visit the artist's own profile — the hidden work should still appear.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/Profile.tsx src/app/components/WorkDetailModal.tsx
git commit -m "fix: filter isHidden works on other profiles and direct URL access

Browse/Search already filtered isHidden, but Profile (other user view)
and WorkDetailModal (direct URL) did not. Hidden works now only visible
to the owning artist."
```

---

## Task 3: Work deletion cascade — clean up notifications, reports, picks

When `removeWork()` is called, orphaned references remain in notifications, reports, and picks. This causes dead links when clicking notifications for deleted works.

**Files:**
- Modify: `src/app/store.ts:185-193` (removeWork function)

- [ ] **Step 1: Add cleanup helpers for notifications and reports**

In `src/app/store.ts`, add cleanup logic inside `removeWork`. Import is not needed for notifications/reports since they use raw localStorage. Add the cleanup between `cleanupOrphanedWorkId(id)` and `emitWorksChanged()`:

```typescript
removeWork: (id: string): Promise<void> => {
  pointsRecallIfQuickDelete(id);
  void deleteWorkMediaFromIdb(id);
  currentWorks = currentWorks.filter(w => w.id !== id);
  userInteractionStore.removeWorkId(id);
  cleanupOrphanedWorkId(id);

  // Clean up notifications referencing this work
  try {
    const nRaw = localStorage.getItem('artier_notifications');
    if (nRaw) {
      const notifs = JSON.parse(nRaw) as { workId?: string }[];
      const cleaned = notifs.filter(n => n.workId !== id);
      if (cleaned.length !== notifs.length) {
        localStorage.setItem('artier_notifications', JSON.stringify(cleaned));
        window.dispatchEvent(new Event('artier-notifications-changed'));
      }
    }
  } catch { /* ignore parse errors */ }

  // Clean up reports referencing this work
  try {
    const rRaw = localStorage.getItem('artier_reports');
    if (rRaw) {
      const reports = JSON.parse(rRaw) as { targetId?: string }[];
      const cleaned = reports.filter(r => r.targetId !== id);
      if (cleaned.length !== reports.length) {
        localStorage.setItem('artier_reports', JSON.stringify(cleaned));
      }
    }
  } catch { /* ignore */ }

  // Clean up admin picks referencing this work
  try {
    const pRaw = localStorage.getItem('artier_admin_picks_v1');
    if (pRaw) {
      const picks = JSON.parse(pRaw) as string[];
      const cleaned = picks.filter(p => p !== id);
      if (cleaned.length !== picks.length) {
        localStorage.setItem('artier_admin_picks_v1', JSON.stringify(cleaned));
      }
    }
  } catch { /* ignore */ }

  emitWorksChanged();
  return schedulePersist();
},
```

- [ ] **Step 2: Verify in browser**

1. Note a work ID that has notifications (like seed work `local-img-0`).
2. Delete the work from Profile.
3. Open `/notifications` — the notification referencing that work should be gone.
4. Check admin picks — the work should be removed from picks list.

- [ ] **Step 3: Commit**

```bash
git add src/app/store.ts
git commit -m "fix: clean up notifications, reports, picks on work deletion

removeWork() left orphaned references in artier_notifications,
artier_reports, and artier_admin_picks_v1. Clicking a notification
for a deleted work caused a dead link."
```

---

## Task 4: Event duplicate participation enforcement

CURRENT_SPEC says "동일 이벤트 중복 참여 불가" but Upload.tsx does not check if the user already submitted a work for the same event.

**Files:**
- Modify: `src/app/pages/Upload.tsx:757-764` (handlePublish, before addWork)

- [ ] **Step 1: Add duplicate event check before publishing**

In `src/app/pages/Upload.tsx`, inside `handlePublish`, right before the `if (editingWorkId)` block (around line 758), add a check:

```typescript
// Prevent duplicate event participation (editing the same work is OK)
if (linkedEventId && !editingWorkId) {
  const alreadySubmitted = workStore.getWorks().some(
    w => w.linkedEventId?.toString() === linkedEventId.toString() && w.artistId === artists[0]?.id
  );
  if (alreadySubmitted) {
    toast.error(t('upload.errDuplicateEvent'));
    setIsPublishing(false);
    return;
  }
}
```

- [ ] **Step 2: Add i18n key for duplicate event error**

In `src/app/i18n/messages.ts`, find the upload section and add the key:

```typescript
'upload.errDuplicateEvent': '이미 이 이벤트에 참여한 작품이 있습니다',
```

And the English equivalent:

```typescript
'upload.errDuplicateEvent': 'You already have a submission for this event',
```

- [ ] **Step 3: Verify in browser**

1. Upload a work linked to an event.
2. Try uploading another work linked to the same event.
3. Should see error toast and submission should be blocked.
4. Editing the existing submission should still work.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/Upload.tsx src/app/i18n/messages.ts
git commit -m "fix: enforce event duplicate participation check

Upload allowed multiple submissions to the same event despite
CURRENT_SPEC stating '동일 이벤트 중복 참여 불가'. Now checks
workStore for existing linkedEventId before publishing."
```

---

## Task 5: Fix withdrawal to only clear the withdrawing artist's follower delta

`clearFollowerDeltas()` wipes all follower deltas for all artists. Should only remove the withdrawing artist's delta.

**Files:**
- Modify: `src/app/utils/artistFollowDelta.ts:35-37` (add targeted removal function)
- Modify: `src/app/store.ts:686` (call targeted removal instead of global clear)

- [ ] **Step 1: Add `removeArtistFollowerDelta` function**

In `src/app/utils/artistFollowDelta.ts`, add a new exported function after `clearFollowerDeltas`:

```typescript
export function removeArtistFollowerDelta(artistId: string) {
  const d = load();
  delete d[artistId];
  save(d);
}
```

- [ ] **Step 2: Use targeted removal in `performAccountWithdrawal`**

In `src/app/store.ts`, change the import:

```typescript
import { clearFollowerDeltas, removeArtistFollowerDelta } from './utils/artistFollowDelta';
```

Then at line 686, replace `clearFollowerDeltas()` with:

```typescript
removeArtistFollowerDelta(currentArtistId);
```

- [ ] **Step 3: Verify logic**

1. Follow several artists (building up deltas).
2. Withdraw account.
3. Re-seed (or check localStorage) — `artier_artist_follower_delta` should still contain deltas for other artists, only the withdrawn artist's delta should be gone.

- [ ] **Step 4: Commit**

```bash
git add src/app/utils/artistFollowDelta.ts src/app/store.ts
git commit -m "fix: only clear withdrawing artist's follower delta, not all

clearFollowerDeltas() wiped artier_artist_follower_delta entirely on
any withdrawal. Now removeArtistFollowerDelta(id) targets only the
withdrawing artist."
```

---

## Task 6: Clear related draft after editing and publishing an existing work

When editing an existing work via `/upload?edit=workId`, the draft is not cleaned up after successful publish.

**Files:**
- Modify: `src/app/pages/Upload.tsx:757-813` (handlePublish, after successful update)

- [ ] **Step 1: Clear matching draft after edit-publish**

In `src/app/pages/Upload.tsx`, inside `handlePublish`, after line 764 (`workStore.addWork(newWork)` / `workStore.updateWork(...)`) block and before the toast section, add draft cleanup:

```typescript
if (editingWorkId) {
  workStore.updateWork(editingWorkId, newWork);
} else {
  workStore.addWork(newWork);
}

// Clear any draft that was associated with this work
if (activeDraftId) {
  draftStore.deleteDraft(activeDraftId);
}
```

Check if `activeDraftId` state variable already exists in the component (it should, since drafts can be loaded for editing). If it does, use it. If not, track the draft ID that was loaded when entering edit mode.

- [ ] **Step 2: Verify in browser**

1. Save a draft in upload.
2. Open the draft and publish it.
3. Go to Profile → Drafts tab — the draft should be gone.
4. Edit an existing published work → publish again — no stale draft should remain.

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/Upload.tsx
git commit -m "fix: clear draft after editing and publishing an existing work

Publishing from a draft or editing an existing work left the draft in
artier_drafts. Now deletes the active draft on successful publish."
```

---

## Task 7: Notifications page auth check

Notifications page operates on user-specific data but has no authentication check.

**Files:**
- Modify: `src/app/pages/Notifications.tsx:179+` (component body, add auth redirect)

- [ ] **Step 1: Add auth guard to Notifications component**

In `src/app/pages/Notifications.tsx`, import `authStore`:

```typescript
import { authStore } from '../store';
```

Then at the top of the `Notifications` component (right after `useNavigate` and `useI18n` hooks), add:

```typescript
useEffect(() => {
  if (!authStore.isLoggedIn()) {
    navigate('/login?redirect=/notifications', { replace: true });
  }
}, [navigate]);

if (!authStore.isLoggedIn()) return null;
```

- [ ] **Step 2: Verify in browser**

1. Log out.
2. Navigate directly to `/notifications`.
3. Should redirect to `/login?redirect=/notifications`.
4. After login, should return to notifications.

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/Notifications.tsx
git commit -m "fix: add auth guard to Notifications page

/notifications was accessible without login despite operating on
user-specific data. Now redirects to login."
```

---

## Task 8: Replace hardcoded `20` with `TITLE_FIELD_MAX_LEN` in Profile.tsx

Profile.tsx imports `TITLE_FIELD_MAX_LEN` but still hardcodes `20` in 4 places for nickname and headline inputs.

**Files:**
- Modify: `src/app/pages/Profile.tsx:426,432,435,450,456,459` (hardcoded 20s)

- [ ] **Step 1: Verify `TITLE_FIELD_MAX_LEN` is imported**

Check that Profile.tsx already imports from `workDisplay.ts`. It does (per CLAUDE.md). If not, add:

```typescript
import { TITLE_FIELD_MAX_LEN } from '../utils/workDisplay';
```

- [ ] **Step 2: Replace all hardcoded `20` with the constant**

Replace 4 locations:

Line 426: `if (e.target.value.length <= 20)` → `if (e.target.value.length <= TITLE_FIELD_MAX_LEN)`
Line 432: `maxLength={20}` → `maxLength={TITLE_FIELD_MAX_LEN}`
Line 435: `{profileNickname.length}/20` → `{profileNickname.length}/{TITLE_FIELD_MAX_LEN}`
Line 450: `if (e.target.value.length <= 20)` → `if (e.target.value.length <= TITLE_FIELD_MAX_LEN)`
Line 456: `maxLength={20}` → `maxLength={TITLE_FIELD_MAX_LEN}`
Line 459: `{profileHeadline.length}/20` → `{profileHeadline.length}/{TITLE_FIELD_MAX_LEN}`

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/Profile.tsx
git commit -m "fix: replace hardcoded 20 with TITLE_FIELD_MAX_LEN in Profile

Nickname and headline inputs hardcoded maxLength=20 instead of using
the TITLE_FIELD_MAX_LEN constant from workDisplay.ts. Future changes
to the limit would not have propagated."
```

---

## Task 9: Fix CLAUDE.md WORKS_STORAGE_VERSION and CURRENT_SPEC banner count

Documentation says `local-gallery-v11` but code is `local-gallery-v13`. CURRENT_SPEC says banner max 8 but code is 5.

**Files:**
- Modify: `CLAUDE.md:51,188` (version string)
- Modify: `CURRENT_SPEC.md` (banner count: 8 → 5)

- [ ] **Step 1: Update CLAUDE.md**

Find both instances of `local-gallery-v11` in CLAUDE.md and replace with `local-gallery-v13`.

- [ ] **Step 2: Update CURRENT_SPEC.md**

Find the banner max count entry and change from `8개` to `5개`. Also fix the BannerManagement description from "최대 8개" to "최대 5개".

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md CURRENT_SPEC.md
git commit -m "docs: fix WORKS_STORAGE_VERSION (v11→v13) and banner max (8→5)

CLAUDE.md documented v11 but store.ts uses v13.
CURRENT_SPEC.md documented max 8 banners but bannerStore.ts enforces 5."
```

---

## Summary

| Task | Issue | Severity | Flow |
|------|-------|----------|------|
| 1 | Like/save counts not synced → feed ranking broken | HIGH | Browse |
| 2 | isHidden works visible on other profiles + direct URL | HIGH | Profile |
| 3 | Work deletion leaves orphaned notifications/reports/picks | HIGH | Profile, Admin |
| 4 | Event duplicate participation not enforced | HIGH | Upload |
| 5 | Withdrawal clears all follower deltas | MEDIUM | Profile |
| 6 | Draft not cleared after edit-publish | MEDIUM | Upload |
| 7 | Notifications no auth check | MEDIUM | Notifications |
| 8 | TITLE_FIELD_MAX_LEN hardcoded in Profile | LOW | Profile |
| 9 | Doc version/banner count mismatch | LOW | Docs |
