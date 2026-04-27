// 전역 상태 관리 (간단한 구현)
import { useState, useEffect } from 'react';
import { Work, works as initialWorks, artists } from './data';
import { pointsRecallIfQuickDelete } from './utils/pointsBackground';
import { adjustArtistFollowerDelta, removeArtistFollowerDelta } from './utils/artistFollowDelta';
import { clearMockSession } from './services/sessionTokens';
import {
  offloadHeavyMediaInWorks,
  hydrateWorksMedia,
  deleteWorkMediaFromIdb,
  workContainsMediaRefs,
} from './utils/workMediaIdb';
import { forgetSeenWork } from './utils/seenFeedWorks';
import { cleanupReportRefsForWork } from './utils/reportStorage';
import { normalizeWorkVisibility } from './utils/workVisibility';

function cleanupOrphanedWorkId(workId: string) {
  if (typeof window === 'undefined') return;
  try {
    const curRaw = localStorage.getItem('artier_curation_v1');
    if (!curRaw) return;
    const state = JSON.parse(curRaw);
    if (!state || typeof state !== 'object' || !Array.isArray(state.themes)) return;
    let changed = false;
    for (const theme of state.themes) {
      if (theme && Array.isArray(theme.workIds) && theme.workIds.includes(workId)) {
        theme.workIds = theme.workIds.filter((id: string) => id !== workId);
        changed = true;
      }
    }
    if (changed) localStorage.setItem('artier_curation_v1', JSON.stringify(state));
  } catch { /* ignore */ }
}

/**
 * public/images·manifest가 바뀌면 저장된 work.image 경로가 디스크와 어긋나 썸네일 404가 남.
 * 버전을 올리면 시드(현재 manifest 기반)로 다시 채운 뒤 저장된다.
 */
const WORKS_STORAGE_VERSION = 'local-gallery-v16';

// 초안 타입 정의
export interface Draft {
  id: string;
  /** 프로필 초안 카드 표시용(전시명·첫 작품명 등) */
  title: string;
  /** 세부 정보 모달의 전시명 */
  exhibitionName?: string;
  /** 업로드 유형 (혼자/함께) */
  uploadType?: 'solo' | 'group';
  /** 함께 올리기의 그룹명 */
  groupName?: string;
  /** 강사 업로드 여부 */
  isInstructor?: boolean;
  /** 대표 이미지 인덱스. -1이면 `customCoverUrl` 사용 */
  coverImageIndex?: number;
  /** 로컬 파일로 별도 지정한 커버 (data URL). 저장 시 work.customCoverUrl로 이관 */
  customCoverUrl?: string;
  contents: Array<{
    id: string;
    type: 'image';
    url?: string;
    title?: string;
    artist?: { id: string; name: string; avatar: string };
    nonMemberArtist?: { displayName: string; phoneNumber: string };
    artistType?: 'member' | 'non-member' | 'self' | 'unknown';
    fullWidth?: boolean;
  }>;
  tags: string[];
  categories: string[];
  savedAt: string;
}

// ===== 작품 데이터 관리 =====

/** 시드·버전 마이그레이션용(용량 작음). 실패는 무시한다. */
function saveWorksToStoragePlain(works: Work[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('artier_works_version', WORKS_STORAGE_VERSION);
    localStorage.setItem('artier_works', JSON.stringify(works));
  } catch {
    /* ignore */
  }
}

// 로컬 스토리지에서 작품 데이터 불러오기
const loadWorksFromStorage = (): Work[] => {
  if (typeof window === 'undefined') return initialWorks;

  const version = localStorage.getItem('artier_works_version');
  if (version !== WORKS_STORAGE_VERSION) {
    // Migration: keep user-uploaded works, refresh only seed data
    let userWorks: Work[] = [];
    try {
      const raw = localStorage.getItem('artier_works');
      if (raw) {
        const all = JSON.parse(raw) as Array<Work & { editorsPick?: boolean }>;
        const seedIds = new Set(initialWorks.map((w) => w.id));
        userWorks = all
          .filter((w) => !seedIds.has(w.id))
          .map((w) => {
            // v14: editorsPick → pickBadge 리네이밍
            if ('editorsPick' in w) {
              const { editorsPick, ...rest } = w;
              return { ...rest, pickBadge: editorsPick || rest.pickBadge } as Work;
            }
            return w as Work;
          });
      }
    } catch { /* ignore corrupt data */ }
    const merged = [...initialWorks, ...userWorks].map(normalizeWorkVisibility);
    saveWorksToStoragePlain(merged);
    return merged;
  }

  const stored = localStorage.getItem('artier_works');
  if (stored) {
    try {
      return (JSON.parse(stored) as Work[]).map(normalizeWorkVisibility);
    } catch {
      const normalizedSeed = initialWorks.map(normalizeWorkVisibility);
      saveWorksToStoragePlain(normalizedSeed);
      return normalizedSeed;
    }
  }
  return initialWorks.map(normalizeWorkVisibility);
};

