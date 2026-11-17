'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LanguageInfo {
  id: string;
  code: string;
  name: string;
  native_name: string;
  speech_lang: string;
  direction: 'ltr' | 'rtl';
}

interface ModuleInfo {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
}

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  grammar_notes: string | null;
  sort_order: number;
}

interface VocabItem {
  id: string;
  term: string;
  phonetic: string | null;
  meaning: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_phonetic: string | null;
  example_meaning: string | null;
  sort_order: number;
}

type ActiveTab = 'materi' | 'kosakata' | 'flashcard';
type FontSizeOption = 'sm' | 'md' | 'lg' | 'xl';

const FONT_SIZE_ORDER: FontSizeOption[] = ['sm', 'md', 'lg', 'xl'];

const FONT_SIZE_CONFIG: Record<
  FontSizeOption,
  {
    label: string;
    body: string;
    table: string;
    quote: string;
    code: string;
    inlineAudio: string;
    h1: string;
    h2: string;
    h3: string;
    lessonTitle: string;
    vocabTerm: string;
    vocabMeaning: string;
    vocabExample: string;
  }
> = {
  sm: {
    label: 'Kecil',
    body: 'text-sm leading-relaxed',
    table: 'text-xs sm:text-sm',
    quote: 'text-xs sm:text-sm',
    code: 'text-xs',
    inlineAudio: 'text-xs',
    h1: 'text-xl',
    h2: 'text-lg',
    h3: 'text-base',
    lessonTitle: 'text-xl sm:text-2xl',
    vocabTerm: 'text-xl sm:text-2xl',
    vocabMeaning: 'text-sm',
    vocabExample: 'text-xs',
  },
  md: {
    label: 'Normal',
    body: 'text-base leading-relaxed',
    table: 'text-sm sm:text-base',
    quote: 'text-sm sm:text-base',
    code: 'text-sm',
    inlineAudio: 'text-sm',
    h1: 'text-2xl',
    h2: 'text-xl',
    h3: 'text-lg',
    lessonTitle: 'text-2xl sm:text-3xl',
    vocabTerm: 'text-2xl sm:text-3xl',
    vocabMeaning: 'text-base',
    vocabExample: 'text-sm',
  },
  lg: {
    label: 'Besar',
    body: 'text-lg leading-relaxed',
    table: 'text-base sm:text-lg',
    quote: 'text-base sm:text-lg',
    code: 'text-base',
    inlineAudio: 'text-base',
    h1: 'text-3xl',
    h2: 'text-2xl',
    h3: 'text-xl',
    lessonTitle: 'text-2xl sm:text-3xl',
    vocabTerm: 'text-2xl sm:text-3xl',
    vocabMeaning: 'text-lg',
    vocabExample: 'text-base',
  },
  xl: {
    label: 'Ekstra',
    body: 'text-xl leading-relaxed',
    table: 'text-lg sm:text-xl',
    quote: 'text-lg sm:text-xl',
    code: 'text-lg',
    inlineAudio: 'text-lg',
    h1: 'text-3xl sm:text-4xl',
    h2: 'text-2xl sm:text-3xl',
    h3: 'text-xl sm:text-2xl',
    lessonTitle: 'text-3xl sm:text-4xl',
    vocabTerm: 'text-3xl sm:text-4xl',
    vocabMeaning: 'text-xl',
    vocabExample: 'text-lg',
  },
};

type ContentBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | {
      type: 'table';
      headers: string[];
      alignments: ('text-left' | 'text-center' | 'text-right')[];
      rows: string[][];
    }
  | { type: 'paragraph'; text: string };

const TABLE_SEPARATOR_REGEX = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/;

function parseTableCells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

interface FormattedLessonContentProps {
  text: string;
  direction: 'ltr' | 'rtl';
  fontSize: FontSizeOption;
  speakingId: string | null;
  onSpeak: (text: string, id: string, rate?: number) => void;
}

