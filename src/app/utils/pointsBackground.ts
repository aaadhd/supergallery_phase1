/**
 * Phase 1 백그라운드 포인트 (기능 모음·정책) — UI 없음, 로컬 적립 로그만
 */

const LEDGER_KEY = 'artier_points_ledger';
const STATE_KEY = 'artier_points_state';
const PUBLISH_TIMES_KEY = 'artier_work_publish_times';
const PP_BALANCE_KEY = 'artier_pp_balance';

export const POINTS_LEDGER_EVENT = 'artier-points-ledger';

function notifyLedgerChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(POINTS_LEDGER_EVENT));
}

export type PointLedgerEntry = {
  id: string;
  at: string;
  kind: string;
  ap: number;
  note?: string;
};

type PointsState = {
  totalApAccrued: number;
  firstUploadDone: boolean;
  signupApDone: boolean;
  onboardingApDone: boolean;
  dailyBrowseStreak: string;
  uploadDatesByDay: Record<string, number>;
  uploadMonthCount: Record<string, number>;
  followerMilestones: Record<string, boolean>;
  groupCreateMonth: Record<string, boolean>;
  groupParticipationMonth: Record<string, number>;
};

function loadState(): PointsState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    return { ...freshState(), ...JSON.parse(raw) };
  } catch {
    return freshState();
  }
}

function freshState(): PointsState {
  return {
    totalApAccrued: 0,
    firstUploadDone: false,
    signupApDone: false,
    onboardingApDone: false,
    dailyBrowseStreak: '',
    uploadDatesByDay: {},
    uploadMonthCount: {},
    followerMilestones: {},
    groupCreateMonth: {},
    groupParticipationMonth: {},
  };
}

function saveState(s: PointsState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

function appendLedger(entry: { id?: string; kind: string; ap: number; note?: string }) {
  let list: PointLedgerEntry[] = [];
  try {
    list = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]');
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  const row: PointLedgerEntry = {
    id: entry.id || `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    kind: entry.kind,
    ap: entry.ap,
    note: entry.note,
  };
  list.unshift(row);
  localStorage.setItem(LEDGER_KEY, JSON.stringify(list.slice(0, 500)));
  notifyLedgerChanged();
}

function award(ap: number, kind: string, note?: string) {
  if (ap === 0) return;
  const s = loadState();
  s.totalApAccrued = Math.max(0, s.totalApAccrued + ap);
  saveState(s);
  appendLedger({ kind, ap, note });
}

export function pointsOnSignupComplete() {
  const s = loadState();
  if (s.signupApDone) return;
  s.signupApDone = true;
  saveState(s);
  award(50, 'signup', '회원가입 완료');
}

export function pointsOnOnboardingStep1Complete() {
  const s = loadState();
  if (s.onboardingApDone) return;
  s.onboardingApDone = true;
  saveState(s);
  award(30, 'onboarding', '온보딩 Step1');
}

export function pointsOnBrowseDailyVisit() {
  const day = new Date().toISOString().slice(0, 10);
  const s = loadState();
  if (s.dailyBrowseStreak === day) return;
  s.dailyBrowseStreak = day;
  saveState(s);
  award(5, 'daily_browse', '일일 출석(둘러보기)');
}

export function pointsOnWorkPublished(work: {
  id: string;
  primaryExhibitionType?: string;
  isInstructorUpload?: boolean;
  groupName?: string;
}) {
  const s = loadState();
  const day = new Date().toISOString().slice(0, 10);
  const month = day.slice(0, 7);

  let times: Record<string, string> = {};
  try {
    times = JSON.parse(localStorage.getItem(PUBLISH_TIMES_KEY) || '{}');
  } catch {
    times = {};
  }
  times[work.id] = new Date().toISOString();
  localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));

  let firstEver = false;
  if (!s.firstUploadDone) {
    s.firstUploadDone = true;
    firstEver = true;
    award(100, 'first_upload', '첫 작품 업로드');
  }
  if (!firstEver) {
    const countToday = s.uploadDatesByDay[day] || 0;
    if (countToday < 2) {
      s.uploadDatesByDay[day] = countToday + 1;
      award(20, 'upload', '작품 업로드');
    }
  }

  const monthUploads = (s.uploadMonthCount[month] || 0) + 1;
  s.uploadMonthCount[month] = monthUploads;
  if (monthUploads === 4) {
    award(50, 'upload_month_4', '월 4회 업로드 달성');
  }

  if (work.primaryExhibitionType === 'group' && work.groupName) {
    if (work.isInstructorUpload) {
      const gk = `m:${month}:inst`;
      if (!s.groupCreateMonth[gk]) {
        s.groupCreateMonth[gk] = true;
        award(30, 'group_create', '그룹전시 생성');
      }
    } else {
      const n = (s.groupParticipationMonth[month] || 0) + 1;
      if (n <= 5) {
        s.groupParticipationMonth[month] = n;
        award(15, 'group_participate', '그룹전시 참여');
      }
    }
  }

  saveState(s);
}

export function pointsOnFollowerCount(count: number) {
  const s = loadState();
  const milestones: [number, number][] = [
    [10, 30],
    [50, 100],
    [100, 200],
  ];
  for (const [th, ap] of milestones) {
    if (count >= th && !s.followerMilestones[String(th)]) {
      s.followerMilestones[String(th)] = true;
      award(ap, `followers_${th}`, `팔로워 ${th}명`);
    }
  }
  saveState(s);
}

/** 업로드 후 24시간 이내 삭제 시 해당 작품 관련 업로드 AP 회수(간이) */
export function pointsRecallIfQuickDelete(workId: string) {
  let times: Record<string, string> = {};
  try {
    times = JSON.parse(localStorage.getItem(PUBLISH_TIMES_KEY) || '{}');
  } catch {
    return;
  }
  const t = times[workId];
  if (!t) return;
  const parsedTime = new Date(t).getTime();
  if (Number.isNaN(parsedTime)) {
    delete times[workId];
    localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));
    return;
  }
  const elapsed = Date.now() - parsedTime;
  if (elapsed > 86400000) {
    delete times[workId];
    localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));
    return;
  }
  delete times[workId];
  localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));
  award(-20, 'upload_revoke', '24h 이내 삭제로 업로드 AP 회수(간이)');
}

/** 앱 초기화 시 만료 배치 시뮬레이션(로그만) */
export function readPointsLedger(): PointLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]') as PointLedgerEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 표시용 AP 잔액: 원장 합계(데모와 일치) */
export function getApBalanceFromLedger(): number {
  return readPointsLedger().reduce((s, e) => s + (typeof e.ap === 'number' ? e.ap : 0), 0);
}

export function getPpBalance(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(PP_BALANCE_KEY);
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function addDemoPp(amount: number) {
  if (typeof window === 'undefined' || amount <= 0) return;
  const next = getPpBalance() + amount;
  localStorage.setItem(PP_BALANCE_KEY, String(next));
  appendLedger({ kind: 'pp_credit', ap: 0, note: `PP +${amount} (demo)` });
  notifyLedgerChanged();
}

export function runPointsExpiryBatch() {
  const ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]') as PointLedgerEntry[];
  if (!Array.isArray(ledger) || ledger.length === 0) return;
  const oneYearAgo = Date.now() - 365 * 86400000;
  const stale = ledger.filter((e) => new Date(e.at).getTime() < oneYearAgo);
  if (stale.length > 0) {
    appendLedger({
      kind: 'batch_expire_ap',
      ap: 0,
      note: `만료 배치: ${stale.length}건(시뮬, Phase2에서 실제 차감)`,
    });
  }
}
