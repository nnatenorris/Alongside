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
  recipientPhone?: string;
}): Promise<CreateShareResponse> {
  const res = await fetch(`${API_BASE_URL}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: params.sourceUrl,
      recipient_phone: params.recipientPhone || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Something went wrong sending that.');
  }
  return data;
}
