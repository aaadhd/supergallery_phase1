#!/usr/bin/env node
/**
 * Artier 전체 화면 스크린샷 캡처 스크립트 (Phase 1)
 *
 * IA_ScreenList_v1.md의 USR-*, ADM-*, CM-* 카드를 경로별로 캡처.
 * - USR/CM: 모바일 뷰포트 390x844
 * - ADM: 데스크톱 뷰포트 1440x900
 * - 각 카드별 대표 1장 + 주요 상태 변형(비로그인/빈 상태/탭 등)
 *
 * 사전 조건: `npm run dev`이 http://localhost:5173 에서 떠 있어야 함.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.resolve('audits/screenshots');
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };

// 샘플 ID (localGalleryManifest 기반 — 부팅 시 자동 시드됨)
const SAMPLE_EXH_ID = 'local-img-0';
const SAMPLE_EXH_GROUP_ID = 'local-group-multi-0';
const SAMPLE_ARTIST_ID = '2'; // 김영자 (타인 프로필)
const SAMPLE_EVENT_ID = '1';
const SAMPLE_NOTICE_ID = 'notice-1';

/** @typedef {{
 *   id: string;
 *   name: string;
 *   url: string;
 *   device?: 'mobile' | 'desktop';
 *   auth?: 'loggedIn' | 'loggedOut';
 *   wait?: number;          // ms 추가 대기
 *   waitSelector?: string;  // 특정 셀렉터가 보일 때까지
 *   before?: (page: import('playwright').Page) => Promise<void>;
 *   after?: (page: import('playwright').Page) => Promise<void>;
 *   fullPage?: boolean;
 * }} Shot
 */

const seedMockData = async (page) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('artier_auth', 'true');
      localStorage.setItem('artier_cookie_consent', 'all');
      localStorage.setItem('artier_onboarding_done', 'true');
      localStorage.setItem('artier_splash_seen', 'true');
      localStorage.setItem('artier_admin_session_v1', '1');
      const profile = {
        name: '카테',
        nickname: '카테',
        headline: '빛과 색을 통해 감정을 표현합니다',
        bio: '30년간 빛과 감정의 상관을 그려왔습니다. 최근에는 디지털로 작업합니다.',
        location: 'KR',
        interests: ['painting', 'drawing', 'digitalArt'],
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        email: 'kate@artier.demo',
        phone: '01012345678',
        realName: '이정은',
      };
      localStorage.setItem('artier_profile', JSON.stringify(profile));
      // 검색 히스토리(빈 상태 방지용, 스키마 단순)
      localStorage.setItem('artier_recent_searches__guest', JSON.stringify(['수채화', '김영자', '봄']));
    } catch (e) {
      console.warn('seedMockData err', e);
    }
  });
};

const setLoggedOut = async (page) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('artier_auth', 'false');
      localStorage.removeItem('artier_profile');
    } catch {}
  });
};

