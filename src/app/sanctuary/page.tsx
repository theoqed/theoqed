'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type TimerMode = 'pomodoro' | 'deep' | 'short_break' | 'long_break';
type SessionCategory = 'Kuliah' | 'Mengajar' | 'Coding' | 'Riset';

interface TimerPreset {
  id: TimerMode;
  label: string;
  minutes: number;
  isFocus: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  category: SessionCategory;
  completed: boolean;
  createdAt: string;
}

interface CompletedSession {
  id: string;
  category: SessionCategory;
  taskTitle: string | null;
  minutes: number;
  finishedAt: string;
}

const TIMER_PRESETS: Record<TimerMode, TimerPreset> = {
  pomodoro: { id: 'pomodoro', label: 'Fokus 25m', minutes: 25, isFocus: true },
  deep: { id: 'deep', label: 'Deep Work 50m', minutes: 50, isFocus: true },
  short_break: { id: 'short_break', label: 'Istirahat 5m', minutes: 5, isFocus: false },
  long_break: { id: 'long_break', label: 'Istirahat 15m', minutes: 15, isFocus: false },
};

const CATEGORIES: SessionCategory[] = ['Kuliah', 'Mengajar', 'Coding', 'Riset'];

const CATEGORY_STYLES: Record<SessionCategory, string> = {
  Kuliah: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900',
  Mengajar: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900',
  Coding: 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-900',
  Riset: 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900',
};

const SCRATCHPAD_TABS = [
  { id: 'general', label: 'Catatan Utama' },
  { id: 'math', label: 'Ide & Soal' },
  { id: 'weekly', label: 'Rencana Minggu Ini' },
] as const;

