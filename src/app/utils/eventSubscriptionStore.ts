/**
 * 응모전 알림 구독 여부 (계정 단위 boolean).
 * 가입 이메일을 자동 사용하므로 별도 이메일 입력·목록 없음.
 * Phase 1: 로컬 플래그. 백엔드 연동 후 서버 저장으로 전환.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'artier_event_subscription';
const CHANGED = 'artier-event-subscription-changed';

export function isEventSubscribed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setEventSubscribed(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  window.dispatchEvent(new Event(CHANGED));
}

export function useEventSubscription(): [boolean, (v: boolean) => void] {
  const [subscribed, setSubscribed] = useState(isEventSubscribed);

  useEffect(() => {
    const handler = () => setSubscribed(isEventSubscribed());
    window.addEventListener(CHANGED, handler);
    return () => window.removeEventListener(CHANGED, handler);
  }, []);

  const toggle = (v: boolean) => {
    setEventSubscribed(v);
    setSubscribed(v);
  };

  return [subscribed, toggle];
}
