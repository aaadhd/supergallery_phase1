import type { MessageKey } from '../i18n/messages';

export const REJECTION_REASONS = ['low_quality', 'spam', 'inappropriate', 'copyright'] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const REJECTION_REASON_LABEL_KEY: Record<RejectionReason, MessageKey> = {
  low_quality: 'review.reasonLowQuality',
  spam: 'review.reasonSpam',
  inappropriate: 'review.reasonInappropriate',
  copyright: 'review.reasonCopyright',
};
