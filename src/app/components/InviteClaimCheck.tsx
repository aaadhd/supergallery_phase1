import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';
import type { MatchCandidate } from '../utils/inviteMessaging';

/**
 * §3.5.1 본인 확인 단계.
 * 가입 마지막에 매칭 후보가 1건 이상이면 노출. 무작위 최대 3건의 작품 카드 + 단일 yes/no.
 */
export function InviteClaimCheck({
  candidates,
  onYes,
  onNo,
  busy,
}: {
  candidates: MatchCandidate[];
  onYes: () => void;
  onNo: () => void;
  busy?: boolean;
}) {
  const { t } = useI18n();

  // 같은 가입 세션에서 새로고침해도 동일 표본을 보여주기 위해 시드 고정
  const sample = useMemo(() => pickSample(candidates, 3), [candidates]);

  if (sample.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-1">
        {t('invite.claimCheckTitle')}
      </h2>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {t('invite.claimCheckBody')}
      </p>

      <div className="space-y-3 mb-6">
        {sample.map((c) => (
          <div
            key={c.workId + ':' + c.inviteId}
            className="rounded-xl border border-border bg-white overflow-hidden"
          >
            <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="h-full w-full bg-muted/30" />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground truncate">
                {c.workTitle}
              </p>
              {c.inviterNickname ? (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {t('invite.claimCheckCardInviter').replace(
                    '{nickname}',
                    c.inviterNickname,
                  )}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={onYes}
          disabled={!!busy}
          className="w-full min-h-[48px] rounded-xl py-3.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#171717' }}
        >
          {t('invite.claimCheckYes')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNo}
          disabled={!!busy}
          className="w-full min-h-[48px] rounded-xl py-3.5 text-sm font-semibold"
        >
          {t('invite.claimCheckNo')}
        </Button>
      </div>
    </div>
  );
}

/** 후보가 4건 이상이면 무작위 3건 표본 추출. 1~3건이면 전부 반환. */
function pickSample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  // 안정적 표본: 후보 식별자 기반 시드(가입 세션 내 동일 결과)
  const indices = items.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(stableHash(String(i)) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n).map((i) => items[i]);
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  // 0~1 사이 값으로 정규화
  return ((h >>> 0) % 1000) / 1000;
}

export default InviteClaimCheck;
