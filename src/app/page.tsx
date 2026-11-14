'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Problem } from '@/types';
import { Theorem } from '@/types/theorem';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MathText } from '@/components/MathText';

interface NotePreview {
  id: string | number;
  slug?: string;
  title?: string;
  subject?: string;
  category?: string;
  description?: string;
  summary?: string;
  created_at?: string;
}

// --- SVG ICONS ---
function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function FolderIcon({ className = 'w-5 h-5' }: { className?: string }) {
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

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

// --- CUSTOM GEOMETRIC & MATHEMATICAL HERO ILLUSTRATION ---
function HeroMathIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      {/* Glow halus di belakang ilustrasi */}
      <div className="absolute -inset-4 bg-linear-to-tr from-blue-500/15 via-indigo-500/10 to-sky-400/15 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {/* Header Bar Minimalis */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <span>FIG 1.0 — EUCLIDEAN &amp; ANALYTIC SPACE</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">Q.E.D. ■</span>
        </div>

        {/* SVG Ilustrasi Geometris & Kurva Fungsi */}
        <svg
          viewBox="0 0 460 300"
          className="w-full h-auto mt-3"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Ilustrasi Geometris dan Analisis Matematika TheoQED"
        >
          <defs>
            <pattern id="mathGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                stroke="currentColor"
                className="text-slate-200/70 dark:text-slate-800/80"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="integralFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>

          {/* Grid Latar */}
          <rect x="12" y="12" width="436" height="276" rx="16" fill="url(#mathGrid)" />

          {/* Sumbu Kartesius */}
          <line x1="44" y1="220" x2="416" y2="220" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1.5" />
          <line x1="110" y1="32" x2="110" y2="268" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1.5" />

          {/* Lingkaran Geometri & Segitiga Dalam (Kiri Atas) */}
          <circle
            cx="110"
            cy="120"
            r="58"
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <polygon
            points="110,62 60,149 160,149"
            stroke="#0EA5E9"
            strokeWidth="1.75"
            fill="#0EA5E9"
            fillOpacity="0.06"
          />
          <circle cx="110" cy="62" r="4" fill="#0EA5E9" />
          <circle cx="60" cy="149" r="4" fill="#0EA5E9" />
          <circle cx="160" cy="149" r="4" fill="#0EA5E9" />

          {/* Area Integral di Bawah Kurva */}
          <path
            d="M 150 220 L 150 185 C 195 160, 225 78, 275 88 C 320 97, 345 155, 385 110 L 385 220 Z"
            fill="url(#integralFill)"
          />

          {/* Batas Vertikal Integral a dan b */}
          <line x1="150" y1="185" x2="150" y2="220" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="385" y1="110" x2="385" y2="220" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Kurva Fungsi Utama */}
          <path
            d="M 55 245 C 105 225, 125 198, 150 185 C 195 160, 225 78, 275 88 C 320 97, 345 155, 385 110 C 400 93, 412 76, 422 62"
            stroke="url(#curveStroke)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Garis Singgung (Tangent Line) pada Titik Ekstrem Lokal */}
          <line x1="210" y1="86" x2="335" y2="86" stroke="#10B981" strokeWidth="1.75" strokeDasharray="5 4" />
          <circle cx="272" cy="86" r="5.5" fill="#10B981" />
          <circle cx="272" cy="86" r="10" stroke="#10B981" strokeOpacity="0.35" strokeWidth="2" />

          {/* Titik Simpul di Kurva */}
          <circle cx="150" cy="185" r="4.5" fill="#2563EB" />
          <circle cx="385" cy="110" r="4.5" fill="#6366F1" />

          {/* Label Notasi Geometris */}
          <text x="146" y="238" fill="currentColor" className="text-slate-500 dark:text-slate-400 text-[12px] font-mono">
            a
          </text>
          <text x="381" y="238" fill="currentColor" className="text-slate-500 dark:text-slate-400 text-[12px] font-mono">
            b
          </text>
          <text x="242" y="72" fill="#10B981" className="text-[11px] font-mono font-bold">
            f&apos;(x₀) = 0
          </text>
          <text x="235" y="175" fill="#2563EB" className="text-[12px] font-mono font-bold">
            ∫ f(x) dx
          </text>
        </svg>

        {/* Strip Tag Bidang di Bawah Ilustrasi */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Analisis • Aljabar • Kombinatorika • Geometri</span>
          <span className="font-mono text-slate-400 dark:text-slate-500">∀ε &gt; 0, ∃δ &gt; 0</span>
        </div>
      </div>
    </div>
  );
}

