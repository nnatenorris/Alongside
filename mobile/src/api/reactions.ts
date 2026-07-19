import { API_BASE_URL } from '../config';

export interface UploadUrlResponse {
  upload_url: string;
  method: 'PUT';
}

export async function initReactionUpload(
  shareId: string,
): Promise<UploadUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/shares/${shareId}/reaction/init`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not start the upload.');
  }
  return data;
}

export async function uploadReactionFile(
  uploadUrl: string,
  filePath: string,
): Promise<void> {
  const fileUri = filePath.startsWith('file://')
    ? filePath
    : `file://${filePath}`;
  const fileBlob = await (await fetch(fileUri)).blob();
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: fileBlob,
  });
  if (!res.ok) {
    throw new Error('The reaction upload failed.');
  }
}

export async function completeReaction(
  shareId: string,
  params: { capturedFrom: number; duration: number },
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/shares/${shareId}/reaction/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captured_from: params.capturedFrom,
        duration: params.duration,
      }),
    },
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Could not finish sending the reaction.');
  }
}

export type ReplayInfo =
  | { status: 'pending' }
  | {
      status: 'ready';
      video_id: string;
      start_offset: number;
      title: string;
      reaction_url: string;
      captured_from: number;
      duration: number;
    };

export async function getReplay(shareId: string): Promise<ReplayInfo> {
  const res = await fetch(`${API_BASE_URL}/shares/${shareId}/reaction`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not load the reaction.');
  }
  return data;
}
