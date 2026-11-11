'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  getAllAdminNodes,
  getKnowledgeFields,
  getNodeBySlug,
  saveKnowledgeNode,
  saveKnowledgeEdge,
} from '@/lib/knowledge-atlas/supabase';
import {
  KnowledgeNode,
  KnowledgeField,
  KnowledgeNodeType,
  KnowledgeStatus,
  KnowledgeRelationType,
} from '@/types/knowledge-atlas';

export default function KnowledgeAtlasAdminPage() {
  const [activeTab, setActiveTab] = useState<'NODES' | 'EDGES'>('NODES');
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [fields, setFields] = useState<KnowledgeField[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Node State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [nodeType, setNodeType] = useState<KnowledgeNodeType>('concept');
  const [fieldId, setFieldId] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<KnowledgeStatus>('published');

  // Form Page Content State
  const [equationLatex, setEquationLatex] = useState('');
  const [explanation, setExplanation] = useState('');
  const [applications, setApplications] = useState('');

  // Form Edge State
  const [sourceNodeId, setSourceNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [relationType, setRelationType] = useState<KnowledgeRelationType>('applied_in');
  const [edgeDescription, setEdgeDescription] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [adminNodes, fieldList] = await Promise.all([
      getAllAdminNodes(),
      getKnowledgeFields(),
    ]);
    setNodes(adminNodes);
    setFields(fieldList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditNode = async (node: KnowledgeNode) => {
    setEditingId(node.id);
    setTitle(node.title);
    setSlug(node.slug);
    setNodeType(node.node_type);
    setFieldId(node.primary_field_id || '');
    setSummary(node.summary);
    setStatus(node.status);

    const { page } = await getNodeBySlug(node.slug);
    const content = page?.content_json || {};
    setEquationLatex(content.equation_latex || '');
    setExplanation(content.explanation || '');
    setApplications(content.applications ? content.applications.join('\n') : '');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setNodeType('concept');
    setFieldId('');
    setSummary('');
    setStatus('published');
    setEquationLatex('');
    setExplanation('');
    setApplications('');
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const appArray = applications
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const pageContent = {
      equation_latex: equationLatex.trim() || undefined,
      explanation: explanation.trim() || undefined,
      applications: appArray.length > 0 ? appArray : undefined,
    };

    const success = await saveKnowledgeNode(
      {
        id: editingId || undefined,
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        node_type: nodeType,
        primary_field_id: fieldId || null,
        summary,
        status,
      },
      pageContent
    );

    if (success) {
      setMessage({ type: 'success', text: 'Entitas berhasil disimpan!' });
      handleResetForm();
      loadData();
    } else {
      setMessage({ type: 'error', text: 'Gagal menyimpan entitas. Cek konsol.' });
    }
  };

  const handleSaveEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (sourceNodeId === targetNodeId) {
      setMessage({ type: 'error', text: 'Node asal dan tujuan tidak boleh sama.' });
      return;
    }

    const success = await saveKnowledgeEdge({
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      relation_type: relationType,
      description: edgeDescription,
    });

    if (success) {
      setMessage({ type: 'success', text: 'Relasi Graf berhasil ditambahkan!' });
      setEdgeDescription('');
    } else {
      setMessage({ type: 'error', text: 'Gagal membuat relasi. Mungkin relasi sudah ada.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Dashboard Editor Knowledge Atlas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola entitas konsep, notasi rumus, status publikasi, dan keterhubungan relasi graf.
              </p>
            </div>
            <Link
              href="/knowledge-atlas"
              className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition"
            >
              Lihat Katalog Publik
            </Link>
          </div>

          {/* TAB NAVIGASI */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('NODES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'NODES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              1. Manajemen Entitas (Nodes)
            </button>
            <button
              onClick={() => setActiveTab('EDGES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'EDGES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              2. Hubungkan Graf (Edges)
            </button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* TAB 1: FORM NODE */}
          {activeTab === 'NODES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* FORM EDITOR */}
              <form
                onSubmit={handleSaveNode}
                className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Entitas Konsep' : 'Tambah Entitas Baru'}
                  </h2>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Judul Konsep / Rumus</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (!editingId) {
                          setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }
                      }}
                      placeholder="misal: Derivatif"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipe Entitas</label>
                    <select
                      value={nodeType}
                      onChange={(e) => setNodeType(e.target.value as KnowledgeNodeType)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <option value="concept">Concept</option>
                      <option value="formula">Formula</option>
                      <option value="theorem">Theorem</option>
                      <option value="algorithm">Algorithm</option>
                      <option value="person">Person</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Sub-bidang (Field)</label>
                    <select
                      value={fieldId}
                      onChange={(e) => setFieldId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <option value="">-- Tanpa Field --</option>
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Status Publikasi</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as KnowledgeStatus)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ringkasan Singkat (Summary)</label>
                  <textarea
                    rows={2}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Ringkasan 1-2 kalimat..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Persamaan LaTeX (Opsional)</label>
                  <input
                    type="text"
                    value={equationLatex}
                    onChange={(e) => setEquationLatex(e.target.value)}
                    placeholder="misal: f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Penjelasan Lengkap (Markdown/Teks)</label>
                  <textarea
                    rows={4}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Penjelasan mendalam mengenai konsep..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Aplikasi Utama (1 per baris)</label>
                  <textarea
                    rows={3}
                    value={applications}
                    onChange={(e) => setApplications(e.target.value)}
                    placeholder="Kecepatan dan percepatan dalam Fisika Klasik&#10;Pengoptimalan fungsi pada Machine Learning"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Terbitkan Entitas Baru'}
                </button>
              </form>

              {/* DAFTAR NODE TERSEDIA */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  Daftar Entitas ({nodes.length})
                </h2>

                {loading ? (
                  <p className="text-xs text-slate-400">Memuat data...</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {nodes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleEditNode(n)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                          editingId === n.id
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              n.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {n.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{n.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FORM RELASI GRAF (EDGES) */}
          {activeTab === 'EDGES' && (
            <form
              onSubmit={handleSaveEdge}
              className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                Hubungkan Dua Konsep (Tambah Graf Edge)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Node Asal (Source)</label>
                  <select
                    required
                    value={sourceNodeId}
                    onChange={(e) => setSourceNodeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    <option value="">-- Pilih Node Asal --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Node Tujuan (Target)</label>
                  <select
                    required
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    <option value="">-- Pilih Node Tujuan --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Jenis Hubungan / Relasi</label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value as KnowledgeRelationType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  <option value="applied_in">applied_in (Diterapkan Pada)</option>
                  <option value="prerequisite_of">prerequisite_of (Prasyarat Untuk)</option>
                  <option value="derived_from">derived_from (Diturunkan Dari)</option>
                  <option value="related_to">related_to (Berhubungan Dengan)</option>
                  <option value="contrasts_with">contrasts_with (Berlawanan Dengan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Penjelasan Singkat Keterhubungan</label>
                <textarea
                  rows={3}
                  value={edgeDescription}
                  onChange={(e) => setEdgeDescription(e.target.value)}
                  placeholder="misal: Turunan digunakan dalam mengukur laju perubahan kecepatan posisi terhadap waktu."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Buat Hubungan Graf
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}