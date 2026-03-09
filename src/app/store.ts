// 전역 상태 관리 (간단한 구현)
import { useState, useEffect } from 'react';
import { Work, works as initialWorks } from './data';

// 초안 타입 정의
export interface Draft {
  id: string;
  title: string;
  contents: Array<{
    id: string;
    type: 'image' | 'text';
    url?: string;
    text?: string;
    title?: string;
    artist?: { id: string; name: string; avatar: string }
  }>;
  tags: string[];
  categories: string[];
  imageCustomizations: Record<string, {
    frame: string;
    effect: string | null;
    intensity: number;
    speed: number;
    lightingAngle: number;
    lightingIntensity: number;
  }>;
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
    currentWorks = currentWorks.filter(w => w.id !== id);
    saveWorksToStorage(currentWorks);
    listeners.forEach(listener => listener());
  },

  // 판매 심사 요청
  requestSale: (id: string, requestData: {
    description: string;
    interview: string;
    price: string;
    editionSize: string;
  }) => {
    workStore.updateWork(id, {
      saleStatus: 'requested',
      saleRequestDate: new Date().toISOString(),
      saleRequest: requestData // 요청 데이터 저장
    });
  },

  // 판매 심사 승인
  approveSale: (id: string) => {
    workStore.updateWork(id, {
      saleStatus: 'approved',
      isForSale: true,
      saleApprovalDate: new Date().toISOString()
    });
  },

  // 판매 심사 거절
  rejectSale: (id: string) => {
    workStore.updateWork(id, {
      saleStatus: 'none',
      saleRequestDate: undefined,
      saleRequest: undefined,
    });
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
  fields: string[];
  bannerImg: string | null;
}

const defaultProfile: UserProfile = {
  name: '',
  nickname: '',
  headline: '',
  bio: '',
  location: '',
  fields: ['파인아트'],
  bannerImg: null,
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

// ===== 전시룸 데이터 관리 =====

import { Room } from './data';

const loadRoomsFromStorage = (): Room[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('artier_rooms');
  if (stored) {
    try { return JSON.parse(stored); } catch { }
  }
  return [];
};

const saveRoomsToStorage = (rooms: Room[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('artier_rooms', JSON.stringify(rooms));
  }
};

let currentUserRooms: Room[] = loadRoomsFromStorage();
const roomListeners: (() => void)[] = [];

export const roomStore = {
  getRooms: () => currentUserRooms,
  getRoom: (id: string) => currentUserRooms.find(r => r.id === id),
  addRoom: (room: Room) => {
    currentUserRooms = [room, ...currentUserRooms];
    saveRoomsToStorage(currentUserRooms);
    roomListeners.forEach(l => l());
  },
  updateRoom: (id: string, updates: Partial<Room>) => {
    currentUserRooms = currentUserRooms.map(r => r.id === id ? { ...r, ...updates } : r);
    saveRoomsToStorage(currentUserRooms);
    roomListeners.forEach(l => l());
  },
  deleteRoom: (id: string) => {
    currentUserRooms = currentUserRooms.filter(r => r.id !== id);
    saveRoomsToStorage(currentUserRooms);
    roomListeners.forEach(l => l());
  },
  subscribe: (listener: () => void) => {
    roomListeners.push(listener);
    return () => {
      const idx = roomListeners.indexOf(listener);
      if (idx > -1) roomListeners.splice(idx, 1);
    };
  },
};

export const useRoomStore = () => {
  const [, forceUpdate] = useState({});
  useEffect(() => roomStore.subscribe(() => forceUpdate({})), []);
  return roomStore;
};