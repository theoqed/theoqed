'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { checkPremiumAccess } from '@/lib/access';

// --- INTERFACES ---
interface CourseInfo {
  id: string;
  title: string;
  slug: string;
  category: string;
  instructor_name?: string;
  is_free: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  order_index: number;
}

interface LessonItem {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  lesson_type: 'article' | 'video' | 'practice' | 'tryout';
  content?: string;
  video_url?: string;
  problem_ids: string[];
  tryout_id?: string | null;
  duration_minutes: number;
  is_preview: boolean;
  order_index: number;
}

interface ProblemData {
  id: string;
  title: string;
  topic: string;
  statement: string;
  problem_type?: 'multiple_choice' | 'short_answer';
  options?: { [key: string]: string };
  solutions?: {
    id?: string;
    title?: string;
    author?: string;
    brief?: string;
    steps?: string[];
    final_answer?: string;
  }[];
}

interface TryoutData {
  id: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  duration_minutes: number;
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

function MenuLinesIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h12M4 18h16" />
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
      className={`w-3 h-3 shrink-0 ${className}`.trim()}
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

function XMarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function BookOpenIcon({ className = '' }: { className?: string }) {
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

// --- HELPER: RENDER LATEX (KATEX VIA CDN) ---
function MathContent({ text, className = '' }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderMath = () => {
      const renderFn = (window as any).renderMathInElement;
      if (renderFn && containerRef.current) {
        renderFn(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      }
    };

    if ((window as any).renderMathInElement) {
      renderMath();
      return;
    }

    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('katex-js')) {
      const script = document.createElement('script');
      script.id = 'katex-js';
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
      script.async = true;
      script.onload = () => {
        const autoRender = document.createElement('script');
        autoRender.id = 'katex-auto-render';
        autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js';
        autoRender.async = true;
        autoRender.onload = renderMath;
        document.head.appendChild(autoRender);
      };
      document.head.appendChild(script);
    } else {
      const timer = setTimeout(renderMath, 300);
      return () => clearTimeout(timer);
    }
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`whitespace-pre-line leading-relaxed overflow-x-auto ${className}`}
    >
      {text}
    </div>
  );
}

// --- HELPER: KONVERSI URL YOUTUBE KE EMBED ---
function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  }
  return trimmed;
}

