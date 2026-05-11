import { useState, type ReactElement, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Users, User as UserIcon } from 'lucide-react';
import { type Work, type Artist, artists as allArtists } from '../data';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { usePointerCoarse } from '../hooks/usePointerCoarse';
import { imageUrls } from '../imageUrls';
import { getImageCount, getThumbCover } from '../utils/imageHelper';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';
import { ImageWithFallback } from './ImageWithFallback';
import { displayExhibitionTitle } from '../utils/workDisplay';

function resolveImage(key: string): string {
  return imageUrls[key] || key;
}

export function truncateArtistName(name: string, max = 10): string {
  const n = (name ?? '').trim();
  return n.length > max ? `${n.slice(0, max)}…` : n;
}

// ===========================================================================
// 터치: Popover(탭) · 마우스: HoverCard
// ===========================================================================
export function WorkArtistPeek({
  coarse,
  trigger,
  children,
}: {
  coarse: boolean;
  trigger: ReactElement;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (coarse) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className="w-[min(calc(100vw-2rem),20rem)] max-h-[min(70vh,24rem)] overflow-y-auto p-3 z-[60]"
          align="start"
          side="bottom"
          sideOffset={6}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent align="start" sideOffset={6} className="w-[min(22rem,calc(100vw-2rem))] p-3 z-[60]" onClick={(e) => e.stopPropagation()}>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}

// ===========================================================================
// MemberRow -- popover member row for group/co-owner works
// ===========================================================================
export function MemberRow({
  artist,
  isRegistered = true,
  onNavigate,
  isFollowing,
  onToggleFollow,
}: {
  artist: Artist;
  isRegistered?: boolean;
  onNavigate: (id: string) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const { t } = useI18n();

  if (!isRegistered) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {truncateArtistName(artist.name)}
          </p>
        </div>
      </div>
    );
  }

  const go = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onNavigate(artist.id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } }}
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer lg:hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
    >
      <img src={artist.avatar} alt={artist.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">
            {truncateArtistName(artist.name)}
          </p>
        </div>
        {artist.bio && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{artist.bio}</p>
        )}
      </div>
      {artist.id !== allArtists[0].id && (
        <Button
          type="button"
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
          className="shrink-0 min-h-9 text-xs px-4 rounded-lg"
        >
          {isFollowing ? t('social.following') : t('social.follow')}
        </Button>
      )}
    </div>
  );
}

// ===========================================================================
// WorkCard -- 전시 카드 (Browse · Search 공용)
// ===========================================================================
export interface WorkCardProps {
  work: Work;
  index: number;
  onSelect: () => void;
  onArtistClick: (artistId: string) => void;
  isFollowing: (artistId: string) => boolean;
  onToggleFollow: (artistId: string) => void;
  onReport?: (work: Work) => void;
}