function isQuotaExceeded(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') return true;
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: number }).code === 22
  );
}

function emitWorksChanged() {
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('artier-works-changed'));
}

/** 직렬화된 작품 목록을 localStorage에 쓴다. 용량 초과 시 무거운 data URL만 IDB로 옮긴 복제본으로 재시도한다. */
let persistChain: Promise<void> = Promise.resolve();

function schedulePersist(): Promise<void> {
  const run = persistChain.then(async () => {
    if (typeof window === 'undefined') return;
    try {
      try {
        localStorage.setItem('artier_works_version', WORKS_STORAGE_VERSION);
        localStorage.setItem('artier_works', JSON.stringify(currentWorks));
      } catch (e) {
        if (!isQuotaExceeded(e)) throw e;
        const snapshot = JSON.parse(JSON.stringify(currentWorks)) as Work[];
        const forDisk = await offloadHeavyMediaInWorks(snapshot);
        localStorage.setItem('artier_works_version', WORKS_STORAGE_VERSION);
        localStorage.setItem('artier_works', JSON.stringify(forDisk));
      }
    } catch (err) {
      console.error('[workStore] persist failed', err);
      throw err;
    }
  });
  persistChain = run.catch(() => {
    /* 다음 저장이 이어지도록 큐는 유지 */
  });
  return run;
}

// 작품 데이터 관리
let currentWorks = loadWorksFromStorage();
const listeners: (() => void)[] = [];

export const workStore = {
  // 모든 작품 가져오기
  getWorks: () => currentWorks,

  // 특정 작품 가져오기
  getWork: (id: string) => currentWorks.find(w => w.id === id),

  /** 로드된 작품에 `__artier_media__` 포인터가 있으면 IDB에서 실제 이미지 문자열로 채운다 */
  hydrateMediaIfNeeded: async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (!currentWorks.some(workContainsMediaRefs)) return;
    currentWorks = await hydrateWorksMedia(currentWorks);
    emitWorksChanged();
  },

  // 새 작품 추가
  addWork: (work: Work): Promise<void> => {
    currentWorks = [work, ...currentWorks];
    emitWorksChanged();
    return schedulePersist();
  },

  // 작품 업데이트
  updateWork: (id: string, updates: Partial<Work>): Promise<void> => {
    currentWorks = currentWorks.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
    emitWorksChanged();
    return schedulePersist();
  },

  removeWork: (id: string): Promise<void> => {
    pointsRecallIfQuickDelete(id); // artier_work_publish_times 엔트리도 함께 정리
    void deleteWorkMediaFromIdb(id);
    currentWorks = currentWorks.filter(w => w.id !== id);
    userInteractionStore.removeWorkId(id);
    cleanupOrphanedWorkId(id); // 기획전(artier_curation_v1) workIds 정리
    forgetSeenWork(id); // 이미 본 작품 목록에서 제거
    cleanupReportRefsForWork(id); // 신고 중복 서명·신고자 숨김 참조 정리

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
    } catch { /* ignore */ }

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

    // 비회원 초대 토큰 영구 무효화 (Policy §3.4 — 전시 삭제 시 토큰 revoke)
    try {
      // 동적 import로 inviteTokenStore와 store.ts의 순환 의존 차단
      void import('./utils/inviteTokenStore').then(({ revokeInviteToken }) => revokeInviteToken(id));
    } catch { /* ignore */ }

    emitWorksChanged();
    return schedulePersist();
  },

  /** 다른 탭·창에서 `artier_works`가 바뀐 뒤 메모리와 화면을 맞출 때 */
  syncFromLocalStorage: () => {
    if (typeof window === 'undefined') return;
    currentWorks = loadWorksFromStorage();
    emitWorksChanged();
    void workStore.hydrateMediaIfNeeded();
  },

  // 변경사항 구독
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
};

