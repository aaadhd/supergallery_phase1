/**
 * 앱 전역 설정 상수.
 *
 * 이메일·도메인·연락처 등 사용자에게 노출되는 값을 한 곳에서 관리한다.
 * Phase 2 실서비스 전환 시 환경변수로 치환하기 쉬운 구조를 유지.
 */

/** 서비스 고객 지원 이메일. Maintenance·Privacy·문의 화면에서 공통 사용. */
export const SUPPORT_EMAIL = 'support@artier.com';

/** 푸터·일반 연락처 이메일 (운영/홍보/제휴 등 지원 외 용도). */
export const CONTACT_EMAIL = 'contact@artier.kr';

/** 브랜드 표기 */
export const BRAND = {
  NAME: 'Artier',
  PROJECT_NAME: 'SuperGallery',
} as const;
