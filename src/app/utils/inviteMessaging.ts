import { workStore } from '../store';
import { isWorkRejected, isWorkHidden } from './workVisibility';

/**
 * 비가입자 작가 초대 발송 (모의 구현)
 * - 명세: 작가 설정 및 비가입자 초대 기능 스펙
 * - 실제 발송 없음. localStorage에 로그만 기록하여 PM이 확인 가능
 * - 중복 발송 방지: 동일 (phoneNumber + workId) 조합
 * - 채널 라우팅:
 *   한국 (+82, 01x): 카카오 알림톡 1순위 → SMS 폴백
 *   해외: 이메일 (전화번호가 아닌 이메일로 발송)
 * - 출시 전 실 외부 서비스 연동 예정
 */

const LOG_KEY = 'artier_invite_messaging_log';
const MAX_LOG = 300;

export type InviteChannel = 'kakao_alimtalk' | 'sms' | 'email';

export type InviteLogEntry = {
  id: string;
  at: string;
  workId: string;
  phoneNumber: string;
  displayName: string;
  channel: InviteChannel;
  locale: 'ko' | 'en';
  message: string;
  success: boolean;
  failReason?: string;
};

function isKoreanNumber(raw: string): boolean {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+82')) return true;
  if (digits.startsWith('82') && digits.length >= 11) return true;
  return /^01[0-9]/.test(digits);
}

/**
 * 채널 라우팅:
 * - 한국 번호 → kakao_alimtalk (실서비스에서 실패 시 sms 폴백)
 * - 해외 번호 → email (전화번호 기반 SMS 대신 이메일 발송)
 */
function pickChannel(phoneNumber: string): InviteChannel {
  return isKoreanNumber(phoneNumber) ? 'kakao_alimtalk' : 'email';
}

function buildMessage(
  displayName: string,
  exhibitionUrl: string,
  locale: 'ko' | 'en',
): string {
  if (locale === 'en') {
    return `Hi ${displayName}, your artwork is now on display at Artier! Check it out 👉 ${exhibitionUrl}`;
  }
  return `[${displayName}]님의 그림이 Artier에 전시되었어요! 지금 확인해보세요 👉 ${exhibitionUrl}`;
}

function readLog(): InviteLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function appendLog(entry: InviteLogEntry) {
  if (typeof window === 'undefined') return;
  const list = readLog();
  list.unshift(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, MAX_LOG)));
}

/** 간단 해시 (중복 체크용, 보안용 아님) */
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return 'ph_' + (h >>> 0).toString(36);
}

export function hasAlreadySent(phoneNumber: string, workId: string): boolean {
  const hash = simpleHash(phoneNumber.replace(/\s+/g, ''));
  return readLog().some(
    (e) => e.workId === workId && (e as Record<string, unknown>).phoneHash === hash && e.success,
  );
}

export type SendInviteInput = {
  phoneNumber: string;
  displayName: string;
  workId: string;
  exhibitionUrl: string;
  locale: 'ko' | 'en';
};

export type SendInviteResult = {
  success: boolean;
  channel: InviteChannel;
  failReason?: string;
  deduplicated?: boolean;
};

/** 전화번호 마스킹: 010-1234-5678 → 010-****-5678 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.length <= 4) return '****';
  return digits.slice(0, digits.length - 4).replace(/./g, (c, i) => i < 3 || c === '+' ? c : '*') + digits.slice(-4);
}

/** 최소 전화번호 형식 검증: 숫자 7자리 이상 */
function isValidPhoneFormat(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 7;
}

/** 모의 발송. 실패 시에도 게시는 계속 진행된다(호출 측에서 보장). */
export function sendInviteToNonMember(input: SendInviteInput): SendInviteResult {
  const { phoneNumber, displayName, workId, exhibitionUrl, locale } = input;
  const channel = pickChannel(phoneNumber);

  // 전화번호 형식 검증
  if (!isValidPhoneFormat(phoneNumber)) {
    return { success: false, channel, failReason: 'invalid_phone_format' };
  }

  // 이미 가입된 번호인지 확인
  try {
    const registered = JSON.parse(localStorage.getItem('artier_registered_phones_v1') || '[]') as string[];
    const normalized = phoneNumber.replace(/[^\d+]/g, '');
    if (registered.some((r) => r.replace(/[^\d+]/g, '') === normalized)) {
      return { success: false, channel, failReason: 'already_registered' };
    }
  } catch { /* ignore */ }

  if (hasAlreadySent(phoneNumber, workId)) {
    return { success: true, channel, deduplicated: true };
  }

  const message = buildMessage(displayName, exhibitionUrl, locale);

  const entry = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    workId,
    phoneNumber: maskPhone(phoneNumber),
    phoneHash: simpleHash(phoneNumber.replace(/\s+/g, '')),
    displayName,
    channel,
    locale,
    message,
    success: true,
  } satisfies InviteLogEntry & { phoneHash: string };
  appendLog(entry);

  return { success: true, channel };
}

