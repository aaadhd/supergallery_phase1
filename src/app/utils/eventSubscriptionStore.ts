/**
 * 응모전 공지 알림 구독 여부.
 * USR-STG-01 `eventAlerts` 알림 토글과 동일 기능 — 어느 쪽을 변경해도 동기 반영된다.
 * (Policy §31 N-5: 응모전 선정은 강제 발송, 응모전 공지는 eventAlerts 토글 제어)
 */

import { useState, useEffect } from 'react';

const NOTIFICATION_SETTINGS_KEY = 'artier_notification_settings';
const CHANGED = 'artier-notification-prefs';

export function isEventSubscribed(): boolean {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed.eventAlerts === true;
  } catch {
    return false;
  }
}

export function setEventSubscribed(value: boolean): void {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    const current = stored ? JSON.parse(stored) : {};
    current.eventAlerts = value;
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(current));
  } catch { /* ignore */ }
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