const shots = /** @type {Shot[]} */ ([
  // ===== USR-AUT · 인증·온보딩 =====
  { id: 'USR-AUT-01', name: 'splash', url: '/', auth: 'loggedOut',
    before: async (p) => p.addInitScript(() => localStorage.removeItem('artier_splash_seen')),
    wait: 300 },
  { id: 'USR-AUT-02', name: 'login', url: '/login', auth: 'loggedOut' },
  { id: 'USR-AUT-02-email', name: 'login-email-expanded', url: '/login', auth: 'loggedOut',
    after: async (p) => {
      const btn = p.getByRole('button', { name: /이메일/ }).first();
      if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {});
      await p.waitForTimeout(300);
    } },
  { id: 'USR-AUT-03', name: 'signup-step1', url: '/signup?step=1', auth: 'loggedOut' },
  { id: 'USR-AUT-04', name: 'signup-step2', url: '/signup?step=2', auth: 'loggedOut' },
  { id: 'USR-AUT-05', name: 'signup-step3', url: '/signup?step=3', auth: 'loggedOut' },
  { id: 'USR-AUT-06', name: 'social-signup', url: '/login?demo=social-modal', auth: 'loggedOut' },
  { id: 'USR-AUT-07', name: 'reset-password', url: '/reset-password', auth: 'loggedOut' },
  { id: 'USR-AUT-08', name: 'reset-password-new', url: '/reset-password?demo=new_password', auth: 'loggedOut' },
  { id: 'USR-AUT-09', name: 'onboarding-step0', url: '/onboarding?step=0', auth: 'loggedOut' },
  { id: 'USR-AUT-10', name: 'onboarding-step1', url: '/onboarding?step=1', auth: 'loggedOut' },
  { id: 'USR-AUT-11', name: 'onboarding-step2', url: '/onboarding?step=2', auth: 'loggedOut' },

  // ===== USR-BRW · 둘러보기 =====
  { id: 'USR-BRW-01', name: 'home-all', url: '/?tab=all' },
  { id: 'USR-BRW-01-solo', name: 'home-solo', url: '/?tab=solo' },
  { id: 'USR-BRW-01-group', name: 'home-group', url: '/?tab=group' },
  { id: 'USR-BRW-01-logged-out', name: 'home-logged-out', url: '/', auth: 'loggedOut' },

  // ===== USR-EXH · 전시·작품 상세 =====
  { id: 'USR-EXH-01', name: 'exhibition-detail', url: `/exhibitions/${SAMPLE_EXH_ID}` },
  { id: 'USR-EXH-01-group', name: 'exhibition-detail-group', url: `/exhibitions/${SAMPLE_EXH_GROUP_ID}` },
  { id: 'USR-EXH-02', name: 'curation-detail', url: `/exhibitions/${SAMPLE_EXH_ID}?curated=1` },
  { id: 'USR-EXH-03', name: 'invite-landing', url: `/exhibitions/${SAMPLE_EXH_ID}?from=invite` },
  { id: 'USR-EXH-03-credited', name: 'credited-landing', url: `/exhibitions/${SAMPLE_EXH_ID}?from=credited` },
  { id: 'USR-EXH-04', name: 'work-share-landing', url: `/exhibitions/${SAMPLE_EXH_ID}?from=work` },
  // USR-EXH-05 신고 모달 = CM-03 (상세에서 신고 클릭 후 캡처 별도)
  // USR-EXH-06 공유 시트 = 브라우저 네이티브 (스킵)

  // ===== USR-UPL · 업로드 =====
  { id: 'USR-UPL-01', name: 'upload-type-select', url: '/upload' },
  { id: 'USR-UPL-03', name: 'upload-solo', url: '/upload?solo=1',
    after: async (p) => {
      // 유형 선택 모달이 뜨면 "혼자" 선택 시도
      await p.waitForTimeout(500);
      const soloBtn = p.getByText(/혼자 올리기/).first();
      if (await soloBtn.isVisible().catch(() => false)) await soloBtn.click().catch(() => {});
      await p.waitForTimeout(600);
    } },
  { id: 'USR-UPL-03-draft', name: 'upload-draft-resume', url: '/upload?draft=draft-demo-1',
    after: async (p) => {
      await p.waitForTimeout(500);
      const soloBtn = p.getByText(/혼자 올리기/).first();
      if (await soloBtn.isVisible().catch(() => false)) await soloBtn.click().catch(() => {});
      await p.waitForTimeout(600);
    } },
  { id: 'USR-UPL-03-event', name: 'upload-event-linked', url: `/upload?event=${SAMPLE_EVENT_ID}`,
    after: async (p) => {
      await p.waitForTimeout(500);
      const soloBtn = p.getByText(/혼자 올리기/).first();
      if (await soloBtn.isVisible().catch(() => false)) await soloBtn.click().catch(() => {});
      await p.waitForTimeout(600);
    } },
  // USR-UPL-02/04/05/06/07/08/09/10 — 모달·상호작용 필수. 기본은 스킵, 필요 시 수동.

  // ===== USR-PRF · 프로필 =====
  { id: 'USR-PRF-01-own', name: 'profile-own', url: '/me' },
  { id: 'USR-PRF-01-other', name: 'profile-other', url: `/profile/${SAMPLE_ARTIST_ID}` },
  { id: 'USR-PRF-05', name: 'profile-tab-exhibition', url: '/me?tab=exhibition' },
  { id: 'USR-PRF-06', name: 'profile-tab-works', url: '/me?tab=works' },
  { id: 'USR-PRF-07', name: 'profile-tab-student', url: '/me?tab=student-works' },
  { id: 'USR-PRF-08', name: 'profile-tab-likes', url: '/me?tab=likes' },
  { id: 'USR-PRF-09', name: 'profile-tab-saved', url: '/me?tab=saved' },
  { id: 'USR-PRF-10', name: 'profile-tab-drafts', url: '/me?tab=drafts' },

  // ===== USR-EVT · 이벤트 =====
  { id: 'USR-EVT-01', name: 'events-list', url: '/events' },
  { id: 'USR-EVT-02', name: 'event-detail', url: `/events/${SAMPLE_EVENT_ID}` },

  // ===== USR-SRC · 검색 =====
  { id: 'USR-SRC-01', name: 'search-home', url: '/search' },
  { id: 'USR-SRC-02', name: 'search-results', url: '/search?q=%EC%88%98%EC%B1%84%ED%99%94' }, // '수채화'
  { id: 'USR-SRC-02-empty', name: 'search-empty', url: '/search?q=zzzznoresult' },

  // ===== USR-NTF · 알림 =====
  { id: 'USR-NTF-01', name: 'notifications', url: '/notifications' },
  { id: 'USR-NTF-01-logged-out', name: 'notifications-logged-out', url: '/notifications', auth: 'loggedOut' },

  // ===== USR-STG · 설정 =====
  { id: 'USR-STG-01', name: 'settings-home', url: '/settings' },
  { id: 'USR-STG-03', name: 'settings-notifications', url: '/settings#notifications' },

  // ===== USR-INF · 공지·약관·문의 =====
  { id: 'USR-INF-01', name: 'about', url: '/about' },
  { id: 'USR-INF-02', name: 'faq', url: '/faq' },
  { id: 'USR-INF-03', name: 'notices-list', url: '/notices' },
  { id: 'USR-INF-04', name: 'notice-detail', url: `/notices/${SAMPLE_NOTICE_ID}` },
  { id: 'USR-INF-05', name: 'terms', url: '/terms' },
  { id: 'USR-INF-06', name: 'privacy', url: '/privacy' },
  { id: 'USR-INF-07', name: 'contact', url: '/contact' },

  // ===== ADM · 어드민 (데스크톱) =====
  { id: 'ADM-DSH-01', name: 'admin-dashboard', url: '/admin', device: 'desktop' },
  { id: 'ADM-REV-01', name: 'admin-review', url: '/admin/content-review', device: 'desktop' },
  { id: 'ADM-PCK-01', name: 'admin-picks', url: '/admin/picks', device: 'desktop' },
  { id: 'ADM-PCK-03', name: 'admin-picks-history', url: '/admin/picks?tab=history', device: 'desktop' },
  { id: 'ADM-CUR-01', name: 'admin-curation', url: '/admin/curation', device: 'desktop' },
  { id: 'ADM-BNR-01', name: 'admin-banners', url: '/admin/banners', device: 'desktop' },
  { id: 'ADM-EVT-01', name: 'admin-events', url: '/admin/managed-events', device: 'desktop' },
  { id: 'ADM-EVT-03', name: 'admin-event-participants', url: '/admin/events', device: 'desktop' },
  { id: 'ADM-RPT-01', name: 'admin-reports', url: '/admin/reports', device: 'desktop' },
  { id: 'ADM-MBR-01', name: 'admin-members', url: '/admin/members', device: 'desktop' },
  { id: 'ADM-WRK-01', name: 'admin-works', url: '/admin/works', device: 'desktop' },
  { id: 'ADM-PTN-01', name: 'admin-partners', url: '/admin/partners', device: 'desktop' },
  { id: 'ADM-CKL-01', name: 'admin-checklist', url: '/admin/checklist', device: 'desktop' },
  { id: 'ADM-ISU-01', name: 'admin-issues', url: '/admin/issues', device: 'desktop' },

  // ===== CM · 공통 =====
  { id: 'CM-05', name: 'cookie-consent', url: '/',
    before: async (p) => p.addInitScript(() => localStorage.removeItem('artier_cookie_consent')) },
  { id: 'CM-08-404', name: 'not-found', url: '/this-page-does-not-exist-zzzz' },
  { id: 'CM-08-500', name: 'server-error', url: '/500' },
  { id: 'CM-08-maintenance', name: 'maintenance', url: '/maintenance' },
  { id: 'CM-10-demo', name: 'demo-flow-tools', url: '/demo' },
  { id: 'CM-10-demo-ref', name: 'demo-reference', url: '/demo/reference' },
]);