// React Hook으로 사용하기 위한 헬퍼
export const useWorkStore = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return workStore.subscribe(() => {
      forceUpdate({});
    });
  }, []);

  return workStore;
};

// ===== 초안 데이터 관리 =====

// 로컬 스토리지에서 초안 불러오기
const loadDraftsFromStorage = (): Draft[] => {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('artier_drafts');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // 손상 JSON — 백업 키로 1회 보관 후 빈 배열로 복구.
      try { localStorage.setItem('artier_drafts__corrupt_backup', stored); } catch { /* ignore */ }
      return [];
    }
  }
  return [];
};

// 로컬 스토리지에 초안 저장
const saveDraftsToStorage = (drafts: Draft[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('artier_drafts', JSON.stringify(drafts));
  } catch (err) {
    // quota exceeded 등 — 사용자에게 알릴 방법은 store 레벨에선 제한적.
    // 브라우저 콘솔에 경고 1회 남기고, 메모리 상태는 유지(다음 저장 시도에서 다시 시도).
    if (typeof console !== 'undefined') console.warn('[draftStore] save failed:', err);
  }
};

// 초안 데이터 관리
let currentDrafts = loadDraftsFromStorage();
const draftListeners: (() => void)[] = [];

export const draftStore = {
  // 모든 초안 가져오기
  getDrafts: () => currentDrafts,

  // 특정 초안 가져오기
  getDraft: (id: string) => currentDrafts.find(d => d.id === id),

  // 초안 저장
  saveDraft: (draft: Draft) => {
    const existingIndex = currentDrafts.findIndex(d => d.id === draft.id);
    if (existingIndex >= 0) {
      currentDrafts[existingIndex] = draft;
    } else {
      currentDrafts = [draft, ...currentDrafts];
    }
    saveDraftsToStorage(currentDrafts);
    draftListeners.forEach(listener => listener());
    return draft.id;
  },

  // 초안 삭제
  deleteDraft: (id: string) => {
    currentDrafts = currentDrafts.filter(d => d.id !== id);
    saveDraftsToStorage(currentDrafts);
    draftListeners.forEach(listener => listener());
  },

  // 변경사항 구독
  subscribe: (listener: () => void) => {
    draftListeners.push(listener);
    return () => {
      const index = draftListeners.indexOf(listener);
      if (index > -1) {
        draftListeners.splice(index, 1);
      }
    };
  }
};

// React Hook으로 사용하기 위한 헬퍼
export const useDraftStore = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return draftStore.subscribe(() => {
      forceUpdate({});
    });
  }, []);

  return draftStore;
};

// ===== 프로필 데이터 관리 =====

export interface UserProfile {
  name: string;
  nickname: string;
  /** 전화번호 (Settings에서 추가 가능, 비회원 초대 매칭 키) */
  phone?: string;
  /** 이메일 (소셜 가입 시 제공 확인, 이메일 가입 시 가입 이메일) */
  email?: string;
  headline: string;
  bio: string;
  location: string;
  interests?: string[];
  avatarUrl?: string;
  /** 외부 링크 (SNS, 수업 페이지 등) */
  externalLinks?: { label: string; url: string }[];
}

const defaultProfile: UserProfile = {
  name: '',
  nickname: '',
  headline: '',
  bio: '',
  location: '',
};

const loadProfileFromStorage = (): UserProfile => {
  if (typeof window === 'undefined') return defaultProfile;
  const stored = localStorage.getItem('artier_profile');
  if (stored) {
    try { return { ...defaultProfile, ...JSON.parse(stored) }; } catch { return defaultProfile; }
  }
  return defaultProfile;
};

let currentProfile = loadProfileFromStorage();
const profileListeners: (() => void)[] = [];

// 앱 부팅 시 저장된 프로필을 artists[0] + 내 작품 스냅샷에 동기화
{
  const me = artists[0];
  if (me && currentProfile.name) {
    me.name = currentProfile.name;
    if (currentProfile.headline) me.bio = currentProfile.headline;
    if (currentProfile.avatarUrl) me.avatar = currentProfile.avatarUrl;

    let worksUpdated = false;
    for (const w of currentWorks) {
      if (w.artistId === me.id && w.artist) {
        if (w.artist.name !== me.name || w.artist.avatar !== me.avatar || w.artist.bio !== me.bio) {
          w.artist = { ...w.artist, name: me.name, avatar: me.avatar, bio: me.bio };
          worksUpdated = true;
        }
      }
    }
    if (worksUpdated) void schedulePersist();
  }
}

