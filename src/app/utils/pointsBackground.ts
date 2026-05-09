/**
 * Phase 1 백그라운드 포인트 (기능 모음·정책) — UI 없음, 로컬 적립 로그만
 */

const LEDGER_KEY = 'artier_points_ledger';
const STATE_KEY = 'artier_points_state';
const PUBLISH_TIMES_KEY = 'artier_work_publish_times';

/** 로컬 시간대 기준 YYYY-MM-DD (UTC 대신 사용자 시간대) */
function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type PointLedgerEntry = {
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
}

/** 호출부가 loadState/saveState를 직접 관리. 상태 변경 + 원장 기록만 담당. */
function award(s: PointsState, ap: number, kind: string, note?: string) {
  if (ap === 0) return;
  s.totalApAccrued = Math.max(0, s.totalApAccrued + ap);
  appendLedger({ kind, ap, note });
}

export function pointsOnSignupComplete() {
  const s = loadState();
  if (s.signupApDone) return;
  s.signupApDone = true;
  award(s, 50, 'signup', '회원가입 완료');
  saveState(s);
}

export function pointsOnOnboardingStep1Complete() {
  const s = loadState();
  if (s.onboardingApDone) return;
  s.onboardingApDone = true;
  award(s, 30, 'onboarding', '온보딩 Step1');
  saveState(s);
}

export function pointsOnBrowseDailyVisit() {
  const day = localDateString();
  const s = loadState();
  if (s.dailyBrowseStreak === day) return;
  s.dailyBrowseStreak = day;
  award(s, 5, 'daily_browse', '일일 출석(둘러보기)');
  saveState(s);
}

export function pointsOnWorkPublished(work: {
  id: string;
  primaryExhibitionType?: string;
  groupName?: string;
}) {
  let times: Record<string, string> = {};
  try {
    times = JSON.parse(localStorage.getItem(PUBLISH_TIMES_KEY) || '{}');
  } catch {
    times = {};
  }
  if (times[work.id]) return;
  times[work.id] = new Date().toISOString();
  localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));

  const s = loadState();
  const day = localDateString();
  const month = day.slice(0, 7);

  let firstEver = false;
  if (!s.firstUploadDone) {
    s.firstUploadDone = true;
    firstEver = true;
    award(s, 100, 'first_upload', '첫 작품 업로드');
  }
  if (!firstEver) {
    const countToday = s.uploadDatesByDay[day] || 0;
    if (countToday < 2) {
      s.uploadDatesByDay[day] = countToday + 1;
      award(s, 20, 'upload', '작품 업로드');
    }
  }

  const monthUploads = (s.uploadMonthCount[month] || 0) + 1;
  s.uploadMonthCount[month] = monthUploads;
  if (monthUploads === 4) {
    award(s, 50, 'upload_month_4', '월 4회 업로드 달성');
  }

  if (work.primaryExhibitionType === 'group' && work.groupName) {
    const n = (s.groupParticipationMonth[month] || 0) + 1;
    if (n <= 5) {
      s.groupParticipationMonth[month] = n;
      award(s, 15, 'group_participate', '그룹전시 참여');
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
      award(s, ap, `followers_${th}`, `팔로워 ${th}명`);
    }
  }
  saveState(s);
}

/** 어드민 신고 처리로 작품 강제 삭제 시 업로드 AP 회수 (24h 조건 없음) */
export function pointsRecallOnAdminDelete(workId: string) {
  let times: Record<string, string> = {};
  try {
    times = JSON.parse(localStorage.getItem(PUBLISH_TIMES_KEY) || '{}');
  } catch {
    return;
  }
  const t = times[workId];
  if (!t) return;
  delete times[workId];
  localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));
  const s = loadState();
  award(s, -20, 'admin_delete_revoke', '신고 처리 삭제로 업로드 AP 회수');
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
  delete times[workId];
  localStorage.setItem(PUBLISH_TIMES_KEY, JSON.stringify(times));
  if (Number.isNaN(parsedTime)) return;
  if (Date.now() - parsedTime <= 86400000) {
    const s = loadState();
    award(s, -20, 'upload_revoke', '24h 이내 삭제로 업로드 AP 회수(간이)');
    saveState(s);
  }
}
