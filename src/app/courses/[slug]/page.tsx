'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  description: string;
  thumbnail_url?: string;
  instructor_name: string;
  is_free: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface LessonItem {
  id: string;
  module_id: string;
  title: string;
  lesson_type: 'article' | 'video' | 'practice' | 'tryout';
  duration_minutes: number;
  is_preview: boolean;
  order_index: number;
}

function getCourseCoverGradient(category?: string): string {
  const key = (category || '').toLowerCase();
  if (key.includes('analisis') || key.includes('kalkulus')) {
    return 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800';
  }
  if (key.includes('aljabar')) {
    return 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-800';
  }
  if (key.includes('bilangan') || key.includes('teori')) {
    return 'bg-gradient-to-br from-violet-500 via-purple-600 to-purple-900';
  }
  if (key.includes('geometri')) {
    return 'bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-800';
  }
  if (key.includes('kombinatorika') || key.includes('diskrit')) {
    return 'bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-800';
  }
  return 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-800';
}

// --- SVG ICONS ---
function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function LockClosedIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CrownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AcademicCapIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

export default function CourseSyllabusPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const supabase = useMemo(() => createClient(), []);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');
    root.classList.toggle('dark', nextDark);
    try {
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    } catch {}
    setIsDark(nextDark);
  };

  useEffect(() => {
    if (!slug) return;

    async function fetchCourseDetail() {
      setLoading(true);

      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !courseData) {
        setCourse(null);
        setLoading(false);
        return;
      }

      setCourse(courseData as CourseDetail);

      const [modRes, lesRes, sessionRes] = await Promise.all([
        supabase
          .from('course_modules')
          .select('id, title, description, order_index')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('course_lessons')
          .select('id, module_id, title, lesson_type, duration_minutes, is_preview, order_index')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true }),
        supabase.auth.getSession(),
      ]);

      if (modRes.data) {
        setModules(modRes.data as ModuleItem[]);
        const initialExpand: Record<string, boolean> = {};
        modRes.data.forEach((m) => {
          initialExpand[m.id] = true;
        });
        setExpandedModules(initialExpand);
      }

      if (lesRes.data) setLessons(lesRes.data as LessonItem[]);

      const sessionUser = sessionRes.data?.session?.user;
      if (sessionUser) {
        setUserId(sessionUser.id);
        const [progRes, profileRes] = await Promise.all([
          supabase
            .from('user_course_progress')
            .select('lesson_id')
            .eq('user_id', sessionUser.id)
            .eq('course_id', courseData.id),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle(),
        ]);

        if (progRes.data) {
          setCompletedIds(new Set(progRes.data.map((p) => p.lesson_id)));
        }
        setHasPremiumAccess(checkPremiumAccess(profileRes.data));
      } else {
        setUserId(null);
        setHasPremiumAccess(false);
      }

      setLoading(false);
    }

    fetchCourseDetail();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setHasPremiumAccess(checkPremiumAccess(profile));
      } else {
        setUserId(null);
        setHasPremiumAccess(false);
        setCompletedIds(new Set());
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [slug, supabase]);

  useEffect(() => {
    if (!userId || !course?.id) return;

    supabase
      .from('user_course_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .then(({ data }) => {
        if (data) {
          setCompletedIds(new Set(data.map((p) => p.lesson_id)));
        }
      });
  }, [userId, course?.id, supabase]);

  const orderedLessons = useMemo(() => {
    const result: LessonItem[] = [];
    modules.forEach((mod) => {
      const modLes = lessons
        .filter((l) => l.module_id === mod.id)
        .sort((a, b) => a.order_index - b.order_index);
      result.push(...modLes);
    });
    return result;
  }, [modules, lessons]);

  const canAccessFullCourse = Boolean(course?.is_free || hasPremiumAccess);

  const firstPreviewLesson = useMemo(
    () => orderedLessons.find((l) => l.is_preview) || null,
    [orderedLessons]
  );

  const nextLessonToLearn = useMemo(() => {
    if (orderedLessons.length === 0) return null;
    if (!canAccessFullCourse) return firstPreviewLesson;
    const firstUncompleted = orderedLessons.find((l) => !completedIds.has(l.id));
    return firstUncompleted || orderedLessons[0];
  }, [orderedLessons, completedIds, canAccessFullCourse, firstPreviewLesson]);

  const totalDuration = useMemo(
    () => orderedLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0),
    [orderedLessons]
  );

  const progressPercent =
    orderedLessons.length > 0 ? Math.round((completedIds.size / orderedLessons.length) * 100) : 0;

  const allExpanded = useMemo(
    () => modules.length > 0 && modules.every((m) => expandedModules[m.id]),
    [modules, expandedModules]
  );

  const toggleAllModules = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    modules.forEach((m) => {
      updated[m.id] = nextState;
    });
    setExpandedModules(updated);
  };

  const renderTopHeader = (titleText: string) => (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/courses"
            className="h-9 px-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeftIcon />
            <span className="whitespace-nowrap">Kembali ke Katalog</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {titleText}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!loading && course && canAccessFullCourse && nextLessonToLearn && (
            <button
              type="button"
              onClick={() =>
                router.push(`/courses/${course.slug}/learn?lesson=${nextLessonToLearn.id}`)
              }
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <span className="whitespace-nowrap">
                {completedIds.size > 0 && completedIds.size < orderedLessons.length
                  ? 'Lanjutkan Belajar'
                  : 'Ruang Belajar'}
              </span>
              <ArrowRightIcon />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            className="w-9 h-9 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
        {renderTopHeader('Silabus Kelas')}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat silabus kelas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
        {renderTopHeader('Kelas Tidak Ditemukan')}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center mx-auto">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Kelas Tidak Ditemukan
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Kelas yang Anda cari belum tersedia atau tautannya telah berubah.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              <ArrowLeftIcon />
              <span className="whitespace-nowrap">Kembali ke Katalog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverGradient = getCourseCoverGradient(course.category);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {renderTopHeader(course.title)}

      {/* Header & Hero Kelas */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                  {course.category}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                  Tingkat: {course.level}
                </span>
                {course.is_free ? (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Gratis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                    <CrownIcon className="w-3 h-3 text-amber-500" />
                    <span>Premium</span>
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {course.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {course.description ||
                    'Kurikulum pembelajaran sistematis lengkap dengan pembahasan konsep dan latihan soal terstruktur.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Pengajar
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {course.instructor_name}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Struktur
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {modules.length} Bab
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Total Sesi
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {orderedLessons.length} Materi
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Estimasi Waktu
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    ± {totalDuration} Menit
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION & PROGRESS BOX */}
            <div className="lg:col-span-5 xl:col-span-4 bg-slate-50/80 dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              {course.thumbnail_url ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`aspect-video w-full rounded-xl ${coverGradient} relative overflow-hidden p-5 flex flex-col justify-between text-white`}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
                  <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    THEOCOURSE
                  </span>
                  <p className="relative z-10 text-sm font-bold leading-snug line-clamp-2">
                    {course.title}
                  </p>
                </div>
              )}

              {userId && canAccessFullCourse && orderedLessons.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Progres Belajar</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {completedIds.size} dari {orderedLessons.length} materi selesai
                  </p>
                </div>
              )}

              {canAccessFullCourse ? (
                nextLessonToLearn ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/courses/${course.slug}/learn?lesson=${nextLessonToLearn.id}`)
                      }
                      className="w-full h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="whitespace-nowrap">
                        {completedIds.size === 0
                          ? 'Mulai Belajar Sekarang'
                          : completedIds.size === orderedLessons.length
                          ? 'Ulangi Materi Kelas'
                          : 'Lanjutkan Belajar'}
                      </span>
                      <ArrowRightIcon />
                    </button>

                    {completedIds.size > 0 && completedIds.size < orderedLessons.length && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 text-center">
                        Berikutnya:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {nextLessonToLearn.title}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    Materi kelas sedang disiapkan.
                  </div>
                )
              ) : (
                /* BOX UNTUK USER FREE / TAMU PADA KELAS PREMIUM */
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Kelas Khusus Anggota Premium</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {userId
                        ? 'Akun Anda saat ini berstatus Gratis (Free). Upgrade ke akun Premium untuk membuka seluruh materi kelas ini.'
                        : 'Masuk atau upgrade akun Anda ke Premium untuk mengakses seluruh materi dalam kelas ini.'}
                    </p>
                  </div>

                  {firstPreviewLesson && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/courses/${course.slug}/learn?lesson=${firstPreviewLesson.id}`)
                      }
                      className="w-full h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="whitespace-nowrap">Coba Materi Preview Gratis</span>
                      <ArrowRightIcon />
                    </button>
                  )}

                  <Link
                    href={`/upgrade?redirect=/courses/${course.slug}`}
                    className="w-full h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span className="whitespace-nowrap">Upgrade ke Premium</span>
                    <ArrowRightIcon />
                  </Link>
                </div>
              )}

              {!userId && course.is_free && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  Masuk ke akun Anda untuk menyimpan progres belajar secara otomatis.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DAFTAR SILABUS (MODULES & LESSONS) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Silabus &amp; Daftar Materi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {canAccessFullCourse
                ? 'Pilih materi mana pun untuk langsung masuk ke ruang belajar.'
                : 'Materi berlabel Preview dapat diakses langsung tanpa akun Premium.'}
            </p>
          </div>

          {modules.length > 1 && (
            <button
              type="button"
              onClick={toggleAllModules}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0 cursor-pointer"
            >
              {allExpanded ? 'Tutup Semua Bab' : 'Buka Semua Bab'}
            </button>
          )}
        </div>

        {modules.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            Belum ada bab yang dipublikasikan pada kelas ini.
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod, mIdx) => {
              const modLessons = lessons
                .filter((l) => l.module_id === mod.id)
                .sort((a, b) => a.order_index - b.order_index);
              const isOpen = !!expandedModules[mod.id];
              const modCompletedCount = modLessons.filter((l) => completedIds.has(l.id)).length;
              const isModComplete =
                modLessons.length > 0 && modCompletedCount === modLessons.length;
              const modDuration = modLessons.reduce(
                (sum, l) => sum + (l.duration_minutes || 0),
                0
              );

              return (
                <div
                  key={mod.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                    }
                    className="w-full p-5 sm:px-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          Bab {mIdx + 1}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold normal-case">
                          {modLessons.length} Materi ({modDuration} menit)
                        </span>
                        {userId && canAccessFullCourse && modLessons.length > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span
                              className={`normal-case ${
                                isModComplete
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isModComplete
                                ? 'Bab Selesai'
                                : `${modCompletedCount}/${modLessons.length} Selesai`}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {mod.title}
                      </h3>

                      {mod.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {mod.description}
                        </p>
                      )}
                    </div>

                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <ChevronDownIcon
                        className={`transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
                      {modLessons.length === 0 ? (
                        <div className="p-5 text-xs text-slate-400 italic">
                          Belum ada materi pada bab ini.
                        </div>
                      ) : (
                        modLessons.map((lesson, lIdx) => {
                          const isCompleted = completedIds.has(lesson.id);
                          const isLocked =
                            !course.is_free && !lesson.is_preview && !hasPremiumAccess;

                          return (
                            <Link
                              key={lesson.id}
                              href={`/courses/${course.slug}/learn?lesson=${lesson.id}`}
                              className={`group p-4 sm:px-6 flex items-center justify-between gap-4 transition ${
                                isLocked
                                  ? 'bg-slate-50/50 dark:bg-slate-950/30 hover:bg-amber-500/5'
                                  : 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {!canAccessFullCourse ? (
                                  isLocked ? (
                                    <span className="w-24 h-7 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 text-[11px] font-bold shrink-0 border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                      <LockClosedIcon className="w-3 h-3 text-amber-500" />
                                      <span>Premium</span>
                                    </span>
                                  ) : (
                                    <span className="w-24 h-7 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 text-[11px] font-bold shrink-0 border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                      {isCompleted ? (
                                        <CheckIcon className="w-3 h-3" />
                                      ) : (
                                        <span className="tabular-nums">{lIdx + 1}</span>
                                      )}
                                      <span className="w-px h-3 bg-emerald-500/30 shrink-0" />
                                      <span>Preview</span>
                                    </span>
                                  )
                                ) : (
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 border transition ${
                                      isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                    }`}
                                  >
                                    {isCompleted ? <CheckIcon className="w-3.5 h-3.5" /> : lIdx + 1}
                                  </span>
                                )}

                                <span
                                  className={`text-xs sm:text-sm font-semibold truncate transition ${
                                    isLocked
                                      ? 'text-slate-500 dark:text-slate-400'
                                      : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                  }`}
                                >
                                  {lesson.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums min-w-[2rem] text-right">
                                  {lesson.duration_minutes}m
                                </span>
                                <ArrowRightIcon className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}