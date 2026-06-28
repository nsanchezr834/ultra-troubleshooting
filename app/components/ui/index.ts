// ─────────────────────────────────────────────────────────────────
//  app/components/ui/index.ts
//
//  Central re-export barrel for all atomic UI components.
//  Import from '@/app/components/ui' instead of per-file paths.
// ─────────────────────────────────────────────────────────────────

export { FaultCard, FaultCardSkeleton } from './FaultCard';
export type { ExtendedFault } from './FaultCard';

export { FaultModal } from './FaultModal';

export { VoiceStatusPanel, MicButton } from './VoiceStatusPanel';
export type { VoiceTurn, VoiceOption } from './VoiceStatusPanel';

export { SyncStatusBadge } from './SyncStatusBadge';

export { SearchBar } from './SearchBar';
