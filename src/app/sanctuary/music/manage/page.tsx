'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  PlaylistItem,
  TrackItem,
  PlaylistTrackLink,
  extractYouTubeId,
  getYouTubeThumbnailUrl,
  getTrackCoverUrl,
} from '@/lib/sanctuary-music';

type ManageTab = 'root' | 'playlists';

export default function SanctuaryMusicManagePage() {
  const supabase = useMemo(() => createClient(), []);

  // Auth & Theme
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Data
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [links, setLinks] = useState<PlaylistTrackLink[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState<ManageTab>('root');
  const [statusMessage, setStatusMessage] = useState('');

  // ================= TAB 1 STATE: MASTER LAGU (ROOT) =================
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [trYoutubeUrl, setTrYoutubeUrl] = useState('');
  const [trTitle, setTrTitle] = useState('');
  const [trArtist, setTrArtist] = useState('');
  const [trAlbum, setTrAlbum] = useState('');
  const [trCustomCoverUrl, setTrCustomCoverUrl] = useState('');
  const [trSelectedPlaylistIds, setTrSelectedPlaylistIds] = useState<string[]>([]);
  const [trError, setTrError] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);

  const [rootFilter, setRootFilter] = useState<'all' | 'unassigned'>('all');
  const [rootSearch, setRootSearch] = useState('');

  // ================= TAB 2 STATE: PLAYLIST & KURASI =================
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [plName, setPlName] = useState('');
  const [plDesc, setPlDesc] = useState('');
  const [plCoverYoutubeUrl, setPlCoverYoutubeUrl] = useState('');
  const [plError, setPlError] = useState('');
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [curateSearch, setCurateSearch] = useState('');

  const loadLibrary = useCallback(async () => {
    setLoadingData(true);
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

    if (fetchedPlaylists.length > 0) {
      setSelectedPlaylistId((prev) =>
        prev && fetchedPlaylists.some((p) => p.id === prev) ? prev : fetchedPlaylists[0].id
      );
    } else {
      setSelectedPlaylistId(null);
    }

    setLoadingData(false);
  }, [supabase]);

  useEffect(() => {
    async function verifyAdmin() {
      setCheckingAuth(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAdmin(false);
        setCheckingAuth(false);
        setLoadingData(false);
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

      if (adminStatus) {
        await loadLibrary();
      } else {
        setLoadingData(false);
      }
    }

    verifyAdmin();
  }, [supabase, loadLibrary]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function notify(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 2500);
  }

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

  // ================= AUTO-FETCH METADATA YOUTUBE (oEmbed) =================
  async function handleFetchYouTubeMeta(rawUrl: string) {
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      setTrError('Tautan YouTube atau YouTube Music tidak valid.');
      return;
    }

    setTrError('');
    setFetchingMeta(true);
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`;
      const res = await fetch(oembedUrl);
      if (!res.ok) {
        setTrError('Metadata tidak dapat diambil otomatis (video mungkin membatasi oEmbed), silakan isi judul secara manual.');
        setFetchingMeta(false);
        return;
      }
      const data = (await res.json()) as { title?: string; author_name?: string };
      if (data.title) setTrTitle(data.title);
      if (data.author_name) {
        setTrArtist(data.author_name.replace(/\s*-\s*Topic$/i, '').trim());
      }
      if (!trAlbum.trim()) {
        setTrAlbum('YouTube Music');
      }
      notify('Judul & artis diambil otomatis');
    } catch {
      setTrError('Gagal mengambil metadata YouTube, silakan isi manual.');
    } finally {
      setFetchingMeta(false);
    }
  }

  // ================= HANDLER MASTER LAGU (ROOT) =================
  function resetTrackForm() {
    setEditingTrackId(null);
    setTrYoutubeUrl('');
    setTrTitle('');
    setTrArtist('');
    setTrAlbum('');
    setTrCustomCoverUrl('');
    setTrSelectedPlaylistIds([]);
    setTrError('');
  }

  function toggleTrackPlaylistCheckbox(plId: string) {
    setTrSelectedPlaylistIds((prev) =>
      prev.includes(plId) ? prev.filter((id) => id !== plId) : [...prev, plId]
    );
  }

  async function handleSaveTrack(e: React.FormEvent) {
    e.preventDefault();
    setTrError('');

    const videoId = extractYouTubeId(trYoutubeUrl);
    if (!videoId) {
      setTrError('Link YouTube / YouTube Music tidak valid. Pastikan berisi ID video 11 karakter.');
      return;
    }

    setSavingTrack(true);

    if (editingTrackId) {
      const { error } = await supabase
        .from('sanctuary_tracks')
        .update({
          title: trTitle.trim() || 'Trek Tanpa Judul',
          artist: trArtist.trim() || 'Artis Tidak Diketahui',
          album: trAlbum.trim() || 'YouTube',
          youtube_video_id: videoId,
          custom_cover_url: trCustomCoverUrl.trim() || null,
        })
        .eq('id', editingTrackId);

      if (error) {
        setSavingTrack(false);
        setTrError(error.message);
        return;
      }

      await supabase
        .from('sanctuary_playlist_tracks')
        .delete()
        .eq('track_id', editingTrackId);

      if (trSelectedPlaylistIds.length > 0) {
        await supabase.from('sanctuary_playlist_tracks').insert(
          trSelectedPlaylistIds.map((plId) => ({
            playlist_id: plId,
            track_id: editingTrackId,
          }))
        );
      }

      setSavingTrack(false);
      notify('Lagu di Root diperbarui');
    } else {
      const { data: insertedTrack, error } = await supabase
        .from('sanctuary_tracks')
        .insert({
          title: trTitle.trim() || 'Trek Tanpa Judul',
          artist: trArtist.trim() || 'Artis Tidak Diketahui',
          album: trAlbum.trim() || 'YouTube',
          youtube_video_id: videoId,
          custom_cover_url: trCustomCoverUrl.trim() || null,
          sort_order: tracks.length + 1,
        })
        .select('id')
        .single();

      if (error || !insertedTrack) {
        setSavingTrack(false);
        setTrError(error?.message || 'Gagal menyimpan lagu ke Root.');
        return;
      }

      if (trSelectedPlaylistIds.length > 0) {
        await supabase.from('sanctuary_playlist_tracks').insert(
          trSelectedPlaylistIds.map((plId) => ({
            playlist_id: plId,
            track_id: insertedTrack.id,
          }))
        );
      }

      setSavingTrack(false);
      notify('Lagu ditambahkan ke Root');
    }

    resetTrackForm();
    await loadLibrary();
  }

  function startEditTrack(track: TrackItem) {
    setEditingTrackId(track.id);
    setTrYoutubeUrl(`https://www.youtube.com/watch?v=${track.youtube_video_id}`);
    setTrTitle(track.title);
    setTrArtist(track.artist);
    setTrAlbum(track.album);
    setTrCustomCoverUrl(track.custom_cover_url || '');
    const currentPlIds = links
      .filter((l) => l.track_id === track.id)
      .map((l) => l.playlist_id);
    setTrSelectedPlaylistIds(currentPlIds);
    setTrError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteTrackFromRoot(track: TrackItem) {
    const { error } = await supabase
      .from('sanctuary_tracks')
      .delete()
      .eq('id', track.id);

    if (error) {
      setTrError(error.message);
      return;
    }

    if (editingTrackId === track.id) resetTrackForm();
    notify(`"${track.title}" dihapus dari Root`);
    await loadLibrary();
  }

  // ================= HANDLER PLAYLIST & KURASI =================
  function resetPlaylistForm() {
    setEditingPlaylistId(null);
    setPlName('');
    setPlDesc('');
    setPlCoverYoutubeUrl('');
    setPlError('');
  }

  async function handleSavePlaylist(e: React.FormEvent) {
    e.preventDefault();
    setPlError('');

    const name = plName.trim();
    if (!name) return;

    const coverVideoId = plCoverYoutubeUrl.trim()
      ? extractYouTubeId(plCoverYoutubeUrl)
      : null;

    if (plCoverYoutubeUrl.trim() && !coverVideoId) {
      setPlError('Link YouTube untuk sampul playlist tidak valid.');
      return;
    }

    setSavingPlaylist(true);

    if (editingPlaylistId) {
      const { error } = await supabase
        .from('sanctuary_playlists')
        .update({
          name,
          description: plDesc.trim() || 'Koleksi playlist pribadi.',
          cover_youtube_id: coverVideoId,
        })
        .eq('id', editingPlaylistId);

      setSavingPlaylist(false);
      if (error) {
        setPlError(error.message);
        return;
      }
      notify('Playlist diperbarui');
    } else {
      const { data, error } = await supabase
        .from('sanctuary_playlists')
        .insert({
          name,
          description: plDesc.trim() || 'Koleksi playlist pribadi.',
          cover_youtube_id: coverVideoId,
          sort_order: playlists.length + 1,
        })
        .select('id')
        .single();

      setSavingPlaylist(false);
      if (error) {
        setPlError(error.message);
        return;
      }
      if (data?.id) {
        setSelectedPlaylistId(data.id);
      }
      notify('Playlist baru dibuat');
    }

    resetPlaylistForm();
    await loadLibrary();
  }

  function startEditPlaylist(pl: PlaylistItem) {
    setEditingPlaylistId(pl.id);
    setPlName(pl.name);
    setPlDesc(pl.description);
    setPlCoverYoutubeUrl(
      pl.cover_youtube_id ? `https://www.youtube.com/watch?v=${pl.cover_youtube_id}` : ''
    );
    setPlError('');
  }

  async function handleDeletePlaylist(pl: PlaylistItem) {
    const { error } = await supabase
      .from('sanctuary_playlists')
      .delete()
      .eq('id', pl.id);

    if (error) {
      setPlError(error.message);
      return;
    }

    if (editingPlaylistId === pl.id) resetPlaylistForm();
    notify(`Playlist "${pl.name}" dihapus (lagu tetap aman di Root)`);
    await loadLibrary();
  }

  async function handleAddTrackToSelectedPlaylist(trackId: string) {
    if (!selectedPlaylistId) return;
    const { error } = await supabase.from('sanctuary_playlist_tracks').insert({
      playlist_id: selectedPlaylistId,
      track_id: trackId,
    });

    if (!error) {
      notify('Ditambahkan ke playlist');
      await loadLibrary();
    }
  }

  async function handleRemoveTrackFromSelectedPlaylist(trackId: string) {
    if (!selectedPlaylistId) return;
    const { error } = await supabase
      .from('sanctuary_playlist_tracks')
      .delete()
      .eq('playlist_id', selectedPlaylistId)
      .eq('track_id', trackId);

    if (!error) {
      notify('Dikeluarkan dari playlist (tetap ada di Root)');
      await loadLibrary();
    }
  }

  const filteredRootTracks = useMemo(() => {
    const q = rootSearch.trim().toLowerCase();
    return tracks.filter((t) => {
      const isUnassigned = !(trackPlaylistsMap.get(t.id)?.length);
      if (rootFilter === 'unassigned' && !isUnassigned) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    });
  }, [tracks, rootFilter, rootSearch, trackPlaylistsMap]);

  const activePlaylistObj = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) || null,
    [playlists, selectedPlaylistId]
  );

  const { tracksInSelectedPlaylist, availableRootTracksForPlaylist } = useMemo(() => {
    if (!selectedPlaylistId) {
      return { tracksInSelectedPlaylist: [], availableRootTracksForPlaylist: [] };
    }

    const memberIds = new Set(
      links.filter((l) => l.playlist_id === selectedPlaylistId).map((l) => l.track_id)
    );

    const q = curateSearch.trim().toLowerCase();
    const inPl = tracks.filter((t) => memberIds.has(t.id));
    const available = tracks.filter((t) => {
      if (memberIds.has(t.id)) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    });

    return {
      tracksInSelectedPlaylist: inPl,
      availableRootTracksForPlaylist: available,
    };
  }, [selectedPlaylistId, links, tracks, curateSearch]);

  const detectedVideoId = extractYouTubeId(trYoutubeUrl);
  const previewThumbUrl =
    trCustomCoverUrl.trim() ||
    (detectedVideoId ? getYouTubeThumbnailUrl(detectedVideoId) : null);

  if (checkingAuth || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Memuat pengelola koleksi...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-base font-black text-slate-900 dark:text-white">
          Akses Terbatas — Khusus Pemilik Platform
        </h1>
        <Link
          href="/"
          className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/sanctuary/music"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Pemutar</span>
            </Link>

            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-900 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Kelola Koleksi
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {statusMessage && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {statusMessage}
              </span>
            )}

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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTab('root')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'root'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>1. Master Lagu (Root)</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'root'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tracks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('playlists')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'playlists'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>2. Playlist &amp; Kurasi Lagu</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'playlists'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {playlists.length}
              </span>
            </button>
          </div>

          <p className="hidden md:block pr-3 text-[11px] text-slate-400">
            Mendukung tautan dari <strong>youtube.com</strong>, <strong>music.youtube.com</strong>, maupun <strong>youtu.be</strong>.
          </p>
        </div>

        {/* ================= TAB 1: MASTER LAGU (ROOT) ================= */}
        {activeTab === 'root' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Tambah / Edit Lagu di Root */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingTrackId ? 'Edit Master Lagu' : 'Tambah Lagu ke Root'}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Tempel link YouTube atau YouTube Music untuk menarik cover otomatis.
                  </p>
                </div>

                {editingTrackId && (
                  <button
                    type="button"
                    onClick={resetTrackForm}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveTrack} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold">Link YouTube / YT Music *</label>
                    {detectedVideoId && (
                      <button
                        type="button"
                        disabled={fetchingMeta}
                        onClick={() => handleFetchYouTubeMeta(trYoutubeUrl)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {fetchingMeta ? 'Mengambil info...' : 'Ambil Info Otomatis'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://music.youtube.com/watch?v=... atau https://youtu.be/..."
                    value={trYoutubeUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTrYoutubeUrl(val);
                      if (!trTitle.trim() && extractYouTubeId(val)) {
                        handleFetchYouTubeMeta(val);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                  />
                </div>

                {/* Pratinjau Thumbnail Otomatis */}
                {previewThumbUrl && (
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                    <img
                      src={previewThumbUrl}
                      alt="Pratinjau thumbnail"
                      className="w-16 h-11 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                    />
                    <div className="min-w-0 text-[11px]">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        Video ID terdeteksi: {detectedVideoId}
                      </div>
                      <div className="text-slate-400 truncate">
                        Cover album otomatis menggunakan thumbnail YouTube
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Judul Lagu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: On My Way"
                      value={trTitle}
                      onChange={(e) => setTrTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Artis / Kanal</label>
                    <input
                      type="text"
                      placeholder="Contoh: Alan Walker"
                      value={trArtist}
                      onChange={(e) => setTrArtist(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Album / Kategori</label>
                    <input
                      type="text"
                      placeholder="Contoh: Walker World"
                      value={trAlbum}
                      onChange={(e) => setTrAlbum(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Custom Cover URL (Opsional)</label>
                    <input
                      type="url"
                      placeholder="Kosongkan untuk pakai thumbnail YT"
                      value={trCustomCoverUrl}
                      onChange={(e) => setTrCustomCoverUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]"
                    />
                  </div>
                </div>

                {/* Opsional: Langsung masukkan ke playlist saat input */}
                {playlists.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <label className="block font-bold text-slate-600 dark:text-slate-300">
                      Masukkan ke Playlist (Opsional)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {playlists.map((pl) => {
                        const checked = trSelectedPlaylistIds.includes(pl.id);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => toggleTrackPlaylistCheckbox(pl.id)}
                            className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
                            }`}
                          >
                            {pl.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {trError && <p className="text-rose-600 font-semibold">{trError}</p>}

                <button
                  type="submit"
                  disabled={savingTrack}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition cursor-pointer"
                >
                  {savingTrack
                    ? 'Menyimpan...'
                    : editingTrackId
                    ? 'Simpan Perubahan Lagu'
                    : 'Simpan ke Root'}
                </button>
              </form>
            </section>

            {/* Daftar Master Lagu di Root */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRootFilter('all')}
                    className={`h-7 px-3 rounded-lg transition cursor-pointer ${
                      rootFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Semua Root ({tracks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRootFilter('unassigned')}
                    className={`h-7 px-3 rounded-lg transition cursor-pointer ${
                      rootFilter === 'unassigned'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Belum di Playlist
                  </button>
                </div>

                <input
                  type="text"
                  value={rootSearch}
                  onChange={(e) => setRootSearch(e.target.value)}
                  placeholder="Cari judul atau artis..."
                  className="h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-52"
                />
              </div>

              {filteredRootTracks.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Belum ada lagu di Root pada filter ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
                  {filteredRootTracks.map((track) => {
                    const thumbUrl = getTrackCoverUrl(track);
                    const memberPlaylists = trackPlaylistsMap.get(track.id) || [];

                    return (
                      <div
                        key={track.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                            <img
                              src={thumbUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {track.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="truncate">{track.artist}</span>
                              {memberPlaylists.map((pl) => (
                                <span
                                  key={pl.id}
                                  className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/70 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"
                                >
                                  {pl.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditTrack(track)}
                            title="Edit lagu"
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTrackFromRoot(track)}
                            title="Hapus permanen dari Root"
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= TAB 2: PLAYLIST & KURASI LAGU ================= */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Form & Daftar Playlist */}
            <section className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingPlaylistId ? 'Edit Playlist' : 'Buat Playlist Baru'}
                  </h2>
                  {editingPlaylistId && (
                    <button
                      type="button"
                      onClick={resetPlaylistForm}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSavePlaylist} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Nama Playlist *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Matematika & Koding Malam"
                      value={plName}
                      onChange={(e) => setPlName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Deskripsi Singkat</label>
                    <input
                      type="text"
                      placeholder="Keterangan suasana playlist..."
                      value={plDesc}
                      onChange={(e) => setPlDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      Link YouTube untuk Sampul Playlist (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Kosongkan untuk pakai cover lagu pertama di playlist"
                      value={plCoverYoutubeUrl}
                      onChange={(e) => setPlCoverYoutubeUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                    />
                  </div>

                  {plError && <p className="text-rose-600 font-semibold">{plError}</p>}

                  <button
                    type="submit"
                    disabled={savingPlaylist}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition cursor-pointer"
                  >
                    {savingPlaylist
                      ? 'Menyimpan...'
                      : editingPlaylistId
                      ? 'Simpan Perubahan Playlist'
                      : 'Buat Playlist'}
                  </button>
                </form>
              </div>

              {/* Pilih Playlist untuk Dikurasi */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Pilih Playlist untuk Diisi ({playlists.length})
                </div>

                {playlists.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Belum ada playlist. Buat playlist pertamamu di atas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((pl) => {
                      const count = links.filter((l) => l.playlist_id === pl.id).length;
                      const isSelected = selectedPlaylistId === pl.id;
                      const coverUrl = getYouTubeThumbnailUrl(pl.cover_youtube_id);

                      return (
                        <div
                          key={pl.id}
                          onClick={() => setSelectedPlaylistId(pl.id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg
                                  className="w-4 h-4 text-slate-400"
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

                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {pl.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {count} lagu
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditPlaylist(pl);
                              }}
                              title="Edit playlist"
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlaylist(pl);
                              }}
                              title="Hapus playlist"
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Kolom Kanan: Kurasi Isi Playlist Terpilih */}
            <section className="lg:col-span-7 space-y-5">
              {activePlaylistObj ? (
                <>
                  {/* Kartu 1: Lagu di dalam Playlist Terpilih */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Isi Playlist Terpilih
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {activePlaylistObj.name} ({tracksInSelectedPlaylist.length} lagu)
                        </h3>
                      </div>
                    </div>

                    {tracksInSelectedPlaylist.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        Playlist ini masih kosong. Pilih lagu dari daftar Root di bawah untuk memasukkannya.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {tracksInSelectedPlaylist.map((track) => (
                          <div
                            key={track.id}
                            className="p-3 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/60 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={getTrackCoverUrl(track)}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                  {track.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {track.artist} · {track.album}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTrackFromSelectedPlaylist(track.id)}
                              className="h-7 px-2.5 rounded-lg border border-rose-200 dark:border-rose-900/70 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shrink-0 cursor-pointer"
                            >
                              Keluarkan
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kartu 2: Ambil Lagu dari Root */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Tambahkan Lagu dari Root ({availableRootTracksForPlaylist.length})
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Lagu yang sama juga bisa dimasukkan ke playlist lainnya.
                        </p>
                      </div>

                      <input
                        type="text"
                        value={curateSearch}
                        onChange={(e) => setCurateSearch(e.target.value)}
                        placeholder="Cari lagu di Root..."
                        className="h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-48"
                      />
                    </div>

                    {availableRootTracksForPlaylist.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        Semua lagu di Root sudah masuk ke playlist ini atau belum ada lagu di Root.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {availableRootTracksForPlaylist.map((track) => (
                          <div
                            key={track.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={getTrackCoverUrl(track)}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                  {track.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {track.artist} · {track.album}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddTrackToSelectedPlaylist(track.id)}
                              className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 transition shrink-0 cursor-pointer"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Masukkan</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
                  Buat atau pilih salah satu playlist di sebelah kiri untuk mulai mengisi lagu dari Root.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}