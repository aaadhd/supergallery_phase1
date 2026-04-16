// 용어 정규화 및 Admin 상수 정의

// ===== 정규 용어 (Canonical Labels) =====
export const LABELS = {
  // 브랜드
  SERVICE_NAME: 'Artier',
  PROJECT_NAME: 'SuperGallery',

  // 네비게이션
  NAV_BROWSE: '둘러보기',
  NAV_EVENTS: '이벤트',
  NAV_UPLOAD: '작품 올리기',
  NAV_PROFILE: '내 프로필',
  NAV_ADMIN: '운영 관리',

  // 도메인 용어 - 작품
  WORK: '작품',
  WORKS: '작품',
  EXHIBITION: '전시',
  SOLO_EXHIBITION: '개인전시',
  GROUP_EXHIBITION: '그룹전시',

  // 도메인 용어 - 사람
  ARTIST: '작가',
  PARTNER_ARTIST: '파트너 작가',
  STUDENT: '수강생',
  INSTRUCTOR: '강사',
  GROUP_NAME: '그룹명',

  // 액션
  PUBLISH: '발행하기',
  SAVE_DRAFT: '초안으로 저장',
  FOLLOW: '팔로우',
  FOLLOWING: '팔로잉',
  LIKE: '좋아요',
  SAVE: '저장',
  SHARE: '공유',

  // 상태
  LOGIN: '로그인',
  LOGOUT: '로그아웃',

} as const;

// ===== 전시 유형 =====
export const EXHIBITION_TYPE = {
  SOLO: 'solo',
  GROUP: 'group',
} as const;

// ===== Admin 상태 값 =====
export const ISSUE_STATUS = {
  OPEN: '미결',
  IN_PROGRESS: '진행 중',
  RESOLVED: '해결됨',
  DEFERRED: '보류',
} as const;

export const ISSUE_PRIORITY = {
  CRITICAL: '긴급',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
} as const;

export const ISSUE_CATEGORY = {
  DESIGN: '디자인',
  DEVELOPMENT: '개발',
  CONTENT: '콘텐츠',
  LEGAL: '법무',
  MARKETING: '마케팅',
  OPERATIONS: '운영',
} as const;

export const CHECKLIST_CATEGORY = {
  QA: 'QA',
  LEGAL: '법무',
  CONTENT: '콘텐츠',
  OPERATIONS: '운영',
  MARKETING: '마케팅',
} as const;

export const CHECKLIST_STATUS = {
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  BLOCKED: '차단됨',
} as const;

export const PARTNER_STAGE = {
  PROSPECT: '후보',
  CONTACTED: '연락 완료',
  ONBOARDING: '온보딩 중',
  ACTIVE: '활성',
  INACTIVE: '비활성',
} as const;

export const PARTNER_SUBMISSION = {
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출 완료',
  UNDER_REVIEW: '검토 중',
  APPROVED: '승인',
  REJECTED: '반려',
} as const;

// ===== 색상 매핑 =====
export const STATUS_COLORS: Record<string, string> = {
  '미결': 'bg-red-100 text-red-800',
  '진행 중': 'bg-yellow-100 text-yellow-800',
  '해결됨': 'bg-green-100 text-green-800',
  '보류': 'bg-gray-100 text-gray-600',
  '시작 전': 'bg-gray-100 text-gray-600',
  '완료': 'bg-green-100 text-green-800',
  '차단됨': 'bg-red-100 text-red-800',
  '후보': 'bg-blue-100 text-blue-800',
  '연락 완료': 'bg-indigo-100 text-indigo-800',
  '온보딩 중': 'bg-yellow-100 text-yellow-800',
  '활성': 'bg-green-100 text-green-800',
  '비활성': 'bg-gray-100 text-gray-600',
  '긴급': 'bg-red-100 text-red-800',
  '높음': 'bg-orange-100 text-orange-800',
  '보통': 'bg-blue-100 text-blue-800',
  '낮음': 'bg-gray-100 text-gray-600',
  '미제출': 'bg-gray-100 text-gray-600',
  '제출 완료': 'bg-blue-100 text-blue-800',
  '검토 중': 'bg-yellow-100 text-yellow-800',
  '승인': 'bg-green-100 text-green-800',
  '반려': 'bg-red-100 text-red-800',
};
