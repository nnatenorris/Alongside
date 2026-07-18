export interface Share {
  id: string;
  token: string;
  sourceUrl: string;
  videoId: string;
  startOffset: number;
  title: string;
  thumbnailUrl: string;
  senderName: string | null;
  recipientPhone: string | null;
  createdAt: string;
}

export type ConsentDecision = "allow" | "watch_only";

export interface Consent {
  shareId: string;
  decision: ConsentDecision;
  decidedAt: string;
}

export interface Reaction {
  shareId: string;
  filePath: string;
  capturedFrom: number;
  duration: number;
  completedAt: string;
}

// In-memory for now — fine for a single dev process, lost on restart.
// Swap for real persistence once there's more than one endpoint to share it.
const sharesById = new Map<string, Share>();
const idByToken = new Map<string, string>();
const consentsByShareId = new Map<string, Consent>();
const reactionsByShareId = new Map<string, Reaction>();

export function saveShare(share: Share): void {
  sharesById.set(share.id, share);
  idByToken.set(share.token, share.id);
}

export function getShareByToken(token: string): Share | undefined {
  const id = idByToken.get(token);
  return id ? sharesById.get(id) : undefined;
}

export function getShareById(id: string): Share | undefined {
  return sharesById.get(id);
}

export function recordConsent(shareId: string, decision: ConsentDecision): Consent {
  const consent: Consent = { shareId, decision, decidedAt: new Date().toISOString() };
  consentsByShareId.set(shareId, consent);
  return consent;
}

export function saveReaction(reaction: Reaction): void {
  reactionsByShareId.set(reaction.shareId, reaction);
}

export function getReactionByShareId(shareId: string): Reaction | undefined {
  return reactionsByShareId.get(shareId);
}