// --- KOMPONEN UTAMA RUANG BELAJAR ---
function LearnWorkspace() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const slug = params?.slug as string;
  const requestedLessonId = searchParams.get('lesson');

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // UI Controls
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [fontScale, setFontScale] = useState<'sm' | 'base' | 'lg'>('base');
  const [savingProgress, setSavingProgress] = useState(false);
  const [authNotice, setAuthNotice] = useState(false);

  // State khusus tipe lesson 'practice' & 'tryout'
  const [practiceProblems, setPracticeProblems] = useState<ProblemData[]>([]);
  const [linkedTryout, setLinkedTryout] = useState<TryoutData | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // State interaksi latihan soal
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [solutionOpenMap, setSolutionOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
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

    async function fetchCourseWorkspace() {
      setLoading(true);

      const { data: courseData, error } = await supabase
        .from('courses')
        .select('id, title, slug, category, instructor_name, is_free')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !courseData) {
        setCourse(null);
        setLoading(false);
        return;
      }

      setCourse(courseData as CourseInfo);

      const [modRes, lesRes, sessionRes] = await Promise.all([
        supabase
          .from('course_modules')
          .select('id, title, order_index')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('course_lessons')
          .select('*')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true }),
        supabase.auth.getSession(),
      ]);

      if (modRes.data) setModules(modRes.data as ModuleItem[]);
      if (lesRes.data) {
        const normalized = (lesRes.data as any[]).map((l) => ({
          ...l,
          problem_ids: Array.isArray(l.problem_ids)
            ? l.problem_ids
            : typeof l.problem_ids === 'string'
            ? JSON.parse(l.problem_ids || '[]')
            : [],
        }));
        setLessons(normalized);
      }

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

    fetchCourseWorkspace();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setAuthNotice(false);
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

  // Urutan datar semua materi
  const orderedLessons = useMemo(() => {
    const list: LessonItem[] = [];
    modules.forEach((mod) => {
      const modLessons = lessons
        .filter((l) => l.module_id === mod.id)
        .sort((a, b) => a.order_index - b.order_index);
      list.push(...modLessons);
    });
    return list;
  }, [modules, lessons]);

  const firstPreviewLesson = useMemo(
    () => orderedLessons.find((l) => l.is_preview) || null,
    [orderedLessons]
  );

  // Tentukan materi yang sedang aktif
  const currentIndex = useMemo(() => {
    if (orderedLessons.length === 0) return -1;
    if (requestedLessonId) {
      const foundIdx = orderedLessons.findIndex((l) => l.id === requestedLessonId);
      if (foundIdx !== -1) return foundIdx;
    }
    const firstUncompleted = orderedLessons.findIndex((l) => !completedIds.has(l.id));
    return firstUncompleted !== -1 ? firstUncompleted : 0;
  }, [orderedLessons, requestedLessonId, completedIds]);

  const activeLesson = currentIndex >= 0 ? orderedLessons[currentIndex] : null;
  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeLesson?.module_id) || null,
    [modules, activeLesson?.module_id]
  );
  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  // Kunci materi jika kelas bersifat Terbatas (!course.is_free), materi bukan Preview, dan user belum Premium/Admin
  const isLessonLocked = Boolean(
    course && activeLesson && !course.is_free && !activeLesson.is_preview && !hasPremiumAccess
  );

  useEffect(() => {
    if (activeLesson?.module_id) {
      setCollapsedModules((prev) => ({ ...prev, [activeLesson.module_id]: false }));
    }
  }, [activeLesson?.module_id]);

  // Muat soal latihan atau data tryout ketika materi aktif berubah (hanya jika tidak terkunci)
  useEffect(() => {
    if (!activeLesson || isLessonLocked) {
      setPracticeProblems([]);
      setLinkedTryout(null);
      return;
    }

    setPracticeProblems([]);
    setLinkedTryout(null);
    setUserAnswers({});
    setCheckedMap({});
    setSolutionOpenMap({});

    async function loadLessonAssets() {
      if (activeLesson?.lesson_type === 'practice' && activeLesson.problem_ids.length > 0) {
        setLoadingAsset(true);
        const { data } = await supabase
          .from('problems')
          .select('id, title, topic, statement, problem_type, options, solutions')
          .in('id', activeLesson.problem_ids);

        if (data) {
          const orderedProbs = activeLesson.problem_ids
            .map((pid) => data.find((item) => item.id === pid))
            .filter(Boolean) as ProblemData[];
          setPracticeProblems(orderedProbs);
        }
        setLoadingAsset(false);
      } else if (activeLesson?.lesson_type === 'tryout' && activeLesson.tryout_id) {
        setLoadingAsset(true);
        const { data } = await supabase
          .from('tryouts')
          .select('id, title, slug, category, description, duration_minutes')
          .eq('id', activeLesson.tryout_id)
          .maybeSingle();

        if (data) setLinkedTryout(data as TryoutData);
        setLoadingAsset(false);
      }
    }

    loadLessonAssets();
  }, [activeLesson?.id, isLessonLocked, supabase]);

  const selectLesson = (lessonId: string) => {
    router.push(`/courses/${slug}/learn?lesson=${lessonId}`);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Tandai selesai / batal selesai
  const handleToggleComplete = async (goNextAfter = false) => {
    if (!course || !activeLesson || isLessonLocked) return;

    if (!userId) {
      setAuthNotice(true);
      return;
    }

    setSavingProgress(true);
    const alreadyDone = completedIds.has(activeLesson.id);

    if (alreadyDone && !goNextAfter) {
      const { error } = await supabase
        .from('user_course_progress')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', activeLesson.id);

      if (!error) {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(activeLesson.id);
          return next;
        });
      }
    } else if (!alreadyDone) {
      const { error } = await supabase.from('user_course_progress').insert([
        {
          user_id: userId,
          course_id: course.id,
          lesson_id: activeLesson.id,
        },
      ]);

      if (!error) {
        setCompletedIds((prev) => new Set(prev).add(activeLesson.id));
      }
    }

    setSavingProgress(false);

    if (goNextAfter && nextLesson) {
      selectLesson(nextLesson.id);
    }
  };

  const practiceStats = useMemo(() => {
    let checkedCount = 0;
    let correctCount = 0;
    practiceProblems.forEach((prob) => {
      if (checkedMap[prob.id]) {
        checkedCount++;
        const correctKey = (prob.solutions?.[0]?.final_answer || '').trim().toLowerCase();
        const chosen = (userAnswers[prob.id] || '').trim().toLowerCase();
        if (correctKey && chosen === correctKey) {
          correctCount++;
        }
      }
    });
    return { checkedCount, correctCount };
  }, [practiceProblems, checkedMap, userAnswers]);

  const progressPercent =
    orderedLessons.length > 0 ? Math.round((completedIds.size / orderedLessons.length) * 100) : 0;

  const contentFontClass =
    fontScale === 'sm'
      ? 'text-xs sm:text-sm'
      : fontScale === 'lg'
      ? 'text-base sm:text-[17px]'
      : 'text-sm sm:text-[15px]';

  // STICKY SUB-PAGE HEADER DENGAN BATAS LEBAR max-w-7xl
  const renderTopHeader = (
    titleText: string,
    options?: { showWorkspaceControls?: boolean; showReadingBar?: boolean }
  ) => {
    const showControls = Boolean(options?.showWorkspaceControls);
    const showReadingBar = Boolean(options?.showReadingBar);

    return (
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={course ? `/courses/${course.slug}` : '/courses'}
              className="h-9 px-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeftIcon />
              <span className="whitespace-nowrap">Kembali ke Silabus</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {titleText}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showControls && (
              <>
                {userId && (
                  <div className="hidden sm:flex items-center gap-2.5 h-9 px-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="w-16 md:w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      {progressPercent}%
                    </span>
                  </div>
                )}

                <div className="hidden md:flex items-center h-9 p-1 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold">
                  {(['sm', 'base', 'lg'] as const).map((sz, i) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontScale(sz)}
                      className={`h-full px-2 rounded-lg transition cursor-pointer ${
                        fontScale === sz
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200/70 dark:border-slate-700'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title="Ukuran Teks Materi"
                    >
                      {i === 0 ? 'A-' : i === 1 ? 'A' : 'A+'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-semibold transition inline-flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    !sidebarOpen
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  title={sidebarOpen ? 'Aktifkan Mode Fokus' : 'Tampilkan Daftar Materi'}
                >
                  <MenuLinesIcon />
                  <span className="whitespace-nowrap hidden sm:inline">
                    {sidebarOpen ? 'Mode Fokus' : 'Daftar Materi'}
                  </span>
                </button>
              </>
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

        {showReadingBar && (
          <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-800/80">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
              style={{
                width: `${
                  orderedLessons.length > 0
                    ? Math.round(((currentIndex + 1) / orderedLessons.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        )}
      </header>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
        {renderTopHeader('Ruang Belajar')}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center gap-3 py-24">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Menyiapkan ruang belajar...</p>
        </div>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
        {renderTopHeader('Materi Tidak Ditemukan')}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full">
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center mx-auto">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Materi Tidak Ditemukan
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Materi yang Anda cari belum tersedia atau tautannya telah berubah.
              </p>
            </div>
            <Link
              href={course ? `/courses/${course.slug}` : '/courses'}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              <ArrowLeftIcon />
              <span className="whitespace-nowrap">Kembali ke Silabus</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = completedIds.has(activeLesson.id);

  // TAMPILAN TERKUNCI (Untuk Tamu maupun Akun Free pada Kelas Premium)
  if (isLessonLocked) {
    const hasOtherPreview = Boolean(
      firstPreviewLesson && firstPreviewLesson.id !== activeLesson.id
    );

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
        {renderTopHeader(course.title)}

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 flex items-center justify-center py-12">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/40 max-w-md w-full p-7 sm:p-8 text-center space-y-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
              <LockClosedIcon className="w-5 h-5" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                <CrownIcon />
                <span>Khusus Anggota Premium</span>
              </span>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight pt-0.5">
                {userId
                  ? 'Materi Ini Khusus Anggota Premium'
                  : 'Masuk dengan Akun Premium untuk Membuka Materi'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {userId ? (
                  <>
                    Akun Anda saat ini berstatus{' '}
                    <strong className="text-slate-700 dark:text-slate-200">Gratis (Free)</strong>.
                    Materi{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      &ldquo;{activeLesson.title}&rdquo;
                    </strong>{' '}
                    termasuk dalam akses Premium kelas{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{course.title}</strong>.
                  </>
                ) : (
                  <>
                    Kelas{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{course.title}</strong>{' '}
                    khusus anggota Premium. Silakan masuk atau upgrade akun Anda untuk mengakses
                    seluruh materi.
                  </>
                )}
              </p>
            </div>

            <div className="max-w-sm mx-auto flex flex-col gap-2.5 pt-1">
              <Link
                href={`/upgrade?redirect=/courses/${course.slug}/learn?lesson=${activeLesson.id}`}
                className="w-full h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <CrownIcon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Upgrade ke Premium</span>
                <ArrowRightIcon />
              </Link>

              {hasOtherPreview && firstPreviewLesson && (
                <button
                  type="button"
                  onClick={() => selectLesson(firstPreviewLesson.id)}
                  className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="whitespace-nowrap">Coba Materi Preview Gratis</span>
                  <ArrowRightIcon />
                </button>
              )}

              <Link
                href={`/courses/${course.slug}`}
                className="w-full h-9 px-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-xs font-semibold rounded-xl transition inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeftIcon />
                <span className="whitespace-nowrap">Kembali ke Silabus</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {renderTopHeader(course.title, {
        showWorkspaceControls: true,
        showReadingBar: true,
      })}

      {/* BODY: CONTAINER max-w-7xl DENGAN MARGIN KONSISTEN */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex items-start gap-6 lg:gap-8 relative">
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* SIDEBAR KURIKULUM */}
        {sidebarOpen && (
          <aside className="fixed top-16 bottom-0 left-0 z-30 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 overflow-y-auto p-4 space-y-4 lg:sticky lg:top-24 lg:bottom-auto lg:left-auto lg:z-10 lg:w-72 xl:w-80 lg:max-w-none lg:max-h-[calc(100vh-7.5rem)] lg:rounded-2xl lg:border shrink-0">
            <div className="flex items-center justify-between px-1 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Daftar Kurikulum
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {completedIds.size}/{orderedLessons.length} Selesai
              </span>
            </div>

            <div className="space-y-3">
              {modules.map((mod, mIdx) => {
                const modLessons = lessons
                  .filter((l) => l.module_id === mod.id)
                  .sort((a, b) => a.order_index - b.order_index);
                const isCollapsed = !!collapsedModules[mod.id];
                const modCompletedCount = modLessons.filter((l) => completedIds.has(l.id)).length;

                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                      }
                      className="w-full p-3 text-left flex items-start justify-between gap-2.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Bab {mIdx + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                            ({modCompletedCount}/{modLessons.length})
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug mt-0.5">
                          {mod.title}
                        </h3>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                        <ChevronDownIcon
                          className={`transition-transform duration-200 ${
                            isCollapsed ? '' : 'rotate-180'
                          }`}
                        />
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="p-1.5 pt-0 space-y-1">
                        {modLessons.map((les, lIdx) => {
                          const isActive = les.id === activeLesson.id;
                          const isDone = completedIds.has(les.id);
                          const isItemLocked =
                            !course.is_free && !les.is_preview && !hasPremiumAccess;

                          return (
                            <button
                              key={les.id}
                              type="button"
                              onClick={() => selectLesson(les.id)}
                              className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-2.5 transition cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : isItemLocked
                                  ? 'opacity-80 hover:bg-white dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium'
                                  : 'hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border transition ${
                                    isDone
                                      ? isActive
                                        ? 'bg-white text-indigo-600 border-white'
                                        : 'bg-emerald-500 text-white border-emerald-500'
                                      : isItemLocked
                                      ? isActive
                                        ? 'border-white/50 bg-white/15 text-white'
                                        : 'border-amber-500/40 bg-amber-500/15 text-amber-500'
                                      : isActive
                                      ? 'border-white/50 text-white'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckIcon className="w-3 h-3" />
                                  ) : isItemLocked ? (
                                    <LockClosedIcon className="w-3 h-3" />
                                  ) : (
                                    lIdx + 1
                                  )}
                                </span>

                                <span className="truncate leading-snug">{les.title}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {les.is_preview && !course.is_free && !hasPremiumAccess && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                      isActive
                                        ? 'bg-emerald-500 text-white border-emerald-400'
                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    }`}
                                  >
                                    Preview
                                  </span>
                                )}

                                <span
                                  className={`text-[10px] font-semibold tabular-nums ${
                                    isActive
                                      ? 'text-indigo-100'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {les.duration_minutes}m
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* MAIN LEARNING AREA */}
        <main
          className={`flex-1 min-w-0 space-y-6 ${
            sidebarOpen ? '' : 'max-w-4xl mx-auto w-full'
          }`}
        >
          {/* BREADCRUMB & HEADER MATERI */}
          <div className="space-y-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {activeModule && (
                <>
                  <span className="text-slate-500 dark:text-slate-400">{activeModule.title}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                </>
              )}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                Materi {currentIndex + 1} dari {orderedLessons.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {activeLesson.title}
              </h1>

              {isCurrentCompleted && (
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0">
                  <CheckIcon />
                  <span>Selesai Dipelajari</span>
                </span>
              )}
            </div>
          </div>

          {/* 1. KONTEN VIDEO */}
          {activeLesson.lesson_type === 'video' && activeLesson.video_url && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <iframe
                src={getYoutubeEmbedUrl(activeLesson.video_url) || ''}
                title={activeLesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* 2. KONTEN TEKS / ARTIKEL LATEX */}
          {activeLesson.content && (
            <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
              <MathContent
                text={activeLesson.content}
                className={`${contentFontClass} text-slate-700 dark:text-slate-200 leading-7`}
              />
            </article>
          )}

          {/* 3. LATIHAN SOAL INTERAKTIF */}
          {activeLesson.lesson_type === 'practice' && (
            <div className="space-y-5">
              {practiceProblems.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Total Latihan:{' '}
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {practiceProblems.length} Soal
                    </strong>
                  </span>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      Diperiksa: {practiceStats.checkedCount}/{practiceProblems.length}
                    </span>
                    {practiceStats.checkedCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold tabular-nums">
                        Benar: {practiceStats.correctCount}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {loadingAsset ? (
                <div className="p-12 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span>Memuat soal latihan...</span>
                </div>
              ) : practiceProblems.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  Belum ada soal yang ditautkan pada latihan ini.
                </div>
              ) : (
                practiceProblems.map((prob, idx) => {
                  const isPG = prob.problem_type === 'multiple_choice';
                  const officialSol = prob.solutions?.[0];
                  const correctKey = (officialSol?.final_answer || '').trim();
                  const chosen = userAnswers[prob.id] || '';
                  const isChecked = !!checkedMap[prob.id];
                  const isCorrect =
                    isChecked &&
                    correctKey !== '' &&
                    chosen.trim().toLowerCase() === correctKey.toLowerCase();
                  const isSolOpen = !!solutionOpenMap[prob.id];

                  return (
                    <div
                      key={prob.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 space-y-5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900 text-[11px] font-bold">
                            Soal #{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {prob.topic || 'Umum'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {prob.id}
                        </span>
                      </div>

                      <MathContent
                        text={prob.statement}
                        className={`${contentFontClass} text-slate-800 dark:text-slate-100`}
                      />

                      {isPG && prob.options ? (
                        <div className="space-y-2.5">
                          {['A', 'B', 'C', 'D', 'E'].map((optKey) => {
                            const optText = prob.options?.[optKey];
                            if (!optText) return null;

                            const isSelected = chosen === optKey;
                            const isRightOption = isChecked && optKey === correctKey;
                            const isWrongSelected = isChecked && isSelected && optKey !== correctKey;

                            let cardStyle =
                              'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-950/50';
                            let badgeStyle =
                              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';

                            if (isRightOption) {
                              cardStyle =
                                'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100';
                              badgeStyle = 'bg-emerald-500 border-emerald-500 text-white';
                            } else if (isWrongSelected) {
                              cardStyle =
                                'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100';
                              badgeStyle = 'bg-rose-500 border-rose-500 text-white';
                            } else if (isSelected) {
                              cardStyle =
                                'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40';
                              badgeStyle = 'bg-indigo-600 border-indigo-600 text-white';
                            }

                            return (
                              <button
                                key={optKey}
                                type="button"
                                onClick={() => {
                                  setUserAnswers((prev) => ({ ...prev, [prob.id]: optKey }));
                                  setCheckedMap((prev) => ({ ...prev, [prob.id]: false }));
                                }}
                                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 text-xs sm:text-sm cursor-pointer ${cardStyle}`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition ${badgeStyle}`}
                                >
                                  {optKey}
                                </span>
                                <div className="flex-1 pt-0.5">
                                  <MathContent text={optText} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            placeholder="Ketik jawaban akhir Anda lalu tekan Enter..."
                            value={chosen}
                            onChange={(e) => {
                              setUserAnswers((prev) => ({ ...prev, [prob.id]: e.target.value }));
                              setCheckedMap((prev) => ({ ...prev, [prob.id]: false }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && chosen.trim()) {
                                setCheckedMap((prev) => ({ ...prev, [prob.id]: true }));
                              }
                            }}
                            className="w-full sm:w-96 h-10 px-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          type="button"
                          disabled={!chosen.trim()}
                          onClick={() =>
                            setCheckedMap((prev) => ({ ...prev, [prob.id]: true }))
                          }
                          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Periksa Jawaban
                        </button>

                        {officialSol && (
                          <button
                            type="button"
                            onClick={() =>
                              setSolutionOpenMap((prev) => ({
                                ...prev,
                                [prob.id]: !prev[prob.id],
                              }))
                            }
                            className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            {isSolOpen ? 'Tutup Pembahasan' : 'Lihat Pembahasan'}
                          </button>
                        )}

                        {isChecked && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserAnswers((prev) => ({ ...prev, [prob.id]: '' }));
                              setCheckedMap((prev) => ({ ...prev, [prob.id]: false }));
                            }}
                            className="h-9 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
                          >
                            Reset
                          </button>
                        )}

                        {isChecked && (
                          <div
                            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                              isCorrect
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isCorrect ? (
                              <>
                                <CheckIcon />
                                <span>Jawaban Tepat!</span>
                              </>
                            ) : (
                              <>
                                <XMarkIcon />
                                <span>
                                  Belum tepat • Kunci: <MathContent text={correctKey} className="inline" />
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {isSolOpen && officialSol && (
                        <div className="p-5 sm:p-6 rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs sm:text-sm">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">
                            {officialSol.title || 'Pembahasan Resmi'}
                          </div>

                          {officialSol.brief && (
                            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 text-xs">
                              <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                Ide Utama:{' '}
                              </span>
                              <MathContent text={officialSol.brief} className="inline" />
                            </div>
                          )}

                          {Array.isArray(officialSol.steps) && officialSol.steps.length > 0 && (
                            <div className="space-y-2.5 leading-relaxed">
                              {officialSol.steps.map((step, sIdx) => (
                                <MathContent key={sIdx} text={step} />
                              ))}
                            </div>
                          )}

                          {officialSol.final_answer && (
                            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                              <span>Jawaban Akhir:</span>
                              <MathContent text={officialSol.final_answer} className="inline" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 4. EVALUASI PAKET TRY OUT */}
          {activeLesson.lesson_type === 'tryout' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/40 p-6 sm:p-7 space-y-5">
              {loadingAsset ? (
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  <span>Memuat informasi Evaluasi CBT...</span>
                </div>
              ) : linkedTryout ? (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40">
                      Evaluasi CBT • {linkedTryout.category || 'Try Out'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Durasi: {linkedTryout.duration_minutes} Menit
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {linkedTryout.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {linkedTryout.description ||
                        'Kerjakan simulasi evaluasi CBT berbatas waktu untuk mengukur penguasaan materi pada bagian ini.'}
                    </p>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/tryout/${linkedTryout.slug}`}
                      className="inline-flex items-center gap-2 h-10 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                    >
                      <span className="whitespace-nowrap">Mulai Simulasi CBT Sekarang</span>
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Paket Evaluasi CBT belum ditautkan pada materi ini.
                </p>
              )}
            </div>
          )}

          {/* NOTIFIKASI LOGIN UNTUK PROGRES */}
          {authNotice && !userId && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                Masuk ke akun Anda terlebih dahulu untuk menyimpan progres belajar secara otomatis.
              </span>
              <button
                type="button"
                onClick={() => setAuthNotice(false)}
                className="text-amber-600 dark:text-amber-400 hover:opacity-75 p-1 cursor-pointer shrink-0"
                aria-label="Tutup pemberitahuan"
              >
                <XMarkIcon />
              </button>
            </div>
          )}

          {/* FOOTER NAVIGASI & TOMBOL SELESAI */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && selectLesson(prevLesson.id)}
              className="h-10 px-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-35 hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftIcon />
              <span className="whitespace-nowrap">Materi Sebelumnya</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                disabled={savingProgress}
                onClick={() => handleToggleComplete(false)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCurrentCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-700'
                }`}
              >
                {isCurrentCompleted && <CheckIcon />}
                <span className="whitespace-nowrap">
                  {isCurrentCompleted ? 'Sudah Selesai' : 'Tandai Selesai'}
                </span>
              </button>

              {nextLesson ? (
                <button
                  type="button"
                  disabled={savingProgress}
                  onClick={() => handleToggleComplete(true)}
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="whitespace-nowrap">Selesai &amp; Lanjut</span>
                  <ArrowRightIcon />
                </button>
              ) : (
                <Link
                  href={`/courses/${course.slug}`}
                  onClick={() => {
                    if (!isCurrentCompleted && userId) handleToggleComplete(false);
                  }}
                  className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
                >
                  <CheckIcon />
                  <span className="whitespace-nowrap">Selesaikan Kelas</span>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CourseLearnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
          <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Memuat ruang belajar...</span>
        </div>
      }
    >
      <LearnWorkspace />
    </Suspense>
  );
}