import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Compass } from 'lucide-react';
import { authStore, profileStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';

const STORAGE_PREFIX = 'artier_coach_marks';

interface CoachMarkProps {
  id: 'browse' | 'upload';
}

function storageRootKey(): string {
  try {
    if (!authStore.isLoggedIn()) return 'guest';
    const p = profileStore.getProfile();
    const raw = (p.email || p.nickname || p.name || 'user').slice(0, 96);
    return raw.replace(/[^\w@.\uAC00-\uD7A3-]/g, '_');
  } catch {
    return 'guest';
  }
}

export function CoachMark({ id }: CoachMarkProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [storageKey, setStorageKey] = useState(
    () => `${STORAGE_PREFIX}__${storageRootKey()}`,
  );

  const title = id === 'browse' ? t('coachMark.browseTitle') : t('coachMark.uploadTitle');
  const description = id === 'browse' ? t('coachMark.browseDesc') : t('coachMark.uploadDesc');
  const Icon = id === 'browse' ? Compass : Upload;

  useEffect(() => {
    const sync = () => setStorageKey(`${STORAGE_PREFIX}__${storageRootKey()}`);
    const offA = authStore.subscribe(sync);
    const offP = profileStore.subscribe(sync);
    return () => {
      offA();
      offP();
    };
  }, []);

  useEffect(() => {
    try {
      const shown = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<string, boolean>;
      if (!shown[id]) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
    setVisible(false);
    return undefined;
  }, [id, storageKey]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      const shown = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<string, boolean>;
      shown[id] = true;
      localStorage.setItem(storageKey, JSON.stringify(shown));
    } catch {
      /* ignore */
    }
  }, [id, storageKey]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex items-start gap-3 bg-[#18181B] text-white rounded-2xl shadow-2xl px-4 py-3.5 max-w-[400px]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-xs text-white/70 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4 text-white/50" />
        </button>
      </div>
    </div>
  );
}
