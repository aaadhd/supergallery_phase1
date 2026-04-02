// 전역 상태 관리 (간단한 구현)
import { useState, useEffect } from 'react';
import { Work, works as initialWorks } from './data';
import { pointsRecallIfQuickDelete } from './utils/pointsBackground';

// 초안 타입 정의
export interface Draft {
  id: string;
  title: string;
  contents: Array<{
    id: string;
    type: 'image';
    url?: string;
    title?: string;
    artist?: { id: string; name: string; avatar: string }
  }>;
  tags: string[];
  categories: string[];
  savedAt: string;
}

// ===== 작품 데이터 관리 =====

// 로컬 스토리지에서 작품 데이터 불러오기
const loadWorksFromStorage = (): Work[] => {
  if (typeof window === 'undefined') return initialWorks;

  const stored = localStorage.getItem('artier_works');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialWorks;
    }
  }
  return initialWorks;
};

// 로컬 스토리지에 작품 데이터 저장
const saveWorksToStorage = (works: Work[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('artier_works', JSON.stringify(works));
  }
};

// 작품 데이터 관리
let currentWorks = loadWorksFromStorage();
const listeners: (() => void)[] = [];

export const workStore = {
  // 모든 작품 가져오기
  getWorks: () => currentWorks,

  // 특정 작품 가져오기
  getWork: (id: string) => currentWorks.find(w => w.id === id),

  // 새 작품 추가
  addWork: (work: Work) => {
    currentWorks = [work, ...currentWorks];
    saveWorksToStorage(currentWorks);
    listeners.forEach(listener => listener());
    return work.id;
  },

  // 작품 업데이트
  updateWork: (id: string, updates: Partial<Work>) => {
    currentWorks = currentWorks.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
    saveWorksToStorage(currentWorks);
    listeners.forEach(listener => listener());
  },

  // 작품 삭제
  removeWork: (id: string) => {
    pointsRecallIfQuickDelete(id);
    currentWorks = currentWorks.filter(w => w.id !== id);
    saveWorksToStorage(currentWorks);
    listeners.forEach(listener => listener());
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
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// 로컬 스토리지에 초안 저장
const saveDraftsToStorage = (drafts: Draft[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('artier_drafts', JSON.stringify(drafts));
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
  headline: string;
  bio: string;
  location: string;
  interests?: string[];
  avatarUrl?: string;
  /** Phase 1: 프로필에서 자율 토글 — 강사 배지·수강생 작품 탭 */
  isInstructor?: boolean;
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

export const profileStore = {
  getProfile: () => currentProfile,
  updateProfile: (updates: Partial<UserProfile>) => {
    currentProfile = { ...currentProfile, ...updates };
    localStorage.setItem('artier_profile', JSON.stringify(currentProfile));
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
  useEffect(() => profileStore.subscribe(() => forceUpdate({})), []);
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
    if (currentInteractions.liked.includes(id)) {
      currentInteractions.liked = currentInteractions.liked.filter(i => i !== id);
    } else {
      currentInteractions.liked = [...currentInteractions.liked, id];
    }
    saveInteractions();
  },
  toggleSave: (id: string) => {
    if (currentInteractions.saved.includes(id)) {
      currentInteractions.saved = currentInteractions.saved.filter(i => i !== id);
    } else {
      currentInteractions.saved = [...currentInteractions.saved, id];
    }
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
  useEffect(() => userInteractionStore.subscribe(() => forceUpdate({})), []);
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
  useEffect(() => authStore.subscribe(() => forceUpdate({})), []);
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
    if (currentFollows.includes(id)) {
      currentFollows = currentFollows.filter(f => f !== id);
    } else {
      currentFollows = [...currentFollows, id];
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
  useEffect(() => followStore.subscribe(() => forceUpdate({})), []);
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
  useEffect(() => accountSuspensionStore.subscribe(() => forceUpdate({})), []);
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

const ANON_DISPLAY = '삭제된 사용자';
const ANON_AVATAR =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop';

/** 데모: 현재 로그인 사용자(첫 번째 시드 작가) 기준 탈퇴 처리 */
export function performAccountWithdrawal(currentArtistId: string) {
  withdrawnArtistStore.mark(currentArtistId);
  workStore.getWorks().forEach((w) => {
    if (w.artistId !== currentArtistId) return;
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
  currentInteractions = { liked: [], saved: [] };
  localStorage.setItem('artier_interactions', JSON.stringify(currentInteractions));
  interactionListeners.forEach((l) => l());
  currentFollows = [];
  saveFollows();
  const draftIds = draftStore.getDrafts().map((d) => d.id);
  draftIds.forEach((id) => draftStore.deleteDraft(id));
  authStore.logout();
}