export const profileStore = {
  getProfile: () => currentProfile,
  updateProfile: (updates: Partial<UserProfile>) => {
    currentProfile = { ...currentProfile, ...updates };
    localStorage.setItem('artier_profile', JSON.stringify(currentProfile));
    const me = artists[0];
    if (me) {
      if (updates.name !== undefined) me.name = updates.name;
      if (updates.headline !== undefined) me.bio = updates.headline;
      if (updates.avatarUrl !== undefined) me.avatar = updates.avatarUrl;
      if (updates.name !== undefined || updates.avatarUrl !== undefined || updates.headline !== undefined) {
        let changed = false;
        for (const w of currentWorks) {
          if (w.artistId === me.id && w.artist) {
            w.artist = { ...w.artist, name: me.name, avatar: me.avatar, bio: me.bio };
            changed = true;
          }
        }
        if (changed) {
          void schedulePersist();
          listeners.forEach(l => l());
        }
      }
    }
    profileListeners.forEach(l => l());
  },
  subscribe: (listener: () => void) => {
    profileListeners.push(listener);
    return () => {
      const idx = profileListeners.indexOf(listener);
      if (idx > -1) profileListeners.splice(idx, 1);
    };
  },
};

export const useProfileStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return profileStore.subscribe(() => forceUpdate({}));
  }, []);
  return profileStore;
};

// ===== 좋아요·저장 목록 관리 =====

const loadInteractionsFromStorage = () => {
  if (typeof window === 'undefined') return { liked: [] as string[], saved: [] as string[] };
  const stored = localStorage.getItem('artier_interactions');
  if (stored) {
    try { return JSON.parse(stored) as { liked: string[]; saved: string[] }; } catch { }
  }
  return { liked: [] as string[], saved: [] as string[] };
};

let currentInteractions = loadInteractionsFromStorage();
const interactionListeners: (() => void)[] = [];

const saveInteractions = () => {
  localStorage.setItem('artier_interactions', JSON.stringify(currentInteractions));
  interactionListeners.forEach(l => l());
};

export const userInteractionStore = {
  getLiked: () => currentInteractions.liked,
  getSaved: () => currentInteractions.saved,
  isLiked: (id: string) => currentInteractions.liked.includes(id),
  isSaved: (id: string) => currentInteractions.saved.includes(id),
  toggleLike: (id: string) => {
    // 탈퇴 작가의 작품은 인터랙션 불가(Policy §4.2). 기존 기록은 보존, 신규 토글 차단.
    const w = currentWorks.find(w => w.id === id);
    if (w && withdrawnArtistStore.isWithdrawn(w.artistId)) return;
    const alreadyLiked = currentInteractions.liked.includes(id);
    if (alreadyLiked) {
      currentInteractions.liked = currentInteractions.liked.filter(i => i !== id);
    } else {
      currentInteractions.liked = [...currentInteractions.liked, id];
    }
    saveInteractions();
    if (w) {
      const delta = alreadyLiked ? -1 : 1;
      workStore.updateWork(id, { likes: Math.max(0, (w.likes ?? 0) + delta) });
    }
  },
  toggleSave: (id: string) => {
    // 탈퇴 작가의 작품은 인터랙션 불가(Policy §4.2).
    const w = currentWorks.find(w => w.id === id);
    if (w && withdrawnArtistStore.isWithdrawn(w.artistId)) return;
    const alreadySaved = currentInteractions.saved.includes(id);
    if (alreadySaved) {
      currentInteractions.saved = currentInteractions.saved.filter(i => i !== id);
    } else {
      currentInteractions.saved = [...currentInteractions.saved, id];
    }
    saveInteractions();
    if (w) {
      const delta = alreadySaved ? -1 : 1;
      workStore.updateWork(id, { saves: Math.max(0, (w.saves ?? 0) + delta) });
    }
  },
  removeWorkId: (id: string) => {
    currentInteractions.liked = currentInteractions.liked.filter(i => i !== id);
    currentInteractions.saved = currentInteractions.saved.filter(i => i !== id);
    saveInteractions();
  },
  subscribe: (listener: () => void) => {
    interactionListeners.push(listener);
    return () => {
      const idx = interactionListeners.indexOf(listener);
      if (idx > -1) interactionListeners.splice(idx, 1);
    };
  },
};

