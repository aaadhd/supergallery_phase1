/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** true면 업로드 시 피드 검수 없이 바로 승인 처리 (기본은 pending → 콘텐츠 검토에서 승인) */
  readonly VITE_UPLOAD_AUTO_APPROVE?: string;
}