async function run() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const results = [];
  const failures = [];

  for (const shot of shots) {
    const device = shot.device || 'mobile';
    const viewport = device === 'desktop' ? VIEWPORT_DESKTOP : VIEWPORT_MOBILE;
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      locale: 'ko-KR',
      userAgent: device === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    try {
      if (shot.auth === 'loggedOut') {
        await setLoggedOut(page);
      } else {
        await seedMockData(page);
      }
      if (shot.before) await shot.before(page);

      const url = BASE + shot.url;
      // Vite HMR WebSocket 때문에 networkidle은 안 오므로 domcontentloaded로 빨리 이동
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // React hydrate + 라우팅 + 초기 데이터 렌더 대기
      // main 엘리먼트에 텍스트가 실제로 들어올 때까지 대기 (최대 8초)
      await page.waitForFunction(
        () => {
          const body = document.body;
          return body && body.innerText.trim().length > 20;
        },
        { timeout: 8000 }
      ).catch(() => {});
      await page.waitForTimeout(shot.wait ?? 1500);

      if (shot.waitSelector) {
        await page.waitForSelector(shot.waitSelector, { timeout: 5000 }).catch(() => {});
      }

      if (shot.after) await shot.after(page);

      const fname = `${shot.id}__${shot.name}.png`;
      const filePath = path.join(OUT_DIR, fname);
      // ADM(데스크톱)은 테이블 길이가 매우 길어지므로 기본 false(뷰포트), USR/CM은 true(fullPage)
      const useFullPage = shot.fullPage !== undefined
        ? shot.fullPage
        : device !== 'desktop';
      await page.screenshot({
        path: filePath,
        fullPage: useFullPage,
      });
      results.push({ id: shot.id, file: fname, ok: true });
      console.log(`✓ ${shot.id.padEnd(22)} ${fname}`);
    } catch (e) {
      failures.push({ id: shot.id, err: e.message });
      console.error(`✗ ${shot.id.padEnd(22)} ${e.message}`);
    } finally {
      await ctx.close();
    }
  }
  await browser.close();

  console.log('\n======');
  console.log(`성공: ${results.length} / 실패: ${failures.length}`);
  if (failures.length) {
    console.log('\n실패 목록:');
    failures.forEach(f => console.log(`  - ${f.id}: ${f.err}`));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
