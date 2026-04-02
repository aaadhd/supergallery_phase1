import type { Locale } from '../i18n/uiStrings';

export interface Notice {
  id: string;
  /** Korean title (default for ko locale) */
  title: string;
  /** English title */
  titleEn: string;
  /** Korean body */
  content: string;
  /** English body */
  contentEn: string;
  category: '서비스' | '이벤트' | '정책' | '기타';
  isPinned?: boolean;
  createdAt: string;
}

export function getNoticeTitle(n: Notice, locale: Locale): string {
  return locale === 'en' ? n.titleEn : n.title;
}

export function getNoticeContent(n: Notice, locale: Locale): string {
  return locale === 'en' ? n.contentEn : n.content;
}

export const NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: 'Artier 그랜드 오픈 안내',
    titleEn: 'Artier Grand Opening',
    content:
      '안녕하세요, Artier 운영팀입니다.\n\n2026년 5월 15일, Artier가 그랜드 오픈합니다!\n\n그림을 그리는 누구나 작품을 올리고, 발견되고, 더 넓은 기회로 연결될 수 있는 디지털 아트 플랫폼 Artier에서 여러분의 작품을 세상과 공유해 보세요.\n\n런칭 기념 이벤트도 함께 진행되니 많은 참여 부탁드립니다.',
    contentEn:
      'Hello from the Artier team.\n\nOn May 15, 2026, Artier officially opens to everyone.\n\nArtier is a digital art platform where anyone who creates can upload work, get discovered, and connect to new opportunities. Share your work with the world on Artier.\n\nWe are also running launch events—please join us.',
    category: '서비스',
    isPinned: true,
    createdAt: '2026-05-01T09:00:00',
  },
  {
    id: 'notice-2',
    title: '개인정보처리방침 개정 안내',
    titleEn: 'Privacy Policy Update',
    content:
      'Artier 서비스 이용약관 및 개인정보처리방침이 2026년 5월 1일 부로 개정됩니다.\n\n주요 변경 사항:\n- 수집 항목 변경\n- 보유 기간 조정\n- 제3자 제공 항목 추가\n\n자세한 내용은 개인정보처리방침 페이지를 확인해 주세요.',
    contentEn:
      'The Artier Terms of Service and Privacy Policy will be updated effective May 1, 2026.\n\nKey changes:\n- Updates to items we collect\n- Adjustments to retention periods\n- Additional third-party sharing items\n\nPlease see the Privacy Policy page for details.',
    category: '정책',
    isPinned: false,
    createdAt: '2026-04-20T10:00:00',
  },
  {
    id: 'notice-3',
    title: '봄맞이 특별 기획전 참여 작가 모집',
    titleEn: 'Spring Special Exhibition — Open Call for Artists',
    content:
      '봄을 맞아 "봄빛 갤러리" 기획전을 준비하고 있습니다.\n\n참여를 원하시는 작가님은 이벤트 페이지에서 "참여하기"를 눌러 작품을 업로드해 주세요.\n\n기간: 2026.05.01 ~ 2026.05.31\n선정 작품에는 Artier\'s Pick 배지가 부여됩니다.',
    contentEn:
      'We are preparing the “Spring Light Gallery” special exhibition.\n\nArtists who wish to participate can tap “Join” on the Events page and upload their work.\n\nPeriod: May 1–31, 2026\nSelected works will receive an Artier’s Pick badge.',
    category: '이벤트',
    isPinned: false,
    createdAt: '2026-04-15T14:00:00',
  },
  {
    id: 'notice-4',
    title: '서비스 점검 안내 (4/10 02:00~06:00)',
    titleEn: 'Scheduled maintenance (Apr 10, 02:00–06:00 KST)',
    content:
      '보다 나은 서비스를 위해 아래 일정으로 서비스 점검이 진행됩니다.\n\n일시: 2026년 4월 10일 (목) 02:00 ~ 06:00 (4시간)\n영향: 전체 서비스 이용 불가\n\n점검 중에는 서비스 이용이 제한됩니다. 양해 부탁드립니다.',
    contentEn:
      'We will perform scheduled maintenance as follows.\n\nWhen: Thursday, April 10, 2026, 02:00–06:00 KST (4 hours)\nImpact: The entire service will be unavailable.\n\nThank you for your patience.',
    category: '서비스',
    isPinned: false,
    createdAt: '2026-04-08T11:00:00',
  },
  {
    id: 'notice-5',
    title: 'Artier 소프트 런칭 안내',
    titleEn: 'Artier Soft Launch (Partner Artists)',
    content:
      '파트너 작가님들을 대상으로 소프트 런칭이 시작되었습니다.\n\n소프트 런칭 기간 동안 기능 검증과 버그 점검이 진행됩니다. 불편 사항이 있으시면 문의하기 페이지를 통해 알려 주세요.',
    contentEn:
      'Soft launch has begun for partner artists.\n\nDuring this period we will verify features and fix bugs. If you run into any issues, please let us know via the Contact page.',
    category: '서비스',
    isPinned: false,
    createdAt: '2026-04-01T09:00:00',
  },
];

export function getNoticeById(id: string): Notice | undefined {
  return NOTICES.find((n) => n.id === id);
}

export function getNoticeNeighbors(id: string): { prev: Notice | null; next: Notice | null } {
  const sorted = [...NOTICES].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const idx = sorted.findIndex((n) => n.id === id);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