type ScratchpadTabId = (typeof SCRATCHPAD_TABS)[number]['id'];

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatSeconds(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PersonalSanctuaryPage() {
  const supabase = useMemo(() => createClient(), []);

  // Auth Gate
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Theme & Clock
  const [isDark, setIsDark] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');

  // Pomodoro State
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(TIMER_PRESETS.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SessionCategory>('Kuliah');
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null);
  const [sessionsToday, setSessionsToday] = useState<CompletedSession[]>([]);

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<SessionCategory>('Kuliah');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'done'>('all');

  // Scratchpad State
  const [activePadTab, setActivePadTab] = useState<ScratchpadTabId>('general');
  const [notes, setNotes] = useState<Record<ScratchpadTabId, string>>({
    general: '',
    math: '',
    weekly: '',
  });
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Verifikasi Admin
  useEffect(() => {
    async function checkAccess() {
      setCheckingAuth(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      setIsAdmin(profile?.role === 'admin');
      setCheckingAuth(false);
    }

    checkAccess();
  }, [supabase]);

  // Muat preferensi tema, tanggal, dan data lokal
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const formatter = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setTodayLabel(formatter.format(new Date()));

    try {
      const savedTasks = localStorage.getItem('theo_sanctuary_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      const savedNotes = localStorage.getItem('theo_sanctuary_notes');
      if (savedNotes) setNotes((prev) => ({ ...prev, ...JSON.parse(savedNotes) }));

      const todayKey = getTodayKey();
      const savedSessions = localStorage.getItem(`theo_sanctuary_sessions_${todayKey}`);
      if (savedSessions) setSessionsToday(JSON.parse(savedSessions));
    } catch {
      // Abaikan jika storage tidak tersedia
    }
  }, []);

  // Simpan tugas ke localStorage
  useEffect(() => {
    if (checkingAuth || !isAdmin) return;
    try {
      localStorage.setItem('theo_sanctuary_tasks', JSON.stringify(tasks));
    } catch {
      // Abaikan
    }
  }, [tasks, checkingAuth, isAdmin]);

  // Simpan catatan scratchpad otomatis
  useEffect(() => {
    if (checkingAuth || !isAdmin) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem('theo_sanctuary_notes', JSON.stringify(notes));
        const now = new Date();
        setLastSavedTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
      } catch {
        // Abaikan
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [notes, checkingAuth, isAdmin]);

  // Nada pengingat lembut Web Audio API saat timer selesai
  const playCompletionChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const notesFreq = [523.25, 659.25, 783.99]; // C5 - E5 - G5

      notesFreq.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + idx * 0.16 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.16 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.16);
        osc.stop(ctx.currentTime + idx * 0.16 + 0.6);
      });
    } catch {
      // Abaikan jika browser memblokir audio otomatis
    }
  }, []);

  // Interval hitungan mundur
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const pinnedTask = useMemo(
    () => tasks.find((t) => t.id === pinnedTaskId) || null,
    [tasks, pinnedTaskId]
  );

  // Tangani saat waktu mencapai 00:00
  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      playCompletionChime();

      const currentPreset = TIMER_PRESETS[mode];
      if (currentPreset.isFocus) {
        const now = new Date();
        const finishedAt = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`;

        const entry: CompletedSession = {
          id: `${Date.now()}`,
          category: activeCategory,
          taskTitle: pinnedTask ? pinnedTask.title : null,
          minutes: currentPreset.minutes,
          finishedAt,
        };

        setSessionsToday((prev) => {
          const updated = [entry, ...prev];
          try {
            localStorage.setItem(
              `theo_sanctuary_sessions_${getTodayKey()}`,
              JSON.stringify(updated)
            );
          } catch {
            // Abaikan
          }
          return updated;
        });

        // Otomatis arahkan ke istirahat pendek setelah sesi fokus selesai
        setMode('short_break');
        setSecondsLeft(TIMER_PRESETS.short_break.minutes * 60);
      } else {
        // Kembali siap untuk sesi fokus berikutnya
        setMode('pomodoro');
        setSecondsLeft(TIMER_PRESETS.pomodoro.minutes * 60);
      }
    }
  }, [secondsLeft, isRunning, mode, activeCategory, pinnedTask, playCompletionChime]);

  function selectTimerMode(nextMode: TimerMode) {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(TIMER_PRESETS[nextMode].minutes * 60);
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(TIMER_PRESETS[mode].minutes * 60);
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

  // Handler Tugas
  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const item: TaskItem = {
      id: `${Date.now()}`,
      title,
      category: newTaskCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [item, ...prev]);
    setNewTaskTitle('');
    if (!pinnedTaskId) {
      setPinnedTaskId(item.id);
      setActiveCategory(item.category);
    }
  }

  function toggleTaskDone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    if (pinnedTaskId === id) {
      setPinnedTaskId(null);
    }
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (pinnedTaskId === id) {
      setPinnedTaskId(null);
    }
  }

  function focusOnTask(task: TaskItem) {
    setPinnedTaskId(task.id);
    setActiveCategory(task.category);
  }

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'active') return tasks.filter((t) => !t.completed);
    if (taskFilter === 'done') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, taskFilter]);

  const totalFocusMinutesToday = useMemo(
    () => sessionsToday.reduce((sum, s) => sum + s.minutes, 0),
    [sessionsToday]
  );

  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const totalModeSeconds = TIMER_PRESETS[mode].minutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalModeSeconds - secondsLeft) / totalModeSeconds) * 100))
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Membuka ruang pribadi...</span>
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
          Halaman ini hanya dapat diakses menggunakan akun administrator utama TheoQED.
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >
              <span>←</span>
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-900 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 shrink-0">
                Sanctuary
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                {todayLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/languages"
              className="hidden sm:inline-flex items-center h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition"
            >
              TheoQED Lingo ↗
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Ringkasan Harian */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ruang Fokus &amp; Produktivitas Pribadi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur ritme belajar kuliah, persiapan mengajar, dan pengembangan proyek dalam satu layar tenang.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-center">
              <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                {sessionsToday.length}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sesi Fokus
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-center">
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                {totalFocusMinutesToday}m
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Waktu
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-center">
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {completedTasksCount}/{tasks.length}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tugas Selesai
              </div>
            </div>
          </div>
        </div>

        {/* Grid 12 Kolom: Kiri (Pomodoro & Log) | Kanan (Tugas Harian & Scratchpad) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: POMODORO ENGINE */}
          <section className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
              {/* Pilihan Mode Timer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
                {(Object.keys(TIMER_PRESETS) as TimerMode[]).map((presetKey) => {
                  const preset = TIMER_PRESETS[presetKey];
                  const active = mode === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => selectTimerMode(presetKey)}
                      className={`h-8 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Kategori Sesi Fokus */}
              {TIMER_PRESETS[mode].isFocus && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                    Kategori Sesi Saat Ini
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const selected = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`h-7 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            selected
                              ? CATEGORY_STYLES[cat]
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tampilan Waktu Utama */}
              <div className="py-4 text-center space-y-4">
                <div className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {formatSeconds(secondsLeft)}
                </div>

                {/* Progress Bar */}
                <div className="max-w-xs mx-auto w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      TIMER_PRESETS[mode].isFocus ? 'bg-indigo-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Tugas yang sedang di-pin */}
                {pinnedTask ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900 text-xs">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      Target:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-56">
                      {pinnedTask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinnedTaskId(null)}
                      title="Lepas target"
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Pilih salah satu tugas di sebelah kanan untuk dijadikan target sesi ini.
                  </p>
                )}
              </div>

              {/* Kontrol Mulai / Jeda / Reset */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRunning((prev) => !prev)}
                  className={`flex-1 h-11 rounded-2xl text-xs font-extrabold text-white transition cursor-pointer ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {isRunning ? 'Jeda Timer' : 'Mulai Fokus'}
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Log Sesi Fokus Hari Ini */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Riwayat Sesi Hari Ini ({sessionsToday.length})
                </h2>
                {sessionsToday.length > 0 && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {totalFocusMinutesToday} menit
                  </span>
                )}
              </div>

              {sessionsToday.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">
                  Belum ada sesi selesai hari ini. Selesaikan satu siklus fokus untuk mencatatnya otomatis di sini.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sessionsToday.map((ses) => (
                    <div
                      key={ses.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                              CATEGORY_STYLES[ses.category]
                            }`}
                          >
                            {ses.category}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {ses.taskTitle || 'Sesi Fokus Mandiri'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 shrink-0">
                        {ses.minutes}m · {ses.finishedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* KOLOM KANAN: TARGET HARIAN & SCRATCHPAD */}
          <section className="lg:col-span-7 space-y-5">
            {/* Kartu 1: Target & Tugas Harian */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Target &amp; Tugas Hari Ini
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Klik <strong>Fokuskan</strong> pada tugas untuk menautkannya ke timer.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
                  {(
                    [
                      { id: 'all', label: 'Semua' },
                      { id: 'active', label: 'Aktif' },
                      { id: 'done', label: 'Selesai' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTaskFilter(tab.id)}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer ${
                        taskFilter === tab.id
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Tambah Tugas */}
              <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as SessionCategory)}
                  aria-label="Kategori tugas"
                  className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Tulis target baru (misal: Susun worksheet eksponen SMP)..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  + Tambah
                </button>
              </form>

              {/* Daftar Tugas */}
              {filteredTasks.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Belum ada daftar tugas pada filter ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredTasks.map((task) => {
                    const isPinned = task.id === pinnedTaskId;
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                          isPinned
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                            : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200/70 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskDone(task.id)}
                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                          />
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${
                              CATEGORY_STYLES[task.category]
                            }`}
                          >
                            {task.category}
                          </span>
                          <span
                            className={`text-xs font-semibold truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!task.completed && (
                            <button
                              type="button"
                              onClick={() => focusOnTask(task)}
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                isPinned
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                              }`}
                            >
                              {isPinned ? 'Aktif' : 'Fokuskan'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            title="Hapus tugas"
                            className="h-7 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kartu 2: Scratchpad Kilat */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  {SCRATCHPAD_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePadTab(tab.id)}
                      className={`h-7 px-3 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        activePadTab === tab.id
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400">
                  {lastSavedTime ? `Tersimpan otomatis · ${lastSavedTime}` : 'Tersimpan otomatis di browser'}
                </span>
              </div>

              <textarea
                rows={9}
                value={notes[activePadTab]}
                onChange={(e) =>
                  setNotes((prev) => ({
                    ...prev,
                    [activePadTab]: e.target.value,
                  }))
                }
                placeholder="Tulis coretan pembuktian, draf soal, poin materi kuliah, atau catatan cepat di sini..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}