export function readInviteLog(): InviteLogEntry[] {
  return readLog();
}

export type SignupMatchUser = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * 자동 매칭 성공으로 비회원 슬롯이 회원으로 승격된 초대 1건의 상세.
 * 호출자(Onboarding)가 이 목록으로 "초대한 작가" 측에 알림을 push하는 데 사용한다.
 * Loop: 비회원 초대 → 가입 → 자동 매칭 → 초대한 작가에게 피드백
 */
export type PromotedInviteDetail = {
  workId: string;
  workTitle: string;
  invitedName: string;
};

/**
 * 가입 후보 매칭 카드용 정보 (Policy §3.5.1 본인 확인 화면).
 * 가입 흐름에 표시되는 작품 카드(이미지·작품명·전시명·초대한 분).
 */
export type MatchCandidate = {
  inviteId: string;
  workId: string;
  workTitle: string;
  invitedName: string;
  inviterNickname: string;
  inviterUserId?: string;
  imageUrl?: string;
};

/**
 * 가입 시점에 사용자가 가진 연락처와 일치하는 비회원 초대 후보를 모은다 (Policy §3.5).
 * 자동 연결은 하지 않는다. 호출자가 본인 확인 화면을 거쳐 applyConfirmedMatches로 확정하거나,
 * recordDeclinedMatches로 운영팀 신호를 발송한다.
 */
export function findMatchCandidates(phone: string): MatchCandidate[] {
  const normalized = phone.replace(/\s+/g, '');
  if (!normalized) return [];
  const targetHash = simpleHash(normalized);
  const log = readLog().filter((e) => e.success) as Array<InviteLogEntry & { phoneHash?: string }>;
  const seen = new Set<string>();
  const candidates: MatchCandidate[] = [];

  for (const entry of log) {
    if (!entry.phoneHash || entry.phoneHash !== targetHash) continue;

    const key = entry.workId + '|' + entry.id;
    if (seen.has(key)) continue;
    seen.add(key);

    const work = workStore.getWork(entry.workId);
    if (!work) continue;
    // 비공개·반려 상태인 전시는 본인 확인 표본에서 제외 (§3.5.1 EC-04)
    if (isWorkRejected(work)) continue;
    if (isWorkHidden(work)) continue;

    candidates.push({
      inviteId: entry.id,
      workId: entry.workId,
      workTitle: work.exhibitionName || work.title || '전시',
      invitedName: entry.displayName,
      inviterNickname: work.artist?.name ?? '',
      inviterUserId: typeof work.artistId === 'string' ? work.artistId : undefined,
      imageUrl: Array.isArray(work.image) ? work.image[0] : undefined,
    });
  }

  return candidates;
}

/**
 * 사용자가 본인 확인에서 "맞아요"를 선택했을 때 호출.
 * 후보 전체를 회원 슬롯으로 승격한다.
 */
export function applyConfirmedMatches(
  candidates: MatchCandidate[],
  currentUser: SignupMatchUser,
): PromotedInviteDetail[] {
  const promoted: PromotedInviteDetail[] = [];
  for (const c of candidates) {
    appendMatchResult({
      inviteId: c.inviteId,
      workId: c.workId,
      phone: '',
      invitedName: c.invitedName,
      status: 'matched',
      at: new Date().toISOString(),
    });
    if (promoteNonMemberSlot(c.workId, c.invitedName, currentUser)) {
      promoted.push({
        workId: c.workId,
        workTitle: c.workTitle,
        invitedName: c.invitedName,
      });
    }
  }
  return promoted;
}

/**
 * 사용자가 본인 확인에서 "아니에요"를 선택했을 때 호출.
 * 매칭은 적용하지 않고, 운영팀 큐(ADM-RPT-01 "초대 매칭 거부" 카테고리)에 신호 1건을 적재한다.
 * Policy §3.5.4. 호출자(Onboarding)는 결과의 inviterUserId 목록으로 발신자 알림을 push한다.
 */
