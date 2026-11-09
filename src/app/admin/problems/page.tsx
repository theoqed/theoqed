'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '@/lib/supabase';
import { Problem, Folder, SolutionItem } from '@/types';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Footer } from '@/components/Footer';

// --- SVG ICON HELPERS ---
function FolderIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MoveIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function EditIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function ChevronRightIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// --- HELPER UNTUK CEK KEABSAHAN SOLUSI ---
function getValidSolutions(problem: Problem): SolutionItem[] {
  if (!problem.solutions || !Array.isArray(problem.solutions)) return [];
  return problem.solutions.filter((sol: any) => {
    const hasBrief = Boolean(sol.brief && sol.brief.trim());
    const hasSteps = Array.isArray(sol.steps)
      ? sol.steps.some((s: string) => s && s.trim())
      : Boolean(sol.steps && sol.steps.trim());
    const hasExplanation = Boolean(sol.explanation && sol.explanation.trim());
    const hasFinalAnswer = Boolean(sol.final_answer && sol.final_answer.trim());
    return hasBrief || hasSteps || hasExplanation || hasFinalAnswer;
  });
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
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: true,
              output: 'html',
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto font-sans [&_.katex-display]:my-0"
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
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: false,
              output: 'html',
            });
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

const defaultSolution: SolutionItem = {
  id: 'sol-1',
  title: 'Solusi 1',
  author: 'Dave Marcellino',
  brief: '',
  steps: [],
  final_answer: '',
};

interface BatchItem {
  id: string;
  title: string;
  statement: string;
  problem_type: 'multiple_choice' | 'short_answer';
  options: { A: string; B: string; C: string; D: string; E: string };
  final_answer: string;
}

