import { useEffect } from 'react';
import { workStore } from '../store';

/** 다른 탭에서 작품 데이터(localStorage)가 바뀌면 메인 화면 스토어를 맞춥니다. */
export function WorksStorageSync() {
  useEffect(() => {
    void workStore.hydrateMediaIfNeeded();
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'artier_works') workStore.syncFromLocalStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return null;
}
