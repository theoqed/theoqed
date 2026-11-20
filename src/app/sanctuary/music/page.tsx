'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  PlaylistItem,
  TrackItem,
  PlaylistTrackLink,
  getYouTubeThumbnailUrl,
  getTrackCoverUrl,
} from '@/lib/sanctuary-music';

type RepeatMode = 'off' | 'all' | 'one';

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayerInstance;
  data: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: YTPlayerEvent) => void;
            onStateChange?: (event: YTPlayerEvent) => void;
            onError?: (event: YTPlayerEvent) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function SanctuaryMusicPage() {
  const supabase = useMemo(() => createClient(), []);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);

  // Auth & Theme
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Library Data
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [links, setLinks] = useState<PlaylistTrackLink[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  const [selectedView, setSelectedView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [showVideoStage, setShowVideoStage] = useState(false);

  // Player State
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Verifikasi Admin & Muat Data dari Supabase
  useEffect(() => {
    async function initMusicLibrary() {
      setCheckingAuth(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAdmin(false);
        setCheckingAuth(false);
        setLoadingLibrary(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);
      setCheckingAuth(false);

      if (!adminStatus) {
        setLoadingLibrary(false);
        return;
      }

      const [{ data: plRows }, { data: trRows }, { data: linkRows }] = await Promise.all([
        supabase
          .from('sanctuary_playlists')
          .select('id, name, description, cover_youtube_id, sort_order, created_at')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('sanctuary_tracks')
          .select('id, title, artist, album, youtube_video_id, custom_cover_url, sort_order, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('sanctuary_playlist_tracks')
          .select('id, playlist_id, track_id, added_at')
          .order('added_at', { ascending: true }),
      ]);

      const fetchedPlaylists = (plRows as PlaylistItem[]) || [];
      const fetchedTracks = (trRows as TrackItem[]) || [];
      const fetchedLinks = (linkRows as PlaylistTrackLink[]) || [];

      setPlaylists(fetchedPlaylists);
      setTracks(fetchedTracks);
      setLinks(fetchedLinks);
      if (fetchedTracks.length > 0) {
        setCurrentTrackId(fetchedTracks[0].id);
      }
      setLoadingLibrary(false);
    }

    initMusicLibrary();
  }, [supabase]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Abaikan
    }
  }

  // Pemetaan track_id -> daftar playlist
  const trackPlaylistsMap = useMemo(() => {
    const map = new Map<string, PlaylistItem[]>();
    const playlistById = new Map(playlists.map((p) => [p.id, p]));

    for (const link of links) {
      const pl = playlistById.get(link.playlist_id);
      if (!pl) continue;
      const existing = map.get(link.track_id) || [];
      existing.push(pl);
      map.set(link.track_id, existing);
    }
    return map;
  }, [links, playlists]);

  const unassignedCount = useMemo(
    () => tracks.filter((t) => !(trackPlaylistsMap.get(t.id)?.length)).length,
    [tracks, trackPlaylistsMap]
  );

  const visibleTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let baseList: TrackItem[] = [];
    if (selectedView === 'all') {
      baseList = tracks;
    } else if (selectedView === 'unassigned') {
      baseList = tracks.filter((t) => !(trackPlaylistsMap.get(t.id)?.length));
    } else {
      const allowedTrackIds = new Set(
        links.filter((l) => l.playlist_id === selectedView).map((l) => l.track_id)
      );
      baseList = tracks.filter((t) => allowedTrackIds.has(t.id));
    }

    if (!q) return baseList;
    return baseList.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, selectedView, searchQuery, links, trackPlaylistsMap]);

  const activeCollection = useMemo(() => {
    if (selectedView === 'all') {
      return {
        badge: 'Root Library',
        name: 'Semua Lagu (Root)',
        description: 'Arsip utama seluruh koleksi YouTube & YouTube Music sebelum maupun sesudah masuk playlist.',
        coverUrl: tracks[0] ? getTrackCoverUrl(tracks[0]) : null,
      };
    }
    if (selectedView === 'unassigned') {
      return {
        badge: 'Arsip Root',
        name: 'Belum Masuk Playlist',
        description: 'Daftar lagu di Root yang belum dikelompokkan ke playlist mana pun.',
        coverUrl: visibleTracks[0] ? getTrackCoverUrl(visibleTracks[0]) : null,
      };
    }
    const found = playlists.find((p) => p.id === selectedView);
    const playlistCover =
      getYouTubeThumbnailUrl(found?.cover_youtube_id) ||
      (visibleTracks[0] ? getTrackCoverUrl(visibleTracks[0]) : null);

    return {
      badge: 'Playlist Pribadi',
      name: found?.name || 'Playlist',
      description: found?.description || 'Koleksi playlist pribadi.',
      coverUrl: playlistCover,
    };
  }, [selectedView, playlists, tracks, visibleTracks]);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) || null,
    [tracks, currentTrackId]
  );

  // Navigasi Lagu
  const handleSelectTrack = useCallback(
    (track: TrackItem) => {
      setPlayerError(null);
      if (currentTrackId === track.id) {
        if (!ytPlayerRef.current || !isPlayerReady) return;
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
        } else {
          ytPlayerRef.current.playVideo();
        }
      } else {
        setCurrentTrackId(track.id);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(true);
      }
    },
    [currentTrackId, isPlayerReady, isPlaying]
  );

  const playNextTrack = useCallback(() => {
    setPlayerError(null);
    const pool = visibleTracks.length > 0 ? visibleTracks : tracks;
    if (pool.length === 0) return;

    if (repeatMode === 'one' && currentTrack && ytPlayerRef.current && isPlayerReady) {
      ytPlayerRef.current.seekTo(0, true);
      ytPlayerRef.current.playVideo();
      return;
    }

    if (isShuffle && pool.length > 1) {
      const candidates = pool.filter((t) => t.id !== currentTrackId);
      const randomTrack = candidates[Math.floor(Math.random() * candidates.length)];
      if (randomTrack) {
        setCurrentTrackId(randomTrack.id);
        setCurrentTime(0);
        setIsPlaying(true);
      }
      return;
    }

    const currentIndex = pool.findIndex((t) => t.id === currentTrackId);
    if (currentIndex === -1) {
      setCurrentTrackId(pool[0].id);
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    const isLast = currentIndex === pool.length - 1;
    if (isLast && repeatMode === 'off') {
      setIsPlaying(false);
      return;
    }

    const nextIndex = (currentIndex + 1) % pool.length;
    setCurrentTrackId(pool[nextIndex].id);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [visibleTracks, tracks, repeatMode, currentTrack, isPlayerReady, isShuffle, currentTrackId]);

  const playPrevTrack = useCallback(() => {
    setPlayerError(null);
    if (ytPlayerRef.current && isPlayerReady && ytPlayerRef.current.getCurrentTime() > 4) {
      ytPlayerRef.current.seekTo(0, true);
      setCurrentTime(0);
      return;
    }

    const pool = visibleTracks.length > 0 ? visibleTracks : tracks;
    if (pool.length === 0) return;

    const currentIndex = pool.findIndex((t) => t.id === currentTrackId);
    const targetTrack =
      currentIndex <= 0 ? pool[pool.length - 1] : pool[currentIndex - 1];

    setCurrentTrackId(targetTrack.id);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [visibleTracks, tracks, currentTrackId, isPlayerReady]);

  // Ref agar event listener YouTube selalu membaca state terbaru
  const playNextTrackRef = useRef(playNextTrack);
  useEffect(() => {
    playNextTrackRef.current = playNextTrack;
  }, [playNextTrack]);

  // Muat script resmi YouTube IFrame Player API
  useEffect(() => {
    if (checkingAuth || loadingLibrary || !isAdmin) return;
    if (!playerContainerRef.current || ytPlayerRef.current) return;

    const initialVideoId = tracks[0]?.youtube_video_id || '';

    function createYTPlayer() {
      if (!playerContainerRef.current || ytPlayerRef.current || !window.YT?.Player) return;

      ytPlayerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: initialVideoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            loadedVideoIdRef.current = initialVideoId || null;
            event.target.setVolume(85);
            setIsPlayerReady(true);
          },
          onStateChange: (event) => {
            const state = event.data;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (state === 1) {
              setPlayerError(null);
              setIsPlaying(true);
              const d = event.target.getDuration();
              if (d > 0) setDuration(d);
            } else if (state === 2) {
              setIsPlaying(false);
            } else if (state === 0) {
              playNextTrackRef.current();
            }
          },
          onError: (event) => {
            setIsPlaying(false);
            if (event.data === 101 || event.data === 150) {
              setPlayerError(
                'Pemilik hak cipta video ini membatasi pemutaran embed di situs luar. Ganti tautan dengan versi lain (lyric video / audio kanal lain) di Kelola Koleksi.'
              );
            } else if (event.data === 100) {
              setPlayerError(
                'Video YouTube tidak ditemukan atau telah dihapus oleh pemilik kanal.'
              );
            } else {
              setPlayerError('Video YouTube gagal dimuat. Coba putar lagu berikutnya.');
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createYTPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        createYTPlayer();
      };
    }

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
        setIsPlayerReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth, loadingLibrary, isAdmin]);

  // Sinkronkan pergantian lagu ke instance YT.Player
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player || !isPlayerReady || !currentTrack) return;

    if (loadedVideoIdRef.current !== currentTrack.youtube_video_id) {
      loadedVideoIdRef.current = currentTrack.youtube_video_id;
      if (isPlaying) {
        player.loadVideoById(currentTrack.youtube_video_id);
      } else {
        player.cueVideoById(currentTrack.youtube_video_id);
      }
    }
  }, [currentTrack, isPlayerReady, isPlaying]);

  // Sinkronkan Volume & Mute
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player || !isPlayerReady) return;
    if (isMuted) {
      player.mute();
    } else {
      player.unMute();
      player.setVolume(volume);
    }
  }, [volume, isMuted, isPlayerReady]);

  // Interval pembaruan progress bar durasi lagu
  useEffect(() => {
    if (!isPlaying || !isPlayerReady || isSeeking) return;
    const timer = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player) return;
      const cur = player.getCurrentTime();
      const dur = player.getDuration();
      if (Number.isFinite(cur)) setCurrentTime(cur);
      if (Number.isFinite(dur) && dur > 0) setDuration(dur);
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying, isPlayerReady, isSeeking]);

  function togglePlayPause() {
    const player = ytPlayerRef.current;
    if (!player || !isPlayerReady || !currentTrack) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      if (loadedVideoIdRef.current !== currentTrack.youtube_video_id) {
        loadedVideoIdRef.current = currentTrack.youtube_video_id;
        player.loadVideoById(currentTrack.youtube_video_id);
      } else {
        player.playVideo();
      }
      setIsPlaying(true);
    }
  }

  function handleShufflePlay() {
    setPlayerError(null);
    const pool = visibleTracks.length > 0 ? visibleTracks : tracks;
    if (pool.length === 0) return;
    setIsShuffle(true);
    const randomTrack = pool[Math.floor(Math.random() * pool.length)];
    setCurrentTrackId(randomTrack.id);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function cycleRepeatMode() {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsSeeking(true);
    setCurrentTime(Number(e.target.value));
  }

  function handleSeekCommit(e: React.SyntheticEvent<HTMLInputElement>) {
    const targetTime = Number((e.target as HTMLInputElement).value);
    setIsSeeking(false);
    if (ytPlayerRef.current && isPlayerReady) {
      ytPlayerRef.current.seekTo(targetTime, true);
    }
  }

  if (checkingAuth || loadingLibrary) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Memuat ruang musik pribadi...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Ruang Pribadi
        </span>
        <h1 className="text-base font-black text-slate-900 dark:text-white">
          Akses Terbatas — Khusus Pemilik Platform
        </h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Halaman pemutar musik pribadi ini hanya dapat diakses oleh akun administrator TheoQED.
        </p>
        <Link
          href="/"
          className="mt-1 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const currentCoverUrl = currentTrack ? getTrackCoverUrl(currentTrack) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col pb-28 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/sanctuary"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Sanctuary</span>
            </Link>

            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-900 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Music Deck
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lagu, artis, atau album..."
              className="w-full h-8 pl-8 pr-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sanctuary/music/manage"
              className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Kelola Koleksi</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition cursor-pointer"
            >
              {isDark ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR: NOW PLAYING STAGE + ROOT & PLAYLIST */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Kartu Stage Pemutar YouTube dengan Dropdown Lipat */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4">
            {/* Header Kartu + Tombol Dropdown */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Sedang Diputar
                </span>
                {isPlaying && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowVideoStage((prev) => !prev)}
                aria-expanded={showVideoStage}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <span>{showVideoStage ? 'Tutup Video' : 'Video'}</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showVideoStage ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Info Lagu + Cover Mini (Tampil saat Dropdown Video Tertutup) */}
            {currentTrack && !showVideoStage && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                  {currentCoverUrl && (
                    <img
                      src={currentCoverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentTrack.artist} · {currentTrack.album}
                  </div>
                </div>
              </div>
            )}

            {/* Wadah Dropdown YouTube (Tetap ter-render di DOM agar audio tidak berhenti) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showVideoStage
                  ? 'max-h-72 opacity-100 mt-3'
                  : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <div className="relative w-full aspect-video min-h-[190px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <div ref={playerContainerRef} className="w-full h-full" />
                {tracks.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                    <span>Tambahkan tautan YouTube di Kelola Koleksi</span>
                  </div>
                )}
              </div>

              {currentTrack && (
                <div className="space-y-0.5 pt-2.5">
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentTrack.artist} · {currentTrack.album}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigasi Root & Playlist */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Perpustakaan Root
              </div>

              <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedView('all')}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedView === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>Semua Lagu (Root)</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      selectedView === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tracks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedView('unassigned')}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedView === 'unassigned'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>Belum Masuk Playlist</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      selectedView === 'unassigned'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {unassignedCount}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Playlist ({playlists.length})
                </span>
                <Link
                  href="/sanctuary/music/manage"
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Kurasi
                </Link>
              </div>

              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {playlists.map((pl) => {
                  const count = links.filter((l) => l.playlist_id === pl.id).length;
                  const active = selectedView === pl.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setSelectedView(pl.id)}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="truncate">{pl.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* KONTEN UTAMA: HERO & DAFTAR TREK */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-5">
          {playerError && (
            <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">{playerError}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/sanctuary/music/manage"
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500 transition"
                >
                  Ganti Link
                </Link>
                <button
                  type="button"
                  onClick={playNextTrack}
                  className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900 font-bold hover:opacity-80 transition cursor-pointer"
                >
                  Lagu Berikutnya
                </button>
              </div>
            </div>
          )}

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-500 to-teal-700 shadow-xl border border-white/10 flex items-center justify-center">
              {activeCollection.coverUrl ? (
                <img
                  src={activeCollection.coverUrl}
                  alt={activeCollection.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-16 h-16 text-white/85"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                {activeCollection.badge}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white truncate">
                {activeCollection.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {activeCollection.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  disabled={visibleTracks.length === 0}
                  onClick={() => visibleTracks[0] && handleSelectTrack(visibleTracks[0])}
                  className="h-10 px-5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-black inline-flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Putar Semua ({visibleTracks.length})</span>
                </button>

                <button
                  type="button"
                  disabled={visibleTracks.length === 0}
                  onClick={handleShufflePlay}
                  className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                  <span>Putar Acak</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Daftar Lagu */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {visibleTracks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada lagu di tampilan ini
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tempel tautan YouTube atau YouTube Music ke Root melalui halaman Kelola Koleksi.
                </p>
                <Link
                  href="/sanctuary/music/manage"
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Buka Pengelola Koleksi</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 pl-5 pr-2 w-12 text-center">#</th>
                      <th className="py-3.5 px-3">Judul &amp; Artis</th>
                      <th className="py-3.5 px-3 hidden md:table-cell">Album</th>
                      <th className="py-3.5 pl-3 pr-5 hidden sm:table-cell text-right">Playlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {visibleTracks.map((track, idx) => {
                      const active = currentTrack?.id === track.id;
                      const thumbUrl = getTrackCoverUrl(track);
                      const memberPlaylists = trackPlaylistsMap.get(track.id) || [];

                      return (
                        <tr
                          key={track.id}
                          onClick={() => handleSelectTrack(track)}
                          className={`group transition-colors cursor-pointer ${
                            active
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 pl-5 pr-2 text-center font-mono font-bold">
                            {active && isPlaying ? (
                              <svg
                                className="w-3.5 h-3.5 mx-auto text-emerald-600 dark:text-emerald-400 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <rect x="6" y="5" width="4" height="14" rx="1" />
                                <rect x="14" y="5" width="4" height="14" rx="1" />
                              </svg>
                            ) : active ? (
                              <svg
                                className="w-3.5 h-3.5 mx-auto text-emerald-600 dark:text-emerald-400 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white">
                                {idx + 1}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                                <img
                                  src={thumbUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="min-w-0">
                                <div
                                  className={`font-bold text-xs sm:text-sm truncate ${
                                    active
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {track.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {track.artist}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden md:table-cell truncate max-w-44">
                            {track.album}
                          </td>

                          <td className="py-3 pl-3 pr-5 hidden sm:table-cell text-right">
                            {memberPlaylists.length === 0 ? (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-400">
                                Root Only
                              </span>
                            ) : (
                              <div className="inline-flex flex-wrap justify-end gap-1 max-w-52">
                                {memberPlaylists.map((pl) => (
                                  <span
                                    key={pl.id}
                                    className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-900 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                                  >
                                    {pl.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BOTTOM DOCKED PLAYER BAR */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Kiri: Info Lagu Aktif */}
          <div className="flex items-center gap-3 w-full md:w-72 shrink-0 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
              {currentCoverUrl ? (
                <img src={currentCoverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {currentTrack ? currentTrack.title : 'Belum ada lagu dipilih'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {currentTrack
                  ? `${currentTrack.artist} · ${currentTrack.album}`
                  : 'Pilih lagu dari daftar untuk memutar'}
              </div>
            </div>
          </div>

          {/* Tengah: Kontrol Pemutar & Timeline */}
          <div className="flex-1 w-full max-w-xl flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              {/* Shuffle */}
              <button
                type="button"
                onClick={() => setIsShuffle((prev) => !prev)}
                title="Acak (Shuffle)"
                aria-label="Acak"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isShuffle
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
              </button>

              {/* Previous */}
              <button
                type="button"
                onClick={playPrevTrack}
                disabled={!currentTrack}
                title="Lagu Sebelumnya"
                aria-label="Lagu Sebelumnya"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={!currentTrack || !isPlayerReady}
                title={isPlaying ? 'Jeda' : 'Putar'}
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
                className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:scale-105 disabled:opacity-30 inline-flex items-center justify-center transition cursor-pointer"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={playNextTrack}
                disabled={!currentTrack}
                title="Lagu Berikutnya"
                aria-label="Lagu Berikutnya"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
                </svg>
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={cycleRepeatMode}
                title={`Mode Ulang: ${repeatMode}`}
                aria-label="Mode Ulang"
                className={`relative p-1.5 rounded-lg transition cursor-pointer ${
                  repeatMode !== 'off'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 2l4 4-4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v-1a4 4 0 014-4h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 22l-4-4 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v1a4 4 0 01-4 4H3" />
                </svg>
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Scrubber / Progress Timeline */}
            <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-slate-400">
              <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                disabled={!currentTrack || !duration}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                aria-label="Posisi lagu"
                className="flex-1 h-1 accent-emerald-500 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="w-8 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Kanan: Kontrol Volume */}
          <div className="hidden md:flex items-center justify-end gap-2 w-48 shrink-0">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? 'Bunyikan' : 'Bisukan'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07m2.83-9.9a9 9 0 010 12.73" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                setVolume(Number(e.target.value));
              }}
              aria-label="Volume"
              className="w-24 h-1 accent-emerald-500 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}