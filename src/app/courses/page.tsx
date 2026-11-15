'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';

interface CourseItem {
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

interface ModuleSummary {
  id: string;
  course_id: string;
}

interface LessonSummary {
  id: string;
  course_id: string;
  duration_minutes: number;
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
function AcademicCapIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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

function LockClosedIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LayersIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function ClockIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function CoursesCatalogPage() {
  const supabase = useMemo(() => createClient(), []);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'restricted'>('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    async function fetchCatalogData() {
      setLoading(true);

      const [coursesRes, modulesRes, lessonsRes, sessionRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, slug, category, level, description, thumbnail_url, instructor_name, is_free')
          .eq('status', 'published')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase.from('course_modules').select('id, course_id'),
        supabase.from('course_lessons').select('id, course_id, duration_minutes'),
        supabase.auth.getSession(),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data as CourseItem[]);
      if (modulesRes.data) setModules(modulesRes.data as ModuleSummary[]);
      if (lessonsRes.data) setLessons(lessonsRes.data as LessonSummary[]);

      const sessionUser = sessionRes.data?.session?.user;
      if (sessionUser) {
        setUserId(sessionUser.id);
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('lesson_id')
          .eq('user_id', sessionUser.id);

        if (progressData) {
          setCompletedLessonIds(new Set(progressData.map((p) => p.lesson_id)));
        }
      } else {
        setUserId(null);
      }

      setLoading(false);
    }

    fetchCatalogData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setCompletedLessonIds(new Set());
        setProgressFilter('all');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('user_course_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          setCompletedLessonIds(new Set(data.map((p) => p.lesson_id)));
        }
      });
  }, [userId, supabase]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
    return ['Semua', ...uniqueCats];
  }, [courses]);

  const levels = useMemo(() => {
    const uniqueLevels = Array.from(new Set(courses.map((c) => c.level).filter(Boolean)));
    return ['Semua', ...uniqueLevels];
  }, [courses]);

  const courseStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        moduleCount: number;
        lessonCount: number;
        totalMinutes: number;
        completedCount: number;
        progressPercent: number;
      }
    > = {};

    courses.forEach((course) => {
      const cModules = modules.filter((m) => m.course_id === course.id);
      const cLessons = lessons.filter((l) => l.course_id === course.id);
      const totalMinutes = cLessons.reduce((acc, item) => acc + (item.duration_minutes || 0), 0);
      const completedCount = cLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const progressPercent =
        cLessons.length > 0 ? Math.round((completedCount / cLessons.length) * 100) : 0;

      map[course.id] = {
        moduleCount: cModules.length,
        lessonCount: cLessons.length,
        totalMinutes,
        completedCount,
        progressPercent,
      };
    });

    return map;
  }, [courses, modules, lessons, completedLessonIds]);

  const activeCourseToResume = useMemo(() => {
    if (!userId) return null;
    return (
      courses.find((c) => {
        const st = courseStatsMap[c.id];
        return st && st.completedCount > 0 && st.completedCount < st.lessonCount;
      }) || null
    );
  }, [userId, courses, courseStatsMap]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchCategory = selectedCategory === 'Semua' || course.category === selectedCategory;
      const matchLevel = selectedLevel === 'Semua' || course.level === selectedLevel;
      const matchAccess =
        accessFilter === 'all' ||
        (accessFilter === 'free' && course.is_free) ||
        (accessFilter === 'restricted' && !course.is_free);

      const st = courseStatsMap[course.id];
      const matchProgress =
        progressFilter === 'all' ||
        (progressFilter === 'in_progress' &&
          st &&
          st.completedCount > 0 &&
          st.completedCount < st.lessonCount) ||
        (progressFilter === 'completed' &&
          st &&
          st.lessonCount > 0 &&
          st.completedCount === st.lessonCount);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        (course.description || '').toLowerCase().includes(q) ||
        (course.instructor_name || '').toLowerCase().includes(q) ||
        (course.category || '').toLowerCase().includes(q);

      return matchCategory && matchLevel && matchAccess && matchProgress && matchQuery;
    });
  }, [courses, selectedCategory, selectedLevel, accessFilter, progressFilter, searchQuery, courseStatsMap]);

  const hasActiveFilters =
    selectedCategory !== 'Semua' ||
    selectedLevel !== 'Semua' ||
    accessFilter !== 'all' ||
    progressFilter !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedCategory('Semua');
    setSelectedLevel('Semua');
    setAccessFilter('all');
    setProgressFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      <Navbar />

      {/* Control Panel Katalog Kelas */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              TheoQED Courses
            </h1>

            {/* Statistik & Input Pencarian */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!loading && courses.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{courses.length}</span>
                    <span className="text-slate-500 dark:text-slate-400">Kelas</span>
                  </div>
                  <div className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{lessons.length}</span>
                    <span className="text-slate-500 dark:text-slate-400">Materi</span>
                  </div>
                </div>
              )}

              <div className="relative w-full sm:w-72 md:w-80">
                <SearchIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari judul kelas, topik, pengajar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Baris Filter Kategori, Akses, Tingkat & Progres */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                  Bidang:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Akses */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'free', label: 'Gratis' },
                    { id: 'restricted', label: 'Premium' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAccessFilter(tab.id as typeof accessFilter)}
                      className={`h-7 px-3 rounded-lg transition cursor-pointer ${
                        accessFilter === tab.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Filter Tingkat */}
                {levels.length > 2 && (
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl === 'Semua' ? 'Semua Tingkat' : `Tingkat: ${lvl}`}
                      </option>
                    ))}
                  </select>
                )}

                {/* Filter Progres Pengguna */}
                {userId && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                    {[
                      { id: 'all', label: 'Semua Status' },
                      { id: 'in_progress', label: 'Sedang Dipelajari' },
                      { id: 'completed', label: 'Selesai' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProgressFilter(tab.id as typeof progressFilter)}
                        className={`h-7 px-3 rounded-lg transition cursor-pointer ${
                          progressFilter === tab.id
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Konten Utama Katalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* BANNER LANJUTKAN BELAJAR */}
        {!loading && activeCourseToResume && !hasActiveFilters && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/70 p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <span>Lanjutkan Belajar</span>
                <span>•</span>
                <span>
                  Progres {courseStatsMap[activeCourseToResume.id]?.progressPercent || 0}%
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeCourseToResume.title}
              </p>
            </div>

            <Link
              href={`/courses/${activeCourseToResume.slug}/learn`}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shrink-0"
            >
              <span className="whitespace-nowrap">Lanjutkan Materi</span>
              <ArrowRightIcon />
            </Link>
          </div>
        )}

        {/* GRID KATALOG KELAS */}
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <span>Memuat daftar kelas...</span>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const stats = courseStatsMap[course.id] || {
                moduleCount: 0,
                lessonCount: 0,
                totalMinutes: 0,
                completedCount: 0,
                progressPercent: 0,
              };
              const isCourseDone =
                stats.lessonCount > 0 && stats.completedCount === stats.lessonCount;
              const coverGradient = getCourseCoverGradient(course.category);

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Thumbnail / Cover Kelas */}
                    <div className="p-3 pb-0">
                      <div
                        className={`h-40 rounded-xl ${coverGradient} relative overflow-hidden flex flex-col justify-between p-4`}
                      >
                        {course.thumbnail_url ? (
                          <>
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-950/30 to-indigo-950/20" />
                          </>
                        ) : (
                          <>
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
                          </>
                        )}

                        <div className="relative z-10 flex items-center justify-between w-full gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md text-white border border-white/25">
                            {course.category}
                          </span>

                          {isCourseDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-white">
                              <CheckCircleIcon className="w-3 h-3" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/25">
                              {course.level}
                            </span>
                          )}
                        </div>

                        <div className="relative z-10 flex items-center gap-2.5 text-[11px] font-semibold text-white/95">
                          <span className="inline-flex items-center gap-1">
                            <LayersIcon className="w-3 h-3 text-white/85" />
                            <span>{stats.moduleCount} Bab</span>
                          </span>
                          <span>•</span>
                          <span>{stats.lessonCount} Materi</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 text-white/85" />
                            <span>± {stats.totalMinutes}m</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Judul & Deskripsi Kelas */}
                    <div className="p-5 pt-4 space-y-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                        {course.title}
                      </h2>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description ||
                          'Materi terstruktur lengkap dengan pembahasan konsep dan latihan soal.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Pengajar / Progres & Tombol Aksi */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {stats.completedCount > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span
                            className={
                              isCourseDone
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }
                          >
                            {isCourseDone ? 'Kelas Tuntas' : 'Progres Belajar'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {stats.completedCount}/{stats.lessonCount} ({stats.progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCourseDone ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${stats.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                          Oleh {course.instructor_name}
                        </span>
                        {course.is_free ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[11px] shrink-0">
                            Gratis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold text-[11px] shrink-0">
                            <LockClosedIcon className="w-3 h-3 text-amber-500" />
                            <span>Premium</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="w-full h-9 px-4 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition">
                      <span className="whitespace-nowrap">
                        {isCourseDone
                          ? 'Tinjau Silabus'
                          : stats.completedCount > 0
                          ? 'Lanjutkan Belajar'
                          : 'Lihat Silabus'}
                      </span>
                      <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 max-w-md mx-auto">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/80 dark:border-slate-700">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada kelas yang sesuai filter
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coba ubah kata kunci pencarian atau atur ulang filter kategori dan tingkat.
            </p>
            {hasActiveFilters && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Tampilkan Semua Kelas
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}