'use client';

import React, { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import { createClient } from '@/lib/supabase/client';
import { AdminNavbar } from '@/components/AdminNavbar';

// --- TYPES ---
interface SolutionItem {
  id?: string;
  title?: string;
  author?: string;
  brief?: string;
  steps?: string[];
  final_answer?: string;
}

interface ProblemItem {
  id: string;
  title: string;
  competition?: string | null;
  year?: number | null;
  topic?: string | null;
  level?: string | null;
  statement: string;
  solutions?: SolutionItem[] | null;
  isCustom?: boolean;
}

type PaperSize = 'A4' | 'F4' | 'Letter';
type KopStyle = 'formal' | 'modern';
type ColumnLayout = 1 | 2;
type FontSizeOption = 'sm' | 'md' | 'lg';
type AnswerSpaceStyle = 'blank' | 'lined' | 'grid';
type AnswerSpaceHeight = 'sm' | 'md' | 'lg';
type SolutionDetailMode = 'full' | 'answer-only';

// --- SVG CUSTOM ICONS ---
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function ArrowUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PrinterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h14z" />
    </svg>
  );
}

function ShuffleIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

function CodeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif whitespace-pre-line">
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
                className="text-red-500 font-mono text-xs block text-center my-2"
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
              <code key={index} className="text-red-500 font-mono text-xs">
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

