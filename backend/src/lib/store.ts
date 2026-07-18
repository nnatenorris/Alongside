export interface Share {
  id: string;
  token: string;
  sourceUrl: string;
  videoId: string;
  startOffset: number;
  title: string;
  thumbnailUrl: string;
  recipientPhone: string | null;
  createdAt: string;
}

// In-memory for now — fine for a single dev process, lost on restart.
// Swap for real persistence once there's more than one endpoint to share it.
const sharesById = new Map<string, Share>();
const idByToken = new Map<string, string>();

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
