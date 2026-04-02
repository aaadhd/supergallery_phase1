// GA4 Analytics Utility — Phase 1 스캐폴딩
// measurement ID가 없을 경우 안전하게 실패합니다.

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  gtag('event', eventName, params);
}

// 미리 정의된 이벤트 헬퍼
export const analytics = {
  browseView: () => trackEvent('browse_view'),
  workDetailView: (workId: string) => trackEvent('work_detail_view', { work_id: workId }),
  uploadSubmit: (workId: string) => trackEvent('upload_submit', { work_id: workId }),
  eventDetailView: (eventId: string | number) => trackEvent('event_detail_view', { event_id: eventId }),
  adminView: (page: string) => trackEvent('admin_view', { admin_page: page }),
};
