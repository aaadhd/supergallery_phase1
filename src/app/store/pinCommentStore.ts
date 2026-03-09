/**
 * Pin 코멘트 - 작품 특정 좌표에 핀을 달아 피드백 남기기
 */

export interface PinComment {
  id: string;
  workId: string;
  imageIndex: number;
  x: number; // 0~100 (%)
  y: number; // 0~100 (%)
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

const STORAGE_KEY = 'artier_pin_comments';

function loadFromStorage(): PinComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(pins: PinComment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch (e) {
    console.warn('Pin comments save failed', e);
  }
}

let pins: PinComment[] = loadFromStorage();
const listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export const pinCommentStore = {
  getPins(workId: string, imageIndex?: number): PinComment[] {
    return pins.filter(
      (p) => p.workId === workId && (imageIndex === undefined || p.imageIndex === imageIndex)
    );
  },

  addPin(pin: Omit<PinComment, 'id' | 'createdAt'>): PinComment {
    const newPin: PinComment = {
      ...pin,
      id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    pins = [newPin, ...pins];
    saveToStorage(pins);
    notify();
    return newPin;
  },

  removePin(id: string) {
    pins = pins.filter((p) => p.id !== id);
    saveToStorage(pins);
    notify();
  },

  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    };
  },
};
