'use client';

import React, { useState, useEffect } from 'react';

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  audioDriveId: string;
  coverDriveId: string | null;
}

function extractDriveId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Cocokkan format /d/FILE_ID/
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  // Cocokkan format ?id=FILE_ID atau &id=FILE_ID
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch?.[1]) return queryMatch[1];

  // Jika pengguna langsung menempelkan ID mentah
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;

  return null;
}

export default function SanctuaryMusicPlayer() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [playerEngine, setPlayerEngine] = useState<'embed' | 'native'>('embed');
  const [coverErrorIds, setCoverErrorIds] = useState<Record<string, boolean>>({});

  // Form tambah lagu
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theo_sanctuary_playlist');
      if (saved) {
        const parsed = JSON.parse(saved) as TrackItem[];
        setTracks(parsed);
        if (parsed.length > 0) {
          setActiveTrackId(parsed[0].id);
        }
      }
    } catch {
      // Abaikan jika storage tidak tersedia
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('theo_sanctuary_playlist', JSON.stringify(tracks));
    } catch {
      // Abaikan
    }
  }, [tracks]);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;

  function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const audioId = extractDriveId(audioUrl);
    if (!audioId) {
      setFormError('Link Google Drive audio tidak valid. Pastikan berisi ID file.');
      return;
    }

    const coverId = coverUrl.trim() ? extractDriveId(coverUrl) : null;
    if (coverUrl.trim() && !coverId) {
      setFormError('Link Google Drive gambar cover tidak valid.');
      return;
    }

    const newTrack: TrackItem = {
      id: `${Date.now()}`,
      title: title.trim() || 'Trek Tanpa Judul',
      artist: artist.trim() || 'Koleksi Pribadi',
      audioDriveId: audioId,
      coverDriveId: coverId,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setActiveTrackId(newTrack.id);
    setTitle('');
    setArtist('');
    setAudioUrl('');
    setCoverUrl('');
    setShowAddForm(false);
  }

  function handleDeleteTrack(id: string) {
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTrackId === id) {
        setActiveTrackId(filtered[0]?.id || null);
      }
      return filtered;
    });
  }

  function playNextTrack() {
    if (tracks.length <= 1 || !activeTrack) return;
    const idx = tracks.findIndex((t) => t.id === activeTrack.id);
    const nextIdx = (idx + 1) % tracks.length;
    setActiveTrackId(tracks[nextIdx].id);
  }

  function playPrevTrack() {
    if (tracks.length <= 1 || !activeTrack) return;
    const idx = tracks.findIndex((t) => t.id === activeTrack.id);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    setActiveTrackId(tracks[prevIdx].id);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
      {/* Header Widget */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Personal Audio Deck
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTrack && (
            <button
              type="button"
              onClick={() =>
                setPlayerEngine((prev) => (prev === 'embed' ? 'native' : 'embed'))
              }
              title="Ganti mode pemutar jika audio tidak berbunyi atau ingin auto-next"
              className="h-7 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            >
              {playerEngine === 'embed' ? 'Mode: Drive Embed' : 'Mode: Auto-Next'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition cursor-pointer"
          >
            {showAddForm ? 'Tutup' : '+ Tambah Lagu'}
          </button>
        </div>
      </div>

      {/* Form Tambah Lagu dari Link Google Drive */}
      {showAddForm && (
        <form
          onSubmit={handleAddTrack}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold mb-1">Judul Lagu / Audio *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rainy Night Study Lo-Fi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Artis / Suasana</label>
              <input
                type="text"
                placeholder="Contoh: Instrumental Fokus"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Link Google Drive Audio (MP3/M4A) *</label>
            <input
              type="text"
              required
              placeholder="https://drive.google.com/file/d/1ABC.../view?usp=sharing"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">
              Link Google Drive Cover Album (Opsional)
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/file/d/1XYZ.../view?usp=sharing"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
            />
          </div>

          {formError && <p className="text-rose-600 font-semibold">{formError}</p>}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              Pastikan akses file Drive diatur ke &ldquo;Siapa saja yang memiliki link&rdquo;.
            </span>
            <button
              type="submit"
              className="h-8 px-4 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
            >
              Simpan ke Playlist
            </button>
          </div>
        </form>
      )}

      {/* Kartu Now Playing (Spotify Style) */}
      {activeTrack ? (
        <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 space-y-3.5">
          <div className="flex items-center gap-3.5">
            {/* Album Art */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-800 flex items-center justify-center border border-white/10">
              {activeTrack.coverDriveId && !coverErrorIds[activeTrack.id] ? (
                <img
                  src={`https://drive.google.com/thumbnail?id=${activeTrack.coverDriveId}&sz=w800`}
                  alt={activeTrack.title}
                  onError={() =>
                    setCoverErrorIds((prev) => ({ ...prev, [activeTrack.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-7 h-7 text-white/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
              )}
            </div>

            {/* Info Trek & Tombol Prev/Next */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white truncate">{activeTrack.title}</div>
              <div className="text-xs text-slate-400 truncate">{activeTrack.artist}</div>

              {tracks.length > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={playPrevTrack}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition cursor-pointer"
                  >
                    ⏮ Prev
                  </button>
                  <button
                    type="button"
                    onClick={playNextTrack}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition cursor-pointer"
                  >
                    Next ⏭
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pemutar Audio */}
          {playerEngine === 'embed' ? (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                key={activeTrack.audioDriveId}
                src={`https://drive.google.com/file/d/${activeTrack.audioDriveId}/preview`}
                className="w-full h-16 border-0"
                allow="autoplay"
                title={activeTrack.title}
              />
            </div>
          ) : (
            <audio
              key={activeTrack.audioDriveId}
              controls
              autoPlay
              onEnded={playNextTrack}
              src={`https://docs.google.com/uc?export=open&id=${activeTrack.audioDriveId}`}
              className="w-full h-10 rounded-lg"
            />
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Playlist Pribadi Masih Kosong
          </p>
          <p className="text-[11px] text-slate-400">
            Klik <strong>+ Tambah Lagu</strong> lalu tempel link MP3 dan gambar cover dari Google Drive.
          </p>
        </div>
      )}

      {/* Daftar Antrean Lagu */}
      {tracks.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {tracks.map((track, index) => {
            const isCurrent = activeTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => setActiveTrackId(track.id)}
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition ${
                  isCurrent
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-950 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-4 text-[11px] font-mono font-bold text-slate-400 text-center shrink-0">
                    {isCurrent ? '▶' : index + 1}
                  </span>

                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                    {track.coverDriveId && !coverErrorIds[track.id] ? (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${track.coverDriveId}&sz=w200`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">♪</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{track.artist}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrack(track.id);
                  }}
                  title="Hapus dari playlist"
                  className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}