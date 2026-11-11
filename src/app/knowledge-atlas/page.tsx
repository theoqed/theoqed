'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  getKnowledgeDomains,
  getKnowledgeFields,
  getPublishedNodes,
} from '@/lib/knowledge-atlas/supabase';
import {
  KnowledgeDomain,
  KnowledgeField,
  KnowledgeNode,
} from '@/types/knowledge-atlas';

export default function KnowledgeAtlasCatalogPage() {
  const [domains, setDomains] = useState<KnowledgeDomain[]>([]);
  const [fields, setFields] = useState<KnowledgeField[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDomainId, setSelectedDomainId] = useState<string>('ALL');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function initData() {
      setLoading(true);
      const [domData, fieldData, nodeData] = await Promise.all([
        getKnowledgeDomains(),
        getKnowledgeFields(),
        getPublishedNodes(),
      ]);
      setDomains(domData);
      setFields(fieldData);
      setNodes(nodeData);
      setLoading(false);
    }
    initData();
  }, []);

  const handleDomainChange = async (domainId: string) => {
    setSelectedDomainId(domainId);
    setSelectedFieldId('ALL');
    setLoading(true);

    if (domainId === 'ALL') {
      const [fieldData, nodeData] = await Promise.all([
        getKnowledgeFields(),
        getPublishedNodes({ searchQuery }),
      ]);
      setFields(fieldData);
      setNodes(nodeData);
    } else {
      const [fieldData, nodeData] = await Promise.all([
        getKnowledgeFields(domainId),
        getPublishedNodes({ searchQuery }),
      ]);
      setFields(fieldData);
      const validFieldIds = fieldData.map((f) => f.id);
      setNodes(nodeData.filter((n) => n.primary_field_id && validFieldIds.includes(n.primary_field_id)));
    }
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    const nodeData = await getPublishedNodes({
      fieldId: selectedFieldId !== 'ALL' ? selectedFieldId : undefined,
      searchQuery: query,
    });
    setNodes(nodeData);
    setLoading(false);
  };

  const filteredNodes = nodes.filter((n) => {
    if (selectedFieldId !== 'ALL' && n.primary_field_id !== selectedFieldId) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        {/* HEADER ATLAS (BERSIH & PRESISI) */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>TheoQED Knowledge Atlas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Peta Pengetahuan Terhubungkan — Matematika, STEM & Lintas Disiplin
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Eksplorasi entitas konsep, rumus, teorema, dan jaringan relasi visual yang menghubungkan teori matematika hingga penerapannya di dunia nyata.
            </p>
          </div>
        </div>

        {/* CONTROLS & CATALOG CONTENT */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 my-8 space-y-6">
          {/* DOMAIN TABS, SEARCH BAR, & AKSI CANVAS VISUALIZER */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* DOMAIN SELECTOR */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDomainChange('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDomainId === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua Domain
              </button>

              {domains.map((dom) => (
                <button
                  key={dom.id}
                  onClick={() => handleDomainChange(dom.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedDomainId === dom.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {dom.title} {dom.tier === 1 && '★'}
                </button>
              ))}
            </div>

            {/* CONTROL RIGHT SIDE (SEARCH & VISUALIZER BUTTON) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* PENCARIAN ENTITAS */}
              <div className="relative w-full sm:w-60">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari konsep, rumus..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* TOMBOL CANVAS VISUALIZER (TERINTEGRASI DI BAR FILTER) */}
              <Link
                href="/knowledge-atlas/visualizer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-emerald-400 text-xs font-bold transition border border-slate-700/80 shrink-0 shadow-xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Canvas Graph</span>
              </Link>
            </div>
          </div>

          {/* FIELD SUB-FILTER */}
          {fields.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-xs font-bold text-slate-400">Sub-bidang:</span>
              <button
                onClick={() => setSelectedFieldId('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                  selectedFieldId === 'ALL'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Semua
              </button>
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${ selectedFieldId === f.id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300' }`} > {f.title} </button> ))} </div> )}  {/* GRID NODE ENTITAS */} {loading ? ( <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800"> Memuat data pengetahuan... </div> ) : filteredNodes.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {filteredNodes.map((node) => ( <Link key={node.id} href={`/knowledge-atlas/${node.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
                        {node.node_type}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {node.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {node.summary}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-end text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition duration-200">
                    <div className="flex items-center gap-1">
                      <span>Pelajari Konsep</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              Belum ada entitas konsep yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}