export function WorkCard({ work, index, onSelect, onArtistClick, isFollowing, onToggleFollow }: WorkCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const coarsePointer = usePointerCoarse();
  const artist = work.artist;
  const groupName = work.groupName;
  const coOwners = work.coOwners;
  const hasCoOwnersNoGroup = !groupName && coOwners && coOwners.length > 0;
  const exhibitionLabel = displayExhibitionTitle(work, t('work.untitled'));
  const isPick = work.pickBadge === true || work.pick === true;
  const useGroupStyleRow =
    Boolean(groupName?.trim()) &&
    (work.primaryExhibitionType === 'group' ||
      Boolean(coOwners?.length) ||
      work.owner?.type === 'group');
  const imageSrc = resolveImage(getThumbCover(work));
  const imageCount = getImageCount(work.image);
  const showImageCountBadge =
    imageCount > 1 &&
    (work.primaryExhibitionType === 'group' ||
      work.primaryExhibitionType === 'solo' ||
      Array.isArray(work.image));

  const nonMemberArtists = Array.from(
    new Map(
      (work.imageArtists ?? [])
        .filter((a) => a.type === 'non-member' && !!a.displayName)
        .map((a) => [a.displayName as string, a]),
    ).values(),
  );

  const groupOwnerData: { id: string; memberIds?: string[] } | undefined =
    work.owner?.type === 'group' ? work.owner.data : undefined;
  const dedupeMembers = (members: Artist[]): Artist[] => {
    const seen = new Set<string>();
    return members.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  };
  const peekMembers: Artist[] = (() => {
    if (work.imageArtists && work.imageArtists.length > 0) {
      const memberArtists = work.imageArtists
        .filter((ia) => ia.type === 'member' && ia.memberId)
        .map((ia) => allArtists.find((a: Artist) => a.id === ia.memberId))
        .filter((a): a is Artist => Boolean(a));
      return dedupeMembers(memberArtists);
    }
    const memberIds = groupOwnerData?.memberIds;
    if (memberIds && memberIds.length > 0) {
      const list = memberIds
        .map((mid: string) => allArtists.find((a: Artist) => a.id === mid))
        .filter((a: Artist | undefined): a is Artist => Boolean(a));
      if (list.length > 0) return dedupeMembers(list);
    }
    const raw: Artist[] = [...(coOwners ?? [])];
    const groupId = groupOwnerData?.id;
    const filtered = groupId ? raw.filter((a) => a.id !== groupId) : raw;
    return dedupeMembers(filtered);
  })();

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-sm bg-card ring-1 ring-foreground/[0.07] shadow-[0_2px_24px_-12px_rgba(35,32,40,0.2)] transition-all duration-300 ease-out lg:hover:-translate-y-1 lg:hover:shadow-[0_20px_48px_-28px_rgba(35,32,40,0.28)]"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
      onClick={onSelect}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[oklch(0.96_0.012_85)]">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={imageSrc}
            alt={exhibitionLabel}
            className="h-full w-full min-h-0 min-w-0 object-contain object-center"
          />

          {showImageCountBadge && (
            <div className="absolute left-3 top-3 z-10">
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                {imageCount}
              </div>
            </div>
          )}

          {isPick && (
            <div className="absolute left-3 bottom-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#B8862F] text-white text-xs font-bold shadow-md backdrop-blur-sm">
                ★ Proud&apos;s Pick
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 sm:px-3.5 bg-card">
        <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 min-w-0 mb-1">
          {exhibitionLabel}
        </h3>

        <div className="flex items-center -mx-1">
          {useGroupStyleRow ? (
            <WorkArtistPeek
              coarse={coarsePointer}
              trigger={
                <Button
                  variant="ghost"
                  type="button"
                  className="flex items-center gap-1.5 py-1 px-1 min-w-0 text-sm text-muted-foreground transition-none touch-manipulation rounded-md lg:hover:bg-transparent lg:hover:text-muted-foreground active:bg-transparent cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 shrink-0"><Users className="h-3.5 w-3.5" /></span>
                  <span className="truncate">{truncateArtistName((groupName?.trim() || exhibitionLabel || '') as string)}</span>
                </Button>
              }
            >
              <p className="text-sm font-semibold text-foreground px-1 mb-3">{t('browse.groupMembersLabel')}</p>
              {peekMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  artist={m}
                  isFollowing={isFollowing(m.id)}
                  onToggleFollow={() => onToggleFollow(m.id)}
                  onNavigate={(id) => navigate(`/profile/${id}`)}
                />
              ))}
              {nonMemberArtists.map((nm) => (
                <MemberRow
                  key={`nm-${nm.displayName}`}
                  artist={{ id: `nm-${nm.displayName}`, name: nm.displayName as string, avatar: '', bio: '' }}
                  isRegistered={false}
                  isFollowing={false}
                  onToggleFollow={() => {}}
                  onNavigate={() => {}}
                />
              ))}
            </WorkArtistPeek>
          ) : hasCoOwnersNoGroup ? (
            <WorkArtistPeek
              coarse={coarsePointer}
              trigger={
                <Button
                  variant="ghost"
                  type="button"
                  className="flex items-center gap-1.5 py-1 px-1 min-w-0 text-sm text-muted-foreground transition-none touch-manipulation rounded-md lg:hover:bg-transparent lg:hover:text-muted-foreground active:bg-transparent cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 shrink-0"><Users className="h-3.5 w-3.5" /></span>
                  <span className="truncate">{truncateArtistName(t('browse.groupArtistsLabel'))}</span>
                </Button>
              }
            >
              <p className="text-sm font-semibold text-foreground px-1 mb-3">{t('browse.groupMembersLabel')}</p>
              {peekMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  artist={m}
                  isFollowing={isFollowing(m.id)}
                  onToggleFollow={() => onToggleFollow(m.id)}
                  onNavigate={(id) => navigate(`/profile/${id}`)}
                />
              ))}
              {nonMemberArtists.map((nm) => (
                <MemberRow
                  key={`nm-${nm.displayName}`}
                  artist={{ id: `nm-${nm.displayName}`, name: nm.displayName as string, avatar: '', bio: '' }}
                  isRegistered={false}
                  isFollowing={false}
                  onToggleFollow={() => {}}
                  onNavigate={() => {}}
                />
              ))}
            </WorkArtistPeek>
          ) : (
            <Button
              variant="ghost"
              type="button"
              className="flex items-center gap-1.5 py-1 px-1 min-w-0 text-sm text-muted-foreground lg:hover:text-foreground active:text-foreground transition-colors touch-manipulation rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                onArtistClick(artist.id);
              }}
            >
              {artist.avatar && (
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
              )}
              <span className="truncate">{truncateArtistName(artist.name)}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
