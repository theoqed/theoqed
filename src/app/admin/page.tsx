'use client';

import { useState, useEffect } from 'react';
import katex from 'katex';
import { supabase } from '../../lib/supabase';
import { Problem, Folder, SolutionItem } from '@/types';

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

export default function AdminPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  
  const [moveTarget, setMoveTarget] = useState<{ id: string; type: 'problem' | 'folder'; name: string } | null>(null);
  const [moveModalFolderId, setMoveModalFolderId] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState('');
  
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
  });

  const [stepsText, setStepsText] = useState<{ [solId: string]: string }>({
    'sol-1': '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: folderData } = await supabase.from('folders').select('*').order('name', { ascending: true });
    if (folderData) setFolders(folderData as Folder[]);

    const { data: problemData } = await supabase.from('problems').select('*').order('order_index', { ascending: true });
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
      competition: '',
      year: 2026,
      level: '',
      topic: '',
      statement: '',
      solutions: [{ ...defaultSolution, id: initSolId }],
      section: '',
    });
    setStepsText({ [initSolId]: '' });
    setEditingProblemId(null);
  };

  const handleStartEdit = (problem: Problem) => {
    setEditingProblemId(problem.id);
    const loadedSolutions = problem.solutions && problem.solutions.length > 0
      ? problem.solutions
      : [{ ...defaultSolution, id: `sol-${Date.now()}` }];

    const newStepsText: { [solId: string]: string } = {};
    loadedSolutions.forEach((sol) => {
      newStepsText[sol.id] = sol.steps ? sol.steps.join('\n') : '';
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const folderId = newFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const { error } = await supabase.from('folders').insert([
      { id: folderId, name: newFolderName.trim(), parent_id: currentFolderId }
    ]);

    if (!error) {
      setNewFolderName('');
      setShowAddFolderModal(false);
      fetchData();
    } else {
      alert(`Gagal membuat folder: ${error.message}`);
    }
  };

  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();

    const processedSolutions = formData.solutions.map((sol) => {
      const rawText = stepsText[sol.id] || '';
      const stepsArray = rawText.split('\n').filter((step) => step.trim() !== '');
      return {
        ...sol,
        steps: stepsArray,
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

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-slate-800 transition shadow-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
      
      {/* Header Admin */}
      <header className="border-b border-slate-200 bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight flex items-center gap-1">
              <span className="text-blue-400">√</span>TheoQED Admin<span className="text-blue-400">.</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Google Drive Management Mode
            </span>
          </div>

          <a href="/arsip" className="text-xs font-semibold text-slate-300 hover:text-white transition">
            Lihat Tampilan Publik (Arsip) →
          </a>
        </div>
      </header>

      {/* Direct Folder Context Manager */}
      <div className="bg-white border-b border-slate-200/80 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lokasi Folder Kerja</span>
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setCurrentFolderId(null)}
                className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                  currentFolderId === null ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FolderIcon className="w-3.5 h-3.5" />
                <span>Root</span>
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center gap-2">
                  <span className="text-slate-300">/</span>
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                      idx === breadcrumbs.length - 1
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>{crumb.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFolderModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
            >
              <PlusIcon />
              <span>+ Sub-Folder Baru</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddProblemModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
            >
              <PlusIcon />
              <span>+ Tambah Soal di Sini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Folder Workspace */}
      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        
        {/* SUB-FOLDERS */}
        {currentSubFolders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sub-Folder ({currentSubFolders.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentSubFolders.map((folder) => {
                const childFolderCount = folders.filter((f) => f.parent_id === folder.id).length;
                const childProblemCount = problems.filter((p) => p.folder_id === folder.id).length;

                return (
                  <div
                    key={folder.id}
                    className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm transition flex items-center justify-between group"
                  >
                    <div
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="flex items-center gap-3 cursor-pointer truncate flex-1 pr-2"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                        <FolderIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {folder.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {childFolderCount > 0 && `${childFolderCount} folder `}
                          {childProblemCount > 0 && `${childProblemCount} soal`}
                          {childFolderCount === 0 && childProblemCount === 0 && 'Kosong'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setMoveTarget({ id: folder.id, type: 'folder', name: folder.name });
                          setMoveModalFolderId(null);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
                        title="Pindahkan Folder"
                      >
                        <MoveIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
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
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Daftar Soal ({currentProblems.length})
          </h2>

          {loading ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Memuat data...
            </div>
          ) : currentProblems.length > 0 ? (
            <div className="space-y-3">
              {currentProblems.map((problem, idx) => (
                <div key={problem.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                        {problem.competition} {problem.year} ({problem.level})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-30"
                        title="Naikkan Urutan"
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === currentProblems.length - 1}
                        className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-30"
                        title="Turunkan Urutan"
                      >
                        <ArrowDownIcon />
                      </button>
                      <button
                        onClick={() => handleStartEdit(problem)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded inline-flex items-center gap-1 transition ml-1"
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
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded inline-flex items-center gap-1 transition ml-1"
                      >
                        <MoveIcon />
                        <span>Pindahkan</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProblem(problem.id)}
                        className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 transition ml-1"
                        title="Hapus Soal"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <div className="text-slate-800 text-base leading-relaxed mb-5 whitespace-pre-line">
                    <MathText text={problem.statement} />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">ID: {problem.id}</span>
                    <span className="text-slate-500 font-medium">
                      Topik: {problem.topic} • Solusi: <strong>{problem.solutions?.length || 0} Metode</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : currentSubFolders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Folder ini masih kosong. Klik <strong>+ Tambah Soal di Sini</strong> untuk menginput soal.
            </div>
          ) : null}
        </section>

      </div>

      {/* MODAL 1: BUAT SUB-FOLDER BARU */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Buat Folder Baru</h3>
            <p className="text-xs text-slate-500">
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
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFolderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INPUT / EDIT SOAL (MULTI-SOLUSI & AUTHOR) */}
      {showAddProblemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Modal - Fixed */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProblemId ? 'Edit Soal' : 'Tambah Soal Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan notasi <code className="text-blue-600 font-mono font-bold">$...$</code> untuk persamaan matematika.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                Lokasi: {currentFolder ? currentFolder.name : 'Root'}
              </span>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleSubmitProblem} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* Informasi Utama Soal */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metadata Soal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Soal (Unik)</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingProblemId)}
                        placeholder="mis. ONMIPA-2026-W1"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className={`${inputClass} ${editingProblemId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Singkat Soal</label>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Kompetisi</label>
                      <input
                        type="text"
                        placeholder="mis. ONMIPA"
                        value={formData.competition}
                        onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tahun</label>
                      <input
                        type="number"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tingkat</label>
                      <input
                        type="text"
                        placeholder="mis. Wilayah / Nasional"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Topik / Bidang</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bagian / Section Soal (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Isian Singkat, Uraian, Bagian A"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Teks Soal & Live Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Teks Soal (LaTeX $...$)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tentukan nilai dari $\int_0^1 x^2 dx$..."
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    className={`${inputClass} font-mono leading-relaxed`}
                  />
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl min-h-[50px] text-sm whitespace-pre-line">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Preview Tampilan Soal:</span>
                    <MathText text={formData.statement} />
                  </div>
                </div>

                {/* DYNAMIC MULTI-SOLUSI SECTION */}
                <div className="space-y-4 pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Opsi Solusi & Pembahasan</h4>
                      <p className="text-[11px] text-slate-500">Bisa menambahkan lebih dari 1 metode penyelesaian untuk 1 soal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSolution}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>+ Tambah Metode Solusi Baru</span>
                    </button>
                  </div>

                  {formData.solutions.map((sol, index) => (
                    <div key={sol.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                          Metode Solusi #{index + 1}
                        </span>
                        {formData.solutions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSolution(sol.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-bold transition inline-flex items-center gap-1"
                          >
                            <TrashIcon />
                            <span>Hapus Solusi Ini</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Solusi / Metode</label>
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
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Penulis / Penyusun Solusi</label>
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
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Ide Ringkas / Hint</label>
                          <textarea
                            rows={3}
                            placeholder="Gagasan umum penyelesaian..."
                            value={sol.brief}
                            onChange={(e) => handleUpdateSolution(sol.id, 'brief', e.target.value)}
                            className={`${inputClass} font-mono leading-relaxed`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Langkah Rinci (1 per baris)</label>
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Hasil Akhir (LaTeX)</label>
                        <input
                          type="text"
                          placeholder="mis. \frac{1}{3} atau \blacksquare"
                          value={sol.final_answer || ''}
                          onChange={(e) => handleUpdateSolution(sol.id, 'final_answer', e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action Buttons Footer - Fixed */}
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProblemModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  {editingProblemId ? 'Simpan Perubahan' : 'Simpan Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENJELAJAH FOLDER GOOGLE DRIVE STYLE */}
      {moveTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Pindahkan Item</span>
              <h3 className="text-sm font-bold text-slate-900 truncate">
                "{moveTarget.name}"
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-2 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMoveModalFolderId(null)}
                className={`px-2 py-1 rounded text-[11px] ${
                  moveModalFolderId === null ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Root
              </button>
              {moveModalBreadcrumbs.map((crumb) => (
                <div key={crumb.id} className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400">/</span>
                  <button
                    onClick={() => setMoveModalFolderId(crumb.id)}
                    className={`px-2 py-1 rounded ${
                      moveModalFolderId === crumb.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl p-2 max-h-52 overflow-y-auto space-y-1 bg-white">
              {moveModalSubFolders.length > 0 ? (
                moveModalSubFolders.map((subF) => (
                  <div
                    key={subF.id}
                    onClick={() => setMoveModalFolderId(subF.id)}
                    className="p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{subF.name}</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Tidak ada sub-folder di dalam folder ini.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Tujuan: <strong>{moveModalCurrentFolder ? moveModalCurrentFolder.name : 'Root'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMoveTarget(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmMove}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm"
                >
                  Pindahkan ke Sini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}