import { useState, useEffect } from 'react';
import type { UnresolvedIssue, ChecklistItem, PartnerArtist } from './types';
import { seedIssues, seedChecklist, seedPartnerArtists } from './seedData';

// Generic localStorage store factory (follows existing store.ts pattern)
function createStore<T>(key: string, seed: T[]) {
  const load = (): T[] => {
    if (typeof window === 'undefined') return seed;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { return JSON.parse(stored); } catch { return seed; }
    }
    return seed;
  };

  const save = (data: T[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  let current = load();
  const listeners: (() => void)[] = [];
  const notify = () => listeners.forEach(l => l());

  return {
    getAll: () => current,
    get: (id: string) => current.find((item: any) => item.id === id),
    set: (items: T[]) => { current = items; save(current); notify(); },
    update: (id: string, updates: Partial<T>) => {
      current = current.map((item: any) =>
        item.id === id ? { ...item, ...updates } : item
      );
      save(current);
      notify();
    },
    add: (item: T) => { current = [item, ...current]; save(current); notify(); },
    remove: (id: string) => {
      current = current.filter((item: any) => item.id !== id);
      save(current);
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx > -1) listeners.splice(idx, 1);
      };
    },
    reset: () => { current = seed; save(current); notify(); },
  };
}

export const issueStore = createStore<UnresolvedIssue>('artier_admin_issues', seedIssues);
export const checklistStore = createStore<ChecklistItem>('artier_admin_checklist', seedChecklist);
export const partnerStore = createStore<PartnerArtist>('artier_admin_partners', seedPartnerArtists);

// React hooks
function useStore<T>(store: ReturnType<typeof createStore<T>>) {
  const [, forceUpdate] = useState({});
  useEffect(() => store.subscribe(() => forceUpdate({})), [store]);
  return store;
}

export const useIssueStore = () => useStore(issueStore);
export const useChecklistStore = () => useStore(checklistStore);
export const usePartnerStore = () => useStore(partnerStore);