// Renderer teks terstruktur dengan dukungan tabel Markdown, tombol audio inline {{teks}}, dan skala huruf
function FormattedLessonContent({
  text,
  direction,
  fontSize,
  speakingId,
  onSpeak,
}: FormattedLessonContentProps) {
  const scale = FONT_SIZE_CONFIG[fontSize];

  const blocks = useMemo<ContentBlock[]>(() => {
    const rawLines = text.split(/\r?\n/);
    const result: ContentBlock[] = [];
    let i = 0;

    while (i < rawLines.length) {
      const line = rawLines[i].trim();

      if (!line) {
        i++;
        continue;
      }

      // 1. Deteksi Tabel Markdown
      const nextLine = rawLines[i + 1]?.trim() || '';
      if (line.includes('|') && TABLE_SEPARATOR_REGEX.test(nextLine)) {
        const headers = parseTableCells(line);
        const alignments = parseTableCells(nextLine).map((sep) => {
          if (sep.startsWith(':') && sep.endsWith(':')) return 'text-center';
          if (sep.endsWith(':')) return 'text-right';
          return 'text-left';
        });

        const rows: string[][] = [];
        i += 2;
        while (i < rawLines.length) {
          const rowLine = rawLines[i].trim();
          if (!rowLine || !rowLine.includes('|')) break;
          rows.push(parseTableCells(rowLine));
          i++;
        }

        result.push({ type: 'table', headers, alignments, rows });
        continue;
      }

      // 2. Deteksi Heading
      if (line.startsWith('### ')) {
        result.push({ type: 'h3', text: line.slice(4) });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        result.push({ type: 'h2', text: line.slice(3) });
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        result.push({ type: 'h1', text: line.slice(2) });
        i++;
        continue;
      }

      // 3. Deteksi Blockquote
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('> ')) {
          quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        result.push({ type: 'blockquote', text: quoteLines.join('\n') });
        continue;
      }

      // 4. Deteksi Bullet List
      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        result.push({ type: 'ul', items });
        continue;
      }

      // 5. Deteksi Numbered List
      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        result.push({ type: 'ol', items });
        continue;
      }

      // 6. Paragraf Biasa
      const paraLines: string[] = [];
      while (i < rawLines.length) {
        const current = rawLines[i].trim();
        if (!current) break;
        const upcoming = rawLines[i + 1]?.trim() || '';
        const startsTable = current.includes('|') && TABLE_SEPARATOR_REGEX.test(upcoming);
        const startsSpecial =
          current.startsWith('# ') ||
          current.startsWith('## ') ||
          current.startsWith('### ') ||
          current.startsWith('> ') ||
          /^[-*]\s+/.test(current) ||
          /^\d+\.\s+/.test(current) ||
          startsTable;

        if (startsSpecial && paraLines.length > 0) break;
        paraLines.push(current);
        i++;
      }

      if (paraLines.length > 0) {
        result.push({ type: 'paragraph', text: paraLines.join('\n') });
      }
    }

    return result;
  }, [text]);

  function renderInline(line: string, keyPrefix: string) {
    const parts = line.split(/(\{\{[^}]+\}\}|\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const spokenText = part.slice(2, -2).trim();
        const audioId = `${keyPrefix}-audio-${i}`;
        const isPlaying = speakingId === audioId;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSpeak(spokenText, audioId, 0.95)}
            title={`Dengarkan pelafalan: ${spokenText}`}
            className={`inline-flex items-center gap-1.5 mx-0.5 px-2 py-0.5 rounded-lg border font-bold align-baseline transition cursor-pointer ${
              scale.inlineAudio
            } ${
              isPlaying
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:border-indigo-400'
            }`}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07"
              />
            </svg>
            <span dir={direction}>{spokenText}</span>
          </button>
        );
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono ${scale.code}`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }

  return (
    <div className={`space-y-4 text-slate-700 dark:text-slate-300 ${scale.body}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return (
            <div
              key={idx}
              className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 my-2"
            >
              <table className={`w-full border-collapse ${scale.table}`}>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className={`px-4 py-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap ${
                          block.alignments[hIdx] || 'text-left'
                        }`}
                      >
                        {renderInline(header, `tbl-${idx}-h-${hIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {block.rows.map((cells, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {block.headers.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-2.5 text-slate-700 dark:text-slate-300 ${
                            block.alignments[cIdx] || 'text-left'
                          }`}
                        >
                          {renderInline(cells[cIdx] || '', `tbl-${idx}-r-${rIdx}-c-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={idx} className={`${scale.h3} font-extrabold text-slate-900 dark:text-white pt-2`}>
              {block.text}
            </h3>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={idx} className={`${scale.h2} font-black text-slate-900 dark:text-white pt-3`}>
              {block.text}
            </h2>
          );
        }
        if (block.type === 'h1') {
          return (
            <h1 key={idx} className={`${scale.h1} font-black text-slate-900 dark:text-white pt-3`}>
              {block.text}
            </h1>
          );
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              className={`border-l-4 border-indigo-500 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-r-xl text-slate-700 dark:text-slate-200 whitespace-pre-line ${scale.quote}`}
            >
              {renderInline(block.text, `bq-${idx}`)}
            </blockquote>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, li) => (
                <li key={li}>{renderInline(item, `ul-${idx}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5">
              {block.items.map((item, li) => (
                <li key={li}>{renderInline(item, `ol-${idx}-${li}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {renderInline(block.text, `p-${idx}`)}
          </p>
        );
      })}
    </div>
  );
}

export default function LanguageModuleReaderPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams<{ code: string; slug: string }>();
  const code = params?.code?.toLowerCase();
  const slug = params?.slug;

  const [language, setLanguage] = useState<LanguageInfo | null>(null);
  const [moduleData, setModuleData] = useState<ModuleInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('materi');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeOption>('md');

  // State Floating Tooltip Select-to-Speak di Materi
  const lessonArticleRef = useRef<HTMLElement | null>(null);
  const [selectionPopup, setSelectionPopup] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);

  // State Pencarian Kosakata
  const [vocabSearch, setVocabSearch] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // State Flashcard
  const [deckQueue, setDeckQueue] = useState<VocabItem[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPhoneticFront, setShowPhoneticFront] = useState(true);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    try {
      const savedSize = localStorage.getItem('theo_lingo_font_size') as FontSizeOption | null;
      if (savedSize && FONT_SIZE_ORDER.includes(savedSize)) {
        setFontSize(savedSize);
      }
    } catch {
      // Abaikan jika storage tidak tersedia
    }
  }, []);

  useEffect(() => {
    if (code && slug) {
      loadModuleContent(code, slug);
    }
  }, [code, slug]);

  // Bersihkan popup seleksi saat pindah tab atau materi
  useEffect(() => {
    setSelectionPopup(null);
  }, [activeTab, activeLessonIndex]);

  function changeFontSize(delta: -1 | 1) {
    setFontSize((prev) => {
      const currentIdx = FONT_SIZE_ORDER.indexOf(prev);
      const nextIdx = Math.max(0, Math.min(FONT_SIZE_ORDER.length - 1, currentIdx + delta));
      const nextSize = FONT_SIZE_ORDER[nextIdx];
      try {
        localStorage.setItem('theo_lingo_font_size', nextSize);
      } catch {
        // Abaikan jika storage tidak tersedia
      }
      return nextSize;
    });
  }

  async function loadModuleContent(langCode: string, modSlug: string) {
    setLoading(true);

    const { data: lang } = await supabase
      .from('languages')
      .select('id, code, name, native_name, speech_lang, direction')
      .eq('code', langCode)
      .eq('is_published', true)
      .single();

    if (lang) {
      setLanguage(lang as LanguageInfo);

      const { data: mod } = await supabase
        .from('lang_modules')
        .select('id, slug, title, level, description')
        .eq('language_id', lang.id)
        .eq('slug', modSlug)
        .eq('is_published', true)
        .single();

      if (mod) {
        setModuleData(mod as ModuleInfo);

        const [{ data: lessonRows }, { data: vocabRows }] = await Promise.all([
          supabase
            .from('lang_lessons')
            .select('id, slug, title, content_md, grammar_notes, sort_order')
            .eq('module_id', mod.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('lang_vocab')
            .select(
              'id, term, phonetic, meaning, part_of_speech, example_sentence, example_phonetic, example_meaning, sort_order'
            )
            .eq('module_id', mod.id)
            .order('sort_order', { ascending: true }),
        ]);

        const fetchedLessons = (lessonRows as LessonItem[]) || [];
        const fetchedVocab = (vocabRows as VocabItem[]) || [];

        setLessons(fetchedLessons);
        setVocabList(fetchedVocab);
        setDeckQueue(fetchedVocab);
        setMasteredIds([]);
        setIsFlipped(false);

        if (fetchedLessons.length === 0 && fetchedVocab.length > 0) {
          setActiveTab('kosakata');
        }
      }
    }

    setLoading(false);
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Abaikan jika storage tidak tersedia
    }
  }

  const speakText = useCallback(
    (text: string, id: string, rate = 1) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !language) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language.speech_lang;
      utterance.rate = rate;

      utterance.onstart = () => setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  // Deteksi teks yang diblok pengguna di dalam area materi
  const handleLessonSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    if (
      !selection ||
      selection.rangeCount === 0 ||
      selectedText.length === 0 ||
      selectedText.length > 300 ||
      !lessonArticleRef.current?.contains(selection.anchorNode)
    ) {
      setSelectionPopup(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectionPopup(null);
      return;
    }

    const placeBelow = rect.top < 76;
    const top = placeBelow ? rect.bottom + 8 : rect.top - 44;
    const rawCenter = rect.left + rect.width / 2;
    const left = Math.max(115, Math.min(window.innerWidth - 115, rawCenter));

    setSelectionPopup({ text: selectedText, top, left });
  }, []);

  // Filter Kosakata
  const filteredVocab = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    if (!q) return vocabList;
    return vocabList.filter(
      (v) =>
        v.term.toLowerCase().includes(q) ||
        (v.phonetic || '').toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
    );
  }, [vocabList, vocabSearch]);

  // Kontrol Flashcard
  const currentCard = deckQueue[0] || null;

  function handleCardRating(rating: 'again' | 'hard' | 'good') {
    if (!currentCard) return;
    setIsFlipped(false);

    setDeckQueue((prev) => {
      const [head, ...rest] = prev;
      if (!head) return [];

      if (rating === 'good') {
        setMasteredIds((ids) => (ids.includes(head.id) ? ids : [...ids, head.id]));
        return rest;
      }
      if (rating === 'hard') {
        return [...rest, head];
      }
      const insertAt = Math.min(2, rest.length);
      const next = [...rest];
      next.splice(insertAt, 0, head);
      return next;
    });
  }

  function resetFlashcardDeck(shuffle = false) {
    const base = [...vocabList];
    if (shuffle) {
      for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
      }
    }
    setDeckQueue(base);
    setMasteredIds([]);
    setIsFlipped(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-400">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <span>Memuat modul pembelajaran...</span>
      </div>
    );
  }

  if (!language || !moduleData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Modul tidak ditemukan atau belum dipublikasikan.
        </p>
        <Link
          href={code ? `/languages/${code}` : '/languages'}
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center transition"
        >
          Kembali ke Silabus Bahasa
        </Link>
      </div>
    );
  }

  const currentLesson = lessons[activeLessonIndex] || null;
  const flashcardProgress =
    vocabList.length > 0 ? Math.round((masteredIds.length / vocabList.length) * 100) : 0;
  const activeScale = FONT_SIZE_CONFIG[fontSize];
  const fontSizeIdx = FONT_SIZE_ORDER.indexOf(fontSize);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Floating Toolbar Select-to-Speak */}
      {selectionPopup && activeTab === 'materi' && (
        <div
          style={{ top: selectionPopup.top, left: selectionPopup.left }}
          className="fixed z-50 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg border border-slate-700/80"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => speakText(selectionPopup.text, 'sel-normal', 1)}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              speakingId === 'sel-normal'
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07"
              />
            </svg>
            <span>Dengarkan</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => speakText(selectionPopup.text, 'sel-slow', 0.65)}
            className={`h-7 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              speakingId === 'sel-slow'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            0.6x
          </button>
        </div>
      )}

      {/* Top Reader Navbar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={`/languages/${language.code}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Bahasa {language.name}</span>
              <span className="sm:hidden">Silabus</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {moduleData.title}
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900 shrink-0">
                {moduleData.level}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Kontrol Ukuran Huruf (A- / A+) */}
            <div
              role="group"
              aria-label="Pengaturan ukuran huruf modul"
              className="inline-flex items-center h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => changeFontSize(-1)}
                disabled={fontSizeIdx === 0}
                title="Perkecil huruf"
                aria-label="Perkecil huruf"
                className="h-full px-2.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer disabled:cursor-not-allowed"
              >
                A-
              </button>
              <span className="hidden md:inline-block px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-x border-slate-200/80 dark:border-slate-700/80 select-none">
                {activeScale.label}
              </span>
              <button
                type="button"
                onClick={() => changeFontSize(1)}
                disabled={fontSizeIdx === FONT_SIZE_ORDER.length - 1}
                title="Perbesar huruf"
                aria-label="Perbesar huruf"
                className="h-full px-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition cursor-pointer disabled:cursor-not-allowed"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFocusMode((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                focusMode
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
              <span className="hidden sm:inline">Mode Fokus</span>
            </button>

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

      {/* Main Content */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-200 ${
          focusMode ? 'max-w-4xl' : 'max-w-6xl'
        }`}
      >
        {/* Tab Switcher (Materi | Kosakata | Flashcard) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTab('materi')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'materi'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Materi</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'materi'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {lessons.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kosakata')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'kosakata'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Kosakata</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeTab === 'kosakata'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {vocabList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flashcard')}
              className={`flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'flashcard'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Flashcard</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-[11px] font-semibold text-slate-400">
            <span dir={language.direction}>{language.native_name}</span>
            <span>·</span>
            <span>{language.speech_lang}</span>
          </div>
        </div>

        {/* ================= TAB 1: MATERI & TATA BAHASA ================= */}
        {activeTab === 'materi' && (
          <div className="space-y-4">
            {lessons.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {lessons.map((les, idx) => {
                  const active = idx === activeLessonIndex;
                  return (
                    <button
                      key={les.id}
                      type="button"
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`h-8 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {idx + 1}. {les.title}
                    </button>
                  );
                })}
              </div>
            )}

            {currentLesson ? (
              <article
                ref={lessonArticleRef}
                onMouseUp={handleLessonSelection}
                onTouchEnd={handleLessonSelection}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-wrap items-end justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Bagian {activeLessonIndex + 1} dari {lessons.length}
                    </span>
                    <h2 className={`${activeScale.lessonTitle} font-black text-slate-900 dark:text-white`}>
                      {currentLesson.title}
                    </h2>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Blok kata/kalimat target mana pun untuk mendengar pelafalan
                  </span>
                </div>

                <FormattedLessonContent
                  text={currentLesson.content_md}
                  direction={language.direction}
                  fontSize={fontSize}
                  speakingId={speakingId}
                  onSpeak={speakText}
                />

                {currentLesson.grammar_notes && (
                  <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/70 space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Catatan Tata Bahasa &amp; Pola Kalimat
                    </div>
                    <FormattedLessonContent
                      text={currentLesson.grammar_notes}
                      direction={language.direction}
                      fontSize={fontSize}
                      speakingId={speakingId}
                      onSpeak={speakText}
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={activeLessonIndex === 0}
                    onClick={() => {
                      setActiveLessonIndex((i) => Math.max(0, i - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ← Materi Sebelumnya
                  </button>

                  {activeLessonIndex < lessons.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonIndex((i) => i + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Materi Berikutnya →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('kosakata');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Lanjut ke Kosakata →
                    </button>
                  )}
                </div>
              </article>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada catatan materi pada modul ini
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tambahkan catatan pada tabel <code className="font-mono">lang_lessons</code> atau buka tab Kosakata &amp; Flashcard.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KOSAKATA + AUDIO ================= */}
        {activeTab === 'kosakata' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik ikon pengeras suara untuk mendengar pelafalan normal atau pelan.
              </p>
              <input
                type="text"
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                placeholder="Cari kata, fonetik, atau arti..."
                className="w-full sm:w-72 h-9 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {filteredVocab.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Kosakata belum tersedia
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi entri kosakata di tabel <code className="font-mono">lang_vocab</code> untuk memunculkan daftar kata &amp; flashcard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVocab.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span
                            dir={language.direction}
                            className={`${activeScale.vocabTerm} font-black text-slate-900 dark:text-white`}
                          >
                            {item.term}
                          </span>
                          {item.phonetic && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {item.phonetic}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`${activeScale.vocabMeaning} font-bold text-slate-700 dark:text-slate-200`}>
                            {item.meaning}
                          </span>
                          {item.part_of_speech && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {item.part_of_speech}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Suara Normal & Pelan */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakText(item.term, `${item.id}-normal`, 1)}
                          title="Putar suara (Normal)"
                          className={`h-8 px-2.5 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            speakingId === `${item.id}-normal`
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07m2.83-9.9a9 9 0 010 12.73" />
                          </svg>
                          <span>1x</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => speakText(item.term, `${item.id}-slow`, 0.65)}
                          title="Putar suara (Pelan)"
                          className={`h-8 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            speakingId === `${item.id}-slow`
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400'
                          }`}
                        >
                          0.6x
                        </button>
                      </div>
                    </div>

                    {item.example_sentence && (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-2">
                        <div className={`space-y-0.5 ${activeScale.vocabExample}`}>
                          <p dir={language.direction} className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.example_sentence}
                          </p>
                          {item.example_phonetic && (
                            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
                              {item.example_phonetic}
                            </p>
                          )}
                          {item.example_meaning && (
                            <p className="text-slate-500 dark:text-slate-400">
                              {item.example_meaning}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => speakText(item.example_sentence!, `${item.id}-ex`, 0.95)}
                          title="Putar contoh kalimat"
                          className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 inline-flex items-center justify-center shrink-0 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: FLASHCARD INTERAKTIF ================= */}
        {activeTab === 'flashcard' && (
          <div className="max-w-2xl mx-auto space-y-5 py-2">
            {vocabList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada kartu untuk dilatih
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Flashcard dibuat otomatis dari daftar kosakata pada modul ini.
                </p>
              </div>
            ) : (
              <>
                {/* Bar Progres & Pengaturan Kartu */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Dikuasai: {masteredIds.length} / {vocabList.length} kartu ({flashcardProgress}%)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPhoneticFront((prev) => !prev)}
                        className={`h-7 px-2.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                          showPhoneticFront
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        Fonetik: {showPhoneticFront ? 'Tampil' : 'Sembunyi'}
                      </button>

                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(true)}
                        className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Acak Dek
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${flashcardProgress}%` }}
                    />
                  </div>
                </div>

                {/* Kartu Utama atau Layar Selesai */}
                {currentCard ? (
                  <div className="space-y-4">
                    <div
                      onClick={() => setIsFlipped((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setIsFlipped((prev) => !prev);
                        }
                      }}
                      className="min-h-72 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-8 flex flex-col items-center justify-center text-center shadow-xs transition cursor-pointer select-none relative"
                    >
                      <span className="absolute top-4 left-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {isFlipped ? 'Arti & Konteks' : 'Sisi Depan · Klik untuk Balik'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.term, `fc-${currentCard.id}`, 0.95);
                        }}
                        title="Dengarkan pelafalan"
                        className="absolute top-3.5 right-4 h-8 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 010 7.07" />
                        </svg>
                        <span>Suara</span>
                      </button>

                      {!isFlipped ? (
                        <div className="space-y-3">
                          <div
                            dir={language.direction}
                            className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
                          >
                            {currentCard.term}
                          </div>
                          {showPhoneticFront && currentCard.phonetic && (
                            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                              {currentCard.phonetic}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-md">
                          <div className="space-y-1">
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                              {currentCard.meaning}
                            </div>
                            {currentCard.phonetic && (
                              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {currentCard.term} · {currentCard.phonetic}
                              </div>
                            )}
                          </div>

                          {currentCard.example_sentence && (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-1">
                              <p dir={language.direction} className="font-bold text-slate-800 dark:text-slate-200">
                                {currentCard.example_sentence}
                              </p>
                              {currentCard.example_meaning && (
                                <p className="text-slate-500 dark:text-slate-400">
                                  {currentCard.example_meaning}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tombol Penilaian Mandiri */}
                    {isFlipped ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCardRating('again')}
                          className="h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-950 border border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-extrabold transition cursor-pointer"
                        >
                          Belum Hafal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardRating('hard')}
                          className="h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-950 border border-amber-200/80 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-extrabold transition cursor-pointer"
                        >
                          Ragu-Ragu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardRating('good')}
                          className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition cursor-pointer"
                        >
                          Sudah Hafal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsFlipped(true)}
                        className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition cursor-pointer"
                      >
                        Tampilkan Arti
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 p-10 text-center space-y-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
                      Sesi Selesai
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Semua {vocabList.length} Kartu Berhasil Dikuasai!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kamu dapat mengulang dek secara acak untuk memperkuat ingatan jangka panjang.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(false)}
                        className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Ulangi Berurutan
                      </button>
                      <button
                        type="button"
                        onClick={() => resetFlashcardDeck(true)}
                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Ulangi Acak
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}