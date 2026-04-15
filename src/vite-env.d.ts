/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** true면 업로드 시 피드 검수 없이 바로 승인 처리 (기본은 pending → 콘텐츠 검토에서 승인) */
  readonly VITE_UPLOAD_AUTO_APPROVE?: string;
  /** true면 어드민 `adminGate` 역할 검사 생략(로그인만) — CI·프리뷰 */
  readonly VITE_ADMIN_OPEN?: string;
  /** true면 검수용 화면 바로가기(플로팅) 표시 — 프로덕션 빌드 검수·프리뷰용 */
  readonly VITE_FOOTER_QA_LINKS?: string;
  /** 실 API 베이스 URL — 미설정 시 `apiClient` 호출 불가 */
  readonly VITE_API_BASE_URL?: string;
}
