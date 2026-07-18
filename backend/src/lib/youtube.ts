export function parseYouTubeUrl(url: string): {
  videoId: string;
  startSeconds: number;
} {
  const u = new URL(url);
  const videoId = u.hostname.includes('youtu.be')
    ? u.pathname.slice(1)
    : (u.searchParams.get('v') ?? '');
  const startSeconds = parseInt(
    u.searchParams.get('t') ?? u.searchParams.get('start') ?? '0',
    10,
  );
  return { videoId, startSeconds };
}

export interface YouTubeVideoInfo {
  title: string;
  thumbnailUrl: string;
  authorName: string;
}

export async function resolveYouTubeVideo(
  videoId: string,
): Promise<YouTubeVideoInfo> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error(`oEmbed lookup failed with status ${res.status}`);
  }
  const data = (await res.json()) as {
    title: string;
    thumbnail_url: string;
    author_name: string;
  };

  return {
    title: data.title,
    thumbnailUrl: data.thumbnail_url,
    authorName: data.author_name,
  };
}
