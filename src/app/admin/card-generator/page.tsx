'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Script from 'next/script';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

interface HtmlToImageLib {
  toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>;
  toBlob: (node: HTMLElement, options?: Record<string, unknown>) => Promise<Blob | null>;
}

declare global {
  interface Window {
    htmlToImage?: HtmlToImageLib;
  }
}

// --- TYPES ---
type CardVariant = 'theorem' | 'problem' | 'proof';
type PatternType = 'none' | 'grid' | 'dots';
type FontStyle = 'serif' | 'sans';
type FontSizeKey = 'sm' | 'md' | 'lg';
type TextAlignKey = 'left' | 'center';

interface CardSlide {
  id: string;
  variant: CardVariant;
  topic: string;
  badgeRight: string;
  title: string;
  subtitle: string;
  latexContent: string;
  calloutTitle: string;
  calloutContent: string;
}

interface ThemePreset {
  id: string;
  name: string;
  swatch: string;
  bg: string;
  accent: string;
  calloutBg: string;
  border: string;
  brandColor: string;
  gridColor: string;
  cardBg: string;
}

interface AspectRatioPreset {
  id: string;
  label: string;
  desc: string;
  widthClass: string;
  heightClass: string;
  baseWidth: number;
  baseHeight: number;
}

interface DbTheoremRow {
  id: string;
  title: string;
  field: string;
  topic: string;
  mathematicians?: string | null;
  statement: string;
  intuition?: string | null;
  proof_steps?: Array<{ step: number; tag?: string; content: string }> | null;
}

interface DbProblemRow {
  id: string;
  title?: string | null;
  statement?: string | null;
  content?: string | null;
  question?: string | null;
  topic?: string | null;
  category?: string | null;
  field?: string | null;
  difficulty?: string | null;
  source?: string | null;
  solution?: string | null;
  explanation?: string | null;
}

// --- PRESETS ---
const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight',
    name: 'Midnight Dark',
    swatch: 'bg-slate-950 border-indigo-500',
    bg: 'bg-slate-950 text-slate-100',
    accent: 'text-indigo-300 bg-indigo-950/90 border-indigo-800/80',
    calloutBg: 'bg-slate-900/90 border-slate-800 text-slate-200',
    border: 'border-slate-800',
    brandColor: 'text-indigo-400',
    gridColor: 'rgba(148, 163, 184, 0.07)',
    cardBg: '#020617',
  },
  {
    id: 'light',
    name: 'Academic Light',
    swatch: 'bg-white border-slate-300',
    bg: 'bg-white text-slate-900',
    accent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    calloutBg: 'bg-slate-50 border-slate-200/90 text-slate-700',
    border: 'border-slate-200',
    brandColor: 'text-indigo-600',
    gridColor: 'rgba(15, 23, 42, 0.05)',
    cardBg: '#ffffff',
  },
  {
    id: 'blueprint',
    name: 'Indigo Blueprint',
    swatch: 'bg-indigo-950 border-indigo-400',
    bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white',
    accent: 'text-sky-300 bg-sky-950/70 border-sky-700/60',
    calloutBg: 'bg-indigo-950/70 border-indigo-800/70 text-indigo-100',
    border: 'border-indigo-800/60',
    brandColor: 'text-sky-400',
    gridColor: 'rgba(129, 140, 248, 0.11)',
    cardBg: '#0f172a',
  },
  {
    id: 'emerald',
    name: 'Chalkboard',
    swatch: 'bg-emerald-950 border-emerald-500',
    bg: 'bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-950 text-emerald-50',
    accent: 'text-emerald-300 bg-emerald-950/90 border-emerald-700/70',
    calloutBg: 'bg-emerald-950/60 border-emerald-800/70 text-emerald-100',
    border: 'border-emerald-800/60',
    brandColor: 'text-emerald-400',
    gridColor: 'rgba(52, 211, 153, 0.08)',
    cardBg: '#022c22',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Gold',
    swatch: 'bg-neutral-950 border-amber-500',
    bg: 'bg-neutral-950 text-neutral-100',
    accent: 'text-amber-300 bg-amber-950/70 border-amber-700/60',
    calloutBg: 'bg-neutral-900/90 border-amber-900/40 text-neutral-200',
    border: 'border-neutral-800',
    brandColor: 'text-amber-400',
    gridColor: 'rgba(251, 191, 36, 0.06)',
    cardBg: '#0a0a0a',
  },
];