export function recordDeclinedMatches(candidates: MatchCandidate[]): {
  inviters: { inviterUserId?: string; workTitle: string; workId: string }[];
} {
  for (const c of candidates) {
    appendMatchResult({
      inviteId: c.inviteId,
      workId: c.workId,
      phone: '',
      invitedName: c.invitedName,
      status: 'declined',
      at: new Date().toISOString(),
    });
  }
  // 운영팀 큐(ADM-RPT-01 "초대 매칭 거부") 적재
  try {
    const KEY = 'artier_invite_decline_log';
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const arr = Array.isArray(list) ? list : [];
    arr.unshift({
      at: new Date().toISOString(),
      candidates: candidates.map((c) => ({
        workId: c.workId,
        workTitle: c.workTitle,
        invitedName: c.invitedName,
        inviterUserId: c.inviterUserId,
      })),
    });
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 200)));
  } catch { /* ignore */ }

  return {
    inviters: candidates.map((c) => ({
      inviterUserId: c.inviterUserId,
      workTitle: c.workTitle,
      workId: c.workId,
    })),
  };
}

/**
 * 작품의 imageArtists 중 displayName이 일치하는 비회원 슬롯을
 * 회원 슬롯(memberId/Name/Avatar)으로 승격한다. 변경이 있으면 true.
 */
function promoteNonMemberSlot(
  workId: string,
  invitedDisplayName: string,
  currentUser: SignupMatchUser,
): boolean {
  if (typeof window === 'undefined') return false;
  const work = workStore.getWork(workId);
  if (!work || !Array.isArray(work.imageArtists)) return false;

  const target = invitedDisplayName.trim();
  let changed = false;
  const next = work.imageArtists.map((ia) => {
    if (ia.type === 'non-member' && (ia.displayName ?? '').trim() === target) {
      changed = true;
      return {
        type: 'member' as const,
        memberId: currentUser.id,
        memberName: currentUser.name,
        memberAvatar: currentUser.avatar,
      };
    }
    return ia;
  });

  if (!changed) return false;
  workStore.updateWork(workId, { imageArtists: next });
  return true;
}

/**
 * 마이페이지 disavow: 본인이 member 슬롯으로 자동 연결된 piece를
 * 'unknown' (작가 미상) 슬롯으로 원복. 번호·이름 스크럽 (Policy §3.5).
 * 반환: { ok, workTitle, pieceTitle } — 발신자 알림 작성용.
 */
export function demoteSlotToUnknown(
  workId: string,
  pieceIndex: number,
  expectedMemberId: string,
): { ok: boolean; workTitle?: string; pieceTitle?: string } {
  if (typeof window === 'undefined') return { ok: false };
  const work = workStore.getWork(workId);
  if (!work || !Array.isArray(work.imageArtists)) return { ok: false };
  const slot = work.imageArtists[pieceIndex];
  if (!slot || slot.type !== 'member' || slot.memberId !== expectedMemberId) {
    return { ok: false };
  }
  // 본인이 업로드한 전시의 자기 슬롯은 disavow 차단(자기 작품을 작가 미상으로 만드는 것은 의도와 어긋남).
  if (work.artistId === expectedMemberId) {
    return { ok: false };
  }
  const next = work.imageArtists.map((ia, idx) =>
    idx === pieceIndex ? ({ type: 'unknown' as const }) : ia,
  );
  workStore.updateWork(workId, { imageArtists: next });
  appendMatchResult({
    inviteId: `disavow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workId,
    phone: '',
    invitedName: slot.memberName ?? '',
    status: 'disavowed',
    at: new Date().toISOString(),
  });
  return {
    ok: true,
    workTitle: work.exhibitionName || work.title,
    pieceTitle: work.imagePieceTitles?.[pieceIndex],
  };
}

export type MatchResult = {
  inviteId: string;
  workId: string;
  phone: string;
  invitedName: string;
  /** 자동 연결 시 signupName 기록은 더 이상 안 함 (실명 대조 폐기) */
  signupName?: string;
  status: 'matched' | 'disavowed' | 'declined';
  at: string;
};

const MATCH_LOG_KEY = 'artier_invite_match_log';

function appendMatchResult(entry: MatchResult) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(MATCH_LOG_KEY);
    const list: MatchResult[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(MATCH_LOG_KEY, JSON.stringify(list.slice(0, 200)));
  } catch { /* ignore */ }
}

export function readMatchLog(): MatchResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MATCH_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