export default function AdminProblemsPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);

  const [moveTarget, setMoveTarget] = useState<{ id: string; type: 'problem' | 'folder'; name: string } | null>(null);
  const [moveModalFolderId, setMoveModalFolderId] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState('');

  // Form State - Single Problem
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    competition: string;
    year: number;
    level: string;
    topic: string;
    statement: string;
    solutions: SolutionItem[];
    section: string;
    problem_type: string;
    options: { [key: string]: string };
  }>({
    id: '',
    title: '',
    competition: '',
    year: 2026,
    level: '',
    topic: '',
    statement: '',
    solutions: [{ ...defaultSolution }],
    section: '',
    problem_type: 'multiple_choice',
    options: { A: '', B: '', C: '', D: '', E: '' },
  });

  const [stepsText, setStepsText] = useState<{ [solId: string]: string }>({
    'sol-1': '',
  });

  // Form State - Mass Input (Batch) Mendukung Pilihan Ganda
  const [batchMeta, setBatchMeta] = useState({
    competition: '',
    year: 2026,
    level: '',
    topic: '',
    section: '',
    default_type: 'multiple_choice' as 'multiple_choice' | 'short_answer',
  });

  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    {
      id: '',
      title: '',
      statement: '',
      problem_type: 'multiple_choice',
      options: { A: '', B: '', C: '', D: '', E: '' },
      final_answer: 'A',
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: folderData, error: fErr } = await supabase.from('folders').select('*');
    if (!fErr && folderData) {
      const sortedFolders = (folderData as Folder[]).sort((a, b) => {
        const orderA = (a as any).order_index ?? 0;
        const orderB = (b as any).order_index ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
      setFolders(sortedFolders);
    }

    const { data: problemData } = await supabase
      .from('problems')
      .select('*')
      .order('order_index', { ascending: true });

    if (problemData) setProblems(problemData as Problem[]);
    setLoading(false);
  }

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const currentSubFolders = folders.filter((f) =>
    currentFolderId === null ? !f.parent_id : f.parent_id === currentFolderId
  );
  const currentProblems = problems.filter((p) =>
    currentFolderId === null ? !p.folder_id : p.folder_id === currentFolderId
  );

  const getBreadcrumbs = () => {
    const crumbs: Folder[] = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parent_id);
    }
    return crumbs;
  };
  const breadcrumbs = getBreadcrumbs();

  const moveModalCurrentFolder = folders.find((f) => f.id === moveModalFolderId);
  const moveModalSubFolders = folders.filter((f) =>
    moveModalFolderId === null ? !f.parent_id : f.parent_id === moveModalFolderId
  );

  const getMoveModalBreadcrumbs = () => {
    const crumbs: Folder[] = [];
    let curr = moveModalCurrentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find((f) => f.id === curr?.parent_id);
    }
    return crumbs;
  };
  const moveModalBreadcrumbs = getMoveModalBreadcrumbs();

  const resetForm = () => {
    const initSolId = `sol-${Date.now()}`;
    setFormData({
      id: '',
      title: '',
      competition: currentFolder?.name || '',
      year: 2026,
      level: '',
      topic: '',
      statement: '',
      solutions: [{ ...defaultSolution, id: initSolId }],
      section: '',
      problem_type: 'multiple_choice',
      options: { A: '', B: '', C: '', D: '', E: '' },
    });
    setStepsText({ [initSolId]: '' });
    setEditingProblemId(null);
  };

  const resetBatchForm = () => {
    setBatchMeta({
      competition: currentFolder?.name || '',
      year: 2026,
      level: '',
      topic: '',
      section: '',
      default_type: 'multiple_choice',
    });
    setBatchItems([
      {
        id: '',
        title: '',
        statement: '',
        problem_type: 'multiple_choice',
        options: { A: '', B: '', C: '', D: '', E: '' },
        final_answer: 'A',
      },
    ]);
  };

  const handleStartEdit = (problem: Problem) => {
    setEditingProblemId(problem.id);
    
    const rawSolutions = problem.solutions && problem.solutions.length > 0
      ? problem.solutions
      : [{ ...defaultSolution, id: `sol-${Date.now()}` }];

    const loadedSolutions: SolutionItem[] = rawSolutions.map((sol: any, idx: number) => ({
      id: sol.id || `sol_${Date.now()}_${idx}`,
      title: sol.title || `Solusi ${idx + 1}`,
      author: sol.author || 'Dave Marcellino',
      brief: sol.brief || '',
      steps: Array.isArray(sol.steps)
        ? sol.steps
        : typeof sol.steps === 'string'
        ? [sol.steps]
        : typeof sol.content === 'string'
        ? [sol.content]
        : [],
      final_answer: sol.final_answer || sol.answer || sol.result || '',
    }));

    const newStepsText: { [solId: string]: string } = {};
    loadedSolutions.forEach((sol: any) => {
      const solKey = sol.id;
      if (Array.isArray(sol.steps)) {
        newStepsText[solKey] = sol.steps.join('\n');
      } else if (typeof sol.steps === 'string') {
        newStepsText[solKey] = sol.steps;
      } else if (typeof sol.content === 'string') {
        newStepsText[solKey] = sol.content;
      } else {
        newStepsText[solKey] = '';
      }
    });

    setFormData({
      id: problem.id,
      title: problem.title || '',
      competition: problem.competition || '',
      year: problem.year || 2026,
      level: problem.level || '',
      topic: problem.topic || '',
      statement: problem.statement || '',
      solutions: loadedSolutions,
      section: problem.section || '',
      problem_type: (problem as any).problem_type || 'multiple_choice',
      options: (problem as any).options && typeof (problem as any).options === 'object'
        ? { A: '', B: '', C: '', D: '', E: '', ...(problem as any).options }
        : { A: '', B: '', C: '', D: '', E: '' },
    });
    setStepsText(newStepsText);
    setShowAddProblemModal(true);
  };

  const handleAddSolution = () => {
    const newSolId = `sol-${Date.now()}`;
    const newSol: SolutionItem = {
      id: newSolId,
      title: `Solusi ${formData.solutions.length + 1}`,
      author: 'Dave Marcellino',
      brief: '',
      steps: [],
      final_answer: '',
    };
    setFormData({ ...formData, solutions: [...formData.solutions, newSol] });
    setStepsText({ ...stepsText, [newSolId]: '' });
  };

  const handleRemoveSolution = (solId: string) => {
    if (formData.solutions.length <= 1) return;
    setFormData({
      ...formData,
      solutions: formData.solutions.filter((s) => s.id !== solId),
    });
  };

  const handleUpdateSolution = (solId: string, field: keyof SolutionItem, value: any) => {
    setFormData({
      ...formData,
      solutions: formData.solutions.map((sol) =>
        sol.id === solId ? { ...sol, [field]: value } : sol
      ),
    });
  };

  // Batch Form Handlers
  const handleAddBatchRow = () => {
    setBatchItems([
      ...batchItems,
      {
        id: '',
        title: '',
        statement: '',
        problem_type: batchMeta.default_type,
        options: { A: '', B: '', C: '', D: '', E: '' },
        final_answer: batchMeta.default_type === 'multiple_choice' ? 'A' : '',
      },
    ]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchItems.length <= 1) return;
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const handleBatchItemChange = (index: number, field: string, value: any) => {
    const updated = [...batchItems];
    if (field.startsWith('options.')) {
      const optKey = field.split('.')[1] as 'A' | 'B' | 'C' | 'D' | 'E';
      updated[index].options = {
        ...updated[index].options,
        [optKey]: value,
      };
    } else {
      (updated[index] as any)[field] = value;
    }
    setBatchItems(updated);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const currentMaxOrder = currentSubFolders.length > 0
      ? Math.max(...currentSubFolders.map((f) => (f as any).order_index || 0))
      : 0;

    const folderId = newFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const { error } = await supabase.from('folders').insert([
      {
        id: folderId,
        name: newFolderName.trim(),
        parent_id: currentFolderId,
        order_index: currentMaxOrder + 1,
      },
    ]);

    if (!error) {
      setNewFolderName('');
      setShowAddFolderModal(false);
      fetchData();
    } else {
      alert(`Gagal membuat folder: ${error.message}`);
    }
  };

  const handleRenameFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolder.name.trim()) return;

    const { data, error } = await supabase
      .from('folders')
      .update({ name: editingFolder.name.trim() })
      .eq('id', editingFolder.id)
      .select();

    if (error) {
      alert(`Gagal merename folder: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert('Gagal merename: Data tidak ditemukan atau terhalang aturan RLS Supabase.');
    } else {
      setEditingFolder(null);
      await fetchData();
    }
  };

  const handleMoveFolderOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSubFolders.length) return;

    const updatedSubFolders = [...currentSubFolders];
    const temp = updatedSubFolders[index];
    updatedSubFolders[index] = updatedSubFolders[targetIndex];
    updatedSubFolders[targetIndex] = temp;

    const updates = updatedSubFolders.map((folder, i) =>
      supabase
        .from('folders')
        .update({ order_index: i + 1 })
        .eq('id', folder.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.find((r) => r.error);

    if (hasError?.error) {
      alert(`Gagal mengubah urutan: ${hasError.error.message}`);
    } else {
      await fetchData();
    }
  };

  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();

    const processedSolutions = formData.solutions
      .filter((sol) => sol.brief?.trim() !== '' || stepsText[sol.id]?.trim() !== '' || sol.final_answer?.trim() !== '')
      .map((sol) => {
        const rawText = stepsText[sol.id] || '';
        const stepsArray = rawText.split('\n').filter((step) => step.trim() !== '');
        return {
          id: sol.id || `sol-${Date.now()}`,
          title: sol.title || 'Solusi Utama',
          author: sol.author || 'Dave Marcellino',
          brief: sol.brief || '',
          steps: stepsArray,
          final_answer: sol.final_answer || '',
        };
      });

    const payload = {
      title: formData.title.trim(),
      competition: formData.competition.trim() || currentFolder?.name || 'Umum',
      year: Number(formData.year),
      level: formData.level.trim() || 'Umum',
      topic: formData.topic.trim() || 'Umum',
      statement: formData.statement,
      solutions: processedSolutions,
      section: formData.section ? formData.section.trim() : null,
      problem_type: formData.problem_type,
      options: formData.problem_type === 'multiple_choice' ? formData.options : {},
    };

    if (editingProblemId) {
      const { error } = await supabase
        .from('problems')
        .update(payload)
        .eq('id', editingProblemId);

      if (!error) {
        setShowAddProblemModal(false);
        resetForm();
        fetchData();
      } else {
        alert(`Gagal memperbarui soal: ${error.message}`);
      }
    } else {
      const currentMaxOrder = problems.length > 0 ? Math.max(...problems.map((p) => p.order_index || 0)) : 0;

      const { error } = await supabase.from('problems').insert([
        {
          id: formData.id.trim(),
          ...payload,
          folder_id: currentFolderId,
          order_index: currentMaxOrder + 1,
        },
      ]);

      if (!error) {
        setShowAddProblemModal(false);
        resetForm();
        fetchData();
      } else {
        alert(`Gagal menyimpan soal: ${error.message}`);
      }
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = batchItems.filter(
      (item) => item.id.trim() !== '' && item.statement.trim() !== ''
    );

    if (validItems.length === 0) {
      alert('Harap isi minimal satu soal dengan ID dan Pernyataan yang valid.');
      return;
    }

    const currentMaxOrder = problems.length > 0 ? Math.max(...problems.map((p) => p.order_index || 0)) : 0;

    const payload = validItems.map((item, index) => {
      const isPG = item.problem_type === 'multiple_choice';
      
      const initialSolutions = item.final_answer?.trim()
        ? [
            {
              id: `sol-${Date.now()}-${index}`,
              title: 'Kunci Jawaban Resmi',
              author: 'Dave Marcellino',
              brief: '',
              steps: [],
              final_answer: item.final_answer.trim(),
            },
          ]
        : [];

      return {
        id: item.id.trim(),
        title: item.title.trim() || `Soal ${item.id.trim()}`,
        competition: batchMeta.competition.trim() || currentFolder?.name || 'Umum',
        year: Number(batchMeta.year),
        level: batchMeta.level.trim() || 'Umum',
        topic: batchMeta.topic.trim() || 'Umum',
        section: batchMeta.section.trim() ? batchMeta.section.trim() : null,
        statement: item.statement,
        solutions: initialSolutions,
        folder_id: currentFolderId,
        order_index: currentMaxOrder + index + 1,
        problem_type: item.problem_type,
        options: isPG ? item.options : {},
      };
    });

    const { error } = await supabase.from('problems').insert(payload);

    if (!error) {
      setShowBatchModal(false);
      resetBatchForm();
      fetchData();
    } else {
      alert(`Gagal menambah batch: ${error.message}`);
    }
  };

  const handleConfirmMove = async () => {
    if (!moveTarget) return;

    if (moveTarget.type === 'problem') {
      const { error } = await supabase
        .from('problems')
        .update({ folder_id: moveModalFolderId })
        .eq('id', moveTarget.id);
      if (!error) {
        setMoveTarget(null);
        fetchData();
      } else alert(`Gagal memindahkan: ${error.message}`);
    } else {
      if (moveTarget.id === moveModalFolderId) {
        alert('Tidak bisa memindahkan folder ke dalam dirinya sendiri!');
        return;
      }
      const { error } = await supabase
        .from('folders')
        .update({ parent_id: moveModalFolderId })
        .eq('id', moveTarget.id);
      if (!error) {
        setMoveTarget(null);
        fetchData();
      } else alert(`Gagal memindahkan: ${error.message}`);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    const { error } = await supabase.from('problems').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Hapus folder ini beserta isinya?')) return;
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentProblems.length) return;

    const p1 = currentProblems[index];
    const p2 = currentProblems[targetIndex];

    await supabase.from('problems').update({ order_index: p2.order_index }).eq('id', p1.id);
    await supabase.from('problems').update({ order_index: p1.order_index }).eq('id', p2.id);

    fetchData();
  };

  const inputClass = "w-full p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1 pb-20">
        
        <AdminNavbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 my-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Dashboard Admin
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Bank Soal & Folder
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kelola arsip soal olimpiade/kompetisi, pilihan ganda, hirarki sub-folder, serta metode pembahasan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowAddFolderModal(true)}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <PlusIcon />
                <span>+ Sub-Folder</span>
              </button>
              <button
                onClick={() => {
                  resetBatchForm();
                  setShowBatchModal(true);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <PlusIcon />
                <span>Input Massal</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddProblemModal(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <PlusIcon />
                <span>Tambah Soal</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2">
              Lokasi Folder Kerja Saat Ini:
            </span>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setCurrentFolderId(null)}
                className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                  currentFolderId === null 
                    ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FolderIcon className="w-3.5 h-3.5" />
                <span>Root Utama</span>
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 ${
                      idx === breadcrumbs.length - 1
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>{crumb.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">

            {/* SUB-FOLDERS */}
            {currentSubFolders.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Sub-Folder ({currentSubFolders.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {currentSubFolders.map((folder, idx) => {
                    const childFolderCount = folders.filter((f) => f.parent_id === folder.id).length;
                    const childProblemCount = problems.filter((p) => p.folder_id === folder.id).length;

                    return (
                      <div
                        key={folder.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm transition flex items-center justify-between group"
                      >
                        <div
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="flex items-center gap-3 cursor-pointer truncate flex-1 pr-2"
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
                            <FolderIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                              {folder.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                              {childFolderCount > 0 && `${childFolderCount} folder `}
                              {childProblemCount > 0 && `${childProblemCount} soal`}
                              {childFolderCount === 0 && childProblemCount === 0 && 'Kosong'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveFolderOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                            title="Naikkan Urutan Folder"
                          >
                            <ArrowUpIcon />
                          </button>
                          <button
                            onClick={() => handleMoveFolderOrder(idx, 'down')}
                            disabled={idx === currentSubFolders.length - 1}
                            className="p-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                            title="Turunkan Urutan Folder"
                          >
                            <ArrowDownIcon />
                          </button>
                          <button
                            onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                            title="Ubah Nama (Rename) Folder"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => {
                              setMoveTarget({ id: folder.id, type: 'folder', name: folder.name });
                              setMoveModalFolderId(null);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                            title="Pindahkan Folder"
                          >
                            <MoveIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg text-slate-400 hover:text-red-500 transition"
                            title="Hapus Folder"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* DAFTAR SOAL */}
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Daftar Soal ({currentProblems.length})
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : currentProblems.length > 0 ? (
                <div className="space-y-4">
                  {currentProblems.map((problem, idx) => {
                    const isPG = (problem as any).problem_type === 'multiple_choice';
                    const opts = (problem as any).options || {};
                    const hasOptions = Object.keys(opts).some((k) => opts[k]);
                    
                    const validSolutions = getValidSolutions(problem);
                    const hasValidSolutions = validSolutions.length > 0;

                    const isLongOption = Object.values(opts).some(
                      (optText: any) => optText && typeof optText === 'string' && (optText.length > 35 || optText.includes('\n'))
                    );

                    const renderAdminOptionCard = (opt: string) => {
                      const optText = opts[opt];
                      if (!optText) return null;
                      return (
                        <div
                          key={opt}
                          className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-3 transition"
                        >
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900">
                            {opt}
                          </span>
                          <div className="flex-1 min-w-0 py-0.5">
                            <MathText text={optText} />
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div key={problem.id} className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-lg">
                              {problem.competition} {problem.year} ({problem.level})
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                              isPG 
                                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {isPG ? 'Pilihan Ganda' : 'Isian / Uraian'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveOrder(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                              title="Naikkan Urutan"
                            >
                              <ArrowUpIcon />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(idx, 'down')}
                              disabled={idx === currentProblems.length - 1}
                              className="p-1 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                              title="Turunkan Urutan"
                            >
                              <ArrowDownIcon />
                            </button>
                            <button
                              onClick={() => handleStartEdit(problem)}
                              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-lg inline-flex items-center gap-1 transition ml-1"
                              title="Edit Soal"
                            >
                              <EditIcon />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setMoveTarget({ id: problem.id, type: 'problem', name: problem.title });
                                setMoveModalFolderId(null);
                              }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg inline-flex items-center gap-1 transition ml-1"
                            >
                              <MoveIcon />
                              <span>Pindahkan</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="p-1.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-lg hover:bg-red-100 transition ml-1"
                              title="Hapus Soal"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        {/* Pernyataan Teks Soal */}
                        <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                          <MathText text={problem.statement} />
                        </div>

                        {/* PREVIEW OPSI PILIHAN GANDA (A-E) SEJAJAR */}
                        {isPG && hasOptions && (
                          <div>
                            {isLongOption ? (
                              <div className="space-y-2.5 pt-2">
                                {['A', 'B', 'C', 'D', 'E'].map((opt) => renderAdminOptionCard(opt))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                <div className="space-y-2.5">
                                  {['A', 'B', 'C'].map((opt) => renderAdminOptionCard(opt))}
                                </div>
                                <div className="space-y-2.5">
                                  {['D', 'E'].map((opt) => renderAdminOptionCard(opt))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 dark:text-slate-500 font-mono">ID: {problem.id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Topik: {problem.topic}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            {hasValidSolutions ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900/60">
                                {validSolutions.length} Metode Pembahasan
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/60">
                                Belum Ada Pembahasan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : currentSubFolders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs shadow-sm">
                  Folder ini masih kosong. Klik <strong>+ Input Massal</strong> atau <strong>+ Tambah Soal</strong> untuk menginput soal.
                </div>
              ) : null}
            </section>

          </div>

        </main>
      </div>

      {/* MODAL 1: BUAT SUB-FOLDER BARU */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Buat Folder Baru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Folder baru akan dibuat di dalam: <strong>{currentFolder ? currentFolder.name : 'Root Utama'}</strong>
            </p>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Nama Folder (mis. Wilayah, 2026)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={inputClass}
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFolderModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition shadow-md"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RENAME FOLDER */}
      {editingFolder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Ubah Nama Folder</h3>
            <form onSubmit={handleRenameFolderSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Nama Folder Baru"
                value={editingFolder.name}
                onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                className={inputClass}
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition shadow-md"
                >
                  Simpan Nama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INPUT SOAL MASSAL (BATCH) */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Input Soal Massal (Batch)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Isi metadata satu kali, lalu masukkan ID, Pernyataan, dan Opsi A–E untuk banyak soal sekaligus.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 px-3 py-1 rounded-xl">
                Folder: {currentFolder ? currentFolder.name : 'Root'}
              </span>
            </div>

            <form onSubmit={handleBatchSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metadata Bersama Batch Ini</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Kompetisi</label>
                      <input
                        type="text"
                        placeholder="mis. ONMIPA-PT"
                        value={batchMeta.competition}
                        onChange={(e) => setBatchMeta({ ...batchMeta, competition: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tahun</label>
                      <input
                        type="number"
                        required
                        value={batchMeta.year}
                        onChange={(e) => setBatchMeta({ ...batchMeta, year: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat</label>
                      <input
                        type="text"
                        placeholder="mis. Wilayah / Nasional"
                        value={batchMeta.level}
                        onChange={(e) => setBatchMeta({ ...batchMeta, level: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Topik / Bidang</label>
                      <input
                        type="text"
                        placeholder="mis. Struktur Aljabar"
                        value={batchMeta.topic}
                        onChange={(e) => setBatchMeta({ ...batchMeta, topic: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Seksi / Section (Opsional)</label>
                      <input
                        type="text"
                        placeholder="mis. Bagian A, PG"
                        value={batchMeta.section}
                        onChange={(e) => setBatchMeta({ ...batchMeta, section: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Default Tipe Soal Batch</label>
                      <select
                        value={batchMeta.default_type}
                        onChange={(e) => setBatchMeta({ ...batchMeta, default_type: e.target.value as any })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400"
                      >
                        <option value="multiple_choice">Pilihan Ganda (A-E)</option>
                        <option value="short_answer">Isian Singkat / Uraian</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Daftar Soal Batch ({batchItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddBatchRow}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>+ Tambah Baris Soal</span>
                    </button>
                  </div>

                  {batchItems.map((item, index) => (
                    <div key={index} className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 relative shadow-sm">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 rounded-md">
                            Baris Soal #{index + 1}
                          </span>
                          <select
                            value={item.problem_type}
                            onChange={(e) => handleBatchItemChange(index, 'problem_type', e.target.value)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                          >
                            <option value="multiple_choice">Pilihan Ganda (A-E)</option>
                            <option value="short_answer">Isian Singkat</option>
                          </select>
                        </div>

                        {batchItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(index)}
                            className="text-xs text-red-500 hover:text-red-600 font-bold transition inline-flex items-center gap-1"
                          >
                            <TrashIcon />
                            <span>Hapus Baris</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ID Soal (Unik)</label>
                          <input
                            type="text"
                            required
                            placeholder="mis. ONM-26-W1-I1"
                            value={item.id}
                            onChange={(e) => handleBatchItemChange(index, 'id', e.target.value)}
                            className={`${inputClass} font-mono`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Judul Singkat Soal</label>
                          <input
                            type="text"
                            required
                            placeholder="mis. Soal 1 Pilihan Ganda"
                            value={item.title}
                            onChange={(e) => handleBatchItemChange(index, 'title', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pernyataan Soal (LaTeX $...$)</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Tuliskan pernyataan soal di sini..."
                          value={item.statement}
                          onChange={(e) => handleBatchItemChange(index, 'statement', e.target.value)}
                          className={`${inputClass} font-mono leading-relaxed`}
                        />
                      </div>

                      {item.problem_type === 'multiple_choice' ? (
                        <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Opsi Jawaban A–E (KaTeX $...$):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                              <div key={opt} className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900">
                                  {opt}
                                </span>
                                <input
                                  type="text"
                                  placeholder={`Opsi ${opt}`}
                                  value={item.options[opt as 'A' | 'B' | 'C' | 'D' | 'E'] || ''}
                                  onChange={(e) => handleBatchItemChange(index, `options.${opt}`, e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Kunci Jawaban Resmi:</label>
                            <select
                              value={item.final_answer}
                              onChange={(e) => handleBatchItemChange(index, 'final_answer', e.target.value)}
                              className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-indigo-600"
                            >
                              {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                <option key={opt} value={opt}>Opsi {opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Kunci Jawaban Singkat (Opsional)</label>
                          <input
                            type="text"
                            placeholder="mis. \frac{1}{2} atau 42"
                            value={item.final_answer}
                            onChange={(e) => handleBatchItemChange(index, 'final_answer', e.target.value)}
                            className={`${inputClass} font-mono`}
                          />
                        </div>
                      )}

                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs whitespace-pre-line min-h-[42px]">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          Live Preview Tampilan Soal #{index + 1}:
                        </span>
                        <MathText text={item.statement} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchModal(false);
                    resetBatchForm();
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition shadow-md"
                >
                  Simpan Semua Soal Massal ({batchItems.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INPUT / EDIT SOAL SATUAN */}
      {showAddProblemModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingProblemId ? 'Edit Soal' : 'Tambah Soal Satuan'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gunakan notasi <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">$...$</code> untuk persamaan matematika.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900">
                Lokasi: {currentFolder ? currentFolder.name : 'Root'}
              </span>
            </div>

            <form onSubmit={handleSubmitProblem} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Metadata Soal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ID Soal (Unik)</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingProblemId)}
                        placeholder="mis. ONMIPA-2026-W1"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className={`${inputClass} ${editingProblemId ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Singkat Soal</label>
                      <input
                        type="text"
                        required
                        placeholder="mis. Soal 1 Isian Singkat"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kompetisi</label>
                      <input
                        type="text"
                        placeholder="mis. ONMIPA"
                        value={formData.competition}
                        onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tahun</label>
                      <input
                        type="number"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tingkat</label>
                      <input
                        type="text"
                        placeholder="mis. Wilayah / Nasional"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Topik / Bidang</label>
                      <input
                        type="text"
                        placeholder="mis. Aljabar"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Bagian / Section Soal (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Isian Singkat, Uraian, Bagian A"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Teks Soal (LaTeX $...$)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tentukan nilai dari $\int_0^1 x^2 dx$..."
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    className={`${inputClass} font-mono leading-relaxed`}
                  />
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl min-h-[50px] text-sm whitespace-pre-line">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Live Preview Tampilan Soal:</span>
                    <MathText text={formData.statement} />
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                    <div>
                      <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                        📝 Format & Tipe Jawaban Soal
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Pilih apakah soal berbentuk pilihan ganda (A–E) atau isian singkat.
                      </p>
                    </div>
                    <select
                      value={formData.problem_type}
                      onChange={(e) => setFormData({ ...formData, problem_type: e.target.value })}
                      className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none shrink-0"
                    >
                      <option value="multiple_choice">Pilihan Ganda (A–E)</option>
                      <option value="short_answer">Isian Singkat / Uraian</option>
                    </select>
                  </div>

                  {formData.problem_type === 'multiple_choice' && (
                    <div className="space-y-3 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Isi Teks / Notasi KaTeX Opsi Jawaban (A–E):
                      </span>
                      {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                        <div key={opt} className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-900">
                            {opt}
                          </span>
                          <input
                            type="text"
                            placeholder={`Teks Opsi ${opt} (mis. $\\frac{1}{2}$ atau 42)`}
                            value={formData.options[opt] || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                options: { ...formData.options, [opt]: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Opsi Solusi & Pembahasan</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Bisa menambahkan lebih dari 1 metode penyelesaian untuk 1 soal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSolution}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>+ Tambah Metode Solusi Baru</span>
                    </button>
                  </div>

                  {formData.solutions.map((sol, index) => (
                    <div key={sol.id || index} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                          Metode Solusi #{index + 1}
                        </span>
                        {formData.solutions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSolution(sol.id)}
                            className="text-xs text-red-500 hover:text-red-600 font-bold transition inline-flex items-center gap-1"
                          >
                            <TrashIcon />
                            <span>Hapus Solusi Ini</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Solusi / Metode</label>
                          <input
                            type="text"
                            required
                            placeholder="mis. Solusi 1 (Resmi) / Metode AM-GM"
                            value={sol.title}
                            onChange={(e) => handleUpdateSolution(sol.id, 'title', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Penulis / Penyusun Solusi</label>
                          <input
                            type="text"
                            placeholder="mis. Official IMO 2024 / Dave Marcellino"
                            value={sol.author}
                            onChange={(e) => handleUpdateSolution(sol.id, 'author', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Ide Ringkas / Hint</label>
                          <textarea
                            rows={3}
                            placeholder="Gagasan umum penyelesaian..."
                            value={sol.brief}
                            onChange={(e) => handleUpdateSolution(sol.id, 'brief', e.target.value)}
                            className={`${inputClass} font-mono leading-relaxed`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Langkah Rinci (1 per baris)</label>
                          <textarea
                            rows={3}
                            placeholder="Langkah 1: ...&#10;Langkah 2: ..."
                            value={stepsText[sol.id] || ''}
                            onChange={(e) => setStepsText({ ...stepsText, [sol.id]: e.target.value })}
                            className={`${inputClass} font-mono leading-relaxed`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Kunci Jawaban Benar / Hasil Akhir</label>
                        <input
                          type="text"
                          placeholder={formData.problem_type === 'multiple_choice' ? "mis. A (atau huruf opsi yang benar)" : "mis. \\frac{1}{3} atau 42"}
                          value={sol.final_answer || ''}
                          onChange={(e) => handleUpdateSolution(sol.id, 'final_answer', e.target.value)}
                          className={`${inputClass} font-mono font-bold text-indigo-600 dark:text-indigo-400`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProblemModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-md"
                >
                  {editingProblemId ? 'Simpan Perubahan' : 'Simpan Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PENJELAJAH FOLDER GOOGLE DRIVE STYLE */}
      {moveTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">Pindahkan Item</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                &quot;{moveTarget.name}&quot;
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => setMoveModalFolderId(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] ${
                  moveModalFolderId === null ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Root Utama
              </button>
              {moveModalBreadcrumbs.map((crumb) => (
                <div key={crumb.id} className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-600">/</span>
                  <button
                    onClick={() => setMoveModalFolderId(crumb.id)}
                    className={`px-2.5 py-1 rounded-lg ${
                      moveModalFolderId === crumb.id ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 max-h-52 overflow-y-auto space-y-1 bg-white dark:bg-slate-950">
              {moveModalSubFolders.length > 0 ? (
                moveModalSubFolders.map((subF) => (
                  <div
                    key={subF.id}
                    onClick={() => setMoveModalFolderId(subF.id)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{subF.name}</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  Tidak ada sub-folder di dalam folder ini.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tujuan: <strong>{moveModalCurrentFolder ? moveModalCurrentFolder.name : 'Root Utama'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMoveTarget(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmMove}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-md"
                >
                  Pindahkan ke Sini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}