const ASPECT_RATIOS: AspectRatioPreset[] = [
  {
    id: '1:1',
    label: '1:1 Square',
    desc: 'Feed IG / X',
    widthClass: 'w-[480px]',
    heightClass: 'h-[480px]',
    baseWidth: 480,
    baseHeight: 480,
  },
  {
    id: '4:5',
    label: '4:5 Portrait',
    desc: 'Carousel IG',
    widthClass: 'w-[432px]',
    heightClass: 'h-[540px]',
    baseWidth: 432,
    baseHeight: 540,
  },
  {
    id: '9:16',
    label: '9:16 Story',
    desc: 'IG Story / Reels',
    widthClass: 'w-[360px]',
    heightClass: 'h-[640px]',
    baseWidth: 360,
    baseHeight: 640,
  },
  {
    id: '16:9',
    label: '16:9 Slide',
    desc: 'Presentasi',
    widthClass: 'w-[600px]',
    heightClass: 'h-[337.5px]',
    baseWidth: 600,
    baseHeight: 337.5,
  },
];

const VARIANT_OPTIONS: Array<{ id: CardVariant; label: string; footerTag: string }> = [
  { id: 'theorem', label: 'Teorema / Konsep', footerTag: 'THEOREM' },
  { id: 'problem', label: 'Tantangan Soal', footerTag: 'PROBLEM' },
  { id: 'proof', label: 'Pembahasan / Bukti', footerTag: 'Q.E.D.' },
];

const LATEX_SNIPPETS = [
  { label: '$$...$$', insert: '\n$$\n\n$$\n' },
  { label: '$...$', insert: '$$' },
  { label: 'Pecahan', insert: '\\frac{a}{b}' },
  { label: 'Sigma', insert: '\\sum_{i=1}^{n} ' },
  { label: 'Integral', insert: '\\int_{a}^{b} f(x)\\,dx' },
  { label: 'Modulo', insert: '\\equiv 0 \\pmod{m}' },
  { label: 'Implikasi', insert: '\\implies ' },
  { label: 'Akar', insert: '\\sqrt{x}' },
];

const INITIAL_SLIDE: CardSlide = {
  id: 'slide-1',
  variant: 'theorem',
  topic: 'TEORI BILANGAN',
  badgeRight: 'KLASIK',
  title: 'Teorema Sisa Cina (CRT)',
  subtitle: 'Sunzi Suanjing · Abad ke-3 M',
  latexContent:
    'Diberikan sistem kongruensi linier:\n$$x \\equiv a_1 \\pmod{m_1}$$\n$$x \\equiv a_2 \\pmod{m_2}$$\nJika $\\gcd(m_1, m_2) = 1$, maka solusi $x$ bersifat unik secara modulo $M = m_1 m_2$.',
  calloutTitle: 'Intuisi Utama',
  calloutContent:
    'Setiap sisa pembagian terhadap dua modulus yang saling koprima menentukan tepat satu residu unik dalam siklus $m_1 m_2$.',
};

// --- ICONS ---
function ImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DatabaseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
}

function PlusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function CardMathText({
  text,
  fontStyle = 'serif',
}: {
  text: string;
  fontStyle?: FontStyle;
}) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className={`leading-relaxed ${fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code
                key={index}
                className="text-red-400 font-mono text-xs block text-center my-2"
              >
                {part}
              </code>
            );
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return (
              <code key={index} className="text-red-400 font-mono text-xs">
                {part}
              </code>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default function MathCardGeneratorPage() {
  const supabase = useMemo(() => createClient(), []);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Export & Feedback States
  const [downloading, setDownloading] = useState(false);
  const [batchExporting, setBatchExporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [pixelRatio, setPixelRatio] = useState<number>(3);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');

  // Carousel Slides State
  const [slides, setSlides] = useState<CardSlide[]>([INITIAL_SLIDE]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Global Card Design States
  const [watermark, setWatermark] = useState('TheoQED Academy • @davemarcellino_');
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioPreset>(ASPECT_RATIOS[0]);
  const [pattern, setPattern] = useState<PatternType>('grid');
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif');
  const [fontSize, setFontSize] = useState<FontSizeKey>('md');
  const [textAlign, setTextAlign] = useState<TextAlignKey>('left');
  const [showBgSymbol, setShowBgSymbol] = useState<boolean>(true);
  const [showSlideIndicator, setShowSlideIndicator] = useState<boolean>(true);

  // Database Import Modal States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importSource, setImportSource] = useState<'theorems' | 'problems'>('theorems');
  const [importSearch, setImportSearch] = useState('');
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbTheorems, setDbTheorems] = useState<DbTheoremRow[]>([]);
  const [dbProblems, setDbProblems] = useState<DbProblemRow[]>([]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Auto-adjust preview zoom on smaller screens
  useEffect(() => {
    const updateZoom = () => {
      if (window.innerWidth < 640) {
        setPreviewZoom(0.68);
      } else if (window.innerWidth < 1280) {
        setPreviewZoom(0.88);
      } else {
        setPreviewZoom(1);
      }
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  // Update field on current slide
  const updateCurrentSlide = (patch: Partial<CardSlide>) => {
    setSlides((prev) =>
      prev.map((slide, idx) => (idx === activeSlideIndex ? { ...slide, ...patch } : slide))
    );
  };

  // Insert LaTeX snippet at textarea cursor
  const handleInsertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      updateCurrentSlide({ latexContent: `${currentSlide.latexContent}${snippet}` });
      return;
    }
    const start = el.selectionStart ?? currentSlide.latexContent.length;
    const end = el.selectionEnd ?? currentSlide.latexContent.length;
    const nextText =
      currentSlide.latexContent.slice(0, start) +
      snippet +
      currentSlide.latexContent.slice(end);
    updateCurrentSlide({ latexContent: nextText });

    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = snippet === '$$' ? start + 1 : start + snippet.length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };

  // --- SLIDE MANAGEMENT ---
  const handleAddSlide = () => {
    const newSlide: CardSlide = {
      id: `slide-${Date.now()}`,
      variant: 'proof',
      topic: currentSlide.topic,
      badgeRight: `SLIDE ${slides.length + 1}`,
      title: `${currentSlide.title} (Lanjutan)`,
      subtitle: '',
      latexContent: 'Langkah pembuktian atau pembahasan:\n$$\\therefore \\text{Terbukti.}$$',
      calloutTitle: '',
      calloutContent: '',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    const copy: CardSlide = {
      ...currentSlide,
      id: `slide-${Date.now()}`,
    };
    const nextSlides = [...slides];
    nextSlides.splice(activeSlideIndex + 1, 0, copy);
    setSlides(nextSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) return;
    const nextSlides = slides.filter((_, idx) => idx !== index);
    setSlides(nextSlides);
    setActiveSlideIndex(Math.max(0, Math.min(activeSlideIndex, nextSlides.length - 1)));
  };

  // --- DATABASE IMPORT ---
  const openImportModal = async () => {
    setIsImportOpen(true);
    setImportSearch('');
    setLoadingDb(true);

    const [theoremsRes, problemsRes] = await Promise.all([
      supabase
        .from('theorems')
        .select('id, title, field, topic, mathematicians, statement, intuition, proof_steps')
        .order('order_index', { ascending: true })
        .limit(60),
      supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60),
    ]);

    if (theoremsRes.data) setDbTheorems(theoremsRes.data as DbTheoremRow[]);
    if (problemsRes.data) setDbProblems(problemsRes.data as DbProblemRow[]);
    setLoadingDb(false);
  };

  const applyTheoremToCard = (item: DbTheoremRow, asCarousel: boolean) => {
    const mainSlide: CardSlide = {
      id: `slide-${Date.now()}-1`,
      variant: 'theorem',
      topic: (item.field || 'MATEMATIKA').toUpperCase(),
      badgeRight: (item.topic || 'TEOREMA').toUpperCase(),
      title: item.title,
      subtitle: item.mathematicians || '',
      latexContent: item.statement,
      calloutTitle: item.intuition ? 'Intuisi & Penggunaan' : '',
      calloutContent: item.intuition || '',
    };

    if (asCarousel && Array.isArray(item.proof_steps) && item.proof_steps.length > 0) {
      const stepsText = item.proof_steps
        .map(
          (s, idx) =>
            `${idx + 1}. ${s.tag ? `[${s.tag}] ` : ''}${s.content}`
        )
        .join('\n\n');

      const proofSlide: CardSlide = {
        id: `slide-${Date.now()}-2`,
        variant: 'proof',
        topic: (item.field || 'MATEMATIKA').toUpperCase(),
        badgeRight: 'PEMBUKTIAN',
        title: `Bukti: ${item.title}`,
        subtitle: '',
        latexContent: stepsText,
        calloutTitle: '',
        calloutContent: '',
      };

      setSlides([mainSlide, proofSlide]);
      setActiveSlideIndex(0);
    } else {
      updateCurrentSlide(mainSlide);
    }

    setIsImportOpen(false);
  };

  const applyProblemToCard = (item: DbProblemRow, includeSolutionSlide: boolean) => {
    const problemBody = item.statement || item.content || item.question || '';
    const problemTopic = (item.topic || item.category || item.field || 'LATIHAN SOAL').toUpperCase();
    const problemBadge = (item.difficulty || item.source || 'OLIMPIADE').toUpperCase();
    const problemTitle = item.title || 'Tantangan Matematika';
    const solutionBody = item.solution || item.explanation || '';

    const questionSlide: CardSlide = {
      id: `slide-${Date.now()}-1`,
      variant: 'problem',
      topic: problemTopic,
      badgeRight: problemBadge,
      title: problemTitle,
      subtitle: item.source || '',
      latexContent: problemBody,
      calloutTitle: '',
      calloutContent: '',
    };

    if (includeSolutionSlide && solutionBody.trim()) {
      const solutionSlide: CardSlide = {
        id: `slide-${Date.now()}-2`,
        variant: 'proof',
        topic: problemTopic,
        badgeRight: 'PEMBAHASAN',
        title: `Solusi: ${problemTitle}`,
        subtitle: '',
        latexContent: solutionBody,
        calloutTitle: '',
        calloutContent: '',
      };
      setSlides([questionSlide, solutionSlide]);
      setActiveSlideIndex(0);
    } else {
      updateCurrentSlide(questionSlide);
    }

    setIsImportOpen(false);
  };

  // --- EXPORT HANDLERS ---
  const renderCardToDataUrl = async (): Promise<string> => {
    if (!cardRef.current || !window.htmlToImage) {
      throw new Error('Modul ekspor belum siap.');
    }

    const baseOptions = {
      pixelRatio,
      backgroundColor: selectedTheme.cardBg,
      cacheBust: true,
    };

    try {
      return await window.htmlToImage.toPng(cardRef.current, baseOptions);
    } catch {
      // Fallback jika stylesheet eksternal memicu SecurityError cssRules
      return await window.htmlToImage.toPng(cardRef.current, {
        ...baseOptions,
        fontEmbedCSS: '',
      });
    }
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    if (!window.htmlToImage) {
      alert('Modul ekspor sedang dimuat, silakan coba beberapa detik lagi.');
      return;
    }

    try {
      setDownloading(true);
      const dataUrl = await renderCardToDataUrl();
      const slugTitle = currentSlide.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const slideSuffix = slides.length > 1 ? `_slide_${activeSlideIndex + 1}` : '';

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `TheoQED_${slugTitle || 'math_card'}${slideSuffix}.png`;
      link.click();
    } catch (err) {
      console.error('Export Failed:', err);
      alert('Gagal mengekspor kartu ke gambar. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportAllSlides = async () => {
    if (!window.htmlToImage || slides.length <= 1) return;
    const originalIndex = activeSlideIndex;

    try {
      setBatchExporting(true);
      for (let i = 0; i < slides.length; i++) {
        setActiveSlideIndex(i);
        await new Promise((r) => setTimeout(r, 180));
        const dataUrl = await renderCardToDataUrl();
        const slugTitle = slides[i].title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `TheoQED_${slugTitle || 'carousel'}_0${i + 1}.png`;
        link.click();
        await new Promise((r) => setTimeout(r, 220));
      }
    } catch (err) {
      console.error('Batch Export Failed:', err);
      alert('Gagal mengekspor seluruh slide.');
    } finally {
      setActiveSlideIndex(originalIndex);
      setBatchExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current || !window.htmlToImage) return;
    try {
      const dataUrl = await renderCardToDataUrl();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2200);
    } catch {
      alert('Browser tidak mendukung penyalinan gambar langsung ke clipboard. Gunakan tombol Unduh PNG.');
    }
  };

  // Computed styles for card
  const patternStyle = useMemo<React.CSSProperties>(() => {
    if (pattern === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${selectedTheme.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${selectedTheme.gridColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      };
    }
    if (pattern === 'dots') {
      return {
        backgroundImage: `radial-gradient(${selectedTheme.gridColor} 1.5px, transparent 1.5px)`,
        backgroundSize: '18px 18px',
      };
    }
    return {};
  }, [pattern, selectedTheme.gridColor]);

  const bodySizeClass =
    fontSize === 'sm'
      ? 'text-xs'
      : fontSize === 'lg'
      ? 'text-[15px]'
      : 'text-[13.5px]';

  const variantMeta =
    VARIANT_OPTIONS.find((v) => v.id === currentSlide.variant) || VARIANT_OPTIONS[0];

  const filteredDbTheorems = useMemo(() => {
    const q = importSearch.trim().toLowerCase();
    if (!q) return dbTheorems;
    return dbTheorems.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.field.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q)
    );
  }, [dbTheorems, importSearch]);

  const filteredDbProblems = useMemo(() => {
    const q = importSearch.trim().toLowerCase();
    if (!q) return dbProblems;
    return dbProblems.filter((p) => {
      const text = `${p.title || ''} ${p.topic || ''} ${p.category || ''} ${p.statement || p.content || p.question || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [dbProblems, importSearch]);

  const outputWidth = Math.round(selectedRatio.baseWidth * pixelRatio);
  const outputHeight = Math.round(selectedRatio.baseHeight * pixelRatio);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"
        strategy="afterInteractive"
      />

      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Studio &amp; Generator
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              LaTeX Math Card Generator
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={openImportModal}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <DatabaseIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Impor dari Database</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedImage ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Salin Gambar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              disabled={downloading || batchExporting}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>{downloading ? 'Mengekspor...' : 'Unduh PNG'}</span>
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PANEL KIRI: KONTROL EDITOR */}
          <div className="lg:col-span-5 space-y-4">
            {/* Carousel Slide Switcher */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Slide Carousel ({slides.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDuplicateSlide}
                    className="h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Duplikat
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="h-7 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 transition cursor-pointer"
                  >
                    <PlusIcon className="w-3 h-3" />
                    <span>Slide</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {slides.map((s, idx) => {
                  const active = idx === activeSlideIndex;
                  return (
                    <div
                      key={s.id}
                      className={`group flex items-center rounded-xl border transition shrink-0 ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSlideIndex(idx)}
                        className="h-8 px-3 text-xs font-bold cursor-pointer"
                      >
                        Slide {idx + 1}
                      </button>
                      {slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(idx)}
                          title="Hapus Slide"
                          className={`pr-2 pl-0.5 h-8 flex items-center cursor-pointer ${
                            active
                              ? 'text-indigo-200 hover:text-white'
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tab Switcher: Konten vs Desain */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800 p-1.5 bg-slate-50/70 dark:bg-slate-950/60 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'content'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/70 dark:border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Konten &amp; LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className={`h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'design'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/70 dark:border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Visual &amp; Ekspor
                </button>
              </div>

              {activeTab === 'content' ? (
                <div className="p-5 space-y-4">
                  {/* Tipe Kartu */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Tipe Kartu Slide {activeSlideIndex + 1}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {VARIANT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateCurrentSlide({ variant: opt.id })}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                            currentSlide.variant === opt.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topik & Badge Kanan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Label Bidang / Topik
                      </label>
                      <input
                        type="text"
                        value={currentSlide.topic}
                        onChange={(e) => updateCurrentSlide({ topic: e.target.value })}
                        placeholder="TEORI BILANGAN"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Tag Sub-Topik / Level
                      </label>
                      <input
                        type="text"
                        value={currentSlide.badgeRight}
                        onChange={(e) => updateCurrentSlide({ badgeRight: e.target.value })}
                        placeholder="OSN / KLASIK"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* Judul & Subjudul */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Judul Kartu
                      </label>
                      <input
                        type="text"
                        value={currentSlide.title}
                        onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                        placeholder="Judul Teorema / Soal"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Subjudul / Sumber (Opsional)
                      </label>
                      <input
                        type="text"
                        value={currentSlide.subtitle}
                        onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                        placeholder="Misal: IMO Shortlist / Tokoh"
                        className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* Konten Utama + Snippet Toolbar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Isi Pernyataan / Soal (KaTeX)
                      </label>
                    </div>

                    {/* Quick LaTeX Bar */}
                    <div className="flex items-center gap-1 flex-wrap p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      {LATEX_SNIPPETS.map((snip) => (
                        <button
                          key={snip.label}
                          type="button"
                          onClick={() => handleInsertSnippet(snip.insert)}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/70 dark:border-slate-800 transition cursor-pointer"
                        >
                          {snip.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={5}
                      value={currentSlide.latexContent}
                      onChange={(e) => updateCurrentSlide({ latexContent: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Kotak Sorotan / Intuisi / Catatan */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Kotak Catatan / Intuisi (Opsional)
                      </label>
                      {currentSlide.calloutContent && (
                        <button
                          type="button"
                          onClick={() =>
                            updateCurrentSlide({ calloutTitle: '', calloutContent: '' })
                          }
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={currentSlide.calloutTitle}
                      onChange={(e) => updateCurrentSlide({ calloutTitle: e.target.value })}
                      placeholder="Judul kotak (misal: Intuisi / Petunjuk / Jawaban)"
                      className="w-full h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition"
                    />
                    <textarea
                      rows={2}
                      value={currentSlide.calloutContent}
                      onChange={(e) => updateCurrentSlide({ calloutContent: e.target.value })}
                      placeholder="Isi catatan tambahan (kosongkan jika tidak diperlukan)..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Watermark Footer */}
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Watermark Footer (Berlaku Semua Slide)
                    </label>
                    <input
                      type="text"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Aspek Rasio */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Aspek Rasio &amp; Ukuran Kanvas
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setSelectedRatio(ratio)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            selectedRatio.id === ratio.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-xs font-bold">{ratio.label}</div>
                          <div className="text-[10px] opacity-75">{ratio.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tema Warna */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Palet Tema Kartu
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {THEME_PRESETS.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            selectedTheme.id === theme.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border shrink-0 ${theme.swatch}`}
                          />
                          <span className="text-[11px] font-bold truncate">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pola Latar */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Tekstur Latar Belakang
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'none', label: 'Polos' },
                          { id: 'grid', label: 'Grid Kertas' },
                          { id: 'dots', label: 'Dot Matrix' },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPattern(p.id)}
                          className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            pattern === p.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipografi & Perataan */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Jenis Huruf
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {(['serif', 'sans'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFontStyle(f)}
                            className={`h-8 rounded-lg text-[11px] font-bold border capitalize cursor-pointer ${
                              fontStyle === f
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Ukuran Teks
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['sm', 'md', 'lg'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFontSize(sz)}
                            className={`h-8 rounded-lg text-[11px] font-bold border uppercase cursor-pointer ${
                              fontSize === sz
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Perataan
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            { id: 'left', label: 'Kiri' },
                            { id: 'center', label: 'Tengah' },
                          ] as const
                        ).map((al) => (
                          <button
                            key={al.id}
                            type="button"
                            onClick={() => setTextAlign(al.id)}
                            className={`h-8 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              textAlign === al.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {al.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resolusi Ekspor & Dekorasi */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Resolusi Ekspor ({outputWidth} × {outputHeight} px)
                      </span>
                      <div className="flex items-center gap-1">
                        {[2, 3, 4].map((scale) => (
                          <button
                            key={scale}
                            type="button"
                            onClick={() => setPixelRatio(scale)}
                            className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                              pixelRatio === scale
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {scale}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={showBgSymbol}
                          onChange={(e) => setShowBgSymbol(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Ornamen simbol matematis samar</span>
                      </label>

                      {slides.length > 1 && (
                        <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                          <input
                            type="checkbox"
                            checked={showSlideIndicator}
                            onChange={(e) => setShowSlideIndicator(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Nomor halaman slide</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PANEL KANAN: LIVE CANVAS PREVIEW */}
          <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-20">
            {/* Preview Toolbar */}
            <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Pratinjau {selectedRatio.id}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({outputWidth}×{outputHeight}px)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[11px] font-mono font-bold">
                  {[0.75, 0.9, 1].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setPreviewZoom(z)}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        Math.abs(previewZoom - z) < 0.05
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>

                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={handleExportAllSlides}
                    disabled={batchExporting || downloading}
                    className="h-8 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition cursor-pointer"
                  >
                    {batchExporting
                      ? 'Mengekspor Semua...'
                      : `Unduh Semua (${slides.length} Slide)`}
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Stage */}
            <div className="w-full overflow-auto flex items-center justify-center p-6 sm:p-8 bg-slate-200/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 min-h-[500px]">
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'center center',
                }}
                className="transition-transform duration-200"
              >
                {/* ELEMENT TARGET EKSPOR PNG (cardRef) */}
                <div
                  ref={cardRef}
                  style={patternStyle}
                  className={`${selectedTheme.bg} ${selectedRatio.widthClass} ${selectedRatio.heightClass} p-8 rounded-3xl border ${selectedTheme.border} shadow-2xl flex flex-col justify-between relative overflow-hidden shrink-0`}
                >
                  {/* Decorative Mathematical Watermark Symbol */}
                  {showBgSymbol && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute -right-6 -bottom-10 font-serif font-black text-[180px] leading-none opacity-[0.04]"
                    >
                      {currentSlide.variant === 'problem'
                        ? '∑'
                        : currentSlide.variant === 'proof'
                        ? '∎'
                        : '∫'}
                    </div>
                  )}

                  {/* Top Header: Topic Badges & Brand */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${selectedTheme.accent}`}
                        >
                          {currentSlide.topic || 'MATEMATIKA'}
                        </span>
                        {currentSlide.badgeRight && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-current/15 opacity-75">
                            {currentSlide.badgeRight}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-black tracking-tight font-sans shrink-0">
                        <span className={selectedTheme.brandColor}>√</span>
                        <span>TheoQED</span>
                        <span className={selectedTheme.brandColor}>.</span>
                      </span>
                    </div>

                    <div className={textAlign === 'center' ? 'text-center' : 'text-left'}>
                      <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                        {currentSlide.title || 'Judul Kartu'}
                      </h3>
                      {currentSlide.subtitle && (
                        <p className="text-[11px] opacity-65 mt-0.5 font-medium">
                          {currentSlide.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center Main Content */}
                  <div
                    className={`my-auto py-3 space-y-3 relative z-10 ${
                      textAlign === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    <div className={`${bodySizeClass} whitespace-pre-line`}>
                      <CardMathText
                        text={currentSlide.latexContent}
                        fontStyle={fontStyle}
                      />
                    </div>

                    {currentSlide.calloutContent.trim() && (
                      <div
                        className={`p-3.5 rounded-2xl border text-left ${selectedTheme.calloutBg}`}
                      >
                        {currentSlide.calloutTitle && (
                          <div
                            className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${selectedTheme.brandColor}`}
                          >
                            {currentSlide.calloutTitle}
                          </div>
                        )}
                        <div className="text-xs leading-relaxed whitespace-pre-line">
                          <CardMathText
                            text={currentSlide.calloutContent}
                            fontStyle={fontStyle}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer */}
                  <div className="pt-3 border-t border-current/10 flex items-center justify-between gap-2 text-[10px] font-mono opacity-65 relative z-10">
                    <span className="truncate">{watermark}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {slides.length > 1 && showSlideIndicator && (
                        <span>
                          0{activeSlideIndex + 1}/0{slides.length}
                        </span>
                      )}
                      <span className="font-bold">{variantMeta.footerTag}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL: IMPOR DARI DATABASE SUPABASE */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsImportOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Integrasi Konten TheoQED
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Impor dari Database
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* Source Tabs & Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportSource('theorems')}
                  className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    importSource === 'theorems'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Perpustakaan Teorema ({dbTheorems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportSource('problems')}
                  className={`h-9 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    importSource === 'problems'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Bank Soal ({dbProblems.length})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  placeholder={
                    importSource === 'theorems'
                      ? 'Cari judul teorema, bidang, atau topik...'
                      : 'Cari judul soal, kategori, atau isi soal...'
                  }
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingDb ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : importSource === 'theorems' ? (
                filteredDbTheorems.length > 0 ? (
                  filteredDbTheorems.map((t) => {
                    const hasProof = Array.isArray(t.proof_steps) && t.proof_steps.length > 0;
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              {t.field}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {t.topic}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {t.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyTheoremToCard(t, false)}
                            className="h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          >
                            1 Kartu
                          </button>
                          {hasProof && (
                            <button
                              type="button"
                              onClick={() => applyTheoremToCard(t, true)}
                              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer"
                            >
                              2 Slide (+Bukti)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    Tidak ada teorema yang cocok.
                  </p>
                )
              ) : filteredDbProblems.length > 0 ? (
                filteredDbProblems.map((p) => {
                  const hasSol = Boolean((p.solution || p.explanation || '').trim());
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            {p.topic || p.category || p.field || 'Soal'}
                          </span>
                          {(p.difficulty || p.source) && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.difficulty || p.source}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.title || (p.statement || p.content || p.question || '').slice(0, 70)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => applyProblemToCard(p, false)}
                          className="h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        >
                          Soal Saja
                        </button>
                        {hasSol && (
                          <button
                            type="button"
                            onClick={() => applyProblemToCard(p, true)}
                            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer"
                          >
                            2 Slide (+Solusi)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  Tidak ada soal yang cocok.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}