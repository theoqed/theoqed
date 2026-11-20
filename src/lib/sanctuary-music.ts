export interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  cover_youtube_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  youtube_video_id: string;
  custom_cover_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface PlaylistTrackLink {
  id: string;
  playlist_id: string;
  track_id: string;
  added_at: string;
}

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // ID langsung (11 karakter standar YouTube)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    // youtu.be/<id>
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // youtube.com atau music.youtube.com
    if (host.endsWith('youtube.com')) {
      const vParam = url.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

      const segments = url.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(segments[1])
      ) {
        return segments[1];
      }
    }
  } catch {
    // Fallback regex jika string bukan URL utuh
    const regexMatch = trimmed.match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/
    );
    if (regexMatch?.[1]) return regexMatch[1];
  }

  return null;
}

export function getYouTubeThumbnailUrl(
  videoId: string | null | undefined,
  quality: 'hqdefault' | 'mqdefault' | 'sddefault' = 'hqdefault'
): string | null {
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

export function getTrackCoverUrl(track: Pick<TrackItem, 'youtube_video_id' | 'custom_cover_url'>): string {
  if (track.custom_cover_url?.trim()) {
    return track.custom_cover_url.trim();
  }
  return `https://i.ytimg.com/vi/${encodeURIComponent(track.youtube_video_id)}/hqdefault.jpg`;
}