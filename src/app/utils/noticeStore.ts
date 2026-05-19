/**
 * ADM-NTC-01 공지 스토어 — localStorage, append + CRUD.
 * 사용자측(USR-INF-03·04)은 status === 'published'인 항목만 읽는다.
 * 고정 공지는 isPinned === true이고 상단 최대 2개 제한(PRD AC-03).
 */

import { useSyncExternalStore } from 'react';
import { NOTICES as SEED_NOTICES } from '../data/notices';

const STORAGE_KEY = 'artier_admin_notices_v1';
const MAX_PINNED = 2;

export type NoticeStatus = 'draft' | 'published' | 'stopped';

export interface AdminNotice {
  id: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  isPinned: boolean;
  status: NoticeStatus;
  createdAt: string;
  updatedAt: string;
}

function seed(): AdminNotice[] {
  return SEED_NOTICES.map((n) => ({
    id: n.id,
    title: n.title,
    titleEn: n.titleEn,
    content: n.content,
    contentEn: n.contentEn,
    isPinned: n.isPinned ?? false,
    status: 'published' as NoticeStatus,
    createdAt: n.createdAt,
    updatedAt: n.createdAt,
  }));
}

function read(): AdminNotice[] {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed();
  } catch {
    return seed();
  }
}

function write(list: AdminNotice[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

const CHANGED_EVENT = 'artier_notices_changed';

let _cache: AdminNotice[] | null = null;
function getSnapshot(): AdminNotice[] {
  if (!_cache) _cache = read();
  return _cache;
}
function subscribe(cb: () => void): () => void {
  const handler = () => { _cache = null; cb(); };
  window.addEventListener(CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useNotices(): AdminNotice[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => seed());
}

export const noticeStore = {
  getAll(): AdminNotice[] {
    return read();
  },
  getPublished(): AdminNotice[] {
    return read()
      .filter((n) => n.status === 'published')
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  },
  getPinnedCount(): number {
    return read().filter((n) => n.status === 'published' && n.isPinned).length;
  },
  add(data: Omit<AdminNotice, 'id' | 'createdAt' | 'updatedAt'>): AdminNotice {
    const list = read();
    const now = new Date().toISOString();
    const next: AdminNotice = {
      ...data,
      id: `ntc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    write([next, ...list]);
    return next;
  },
  update(id: string, patch: Partial<Omit<AdminNotice, 'id' | 'createdAt'>>): void {
    const list = read().map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
    );
    write(list);
  },
  remove(id: string): void {
    write(read().filter((n) => n.id !== id));
  },
  maxPinned: MAX_PINNED,
};
