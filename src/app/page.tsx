'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MathText } from '@/components/MathText';
import { NoteModuleCard, NoteModuleCardData } from '@/components/NoteModuleCard';

interface CoursePreview {
  id: string;
  title: string;
  slug: string;
  category?: string;
  level?: string;
  description?: string;
  instructor_name?: string;
  is_free?: boolean;
  price?: number | null;
  thumbnail_url?: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  [key: string]: unknown;
}

function resolveMediaUrl(record: Record<string, unknown>): string {
  const priorityKeys = [
    'cover_url',
    'cover_image_url',
    'cover_image',
    'thumbnail_url',
    'banner_url',
    'image_url',
    'cover',
    'thumbnail',
    'banner',
    'image',
  ];

  for (const key of priorityKeys) {
    const val = record[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }

  return '';
}

// --- SVG ICONS ---
function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function AcademicCapIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function FolderIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function TheoremIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClipboardCheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CrownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

// --- KARTU COURSE ---
function CourseCard({ course }: { course: CoursePreview }) {
  const [imgError, setImgError] = useState(false);
  const coverSrc = resolveMediaUrl(course);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 overflow-hidden transition flex flex-col justify-between"
    >
      <div>
        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {coverSrc && !imgError ? (
            <img
              src={coverSrc}
              alt={course.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-indigo-500/10 via-blue-500/5 to-slate-100 dark:from-indigo-500/15 dark:via-blue-500/10 dark:to-slate-900 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
                <AcademicCapIcon className="w-6 h-6" />
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 text-indigo-700 dark:text-indigo-300 border border-slate-200/80 dark:border-slate-700 backdrop-blur-xs">
              {course.category || 'Matematika'}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border backdrop-blur-xs ${
                course.is_free
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                  : 'bg-slate-900/90 text-amber-300 border-slate-700'
              }`}
            >
              {course.is_free ? 'Gratis' : 'Premium'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-2">
          <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {course.description ||
              'Silabus terstruktur mencakup konsep fundamental, contoh pembuktian, dan latihan terarah.'}
          </p>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
          {course.instructor_name || 'TheoQED'}
        </span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 shrink-0">
          <span>Mulai Belajar</span>
          <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

const PREMIUM_PLANS = [
  {
    name: 'Paket 1 Bulan',
    badge: 'STANDAR',
    badgeStyle:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
    price: 'Rp100.000',
    perMonth: 'Rp100.000 / bulan',
    featured: false,
  },
  {
    name: 'Paket 3 Bulan',
    badge: 'HEMAT 5%',
    badgeStyle:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    price: 'Rp285.000',
    perMonth: 'Rp95.000 / bulan',
    featured: false,
  },
  {
    name: 'Paket 6 Bulan',
    badge: 'HEMAT 8% • POPULER',
    badgeStyle: 'bg-indigo-600 text-white border-indigo-600',
    price: 'Rp550.000',
    perMonth: 'Rp91.600 / bulan',
    featured: true,
  },
  {
    name: 'Paket 1 Tahun',
    badge: 'HEMAT 17% • PALING HEMAT',
    badgeStyle:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    price: 'Rp1.000.000',
    perMonth: 'Rp83.300 / bulan',
    featured: false,
  },
];

const PREMIUM_FEATURES = [
  'Akses seluruh soal & folder Premium',
  'Semua metode pembahasan & kunci jawaban',
  'Kontribusi solusi pada soal eksklusif',
];

export default function HomePage() {
  const [stats, setStats] = useState({
    problems: 0,
    theorems: 0,
    notes: 0,
    tryouts: 0,
    courses: 0,
  });
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteModuleCardData[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<CoursePreview[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);

      const [
        pCountRes,
        thCountRes,
        nCountRes,
        tCountRes,
        cCountRes,
        problemsRes,
        notesRes,
        coursesRes,
      ] = await Promise.all([
        supabase.from('problems').select('id', { count: 'exact', head: true }),
        supabase.from('theorems').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('tryouts').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase
          .from('problems')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('notes')
          .select('id, title, slug, description, topic, is_premium, created_at, note_chapters(id, parent_id)')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      setStats({
        problems: pCountRes.count || 0,
        theorems: thCountRes.count || 0,
        notes: nCountRes.count || 0,
        tryouts: tCountRes.count || 0,
        courses: cCountRes.count || 0,
      });

      if (problemsRes.data) setRecentProblems(problemsRes.data as Problem[]);
      if (notesRes.data) setRecentNotes(notesRes.data as NoteModuleCardData[]);
      if (coursesRes.data) setFeaturedCourses(coursesRes.data as CoursePreview[]);

      setLoadingData(false);
    }

    loadData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-24">
        <Navbar />

        {/* 1. FULL-VIEWPORT CENTERED HERO SECTION */}
        <section className="relative min-h-[calc(100svh-4rem)] flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080800f_1px,transparent_1px),linear-gradient(to_bottom,#8080800f_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-80 bg-linear-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-4xl mx-auto w-full text-center space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Developed by @davemarcellino_</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.06]">
              <span className="text-indigo-600 dark:text-indigo-400">√ </span>TheoQED<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Platform bank soal olimpiade matematika (ONMIPA/OSN), kelas terstruktur, kumpulan teorema beserta pembuktian, modul catatan kuliah (TheoNotes), serta simulasi ujian Try Out CBT.
            </p>

            {/* Primary CTA (Arsip & Bank Soal dengan ikon) + 3 Tombol Putih Tanpa Ikon (TheoNotes | Courses | Try Out) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-2">
              <Link
                href="/arsip"
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <FolderIcon />
                <span>Arsip &amp; Bank Soal</span>
                <ArrowRightIcon />
              </Link>

              <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-2.5 sm:gap-3">
                <Link
                  href="/notes"
                  className="h-11 px-4 sm:px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-xl transition inline-flex items-center justify-center whitespace-nowrap"
                >
                  TheoNotes
                </Link>

                <Link
                  href="/courses"
                  className="h-11 px-4 sm:px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-xl transition inline-flex items-center justify-center whitespace-nowrap"
                >
                  Courses
                </Link>

                <Link
                  href="/tryout"
                  className="h-11 px-4 sm:px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-xl transition inline-flex items-center justify-center whitespace-nowrap"
                >
                  Try Out
                </Link>
              </div>
            </div>

            {/* Live Stats Bar */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats.problems || '50+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Soal &amp; Solusi
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats.theorems || '15+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Teorema Terkurasi
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats.notes || '5+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Modul TheoNotes
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stats.courses + stats.tryouts || '10+'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Courses &amp; Paket CBT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. EKOSISTEM BELAJAR THEOQED */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
          <div className="space-y-1 max-w-2xl">
            <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Ekosistem Belajar
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Fitur Utama TheoQED
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Utama: Arsip Bank Soal */}
            <Link
              href="/arsip"
              className="md:col-span-7 group bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between gap-6"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900">
                    <FolderIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    Koleksi Utama
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Arsip &amp; Bank Soal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Penjelajah folder soal ONMIPA, OSN, dan ujian perguruan tinggi lengkap dengan filter topik, pencarian cepat, petunjuk penyelesaian, serta solusi terstruktur.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span>Buka Arsip Soal</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Courses */}
            <Link
              href="/courses"
              className="md:col-span-5 group bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition flex flex-col justify-between gap-6"
            >
              <div className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/90 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900 w-fit">
                  <AcademicCapIcon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Courses &amp; Silabus
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Belajar bertahap per bab melalui materi bacaan LaTeX, video pembahasan, latihan interaktif, dan pelacakan progres otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span>Lihat Daftar Courses</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* TheoNotes */}
            <Link
              href="/notes"
              className="md:col-span-4 group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/90 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-900 w-fit">
                  <BookOpenIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    TheoNotes Library
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Catatan kuliah ringkas dan modul rangkuman konsep matematika dengan navigasi yang terstruktur.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                <span>Baca Catatan</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Kumpulan Teorema */}
            <Link
              href="/teorema"
              className="md:col-span-4 group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900 w-fit">
                  <TheoremIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Kumpulan Teorema
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Direktori teorema, lemma, dan prinsip penting lengkap dengan intuisi penggunaan serta pembuktian formal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                <span>Lihat Teorema</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Simulasi Try Out CBT */}
            <Link
              href="/tryout"
              className="md:col-span-4 group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/90 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900 w-fit">
                  <ClipboardCheckIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    Simulasi Try Out CBT
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Latihan ujian berbatas waktu dengan penilaian otomatis dan tinjauan pembahasan pasca-simulasi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                <span>Mulai Simulasi</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>

        {/* 3. COURSES TERBARU (MAKSIMAL 3 KELAS) */}
        {(loadingData || featuredCourses.length > 0) && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Kurikulum Terstruktur
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Courses Terbaru
                </h2>
              </div>

              <Link
                href="/courses"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
              >
                <span>Semua Courses</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featuredCourses.slice(0, 3).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. SOAL TERBARU (3 BARIS HORIZONTAL, TAMPIL FULL TANPA TERPOTONG) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Soal Terbaru
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Soal dan pembahasan yang baru saja ditambahkan ke arsip TheoQED.
              </p>
            </div>

            <Link
              href="/arsip"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Lihat Semua</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingData ? (
            <div className="space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : recentProblems.length > 0 ? (
            <div className="space-y-3.5">
              {recentProblems.slice(0, 3).map((prob) => (
                <div
                  key={prob.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200/70 dark:border-indigo-900">
                        {prob.competition} {prob.year}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {prob.topic}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {prob.id}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
                      <MathText text={prob.statement} />
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-5">
                    <Link
                      href={`/problems/${prob.prob_slug || prob.id}`}
                      className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2 border border-indigo-100 dark:border-indigo-900/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 whitespace-nowrap"
                    >
                      <span>Buka Solusi</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
              Belum ada soal terbaru di basis data.
            </div>
          )}
        </section>

        {/* 5. MODUL THEONOTES TERBARU (DERET KARTU IDENTIK DENGAN /notes) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Catatan Kuliah &amp; Ringkasan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Modul TheoNotes Terbaru
              </h2>
            </div>

            <Link
              href="/notes"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Semua Catatan</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentNotes.map((note) => (
                <NoteModuleCard key={note.id} module={note} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
              Belum ada catatan kuliah di TheoNotes.
            </div>
          )}
        </section>

        {/* 6. PAKET AKSES PREMIUM */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <CrownIcon />
              <span>THEOQED PREMIUM</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pilih Paket Akses Premium
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Buka seluruh arsip folder eksklusif, petunjuk penyelesaian, kunci jawaban resmi, serta beragam metode pembahasan lengkap.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PREMIUM_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col justify-between gap-6 border transition ${
                  plan.featured
                    ? 'border-indigo-500 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${plan.badgeStyle}`}
                  >
                    {plan.badge}
                  </span>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.price}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{plan.perMonth}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    {PREMIUM_FEATURES.map((feat) => (
                      <div
                        key={feat}
                        className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                      >
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/upgrade"
                  className={`w-full h-10 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center ${
                    plan.featured
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  Pilih Paket Ini
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}