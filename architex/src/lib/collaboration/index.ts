export type {
  CollaboratorInfo,
  CollaborationState,
  CollaborationEvent,
  CollaborationProvider,
  CollaborationTransport,
  CollaboratorJoinEvent,
  CollaboratorLeaveEvent,
  CursorMoveEvent,
  CursorPosition,
  NodeUpdateEvent,
  PresenceStatus,
  SelectionChangeEvent,
  SyncMessage,
} from './types';

export { CollaborationManager, LocalTransport } from './collaboration-manager';

export {
  createShareableLink,
  parseShareableLink,
} from './shareable-links';

export type {
  ShareableDiagram,
  CreateLinkResult,
  ParseLinkResult,
} from './shareable-links';

export { forkDesign } from './fork';

export type {
  ForkableDesign,
  ForkedDesign,
} from './fork';

export { FollowModeManager, startFollowing, stopFollowing } from './follow-mode';

export type {
  FollowSession,
  Viewport as FollowViewport,
  ViewportSyncCallback,
} from './follow-mode';

export { toggleUpvote, getUpvoteCount, hasUserUpvoted, getUserUpvotedDesigns } from './upvotes';

export type { UpvoteResult } from './upvotes';

export {
  addComment,
  deleteComment,
  getComments,
  getCommentsFlat,
  getCommentCount,
  buildCommentTree,
} from './comments';

export type {
  Comment,
  ThreadedComment,
} from './comments';
