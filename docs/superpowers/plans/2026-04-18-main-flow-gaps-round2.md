# Main Flow Gaps Round 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix remaining gaps in Browse/Upload/Profile/Admin flows — memory leaks, data loss risk, security, validation, UX feedback.

**Architecture:** All fixes are surgical edits to existing files. Ordered by blast radius: CRITICAL first (data loss, memory), then HIGH (broken flows), then MEDIUM (UX polish).

**Tech Stack:** React 19, TypeScript, localStorage stores, Vite

---

## CRITICAL

### Task 1: Fix 5 store subscription memory leaks

`useProfileStore`, `useInteractionStore`, `useAuthStore`, `useFollowStore`, `useAccountSuspensionStore` — subscribe() return value not returned from useEffect cleanup.

**Files:**
- Modify: `src/app/store.ts:442-444, 514-516, 556-558, 616-618, 676-678`

- [ ] **Step 1:** Fix `useProfileStore` — add `return` before `profileStore.subscribe`
- [ ] **Step 2:** Fix `useInteractionStore` (same pattern)
- [ ] **Step 3:** Fix `useAuthStore` (same pattern)
- [ ] **Step 4:** Fix `useFollowStore` (same pattern)
- [ ] **Step 5:** Fix `useAccountSuspensionStore` (same pattern)
- [ ] **Step 6:** Type check
- [ ] **Step 7:** Commit

---

### Task 2: Storage version migration — don't destroy user data

`loadWorksFromStorage()` replaces all data with seed when version changes.

**Files:**
- Modify: `src/app/store.ts:86-105`

- [ ] **Step 1:** Change logic: if version mismatch, MERGE seed into existing (keep user uploads), then update version
- [ ] **Step 2:** Type check
- [ ] **Step 3:** Commit

---

### Task 3: Login redirect whitelist — block external URLs

`Login.tsx:19` takes `redirect` param without sanitization.

**Files:**
- Modify: `src/app/pages/Login.tsx:19`

- [ ] **Step 1:** Validate redirect starts with `/` (internal path only)
- [ ] **Step 2:** Type check
- [ ] **Step 3:** Commit

---

## HIGH — Upload flow

### Task 4: Validate exhibition name in handlePublish

`handlePublish` has no empty-exhibition-name check despite UI showing red border.

**Files:**
- Modify: `src/app/pages/Upload.tsx:595-607`

- [ ] **Step 1:** Add `exhibitionName.trim()` check after `isOriginalWork` check
- [ ] **Step 2:** Type check + commit

---

### Task 5: Instructor checkbox — confirm before clearing self-slots

Toggling "I'm an instructor" silently erases self-assigned artist slots.

**Files:**
- Modify: `src/app/pages/Upload.tsx:374-389`

- [ ] **Step 1:** Replace immediate clear with `openConfirm` before clearing
- [ ] **Step 2:** Type check + commit

---

### Task 6: Edit mode with deleted work — show error

`/upload?edit=deletedId` silently shows blank form.

**Files:**
- Modify: `src/app/pages/Upload.tsx:458-462`

- [ ] **Step 1:** Show error toast and redirect to `/upload` if work not found
- [ ] **Step 2:** Type check + commit

---

### Task 7: Deep link query preservation on login redirect

`/upload?draft=abc` loses query params on login redirect.

**Files:**
- Modify: `src/app/pages/Upload.tsx:217`

- [ ] **Step 1:** Include full path+query in redirect param
- [ ] **Step 2:** Type check + commit

---

## HIGH — Profile flow

### Task 8: Work deletion — add "permanent" warning + success toast

Delete confirmation lacks "cannot undo" text, and no success feedback.

**Files:**
- Modify: `src/app/pages/Profile.tsx:904-910`

- [ ] **Step 1:** Add description to openConfirm with permanent warning
- [ ] **Step 2:** Add toast.success after removeWork
- [ ] **Step 3:** Do the same for draft deletion (~line 1401)
- [ ] **Step 4:** Type check + commit

---

### Task 9: Profile bio maxLength

Bio textarea has no character limit unlike nickname (20) and headline (20).

**Files:**
- Modify: `src/app/pages/Profile.tsx:470-476`

- [ ] **Step 1:** Add `maxLength={200}` + counter
- [ ] **Step 2:** Type check + commit

---

## HIGH — Browse flow

### Task 10: Follow store — add self-follow and withdrawn-artist guards

`followStore.toggle()` has no guard against self-follow or following withdrawn artists.

**Files:**
- Modify: `src/app/store.ts:584-604`

- [ ] **Step 1:** Add self-follow check (compare against artists[0].id)
- [ ] **Step 2:** Add withdrawnArtistStore.isWithdrawn() check
- [ ] **Step 3:** Type check + commit

---

## HIGH — Admin flow

### Task 11: Banner/Event date validation — start must be before end

Both admin pages allow startAt > endAt.

**Files:**
- Modify: `src/app/admin/BannerManagement.tsx` (submit handler)
- Modify: `src/app/admin/EventManagement.tsx` (submit handler)

- [ ] **Step 1:** Add date comparison in banner submit
- [ ] **Step 2:** Add date comparison in event submit
- [ ] **Step 3:** Add i18n error keys
- [ ] **Step 4:** Type check + commit

---

### Task 12: Event deletion — clean up orphaned linkedEventId

Deleting an event leaves works with dangling `linkedEventId`.

**Files:**
- Modify: `src/app/admin/EventManagement.tsx` (remove handler)

- [ ] **Step 1:** After eventStore.remove(), clear linkedEventId from all works referencing it
- [ ] **Step 2:** Type check + commit

---

## MEDIUM — Validation & UX

### Task 13: Profanity error — specify which field

Current message says "전시명·그룹명·태그에..." without identifying which.

**Files:**
- Modify: `src/app/pages/Upload.tsx:610-613`

- [ ] **Step 1:** Check each field individually and name the offending one
- [ ] **Step 2:** Add i18n keys for per-field messages
- [ ] **Step 3:** Type check + commit

---

### Task 14: Onboarding profile image — add file size limit

No file size check. 50MB image crashes browser.

**Files:**
- Modify: `src/app/pages/Onboarding.tsx:161-170`

- [ ] **Step 1:** Add 5MB limit check before readAsDataURL
- [ ] **Step 2:** Add i18n error key
- [ ] **Step 3:** Type check + commit

---

### Task 15: Search input maxLength

No maxLength on search input.

**Files:**
- Modify: `src/app/pages/Search.tsx:198`

- [ ] **Step 1:** Add `maxLength={100}` to search input
- [ ] **Step 2:** Commit

---

### Task 16: Points double-award prevention

`pointsOnWorkPublished()` has no workId dedup. Same work can award points twice.

**Files:**
- Modify: `src/app/utils/pointsBackground.ts:120-176`

- [ ] **Step 1:** Check if work.id already exists in publish times before awarding
- [ ] **Step 2:** Type check + commit

---

### Task 17: Points balance floor — prevent negative

`getApBalanceFromLedger()` can return negative.

**Files:**
- Modify: `src/app/utils/pointsBackground.ts:233-235`

- [ ] **Step 1:** Clamp return to `Math.max(0, sum)`
- [ ] **Step 2:** Commit

---
