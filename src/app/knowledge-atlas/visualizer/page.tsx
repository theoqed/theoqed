'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getFullGraphData, getKnowledgeDomains } from '@/lib/knowledge-atlas/supabase';
import { KnowledgeNode, KnowledgeEdge, KnowledgeDomain } from '@/types/knowledge-atlas';

interface GraphNodePos {
  node: KnowledgeNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function KnowledgeGraphPage() {
  const [rawNodes, setRawNodes] = useState<KnowledgeNode[]>([]);
  const [rawEdges, setRawEdges] = useState<KnowledgeEdge[]>([]);
  const [domains, setDomains] = useState<KnowledgeDomain[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedDomainId, setSelectedDomainId] = useState<string>('ALL');
  const [selectedRelationType, setSelectedRelationType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Node terpilih untuk drawer detail preview
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  // Canvas pan & zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Posisi Node terhitung
  const [nodePositions, setNodePositions] = useState<GraphNodePos[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Inisialisasi Data
  useEffect(() => {
    async function init() {
      setLoading(true);
      const [graphData, domainList] = await Promise.all([
        getFullGraphData(),
        getKnowledgeDomains(),
      ]);
      setRawNodes(graphData.nodes);
      setRawEdges(graphData.edges);
      setDomains(domainList);
      setLoading(false);
    }
    init();
  }, []);

  // Hitung Tata Letak Awal Node (Layout Fisika Melingkar)
  useEffect(() => {
    if (rawNodes.length === 0) return;

    const width = 900;
    const height = 600;
    const radius = Math.min(width, height) * 0.35;

    const positions: GraphNodePos[] = rawNodes.map((node, idx) => {
      const angle = (idx / rawNodes.length) * 2 * Math.PI;
      // Posisi orbit acak melingkar
      const x = width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 60;
      const y = height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 60;
      return { node, x, y, vx: 0, vy: 0 };
    });

    setNodePositions(positions);
  }, [rawNodes]);

  // Map Filter Data
  const filteredPositions = useMemo(() => {
    return nodePositions.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.node.title.toLowerCase().includes(q);
        const matchesSummary = p.node.summary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary) return false;
      }
      return true;
    });
  }, [nodePositions, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredPositions.map((p) => p.node.id)), [filteredPositions]);

  const filteredEdges = useMemo(() => {
    return rawEdges.filter((edge) => {
      if (!activeNodeIds.has(edge.source_node_id) || !activeNodeIds.has(edge.target_node_id)) {
        return false;
      }
      if (selectedRelationType !== 'ALL' && edge.relation_type !== selectedRelationType) {
        return false;
      }
      return true;
    });
  }, [rawEdges, activeNodeIds, selectedRelationType]);

  // Handlers Drag Canvas & Zoom
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'svg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodePositions((prev) =>
        prev.map((p) => (p.node.id === draggedNodeId ? { ...p, x: mouseX, y: mouseY } : p))
      );
    }
  };

  const handleMouseUpCanvas = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getRelationBadgeColor = (relType: string) => {
    switch (relType) {
      case 'applied_in':
        return 'stroke-emerald-400/70 text-emerald-400';
      case 'prerequisite_of':
        return 'stroke-amber-400/70 text-amber-400';
      case 'derived_from':
        return 'stroke-blue-400/70 text-blue-400';
      default:
        return 'stroke-purple-400/70 text-purple-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-hidden">
      <div>
        <Navbar />

        {/* HEADER CONTROLS BAR */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/knowledge-atlas"
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Katalog</span>
              </Link>
              <span className="text-slate-700">|</span>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>Interactive Knowledge Graph</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {filteredPositions.length} Node
                </span>
              </h1>
            </div>

            {/* FILTER DROPDOWNS & SEARCH */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* FILTER RELASI */}
              <select
                value={selectedRelationType}
                onChange={(e) => setSelectedRelationType(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Semua Jenis Relasi</option>
                <option value="applied_in">Diterapkan pada (applied_in)</option>
                <option value="prerequisite_of">Prasyarat (prerequisite_of)</option>
                <option value="derived_from">Diturunkan dari (derived_from)</option>
                <option value="related_to">Berhubungan (related_to)</option>
              </select>

              {/* SEARCH INPUT */}
              <div className="relative flex-1 md:w-48">
                <input
                  type="text"
                  placeholder="Cari di graf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-200"
                />
                <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* CONTROLS ZOOM */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white rounded hover:bg-slate-800"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white rounded hover:bg-slate-800"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE CANVAS CONTAINER */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="relative w-full h-[calc(100vh-140px)] bg-slate-950 cursor-grab active:cursor-grabbing select-none overflow-hidden"
        >
          {/* GRID BACKGROUND OVERLAY */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
              Menyiapkan Kanvas Graf...
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease-out',
              }}
              className="w-full h-full relative"
            >
              {/* RENDERING SVG EDGES (GARIS RELASI) */}
              <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none overflow-visible">
                {filteredEdges.map((edge) => {
                  const sourcePos = nodePositions.find((p) => p.node.id === edge.source_node_id);
                  const targetPos = nodePositions.find((p) => p.node.id === edge.target_node_id);

                  if (!sourcePos || !targetPos) return null;

                  const colorClass = getRelationBadgeColor(edge.relation_type);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        className={`${colorClass} stroke-[1.5] stroke-dasharray-[4] animate-pulse`}
                      />
                      {/* LABEL PADA GARIS */}
                      {edge.description && (
                        <text
                          x={(sourcePos.x + targetPos.x) / 2}
                          y={(sourcePos.y + targetPos.y) / 2 - 6}
                          fill="#94a3b8"
                          fontSize="9"
                          textAnchor="middle"
                          className="font-mono select-none"
                        >
                          {edge.relation_type}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* RENDERING NODES (TITIK MELAYANG) */}
              {filteredPositions.map((p) => {
                const isSelected = selectedNode?.id === p.node.id;

                return (
                  <div
                    key={p.node.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNodeId(p.node.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(p.node);
                    }}
                    style={{
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 ${
                      isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                    }`}
                  >
                    {/* CORE ORBIT CIRCLE */}
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg backdrop-blur-md ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/30'
                          : p.node.node_type === 'formula'
                          ? 'bg-blue-950/80 border-blue-500/80 text-blue-300'
                          : p.node.node_type === 'theorem'
                          ? 'bg-purple-950/80 border-purple-500/80 text-purple-300'
                          : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                      }`}
                    >
                      <span className="text-xs font-black">
                        {p.node.node_type === 'formula'
                          ? 'ƒ'
                          : p.node.node_type === 'theorem'
                          ? 'Th'
                          : 'C'}
                      </span>
                    </div>

                    {/* LABEL TITLE DI BAWAH NODE */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-200 shadow-md pointer-events-none">
                      {p.node.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SIDE DRAWER PREVIEW UNTUK NODE TERPILIH */}
          {selectedNode && (
            <div className="absolute top-4 right-4 w-80 bg-slate-900/95 border border-slate-800 p-5 rounded-3xl shadow-2xl backdrop-blur-md z-30 space-y-4 animate-in slide-in-from-right duration-200">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                  {selectedNode.node_type}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {selectedNode.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {selectedNode.summary}
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <Link
                  href={`/knowledge-atlas/${selectedNode.slug}`}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl text-center shadow-md transition"
                >
                  Buka Halaman Ensiklopedia
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}