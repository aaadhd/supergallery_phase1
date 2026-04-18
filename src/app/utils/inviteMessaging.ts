import { workStore } from '../store';

/**
 * 비가입자 작가 초대 발송 (모의 구현)
 * - 명세: 작가 설정 및 비가입자 초대 기능 스펙
 * - 실제 발송 없음. localStorage에 로그만 기록하여 PM이 확인 가능
 * - 중복 발송 방지: 동일 (phoneNumber + workId) 조합
 * - 채널: 한국 번호(+82 또는 010~019로 시작) → 카카오 알림톡 우선, 그 외 → SMS
 * - 5% 확률로 실패 시뮬레이션 (게시는 정상 처리됨을 확인하기 위함)
 * - Phase 2에서 실 외부 서비스 연동 예정
 */

const LOG_KEY = 'artier_invite_messaging_log';
const MAX_LOG = 300;

export type InviteChannel = 'kakao_alimtalk' | 'sms';

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

function pickChannel(phoneNumber: string): InviteChannel {
  return isKoreanNumber(phoneNumber) ? 'kakao_alimtalk' : 'sms';
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

/** 모의 발송. 실패 시에도 게시는 계속 진행된다(호출 측에서 보장). */
export function sendInviteToNonMember(input: SendInviteInput): SendInviteResult {
  const { phoneNumber, displayName, workId, exhibitionUrl, locale } = input;
  const channel = pickChannel(phoneNumber);

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
 * 회원가입 시 SMS 초대 매칭
 * 전화번호 일치 + 실명 일치 → 작품 자동 연결:
 *   - 매칭 로그에 기록 + workStore의 해당 작품 imageArtists에서
 *     비회원 슬롯(같은 displayName)을 회원 슬롯(currentUser)으로 승격
 * 전화번호 일치 + 실명 불일치 → 매칭 차단(로그에 기록 + blocked 목록 반환 →
 *   가입 직후 "회원님의 번호로 받은 초대" 모달에서 본인 확인 후 수동 claim 가능)
 */
export type BlockedInvite = {
  inviteId: string;
  workId: string;
  invitedName: string;
};

export function matchSmsInviteOnSignup(
  phone: string,
  realName: string,
  currentUser: SignupMatchUser,
): {
  matched: number;
  blocked: number;
  promotedWorkIds: string[];
  blockedList: BlockedInvite[];
} {
  const normalized = phone.replace(/[\s-]/g, '');
  const log = readLog().filter((e) => e.success);
  let matched = 0;
  let blocked = 0;
  const promotedWorkIds: string[] = [];
  const blockedList: BlockedInvite[] = [];

  for (const entry of log) {
    const entryPhone = entry.phoneNumber.replace(/[\s-]/g, '');
    if (entryPhone !== normalized) continue;

    if (entry.displayName.trim() === realName.trim()) {
      matched++;
      appendMatchResult({
        inviteId: entry.id,
        workId: entry.workId,
        phone: normalized,
        invitedName: entry.displayName,
        signupName: realName,
        status: 'matched',
        at: new Date().toISOString(),
      });
      if (promoteNonMemberSlot(entry.workId, entry.displayName, currentUser)) {
        promotedWorkIds.push(entry.workId);
      }
    } else {
      blocked++;
      blockedList.push({ inviteId: entry.id, workId: entry.workId, invitedName: entry.displayName });
      appendMatchResult({
        inviteId: entry.id,
        workId: entry.workId,
        phone: normalized,
        invitedName: entry.displayName,
        signupName: realName,
        status: 'blocked_name_mismatch',
        at: new Date().toISOString(),
      });
    }
  }

  return { matched, blocked, promotedWorkIds, blockedList };
}

/**
 * 본인 확인을 거친 뒤 수동 매칭. `matchSmsInviteOnSignup`이 이름 불일치로
 * block한 초대를 회원이 "본인 맞다" 확인한 경우 호출.
 * 작품의 비회원 슬롯을 회원 슬롯으로 승격한다.
 */
export function claimBlockedInvite(
  inviteId: string,
  currentUser: SignupMatchUser,
): boolean {
  const entry = readLog().find((e) => e.id === inviteId && e.success);
  if (!entry) return false;
  return promoteNonMemberSlot(entry.workId, entry.displayName, currentUser);
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

export type MatchResult = {
  inviteId: string;
  workId: string;
  phone: string;
  invitedName: string;
  signupName: string;
  status: 'matched' | 'blocked_name_mismatch';
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