export const useInteractionStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return userInteractionStore.subscribe(() => forceUpdate({}));
  }, []);
  return userInteractionStore;
};

// ===== 인증 상태 관리 =====

const loadAuthFromStorage = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('artier_auth');
  if (stored !== null) {
    try { return JSON.parse(stored); } catch { return true; }
  }
  return true;
};

let isLoggedIn = loadAuthFromStorage();
const authListeners: (() => void)[] = [];

export const authStore = {
  isLoggedIn: () => isLoggedIn,
  login: () => {
    isLoggedIn = true;
    localStorage.setItem('artier_auth', 'true');
    authListeners.forEach(l => l());
  },
  logout: () => {
    isLoggedIn = false;
    localStorage.setItem('artier_auth', 'false');
    clearMockSession();
    authListeners.forEach(l => l());
  },
  subscribe: (listener: () => void) => {
    authListeners.push(listener);
    return () => {
      const idx = authListeners.indexOf(listener);
      if (idx > -1) authListeners.splice(idx, 1);
    };
  },
};

export const useAuthStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return authStore.subscribe(() => forceUpdate({}));
  }, []);
  return authStore;
};

// ===== 팔로우 상태 관리 =====

const loadFollowsFromStorage = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('artier_follows');
  if (stored) {
    try { return JSON.parse(stored); } catch { return []; }
  }
  return [];
};

let currentFollows = loadFollowsFromStorage();
const followListeners: (() => void)[] = [];

const saveFollows = () => {
  localStorage.setItem('artier_follows', JSON.stringify(currentFollows));
  followListeners.forEach(l => l());
};

export const followStore = {
  getFollows: () => currentFollows,
  isFollowing: (id: string) => currentFollows.includes(id),
  toggle: (id: string) => {
    // Guard: no self-follow, no following withdrawn artists
    if (id === artists[0]?.id) return;
    if (withdrawnArtistStore.isWithdrawn(id)) return;
    if (currentFollows.includes(id)) {
      currentFollows = currentFollows.filter(f => f !== id);
      adjustArtistFollowerDelta(id, -1);
    } else {
      currentFollows = [...currentFollows, id];
      adjustArtistFollowerDelta(id, 1);
      // 팔로우 알림 자동 발송
      try {
        const p = profileStore.getProfile();
        const name = p.nickname || p.name || 'Member';
        import('./utils/pushDemoNotification').then(({ pushDemoNotification }) => {
          pushDemoNotification({
            type: 'follow' as const,
            message: '님이 회원님을 팔로우합니다',
            fromUser: { name, avatar: '', id: 'me' },
          });
        }).catch(() => {});
      } catch { /* ignore */ }
    }
    saveFollows();
  },
  getCount: () => currentFollows.length,
  subscribe: (listener: () => void) => {
    followListeners.push(listener);
    return () => {
      const idx = followListeners.indexOf(listener);
      if (idx > -1) followListeners.splice(idx, 1);
    };
  },
};

export const useFollowStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return followStore.subscribe(() => forceUpdate({}));
  }, []);
  return followStore;
};

// ===== 계정 정지 (로그인 차단 — 정책: 계정 정지 및 제재) =====

const SUSPEND_KEY = 'artier_account_suspension';

export interface AccountSuspension {
  active: boolean;
  reason?: string;
  /** ISO 날짜 문자열; null이면 기간 없이 표시(영구 정지 안내) */
  until: string | null;
}

function loadSuspension(): AccountSuspension {
  if (typeof window === 'undefined') return { active: false, until: null };
  try {
    const raw = localStorage.getItem(SUSPEND_KEY);
    if (!raw) return { active: false, until: null };
    const p = JSON.parse(raw) as AccountSuspension;
    if (!p.active) return { active: false, until: null };
    if (p.until) {
      const end = new Date(p.until).getTime();
      if (!Number.isNaN(end) && end < Date.now()) {
        localStorage.removeItem(SUSPEND_KEY);
        return { active: false, until: null };
      }
    }
    return { active: true, reason: p.reason, until: p.until ?? null };
  } catch {
    return { active: false, until: null };
  }
}

let suspension = loadSuspension();
const suspensionListeners: (() => void)[] = [];