const MATH_DOMAINS = [
  {
    symbol: '∫',
    title: 'Analisis Real & Kalkulus',
    topics: 'Barisan & deret, kekontinuan, diferensial, integral tak wajar, hingga ruang metrik.',
    accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border-blue-200/70 dark:border-blue-900',
  },
  {
    symbol: 'det',
    title: 'Aljabar Linear & Abstrak',
    topics: 'Matriks, nilai eigen, ruang vektor, polinomial, grup, ring, dan homomorfisma.',
    accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200/70 dark:border-indigo-900',
  },
  {
    symbol: '∑',
    title: 'Kombinatorika & Graf',
    topics: 'Prinsip pencacahan, inklusi-eksklusi, pigeonhole principle, rekurensi, dan teori graf.',
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200/70 dark:border-emerald-900',
  },
  {
    symbol: '≡',
    title: 'Teori Bilangan',
    topics: 'Keterbagian, kongruensi modular, teorema Euler-Fermat, fungsi aritmetika, dan persamaan Diophantine.',
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border-amber-200/70 dark:border-amber-900',
  },
  {
    symbol: '△',
    title: 'Geometri & Trigonometri',
    topics: 'Geometri bidang klasik, kesebangunan, lingkaran, ketaksamaan geometri, dan transformasi.',
    accent: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 border-purple-200/70 dark:border-purple-900',
  },
];

