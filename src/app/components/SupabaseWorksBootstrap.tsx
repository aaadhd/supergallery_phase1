import { useEffect } from 'react';
import { works as seedWorks } from '../data';
import { workStore } from '../store';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { fetchWorksFromSupabase } from '../services/supabaseWorks';

/** Supabase 환경변수가 있으면 마운트 시 `works` 테이블로 작품 목록을 채웁니다. */
export function SupabaseWorksBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetchWorksFromSupabase().then((rows) => {
      if (cancelled) return;
      workStore.replaceWorksFromRemote(rows.length > 0 ? rows : seedWorks);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