export const accountSuspensionStore = {
  get: () => suspension,
  set: (next: AccountSuspension) => {
    suspension = next;
    if (typeof window !== 'undefined') {
      if (next.active) localStorage.setItem(SUSPEND_KEY, JSON.stringify(next));
      else localStorage.removeItem(SUSPEND_KEY);
    }
    suspensionListeners.forEach((l) => l());
  },
  clear: () => accountSuspensionStore.set({ active: false, until: null }),
  subscribe: (l: () => void) => {
    suspensionListeners.push(l);
    return () => {
      const i = suspensionListeners.indexOf(l);
      if (i > -1) suspensionListeners.splice(i, 1);
    };
  },
};

export const useAccountSuspensionStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    return accountSuspensionStore.subscribe(() => forceUpdate({}));
  }, []);
  return accountSuspensionStore;
};

// ===== 탈퇴 후 작가 익명화 (정책: 회원 탈퇴 처리) =====

const WITHDRAWN_ARTISTS_KEY = 'artier_withdrawn_artists';

export const withdrawnArtistStore = {
  getIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(WITHDRAWN_ARTISTS_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  },
  mark(artistId: string) {
    if (typeof window === 'undefined') return;
    const ids = new Set(withdrawnArtistStore.getIds());
    ids.add(artistId);
    localStorage.setItem(WITHDRAWN_ARTISTS_KEY, JSON.stringify([...ids]));
  },
  isWithdrawn(artistId: string) {
    return withdrawnArtistStore.getIds().includes(artistId);
  },
};

const ANON_DISPLAY = '작가 미상';
const ANON_AVATAR =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop';

/** 데모: 현재 로그인 사용자(첫 번째 시드 작가) 기준 탈퇴 처리 */
export function performAccountWithdrawal(currentArtistId: string, withdrawReasonId?: string) {
  if (typeof window !== 'undefined' && withdrawReasonId) {
    try {
      localStorage.setItem('artier_demo_last_withdraw_reason', withdrawReasonId);
    } catch {
      /* ignore */
    }
  }
  withdrawnArtistStore.mark(currentArtistId);
  // Policy §4.4: 탈퇴 후 같은 이메일·전화로 즉시 재가입 가능 — registry에서 식별자 정리.
  try {
    const p = profileStore.getProfile();
    if (typeof window !== 'undefined') {
      void import('./utils/registeredAccounts').then(({ unregisterAccount }) => {
        unregisterAccount(p.email, p.phone);
      });
    }
  } catch { /* ignore */ }
  const ownWorkIds: string[] = [];
  workStore.getWorks().forEach((w) => {
    if (w.artistId !== currentArtistId) return;
    ownWorkIds.push(w.id);
    workStore.updateWork(w.id, {
      artist: {
        ...w.artist,
        id: w.artist.id,
        name: ANON_DISPLAY,
        avatar: ANON_AVATAR,
        bio: undefined,
      },
    });
  });
  // Policy §3.4: 작가 탈퇴 시 본인 업로드 전시의 비회원 초대 토큰을 영구 무효(`revoked`)로 전환.
  if (ownWorkIds.length > 0) {
    void import('./utils/inviteTokenStore').then(({ revokeInviteToken }) => {
      ownWorkIds.forEach((id) => revokeInviteToken(id));
    });
  }
  // 탈퇴 작가의 작품을 어드민 Pick 목록에서 제거 (Policy §15.3 일관 — 탈퇴 작가 작품은 Pick 자격 없음).
  try {
    const pRaw = localStorage.getItem('artier_admin_picks_v1');
    if (pRaw && ownWorkIds.length > 0) {
      const picks = JSON.parse(pRaw) as string[];
      const cleaned = picks.filter((p) => !ownWorkIds.includes(p));
      if (cleaned.length !== picks.length) {
        localStorage.setItem('artier_admin_picks_v1', JSON.stringify(cleaned));
      }
    }
  } catch { /* ignore */ }
  currentInteractions = { liked: [], saved: [] };
  localStorage.setItem('artier_interactions', JSON.stringify(currentInteractions));
  interactionListeners.forEach((l) => l());
  currentFollows = [];
  removeArtistFollowerDelta(currentArtistId);
  saveFollows();
  const draftIds = draftStore.getDrafts().map((d) => d.id);
  draftIds.forEach((id) => draftStore.deleteDraft(id));
  authStore.logout();
}
