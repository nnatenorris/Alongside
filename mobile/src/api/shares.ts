import { API_BASE_URL } from '../config';

export interface CreateShareResponse {
  share_id: string;
  share_link: string;
  title: string;
  thumbnail_url: string;
  start_offset: number;
}

export async function createShare(params: {
  sourceUrl: string;
  senderName?: string;
  recipientPhone?: string;
}): Promise<CreateShareResponse> {
  const res = await fetch(`${API_BASE_URL}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: params.sourceUrl,
      sender_name: params.senderName || undefined,
      recipient_phone: params.recipientPhone || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Something went wrong sending that.');
  }
  return data;
}

export interface ShareInfo {
  share_id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  sender_name: string;
  start_offset: number;
}

export async function getShare(token: string): Promise<ShareInfo> {
  const res = await fetch(`${API_BASE_URL}/shares/${token}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "This link isn't valid.");
  }
  return data;
}

export type ConsentDecision = 'allow' | 'watch_only';

export async function recordConsent(
  shareId: string,
  decision: ConsentDecision,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/shares/${shareId}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Could not record your choice.');
  }
}
