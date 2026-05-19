// src/app/components/upload/types.ts

export interface RegisteredArtist {
  /** Client-side temporary ID */
  id: string;
  type: 'member' | 'non-member';
  memberId?: string;
  memberName?: string;
  memberAvatar?: string;
  displayName?: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

/** Mirror of ContentItem from Upload.tsx — kept in sync structurally */
export type ContentItem = {
  id: string;
  type: 'image';
  url?: string;
  title?: string;
  artist?: { id: string; name: string; avatar: string };
  nonMemberArtist?: { displayName: string };
  artistType?: 'member' | 'non-member' | 'self' | 'unknown';
  fullWidth?: boolean;
  pieceId?: string;
};