export default function HomePage() {
  const [stats, setStats] = useState({ problems: 0, theorems: 0, notes: 0, tryouts: 0 });
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [featuredTheorems, setFeaturedTheorems] = useState<Theorem[]>([]);
  const [recentNotes, setRecentNotes] = useState<NotePreview[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);

      const [pCountRes, thCountRes, nCountRes, tCountRes, problemsRes, theoremsRes, notesRes] =
        await Promise.all([
          supabase.from('problems').select('id', { count: 'exact', head: true }),
          supabase.from('theorems').select('id', { count: 'exact', head: true }),
          supabase.from('notes').select('id', { count: 'exact', head: true }),
          supabase.from('tryouts').select('id', { count: 'exact', head: true }),
          supabase
            .from('problems')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('theorems')
            .select('*')
            .order('order_index', { ascending: true })
            .limit(3),
          supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

      setStats({
        problems: pCountRes.count || 0,
        theorems: thCountRes.count || 0,
        notes: nCountRes.count || 0,
        tryouts: tCountRes.count || 0,
      });

      if (problemsRes.data) {
        setRecentProblems(problemsRes.data as Problem[]);
      }

      if (theoremsRes.data) {
        setFeaturedTheorems(theoremsRes.data as Theorem[]);
      }

      if (notesRes.data) {
        setRecentNotes(notesRes.data as NotePreview[]);
      }

      setLoadingData(false);
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-24">
        <Navbar />

        {/* HERO SECTION */}
        <section className="relative pt-12 sm:pt-16 pb-16 px-4 sm:px-6 overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-72 bg-linear-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/80 dark:border-blue-800 shadow-2xs">
                <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Developed by @davemarcellino_</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                Platform bank soal olimpiade matematika (ONMIPA/OSN), kumpulan teorema beserta pembuktian, modul catatan kuliah (TheoNotes), serta simulasi ujian Try Out CBT.
              </p>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center lg:justify-start gap-3 w-full pt-1">
                <Link
                  href="/arsip"
                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
                >
                  <FolderIcon className="w-4 h-4" />
                  <span>Arsip &amp; Bank Soal</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/teorema"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl shadow-2xs transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <TheoremIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Teorema</span>
                  </Link>

                  <Link
                    href="/tryout"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl shadow-2xs transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <ClipboardCheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Try Out</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/70 leading-none">
                      BETA
                    </span>
                  </Link>
                </div>
              </div>

              {/* Quick Live Stats */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800/80">
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">
                    {stats.problems || '50+'}
                  </strong>
                  <span>Soal &amp; Pembahasan</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">
                    {stats.theorems || '15+'}
                  </strong>
                  <span>Teorema Terkurasi</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">
                    {stats.notes || '5+'}
                  </strong>
                  <span>Modul TheoNotes</span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <strong className="text-slate-900 dark:text-white text-base font-black block">
                    {stats.tryouts || '5+'}
                  </strong>
                  <span>Paket Try Out</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Custom Geometric & Mathematical Illustration */}
            <div className="lg:col-span-5">
              <HeroMathIllustration />
            </div>
          </div>
        </section>

        {/* SECTION 1: EMPAT PILAR PERSIAPAN MATEMATIKA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 space-y-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Ekosistem Belajar
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Empat Pilar Persiapan Matematika
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
              Dirancang terintegrasi mulai dari pemahaman teori, referensi teorema, latihan soal terstruktur, hingga simulasi ujian.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Arsip Bank Soal */}
            <Link
              href="/arsip"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 w-fit">
                  <FolderIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Arsip Bank Soal
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Penjelajah folder soal ONMIPA, OSN, dan ujian mata kuliah lengkap dengan filter topik dan pencarian cepat.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>Buka Bank Soal</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 2: Kumpulan Teorema */}
            <Link
              href="/teorema"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 w-fit">
                  <TheoremIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Kumpulan Teorema
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Referensi cepat teorema, lemma, dan prinsip fundamental beserta intuisi pemakaian dan pembuktian formal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                <span>Lihat Teorema</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 3: TheoNotes */}
            <Link
              href="/notes"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 w-fit">
                  <BookOpenIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    TheoNotes Library
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Catatan ringkas dan rangkuman materi perkuliahan matematika dengan navigasi daftar isi yang terstruktur.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                <span>Baca Catatan</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Card 4: Simulasi Try Out CBT */}
            <Link
              href="/tryout"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 w-fit">
                    <ClipboardCheckIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-100/90 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/70">
                    BETA
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Simulasi Try Out CBT
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Latihan ujian berwaktu menggunakan soal-soal dari arsip dengan evaluasi skor dan pembahasan langsung.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                <span>Mulai Simulasi</span>
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* SECTION 2: CAKUPAN BIDANG MATEMATIKA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 space-y-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Klasifikasi Materi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Cakupan Bidang Matematika
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
              Seluruh soal, teorema, dan catatan disusun berdasarkan cabang utama matematika olimpiade maupun perguruan tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MATH_DOMAINS.map((domain) => (
              <Link
                key={domain.title}
                href="/arsip"
                className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-serif font-bold text-base ${domain.accent}`}>
                    {domain.symbol}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {domain.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {domain.topics}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  <span>Telusuri Arsip</span>
                  <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 3: SOAL TERBARU (4 BARIS HORIZONTAL) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Soal Terbaru
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Daftar soal dan pembahasan yang baru saja diunggah ke basis data TheoQED.
              </p>
            </div>

            <Link
              href="/arsip"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 shrink-0"
            >
              <span>Lihat Semua</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingData ? (
            <div className="space-y-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : recentProblems.length > 0 ? (
            <div className="space-y-3.5">
              {recentProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200/70 dark:border-blue-900">
                        {prob.competition} {prob.year}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {prob.topic}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {prob.id}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-normal line-clamp-2 leading-relaxed">
                      <MathText text={prob.statement} />
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-100 sm:dark:border-slate-800/80 sm:pl-5">
                    <Link
                      href={`/problems/${prob.prob_slug || prob.id}`}
                      className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2 border border-blue-100 dark:border-blue-900/60 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-2xs"
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

        {/* SECTION 4: REFERENSI TEOREMA & MODUL THEONOTES (DINAMIS DARI DATABASE) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kolom Kiri: Sorotan Teorema */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Perpustakaan Teorema
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Teorema &amp; Prinsip Penting
                </h2>
              </div>
              <Link
                href="/teorema"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Semua Teorema</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : featuredTheorems.length > 0 ? (
              <div className="space-y-3">
                {featuredTheorems.map((th) => (
                  <Link
                    key={th.id}
                    href={`/teorema/${th.slug}`}
                    className="group block bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-900">
                        {th.field}
                      </span>
                      {th.mathematicians && (
                        <span className="text-[11px] font-medium text-slate-400 truncate">
                          {th.mathematicians}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {th.title}
                    </h3>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      <MathText text={th.statement} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
                Belum ada teorema yang dipublikasikan.
              </div>
            )}
          </div>

          {/* Kolom Kanan: Modul TheoNotes */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Catatan Kuliah &amp; Ringkasan
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Modul TheoNotes Terbaru
                </h2>
              </div>
              <Link
                href="/notes"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Semua Catatan</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.slug || note.id}`}
                    className="group block bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-2xs transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-md border border-purple-200/70 dark:border-purple-900">
                        {note.subject || note.category || 'TheoNotes'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                        Baca Modul →
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      {note.title || `Catatan #${note.id}`}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {note.description || note.summary || 'Rangkuman konsep, definisi formal, dan contoh penerapan terstruktur.'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
                Belum ada catatan kuliah di TheoNotes.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: ALUR BELAJAR & CTA PENUTUP */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-2xs space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div className="space-y-1.5 max-w-2xl">
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Alur Belajar Terstruktur
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Siap Mengasah Intuisi &amp; Pembuktian Matematis?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gunakan kombinasi referensi teorema, arsip soal kompetisi, dan simulasi berwaktu untuk mempersiapkan diri menghadapi ONMIPA-PT, OSN, maupun ujian akhir semester.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/arsip"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
                >
                  <span>Mulai dari Arsip Soal</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/bookmarks"
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Lihat Soal Tersimpan
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                  01 / KONSEP &amp; TEOREMA
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pahami Fondasi &amp; Lemma
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pelajari definisi formal dan ide pembuktian melalui modul TheoNotes serta direktori Teorema sebelum berhadapan dengan soal non-rutin.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                  02 / EKSPLORASI ARSIP
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Bedah Soal Kompetisi &amp; Kuliah
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Filter soal berdasarkan ajang atau topik, coba kerjakan secara mandiri, lalu bandingkan langkah pembuktianmu dengan solusi lengkap.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                  03 / EVALUASI CBT
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Uji Ketahanan &amp; Manajemen Waktu
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ikuti paket simulasi Try Out berwaktu untuk mengukur ketepatan pengerjaan sekaligus meninjau ulang soal-soal yang perlu diperdalam.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}