/**
 * 가입 완료된 이메일·전화 목록(데모용 로컬 레지스트리).
 * Phase 1 목업 — 서버 users 테이블을 대체. 가입 완료 시 `registerAccount`로 등재,
 * 신규 가입 시 중복 검사에 사용. Phase 2 실 백엔드로 이관 예정.
 */
const EMAIL_KEY = 'artier_registered_emails_v1';
const PHONE_KEY = 'artier_registered_phones_v1';

const readList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const writeList = (key: string, list: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizePhone = (phone: string) => phone.replace(/[^0-9+]/g, '');

export function isEmailRegistered(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e) return false;
  return readList(EMAIL_KEY).some((stored) => normalizeEmail(stored) === e);
}

export function isPhoneRegistered(phone: string): boolean {
  const p = normalizePhone(phone);
  if (!p) return false;
  return readList(PHONE_KEY).some((stored) => normalizePhone(stored) === p);
}

export function registerAccount(email: string, phone: string) {
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);
  if (e) {
    const list = readList(EMAIL_KEY);
    if (!list.some((x) => normalizeEmail(x) === e)) {
      list.push(e);
      writeList(EMAIL_KEY, list);
    }
  }
  if (p) {
    const list = readList(PHONE_KEY);
    if (!list.some((x) => normalizePhone(x) === p)) {
      list.push(p);
      writeList(PHONE_KEY, list);
    }
  }
}

/**
 * Policy §4.4: 탈퇴 후 같은 이메일·전화로 즉시 재가입 가능. 탈퇴 처리 시 호출하여
 * registry에서 식별자를 제거해 차단을 풀어준다.
 */
export function unregisterAccount(email?: string, phone?: string) {
  const e = email ? normalizeEmail(email) : '';
  const p = phone ? normalizePhone(phone) : '';
  if (e) {
    const list = readList(EMAIL_KEY).filter((x) => normalizeEmail(x) !== e);
    writeList(EMAIL_KEY, list);
  }
  if (p) {
    const list = readList(PHONE_KEY).filter((x) => normalizePhone(x) !== p);
    writeList(PHONE_KEY, list);
  }
}
