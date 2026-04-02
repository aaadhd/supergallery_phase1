import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store';
import { allEvents } from './EventDetail';
import { useI18n } from '../i18n/I18nProvider';

type InvitePayload = {
  title: string;
  coverImage: string;
  inviterName: string;
  exhibitionId: number;
};

function resolveInvite(code: string | undefined): InvitePayload | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();

  const seeded: Record<string, { exhibitionId: number; inviterName: string }> = {
    SPRING2026: { exhibitionId: 1, inviterName: '김민서' },
    WATERCOLOR: { exhibitionId: 4, inviterName: '이수채' },
    DIGITAL: { exhibitionId: 2, inviterName: '박드로잉' },
  };

  const seed = seeded[normalized];
  let event = seed ? allEvents.find(e => e.id === seed.exhibitionId) : undefined;
  if (!event && allEvents.length > 0) {
    const idx = hashToIndex(code) % allEvents.length;
    event = allEvents[idx];
  }

  if (!event) return null;

  return {
    title: event.title,
    coverImage: event.image,
    inviterName: seed?.inviterName ?? defaultInviterName(code),
    exhibitionId: event.id,
  };
}

function hashToIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function defaultInviterName(code: string): string {
  const names = ['최작가', '정큐레이터', '한갤러리스트', '강아티스트'];
  return names[hashToIndex(code) % names.length];
}

export default function InvitationLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { t } = useI18n();
  const data = resolveInvite(code);

  useEffect(() => {
    const brand = t('brand.name');
    if (!data) {
      document.title = `${t('invite.invalid')} — ${brand}`;
      return () => {
        document.title = brand;
      };
    }
    document.title = t('invite.docTitle').replace('{title}', data.title).replace('{brand}', brand);
    return () => {
      document.title = brand;
    };
  }, [data, t]);

  const share = async () => {
    const url = window.location.href;
    const title = data?.title ?? t('invite.defaultTitle');
    const inviter = data?.inviterName ?? t('invite.someone');
    const text = t('invite.shareText').replace('{inviter}', inviter);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      /* 사용자 취소 등 */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('invite.clipboardOk'));
    } catch {
      toast.error(t('invite.clipboardFail'));
    }
  };

  const goExhibition = () => {
    if (!data) return;
    navigate(`/events/${data.exhibitionId}`);
  };

  const handleParticipate = () => {
    if (!data) return;
    if (!auth.isLoggedIn()) {
      navigate(`/login?redirect=${encodeURIComponent(`/invite/${code}`)}`);
      return;
    }
    toast.success(t('invite.participated'));
    goExhibition();
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-zinc-600 text-center">{t('invite.invalid')}</p>
        <Link to="/" className="mt-4 text-sm font-medium text-[#6366F1] hover:underline">
          {t('invite.browse')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full bg-zinc-100">
              <img
                src={data.coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 text-sm text-white/90">
                {t('invite.inviteByline').replace('{name}', data.inviterName)}
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6366F1]">
                {t('invite.exhibitionLabel')}
              </p>
              <h1 className="mt-1 text-xl font-bold text-zinc-900 leading-snug">{data.title}</h1>
              <p className="mt-3 text-sm text-zinc-500">
                {t('invite.codeLabel')}{' '}
                <span className="font-mono text-zinc-700">{code}</span>
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {auth.isLoggedIn() ? (
                  <button
                    type="button"
                    onClick={handleParticipate}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: '#6366F1' }}
                  >
                    {t('invite.participate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleParticipate}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: '#6366F1' }}
                  >
                    {t('invite.loginToParticipate')}
                  </button>
                )}
                <Link
                  to="/"
                  className="flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {t('invite.browse')}
                </Link>
                <button
                  type="button"
                  onClick={share}
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800"
                >
                  <Share2 className="h-4 w-4" />
                  {t('invite.share')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