export default function AdminWorksheetPage() {
  const supabase = useMemo(() => createClient(), []);

  const [dbProblems, setDbProblems] = useState<ProblemItem[]>([]);
  const [customProblems, setCustomProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'layout'>('content');
  const [copiedTex, setCopiedTex] = useState(false);

  // State Konfigurasi Identitas Worksheet
  const [headerTitle, setHeaderTitle] = useState('LEMBAR KERJA SISWA (LKS)');
  const [headerSubtitle, setHeaderSubtitle] = useState('TheoQED Mathematics Academy');
  const [title, setTitle] = useState('Latihan Soal Matematika');
  const [topic, setTopic] = useState('Aljabar & Aritmatika');
  const [targetLevel, setTargetLevel] = useState('SMP');
  const [durationText, setDurationText] = useState('60 Menit');
  const [description, setDescription] = useState(
    'Kerjakan setiap soal berikut secara sistematis dengan menuliskan langkah-langkah penyelesaian yang jelas.'
  );
  const [footerNote, setFooterNote] = useState('TheoQED Academy · Dokumen Latihan Terstruktur');

  // Opsi Tata Letak & Cetak
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [kopStyle, setKopStyle] = useState<KopStyle>('formal');
  const [columns, setColumns] = useState<ColumnLayout>(1);
  const [fontSize, setFontSize] = useState<FontSizeOption>('md');
  const [showProblemSource, setShowProblemSource] = useState(false);
  const [showStudentHeader, setShowStudentHeader] = useState(true);
  const [showAnswerSpace, setShowAnswerSpace] = useState(true);
  const [answerSpaceStyle, setAnswerSpaceStyle] = useState<AnswerSpaceStyle>('lined');
  const [answerSpaceHeight, setAnswerSpaceHeight] = useState<AnswerSpaceHeight>('md');
  const [showSolutions, setShowSolutions] = useState(false);
  const [solutionBreakPage, setSolutionBreakPage] = useState(true);
  const [solutionDetailMode, setSolutionDetailMode] = useState<SolutionDetailMode>('full');

  // Seleksi Soal & Modal
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTopicFilter, setPickerTopicFilter] = useState('ALL');
  const [pickerLevelFilter, setPickerLevelFilter] = useState('ALL');

  // Modal Tambah Soal Kustom Lokal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customStatement, setCustomStatement] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [customSteps, setCustomSteps] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  async function fetchProblems() {
    setLoading(true);
    const { data } = await supabase
      .from('problems')
      .select('id, title, competition, year, topic, level, statement, solutions')
      .order('order_index', { ascending: true });

    if (data) {
      setDbProblems(data as ProblemItem[]);
    }
    setLoading(false);
  }

  const allProblemsMap = useMemo(() => {
    const map = new Map<string, ProblemItem>();
    dbProblems.forEach((p) => map.set(p.id, p));
    customProblems.forEach((p) => map.set(p.id, p));
    return map;
  }, [dbProblems, customProblems]);

  const selectedProblemObjects = useMemo(() => {
    return selectedProblemIds
      .map((id) => allProblemsMap.get(id))
      .filter((item): item is ProblemItem => Boolean(item));
  }, [selectedProblemIds, allProblemsMap]);

  const availableTopics = useMemo(() => {
    return Array.from(
      new Set(dbProblems.map((p) => p.topic).filter((t): t is string => Boolean(t)))
    );
  }, [dbProblems]);

  const availableLevels = useMemo(() => {
    return Array.from(
      new Set(dbProblems.map((p) => p.level).filter((l): l is string => Boolean(l)))
    );
  }, [dbProblems]);

  const filteredPickerProblems = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return dbProblems.filter((p) => {
      if (pickerTopicFilter !== 'ALL' && p.topic !== pickerTopicFilter) return false;
      if (pickerLevelFilter !== 'ALL' && p.level !== pickerLevelFilter) return false;
      if (!q) return true;

      return (
        p.id.toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.statement || '').toLowerCase().includes(q) ||
        (p.topic || '').toLowerCase().includes(q) ||
        (p.competition || '').toLowerCase().includes(q)
      );
    });
  }, [dbProblems, pickerSearch, pickerTopicFilter, pickerLevelFilter]);

  // --- HANDLERS ---
  const handlePrint = () => {
    if (selectedProblemIds.length === 0) {
      alert('Pilih atau tambahkan minimal 1 soal terlebih dahulu sebelum mencetak.');
      return;
    }
    window.print();
  };

  const handleMoveProblemOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedProblemIds.length) return;

    const updated = [...selectedProblemIds];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSelectedProblemIds(updated);
  };

  const handleShuffleProblems = () => {
    if (selectedProblemIds.length < 2) return;
    const shuffled = [...selectedProblemIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSelectedProblemIds(shuffled);
  };

  const handleRemoveProblemFromSheet = (id: string) => {
    setSelectedProblemIds((prev) => prev.filter((pId) => pId !== id));
  };

  const toggleProblemSelection = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredPickerProblems.map((p) => p.id);
    setSelectedProblemIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleAddCustomProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatement.trim()) return;

    const newId = `CUSTOM-${Date.now().toString().slice(-5)}`;
    const stepsArr = customSteps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newProblem: ProblemItem = {
      id: newId,
      title: customTitle.trim() || `Soal Tambahan #${customProblems.length + 1}`,
      topic,
      level: targetLevel,
      statement: customStatement.trim(),
      isCustom: true,
      solutions:
        customAnswer.trim() || stepsArr.length > 0
          ? [
              {
                id: `sol-${newId}`,
                title: 'Pembahasan',
                steps: stepsArr,
                final_answer: customAnswer.trim() || undefined,
              },
            ]
          : [],
    };

    setCustomProblems((prev) => [...prev, newProblem]);
    setSelectedProblemIds((prev) => [...prev, newId]);
    setCustomTitle('');
    setCustomStatement('');
    setCustomAnswer('');
    setCustomSteps('');
    setShowCustomModal(false);
  };

  // Export ke kode LaTeX (.tex) siap kompilasi
  const handleCopyLatexSource = async () => {
    const texLines: string[] = [
      '\\documentclass[11pt,a4paper]{article}',
      '\\usepackage[utf8]{inputenc}',
      '\\usepackage[indonesian]{babel}',
      '\\usepackage{amsmath,amssymb,amsthm}',
      '\\usepackage[margin=1.8cm]{geometry}',
      '\\usepackage{enumitem}',
      '',
      '\\begin{document}',
      '\\begin{center}',
      `  {\\Large\\bfseries ${headerTitle}} \\\\[2pt]`,
      `  {\\small\\bfseries ${headerSubtitle}} \\\\[6pt]`,
      `  {\\large\\bfseries ${title}} \\\\`,
      `  {\\footnotesize Topik: ${topic} \\quad|\\quad Tingkat: ${targetLevel}${durationText ? ` \\quad|\\quad Waktu: ${durationText}` : ''}}`,
      '\\end{center}',
      '\\hrule\\vspace{8pt}',
      '',
    ];

    if (showStudentHeader) {
      texLines.push(
        '\\noindent Nama: \\hrulefill \\quad Kelas: \\underline{\\hspace{3cm}} \\quad Tanggal: \\underline{\\hspace{3cm}} \\\\[10pt]'
      );
    }

    if (description.trim()) {
      texLines.push(`\\noindent\\textit{Petunjuk: ${description}} \\\\[10pt]`);
    }

    texLines.push('\\begin{enumerate}[label=\\textbf{\\arabic*.}, itemsep=12pt]');
    selectedProblemObjects.forEach((prob) => {
      texLines.push(`  \\item ${prob.statement}`);
      if (showAnswerSpace) {
        texLines.push('  \\vspace{3cm}');
      }
    });
    texLines.push('\\end{enumerate}');

    if (showSolutions && selectedProblemObjects.length > 0) {
      texLines.push('', '\\newpage', '\\section*{Kunci Jawaban \\& Pembahasan}');
      texLines.push('\\begin{enumerate}[label=\\textbf{\\arabic*.}, itemsep=10pt]');
      selectedProblemObjects.forEach((prob) => {
        const sol = prob.solutions?.[0];
        if (!sol) {
          texLines.push('  \\item \\textit{Belum ada pembahasan.}');
        } else {
          const stepsTex =
            solutionDetailMode === 'full' && sol.steps?.length
              ? `\n  \\begin{itemize}\n${sol.steps.map((s) => `    \\item ${s}`).join('\n')}\n  \\end{itemize}`
              : '';
          const finalTex = sol.final_answer ? ` \\textbf{Hasil Akhir:} ${sol.final_answer}` : '';
          texLines.push(`  \\item ${stepsTex}${finalTex}`);
        }
      });
      texLines.push('\\end{enumerate}');
    }

    texLines.push('', '\\end{document}');

    try {
      await navigator.clipboard.writeText(texLines.join('\n'));
      setCopiedTex(true);
      setTimeout(() => setCopiedTex(false), 2200);
    } catch {
      alert('Gagal menyalin kode LaTeX ke clipboard.');
    }
  };

  // --- COMPUTED CLASSES ---
  const problemTextSizeClass =
    fontSize === 'sm' ? 'text-[11px]' : fontSize === 'lg' ? 'text-sm' : 'text-xs';

  const answerSpaceHeightClass =
    answerSpaceHeight === 'sm' ? 'h-16' : answerSpaceHeight === 'lg' ? 'h-40' : 'h-28';

  const answerSpaceBgStyle = useMemo<React.CSSProperties>(() => {
    if (answerSpaceStyle === 'lined') {
      return {
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 23px, #cbd5e1 24px)',
      };
    }
    if (answerSpaceStyle === 'grid') {
      return {
        backgroundImage:
          'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      };
    }
    return {};
  }, [answerSpaceStyle]);

  const pageCssRule =
    paperSize === 'F4'
      ? '215mm 330mm'
      : paperSize === 'Letter'
      ? 'letter'
      : 'A4';

  const inputClass =
    'w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {/* CSS KHUSUS PRINT / PDF MULTI-HALAMAN */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          aside,
          .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-area {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-problem-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-break {
            break-before: page !important;
            page-break-before: always !important;
          }

          @page {
            size: ${pageCssRule};
            margin: 14mm 15mm 16mm 15mm;
          }
        }
      `}</style>

      <div className="no-print">
        <AdminNavbar />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* HEADER BAR */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Studio &amp; Generator
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Worksheet &amp; LKS Generator
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCopyLatexSource}
              disabled={selectedProblemIds.length === 0}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedTex ? (
                <>
                  <CheckIcon className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Kode .tex Tersalin</span>
                </>
              ) : (
                <>
                  <CodeIcon />
                  <span>Salin LaTeX (.tex)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PrinterIcon />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE 2 KOLOM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: PANEL PENGATURAN */}
          <div className="no-print lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {/* Tab Switcher */}
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
                  Identitas &amp; Daftar Soal ({selectedProblemIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('layout')}
                  className={`h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'layout'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/70 dark:border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tata Letak &amp; Opsi Cetak
                </button>
              </div>

              {activeTab === 'content' ? (
                <div className="p-5 space-y-5">
                  {/* Kop & Judul */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                          Judul Kop Dokumen
                        </label>
                        <input
                          type="text"
                          value={headerTitle}
                          onChange={(e) => setHeaderTitle(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                          Sub-Judul / Lembaga
                        </label>
                        <input
                          type="text"
                          value={headerSubtitle}
                          onChange={(e) => setHeaderSubtitle(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Judul Paket Latihan
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                          Topik / Materi
                        </label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                          Jenjang
                        </label>
                        <select
                          value={targetLevel}
                          onChange={(e) => setTargetLevel(e.target.value)}
                          className={inputClass}
                        >
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA">SMA</option>
                          <option value="Olimpiade">Olimpiade</option>
                          <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                          Alokasi Waktu
                        </label>
                        <input
                          type="text"
                          value={durationText}
                          onChange={(e) => setDurationText(e.target.value)}
                          placeholder="60 Menit"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Petunjuk Pengerjaan
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* Manajemen Daftar Soal Terpilih */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Daftar Soal ({selectedProblemIds.length})
                      </span>

                      <div className="flex items-center gap-1.5">
                        {selectedProblemIds.length > 1 && (
                          <button
                            type="button"
                            onClick={handleShuffleProblems}
                            title="Acak Urutan Soal"
                            className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <ShuffleIcon />
                            <span>Acak</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowCustomModal(true)}
                          className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          <span>Soal Manual</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowProblemPicker(true)}
                          className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          <span>Bank Soal</span>
                        </button>
                      </div>
                    </div>

                    {selectedProblemObjects.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedProblemObjects.map((prob, index) => (
                          <div
                            key={prob.id}
                            className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {prob.title || prob.id}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">
                                  {prob.isCustom ? 'Soal Kustom Lokal' : `${prob.id} · ${prob.topic || 'Umum'}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveProblemOrder(index, 'up')}
                                disabled={index === 0}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                title="Naikkan"
                              >
                                <ArrowUpIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveProblemOrder(index, 'down')}
                                disabled={index === selectedProblemObjects.length - 1}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                title="Turunkan"
                              >
                                <ArrowDownIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProblemFromSheet(prob.id)}
                                className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 flex items-center justify-center cursor-pointer"
                                title="Hapus dari LKS"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Belum ada soal dipilih. Klik <strong>Bank Soal</strong> atau <strong>Soal Manual</strong> untuk menyusun lembar kerja.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Ukuran Kertas, Gaya Kop & Kolom */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Ukuran Kertas
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['A4', 'F4', 'Letter'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setPaperSize(sz)}
                            className={`h-8 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              paperSize === sz
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
                        Gaya Kop
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            { id: 'formal', label: 'Klasik' },
                            { id: 'modern', label: 'Modern' },
                          ] as const
                        ).map((k) => (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => setKopStyle(k.id)}
                            className={`h-8 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              kopStyle === k.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {k.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Kolom Soal
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {([1, 2] as const).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setColumns(col)}
                            className={`h-8 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              columns === col
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {col} Kolom
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ukuran Font */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Ukuran Huruf Soal
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'sm', label: 'Kecil (Padat)' },
                          { id: 'md', label: 'Standar (11pt)' },
                          { id: 'lg', label: 'Besar (12pt)' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontSize(f.id)}
                          className={`h-8 rounded-xl text-xs font-bold border cursor-pointer ${
                            fontSize === f.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist Elemen Dokumen */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Komponen Lembar Kerja
                    </span>

                    <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showStudentHeader}
                        onChange={(e) => setShowStudentHeader(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Kotak identitas siswa (Nama, Kelas, Tanggal, Nilai)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showProblemSource}
                        onChange={(e) => setShowProblemSource(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Tampilkan sumber kompetisi / tahun di samping nomor soal</span>
                    </label>

                    {/* Opsi Ruang Jawaban */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={showAnswerSpace}
                          onChange={(e) => setShowAnswerSpace(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Sediakan area pengerjaan di bawah setiap soal</span>
                      </label>

                      {showAnswerSpace && (
                        <div className="pl-6 grid grid-cols-2 gap-2">
                          <select
                            value={answerSpaceStyle}
                            onChange={(e) => setAnswerSpaceStyle(e.target.value as AnswerSpaceStyle)}
                            className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold"
                          >
                            <option value="blank">Kotak Polos</option>
                            <option value="lined">Garis Tulis</option>
                            <option value="grid">Kotak Grid / Berpetak</option>
                          </select>
                          <select
                            value={answerSpaceHeight}
                            onChange={(e) => setAnswerSpaceHeight(e.target.value as AnswerSpaceHeight)}
                            className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold"
                          >
                            <option value="sm">Tinggi Singkat</option>
                            <option value="md">Tinggi Sedang</option>
                            <option value="lg">Tinggi Luas</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Opsi Kunci Jawaban */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={showSolutions}
                          onChange={(e) => setShowSolutions(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Sertakan kunci jawaban &amp; pembahasan</span>
                      </label>

                      {showSolutions && (
                        <div className="pl-6 space-y-2">
                          <select
                            value={solutionDetailMode}
                            onChange={(e) => setSolutionDetailMode(e.target.value as SolutionDetailMode)}
                            className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold"
                          >
                            <option value="full">Pembahasan Lengkap + Hasil Akhir</option>
                            <option value="answer-only">Kunci Jawaban Akhir Saja (Ringkas)</option>
                          </select>

                          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={solutionBreakPage}
                              onChange={(e) => setSolutionBreakPage(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600"
                            />
                            <span>Mulai pembahasan di halaman baru (terpisah dari soal)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Catatan Kaki Dokumen (Footer)
                    </label>
                    <input
                      type="text"
                      value={footerNote}
                      onChange={(e) => setFooterNote(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: PRATINJAU KERTAS CETAK (PRINT AREA) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="no-print flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                Pratinjau Kertas ({paperSize} · {columns === 2 ? '2 Kolom' : '1 Kolom'})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedProblemObjects.length} Soal Terpasang
              </span>
            </div>

            <div className="print-area bg-white text-slate-900 p-8 sm:p-11 shadow-xl border border-slate-200/90 rounded-2xl min-h-[920px] flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                {/* KOP DOKUMEN */}
                {kopStyle === 'formal' ? (
                  <div className="border-b-4 border-double border-slate-900 pb-3.5 text-center space-y-1">
                    <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase text-slate-900">
                      {headerTitle || 'LEMBAR KERJA SISWA'}
                    </h1>
                    <p className="text-xs font-bold text-slate-700 tracking-wide">
                      {headerSubtitle || 'TheoQED Mathematics Academy'}
                    </p>
                    <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] font-mono text-slate-600 pt-2.5 border-t border-slate-200 mt-2.5">
                      <span>Topik: {topic}</span>
                      <span>Jenjang: {targetLevel}</span>
                      {durationText && <span>Waktu: {durationText}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 block">
                        {headerSubtitle || 'TheoQED Mathematics Academy'}
                      </span>
                      <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                        {headerTitle || 'LEMBAR KERJA SISWA'}
                      </h1>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 pt-1">
                        <span>Topik: {topic}</span>
                        <span>·</span>
                        <span>Jenjang: {targetLevel}</span>
                        {durationText && (
                          <>
                            <span>·</span>
                            <span>{durationText}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black tracking-tight text-slate-900">
                        <span className="text-indigo-600">√</span>TheoQED.
                      </span>
                    </div>
                  </div>
                )}

                {/* IDENTITAS SISWA */}
                {showStudentHeader && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-medium text-slate-800 border border-slate-300 p-3.5 rounded-lg bg-slate-50/40">
                    <div className="flex items-end gap-2">
                      <span className="shrink-0">Nama</span>
                      <span className="flex-1 border-b border-dotted border-slate-400" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="shrink-0">Kelas</span>
                      <span className="flex-1 border-b border-dotted border-slate-400" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="shrink-0">Tanggal</span>
                      <span className="flex-1 border-b border-dotted border-slate-400" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="shrink-0">Nilai / Paraf</span>
                      <span className="flex-1 border-b border-dotted border-slate-400" />
                    </div>
                  </div>
                )}

                {/* JUDUL PAKET & PETUNJUK */}
                <div className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">{title}</h2>
                  {description && (
                    <p className="text-[11px] text-slate-700 leading-relaxed italic bg-slate-50 px-3 py-2 border-l-2 border-slate-800">
                      {description}
                    </p>
                  )}
                </div>

                {/* DAFTAR SOAL */}
                {selectedProblemObjects.length > 0 ? (
                  <div
                    className={
                      columns === 2
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-5 pt-1'
                        : 'space-y-5 pt-1'
                    }
                  >
                    {selectedProblemObjects.map((prob, idx) => (
                      <div key={prob.id} className="print-problem-item space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-xs text-slate-900 shrink-0 min-w-[1.25rem]">
                            {idx + 1}.
                          </span>
                          <div className={`text-slate-900 flex-1 min-w-0 ${problemTextSizeClass}`}>
                            {showProblemSource && (prob.competition || prob.year) && (
                              <span className="inline-block mr-1.5 px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono font-semibold text-slate-600">
                                [{[prob.competition, prob.year].filter(Boolean).join(' ')}]
                              </span>
                            )}
                            <MathText text={prob.statement} />
                          </div>
                        </div>

                        {/* AREA JAWABAN SISWA */}
                        {showAnswerSpace && (
                          <div
                            style={answerSpaceBgStyle}
                            className={`ml-6 rounded-md border border-slate-200/90 ${answerSpaceHeightClass}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-14 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Pratinjau Lembar Kerja Kosong — Pilih soal dari Bank Soal atau buat Soal Manual.
                  </div>
                )}

                {/* KUNCI JAWABAN & PEMBAHASAN */}
                {showSolutions && selectedProblemObjects.length > 0 && (
                  <div
                    className={`${
                      solutionBreakPage ? 'print-page-break pt-2' : 'mt-10 pt-6 border-t-2 border-slate-900'
                    } space-y-4`}
                  >
                    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                      <span className="text-xs font-black tracking-wider uppercase text-slate-900">
                        Kunci Jawaban &amp; Pembahasan — {title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedProblemObjects.length} Soal
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {selectedProblemObjects.map((prob, idx) => {
                        const primarySol = prob.solutions?.[0];
                        return (
                          <div
                            key={`sol-${prob.id}`}
                            className="print-problem-item text-xs border-b border-slate-100 pb-3 last:border-none"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-slate-900 shrink-0 min-w-[1.25rem]">
                                {idx + 1}.
                              </span>
                              <div className="flex-1 space-y-1.5 text-slate-800">
                                {primarySol ? (
                                  <>
                                    {solutionDetailMode === 'full' && (
                                      <>
                                        {primarySol.brief && (
                                          <p className="italic text-slate-600">
                                            <MathText text={primarySol.brief} />
                                          </p>
                                        )}
                                        {primarySol.steps && primarySol.steps.length > 0 && (
                                          <ol className="list-decimal list-inside space-y-1 pl-1">
                                            {primarySol.steps.map((st, sIdx) => (
                                              <li key={sIdx}>
                                                <MathText text={st} />
                                              </li>
                                            ))}
                                          </ol>
                                        )}
                                      </>
                                    )}
                                    {primarySol.final_answer ? (
                                      <p className="font-bold text-slate-900">
                                        Jawaban: <MathText text={primarySol.final_answer} />
                                      </p>
                                    ) : (
                                      solutionDetailMode === 'answer-only' && (
                                        <p className="text-slate-400 italic">
                                          Jawaban akhir belum dicantumkan.
                                        </p>
                                      )
                                    )}
                                  </>
                                ) : (
                                  <p className="text-slate-400 italic">
                                    Belum ada pembahasan tersimpan.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER DOKUMEN */}
              {footerNote && (
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{footerNote}</span>
                  <span>√TheoQED.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: PICKER BANK SOAL */}
      {showProblemPicker && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowProblemPicker(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full shadow-2xl flex flex-col max-h-[86vh] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Bank Soal TheoQED
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pilih Soal untuk Lembar Kerja
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProblemPicker(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="relative sm:col-span-6">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari kode soal, judul, atau isi pernyataan..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={pickerTopicFilter}
                  onChange={(e) => setPickerTopicFilter(e.target.value)}
                  className="sm:col-span-3 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  <option value="ALL">Semua Topik</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={pickerLevelFilter}
                  onChange={(e) => setPickerLevelFilter(e.target.value)}
                  className="sm:col-span-3 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  <option value="ALL">Semua Tingkat</option>
                  {availableLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Menampilkan <strong>{filteredPickerProblems.length}</strong> soal
                </span>
                <div className="flex items-center gap-3">
                  {filteredPickerProblems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Pilih Semua Hasil ({filteredPickerProblems.length})
                    </button>
                  )}
                  {selectedProblemIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProblemIds([])}
                      className="font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Kosongkan Pilihan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List Soal */}
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              {loading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredPickerProblems.length > 0 ? (
                filteredPickerProblems.map((prob) => {
                  const isSelected = selectedProblemIds.includes(prob.id);
                  return (
                    <div
                      key={prob.id}
                      onClick={() => toggleProblemSelection(prob.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500'
                          : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                            {prob.id}
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {prob.topic || 'Umum'}
                          </span>
                          {(prob.competition || prob.year) && (
                            <span className="text-[10px] text-slate-500">
                              · {[prob.competition, prob.year].filter(Boolean).join(' ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {prob.title}
                        </h4>
                        <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          <MathText text={prob.statement} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada soal yang sesuai dengan filter pencarian.
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/60">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Terpilih: <strong>{selectedProblemIds.length} Soal</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowProblemPicker(false)}
                className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Terapkan ke LKS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH SOAL MANUAL LOKAL */}
      {showCustomModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowCustomModal(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Tambahan Cepat
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tambah Soal Manual ke LKS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleAddCustomProblem} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Label / Judul Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Misal: Soal Pemanasan Aljabar"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Pernyataan Soal (Mendukung KaTeX $...$) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="Tentukan nilai $x$ yang memenuhi $2x + 5 = 17$."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Langkah Pembahasan (Opsional, pisahkan tiap langkah dengan baris baru)
                </label>
                <textarea
                  rows={2}
                  value={customSteps}
                  onChange={(e) => setCustomSteps(e.target.value)}
                  placeholder="Kurangi kedua ruas dengan 5 sehingga $2x = 12$."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Kunci Jawaban Akhir (Opsional)
                </label>
                <input
                  type="text"
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="$x = 6$"
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Masukkan ke LKS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}