'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- TYPES ---
interface ProblemItem {
  id: string;
  title: string;
  competition?: string;
  year?: number;
  topic?: string;
  level?: string;
  statement: string;
  solutions?: Array<{
    id: string;
    title: string;
    author?: string;
    brief?: string;
    steps?: string[];
    final_answer?: string;
  }>;
}

// --- ICONS ---
function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ArrowUpIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PrinterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h14z" />
    </svg>
  );
}

function DocumentTextIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// --- KATEX MATH PARSER ---
function MathText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);

  return (
    <span className="leading-relaxed font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const formula = part.slice(2, -2);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: true, output: 'html' });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto [&_.katex-display]:my-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs block text-center my-2">{part}</code>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: false, output: 'html' });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={index} className="text-red-500 font-mono text-xs">{part}</code>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default function AdminWorksheetPage() {
  const [availableProblems, setAvailableProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State Konfigurasi Worksheet (On The Fly)
  const [title, setTitle] = useState('Latihan Soal Matematika');
  const [topic, setTopic] = useState('Aljabar & Aritmatika');
  const [targetLevel, setTargetLevel] = useState('SMP');
  const [description, setDescription] = useState('Jawablah pertanyaan berikut dengan menyertakan langkah penyelesaian yang tepat.');
  const [headerTitle, setHeaderTitle] = useState('LEMBAR KERJA SISWA (LKS)');
  const [headerSubtitle, setHeaderSubtitle] = useState('Bimbingan Belajar TheoQED Academy');
  
  // Opsi Tampilan CETAK / PDF
  const [showStudentHeader, setShowStudentHeader] = useState(true); // Data diri (Nama, Kelas, dst)
  const [showAnswerSpace, setShowAnswerSpace] = useState(false); // Space menulis jawaban
  const [showSolutions, setShowSolutions] = useState(false); // Pembahasan di akhir

  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [showProblemPicker, setShowProblemPicker] = useState(false);
  const [problemPickerSearch, setProblemPickerSearch] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  async function fetchProblems() {
    setLoading(true);
    const { data: probData } = await supabase
      .from('problems')
      .select('id, title, competition, year, topic, level, statement, solutions')
      .order('order_index', { ascending: true });

    if (probData) setAvailableProblems(probData as ProblemItem[]);
    setLoading(false);
  }

  const handlePrint = () => {
    if (selectedProblemIds.length === 0) {
      alert('Pilih minimal 1 soal terlebih dahulu sebelum mencetak!');
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

  const handleRemoveProblemFromSheet = (id: string) => {
    setSelectedProblemIds(selectedProblemIds.filter((pId) => pId !== id));
  };

  const toggleProblemSelection = (id: string) => {
    if (selectedProblemIds.includes(id)) {
      setSelectedProblemIds(selectedProblemIds.filter((pId) => pId !== id));
    } else {
      setSelectedProblemIds([...selectedProblemIds, id]);
    }
  };

  const filteredPickerProblems = availableProblems.filter(
    (p) =>
      p.id.toLowerCase().includes(problemPickerSearch.toLowerCase()) ||
      p.title.toLowerCase().includes(problemPickerSearch.toLowerCase()) ||
      p.statement.toLowerCase().includes(problemPickerSearch.toLowerCase()) ||
      (p.topic && p.topic.toLowerCase().includes(problemPickerSearch.toLowerCase()))
  );

  const selectedProblemObjects = selectedProblemIds
    .map((id) => availableProblems.find((p) => p.id === id))
    .filter(Boolean) as ProblemItem[];

  const inputClass =
    "w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition shadow-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-20 transition-colors duration-200">
      
      {/* CSS STYLES KHUSUS PRINT / CETAK A4 MULTI-PAGE */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan elemen UI website saat diprint */
          header, .no-print, nav {
            display: none !important;
          }
          
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-area {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-w: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-problem-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      {/* Header Admin Terintegrasi (Diabaikan saat Print) */}
      <header className="no-print border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 shrink-0">
              <span className="text-blue-600 dark:text-blue-400">√</span>TheoQED<span className="text-blue-600 dark:text-blue-400">.</span>
            </a>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
              Worksheet Generator
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href="/admin" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
              ← Dashboard Hub
            </a>
            <ThemeToggle />
          </div>

        </div>
      </header>

      {/* Main Layout 2 Kolom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* KOLOM KIRI (5 COLS): PANEL PENGATURAN WORKSHEET (No-Print) */}
        <div className="no-print lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pengaturan Lembar Kerja
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Judul Utama Lembar Kerja</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Topik / Bidang</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tingkat Target</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              {/* OPSI OPTS CHECKBOXES */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Opsi Elemen Cetak (Print Layout Options)
                </h3>
                
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={showStudentHeader}
                      onChange={(e) => setShowStudentHeader(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Sertakan kolom data diri (Nama, Kelas, Tanggal, Nilai)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={showAnswerSpace}
                      onChange={(e) => setShowAnswerSpace(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Sertakan ruang kosong untuk menulis jawaban siswa</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={showSolutions}
                      onChange={(e) => setShowSolutions(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Sertakan kunci jawaban & pembahasan di akhir</span>
                  </label>
                </div>
              </div>

              {/* Header Kop Customizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Judul Kop</label>
                  <input
                    type="text"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sub-Judul Kop / Instansi</label>
                  <input
                    type="text"
                    value={headerSubtitle}
                    onChange={(e) => setHeaderSubtitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Petunjuk Pengerjaan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* SELEKSI DRAF SOAL */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Soal Terpilih ({selectedProblemIds.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProblemPicker(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <PlusIcon />
                  <span>+ Pilih Soal dari Bank Soal</span>
                </button>
              </div>

              {selectedProblemIds.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {selectedProblemIds.map((pId, index) => {
                    const prob = availableProblems.find((p) => p.id === pId);
                    return (
                      <div
                        key={pId}
                        className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded text-[11px] shrink-0">
                            #{index + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {prob ? prob.title || prob.id : pId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveProblemOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            <ArrowUpIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProblemOrder(index, 'down')}
                            disabled={index === selectedProblemIds.length - 1}
                            className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            <ArrowDownIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProblemFromSheet(pId)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded ml-1"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl italic">
                  Belum ada soal terpilih. Klik "+ Pilih Soal dari Bank Soal".
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs sm:text-sm rounded-xl transition text-white shadow-sm flex items-center justify-center gap-2"
            >
              <PrinterIcon />
              <span>Simpan sebagai PDF / Cetak Sekarang</span>
            </button>

          </div>
        </div>

        {/* KOLOM KANAN (7 COLS): PRATINJAU LANGSUNG KERTAS A4 (PRINT AREA) */}
        <div className="lg:col-span-7">
          <div className="print-area bg-white text-slate-900 p-8 sm:p-12 shadow-xl border border-slate-200 rounded-2xl min-h-[900px] space-y-6">
            
            {/* Header Kop */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <h1 className="text-xl font-black tracking-wider uppercase text-slate-900">
                {headerTitle || 'LEMBAR KERJA SISWA'}
              </h1>
              <p className="text-xs font-bold text-slate-700 tracking-wide">
                {headerSubtitle || 'TheoQED Mathematics Academy'}
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-600 pt-3 border-t border-slate-200 mt-3">
                <span>Topik: {topic}</span>
                <span>Tingkat: {targetLevel}</span>
              </div>
            </div>

            {/* OPSI 1: Kolom Data Diri Siswa (Bisa dihilangkan via checkbox) */}
            {showStudentHeader && (
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-700 border border-slate-300 p-3 bg-slate-50/50 rounded">
                <div>Nama Siswa : _______________________</div>
                <div>Kelas/Tingkat : _______________________</div>
                <div>Tanggal : _______________________</div>
                <div>Nilai / Paraf : _______________________</div>
              </div>
            )}

            {/* Judul & Petunjuk */}
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-slate-600 leading-relaxed italic bg-blue-50/60 p-2.5 border-l-2 border-blue-600">
                  {description}
                </p>
              )}
            </div>

            {/* Daftar Soal */}
            <div className="space-y-6 pt-2">
              {selectedProblemObjects.length > 0 ? (
                selectedProblemObjects.map((prob, idx) => (
                  <div key={prob.id} className="print-problem-item space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-xs text-slate-900 shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="text-xs text-slate-900 leading-relaxed space-y-2">
                        <MathText text={prob.statement} />
                      </div>
                    </div>

                    {/* OPSI 2: Ruang Kosong Jawaban Siswa (Bisa dihilangkan via checkbox) */}
                    {showAnswerSpace && (
                      <div className="ml-5 border-l-2 border-dashed border-slate-200 pl-4 py-8 text-[10px] text-slate-400 font-mono italic">
                        [ Ruang Lembar Jawaban Siswa ]
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 italic">
                  [ Pratinjau Lembar Kerja Kosong — Silakan pilih soal terlebih dahulu ]
                </div>
              )}
            </div>

            {/* OPSI 3: Kunci Jawaban & Pembahasan Lengkap di Akhir */}
            {showSolutions && selectedProblemObjects.length > 0 && (
              <div className="print-problem-item mt-12 pt-8 border-t-2 border-slate-900 space-y-6">
                <div className="bg-slate-900 text-white px-3 py-1 text-xs font-bold tracking-wider uppercase inline-block">
                  Kunci Jawaban & Pembahasan
                </div>

                <div className="space-y-6">
                  {selectedProblemObjects.map((prob, idx) => (
                    <div key={prob.id} className="space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900">
                        Pembahasan Soal #{idx + 1} ({prob.title})
                      </h4>
                      {prob.solutions && prob.solutions.length > 0 ? (
                        prob.solutions.map((sol, sIdx) => (
                          <div key={sol.id || sIdx} className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 space-y-1.5">
                            <p className="font-bold text-blue-700 text-[11px]">{sol.title}</p>
                            {sol.brief && <p className="italic text-slate-600">{sol.brief}</p>}
                            {sol.steps && sol.steps.length > 0 && (
                              <ul className="list-disc list-inside space-y-1 pl-1">
                                {sol.steps.map((st, i) => (
                                  <li key={i}><MathText text={st} /></li>
                                ))}
                              </ul>
                            )}
                            {sol.final_answer && (
                              <p className="font-bold text-emerald-700 pt-1 border-t border-slate-200">
                                Hasil Akhir: <MathText text={sol.final_answer} />
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">Belum ada solusi di database.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL: PICKER SOAL DATABASE */}
      {showProblemPicker && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-900 dark:text-slate-100">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pilih Soal dari Bank Soal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Centang soal yang ingin dimasukkan ke dalam lembar kerja ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProblemPicker(false)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition"
              >
                Selesai
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
              <input
                type="text"
                placeholder="Cari berdasarkan ID, topik, atau kata kunci..."
                value={problemPickerSearch}
                onChange={(e) => setProblemPickerSearch(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {filteredPickerProblems.length > 0 ? (
                filteredPickerProblems.map((prob) => {
                  const isSelected = selectedProblemIds.includes(prob.id);
                  return (
                    <div
                      key={prob.id}
                      onClick={() => toggleProblemSelection(prob.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                            {prob.id}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {prob.competition} {prob.year} • {prob.topic || 'Umum'}
                          </span>
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
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  Soal tidak ditemukan.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Terpilih: <strong>{selectedProblemIds.length} Soal</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowProblemPicker(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Terapkan Pilihan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}