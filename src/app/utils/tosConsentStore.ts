export interface PendingTos {
  version: string;
  effectiveDate: string;
  summary: string[];
  isImplied: boolean;
  fullUrl: string;
}

const TOS_CONSENT_KEY = 'artier_tos_consent_v1';

let pending: PendingTos | null = null;
const listeners: (() => void)[] = [];

export const tosConsentStore = {
  getPending: () => pending,
  setPending: (tos: PendingTos) => {
    pending = tos;
    listeners.forEach(l => l());
  },
  clearPending: () => {
    pending = null;
    listeners.forEach(l => l());
  },
  getConsentedVersion: (): string => {
    try { return localStorage.getItem(TOS_CONSENT_KEY) ?? ''; } catch { return ''; }
  },
  recordConsent: (version: string) => {
    try { localStorage.setItem(TOS_CONSENT_KEY, version); } catch {}
  },
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      const i = listeners.indexOf(listener);
      if (i > -1) listeners.splice(i, 1);
    };
  },
};
