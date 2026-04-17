import type { Work } from '../data';

const DB_NAME = 'artier_work_media';
const DB_VERSION = 1;
const STORE = 'blobs';

/** 로컬에만 쓰는 짧은 포인터 — `imageUrls[x] || x` 패턴으로 그대로 src에 넣을 수 있음 */
const REF_PREFIX = '__artier_media__|';

function isHeavyInline(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('data:')) return true;
  if (src.startsWith('blob:')) return true;
  return src.length > 120_000;
}

function isMediaRef(src: string): boolean {
  return typeof src === 'string' && src.startsWith(REF_PREFIX);
}

function refKey(workId: string, slot: string): string {
  return `${REF_PREFIX}${encodeURIComponent(workId)}|${slot}`;
}

function parseRef(ref: string): { workId: string; slot: string } | null {
  if (!isMediaRef(ref)) return null;
  const rest = ref.slice(REF_PREFIX.length);
  const pipe = rest.indexOf('|');
  if (pipe < 0) return null;
  try {
    const workId = decodeURIComponent(rest.slice(0, pipe));
    const slot = rest.slice(pipe + 1);
    if (!workId || !slot) return null;
    return { workId, slot };
  } catch {
    return null;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbKey(workId: string, slot: string): string {
  return `${workId}::${slot}`;
}

async function idbPut(workId: string, slot: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(value, idbKey(workId, slot));
  });
}

async function idbGet(workId: string, slot: string): Promise<string | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    tx.onerror = () => reject(tx.error);
    const r = tx.objectStore(STORE).get(idbKey(workId, slot));
    r.onsuccess = () => resolve(r.result as string | undefined);
  });
}

async function idbDeletePrefix(workId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    const prefix = `${workId}::`;
    const range = IDBKeyRange.bound(prefix, `${prefix}\uffff`);
    const cur = store.openCursor(range);
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) {
        c.delete();
        c.continue();
      }
    };
  });
}

/** data URL 등 무거운 문자열만 IDB로 옮기고 Work 복제본에 짧은 ref를 넣는다 */
export async function offloadHeavyMediaInWork(work: Work): Promise<Work> {
  const w = { ...work } as Work;
  const wid = w.id;

  const imgs = Array.isArray(w.image) ? [...w.image] : [w.image];
  for (let i = 0; i < imgs.length; i++) {
    const s = imgs[i];
    if (typeof s !== 'string' || !isHeavyInline(s)) continue;
    const slot = String(i);
    await idbPut(wid, slot, s);
    imgs[i] = refKey(wid, slot);
  }
  w.image = imgs.length === 1 ? imgs[0] : imgs;

  if (typeof w.customCoverUrl === 'string' && isHeavyInline(w.customCoverUrl)) {
    await idbPut(wid, 'cover', w.customCoverUrl);
    w.customCoverUrl = refKey(wid, 'cover');
  }

  return w;
}

export async function offloadHeavyMediaInWorks(works: Work[]): Promise<Work[]> {
  const out: Work[] = [];
  for (const w of works) {
    out.push(await offloadHeavyMediaInWork({ ...w }));
  }
  return out;
}

/** ref 슬롯을 IDB에서 읽어 실제 data URL 등으로 되돌린다 */
export async function hydrateWorkMedia(work: Work): Promise<Work> {
  const w = { ...work } as Work;
  const resolveStr = async (s: string): Promise<string> => {
    const parsed = parseRef(s);
    if (!parsed) return s;
    const got = await idbGet(parsed.workId, parsed.slot);
    return got ?? s;
  };

  if (typeof w.customCoverUrl === 'string' && isMediaRef(w.customCoverUrl)) {
    w.customCoverUrl = await resolveStr(w.customCoverUrl);
  }

  const imgs = Array.isArray(w.image) ? [...w.image] : [w.image];
  for (let i = 0; i < imgs.length; i++) {
    const s = imgs[i];
    if (typeof s === 'string' && isMediaRef(s)) {
      imgs[i] = await resolveStr(s);
    }
  }
  w.image = imgs.length === 1 ? imgs[0] : imgs;
  return w;
}

export async function hydrateWorksMedia(works: Work[]): Promise<Work[]> {
  return Promise.all(works.map((w) => hydrateWorkMedia({ ...w })));
}

export async function deleteWorkMediaFromIdb(workId: string): Promise<void> {
  try {
    await idbDeletePrefix(workId);
  } catch {
    /* ignore */
  }
}

export function workContainsMediaRefs(work: Work): boolean {
  if (typeof work.customCoverUrl === 'string' && isMediaRef(work.customCoverUrl)) return true;
  const imgs = Array.isArray(work.image) ? work.image : [work.image];
  return imgs.some((s) => typeof s === 'string' && isMediaRef(s));
}
