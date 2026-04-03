import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia('(pointer: coarse)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function getServerSnapshot() {
  return false;
}

/** 손가락·대부분의 폰/태블릿 터치 */
export function usePointerCoarse() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
