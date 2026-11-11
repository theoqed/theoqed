'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MathObject } from '@/types/math-studio';
import { extractSymbols, evaluateMathObject } from '@/lib/math-studio/core';
import { saveLocalDraft, loadLocalDraft, saveProjectToCloud } from '@/lib/math-studio/storage';

const DEFAULT_COLORS = ['#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#06B6D4'];

export default function MathStudioPage() {
  const [projectTitle, setProjectTitle] = useState('Proyek Tanpa Judul');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // State Objek & Scope Variabel
  const [objects, setObjects] = useState<MathObject[]>([
    {
      id: '1',
      project_id: 'local',
      object_type: 'variable',
      name: 'a',
      raw_expression: 'a = 2',
      variables: [],
      dependencies: [],
      style_json: { color: '#F59E0B', visible: true },
      sort_order: 1,
    },
    {
      id: '2',
      project_id: 'local',
      object_type: 'function',
      name: 'f',
      raw_expression: 'f(x) = x^2 - a',
      variables: ['x'],
      dependencies: ['a'],
      style_json: { color: '#10B981', visible: true, lineWidth: 2 },
      sort_order: 2,
    },
    {
      id: '3',
      project_id: 'local',
      object_type: 'function',
      name: 'g',
      raw_expression: 'g(x) = sin(a * x)',
      variables: ['x'],
      dependencies: ['a'],
      style_json: { color: '#3B82F6', visible: true, lineWidth: 2 },
      sort_order: 3,
    },
  ]);

  const [scope, setScope] = useState<Record<string, number>>({ a: 2 });
  const [newExprInput, setNewExprInput] = useState('');

  // State Canvas Viewport
  const [view, setView] = useState({
    centerX: 0,
    centerY: 0,
    scale: 40,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 1. AUTOLOAD DRAFT SAAT HALAMAN PERTAMA KALI DIBUKA
  useEffect(() => {
    const draft = loadLocalDraft();
    if (draft) {
      if (draft.objects && draft.objects.length > 0) setObjects(draft.objects);
      if (draft.scope) setScope(draft.scope);
      if (draft.view) setView(draft.view);
    }
  }, []);

  // 2. AUTOSAVE LOCAL DEBOUNCE (1 Detik setelah perubahan)
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      saveLocalDraft(objects, scope, view);
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [objects, scope, view]);

  // Handle Simpan ke Cloud Supabase
  const handleCloudSave = async () => {
    setSaveStatus('saving');
    const res = await saveProjectToCloud(projectTitle, objects, projectId);
    if (res.success && res.projectId) {
      setProjectId(res.projectId);
      setSaveStatus('saved');
      alert('Proyek berhasil disimpan ke cloud!');
    } else {
      alert(`Gagal menyimpan: ${res.message}`);
      setSaveStatus('unsaved');
    }
  };

  // Tambah Objek Baru
  const handleAddObject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExprInput.trim()) return;

    const raw = newExprInput.trim();
    const { symbols, isFunction, funcName } = extractSymbols(raw);

    let objType: MathObject['object_type'] = isFunction ? 'function' : 'expression';
    let name = funcName || `f_${objects.length + 1}`;

    if (raw.includes('=') && !isFunction) {
      const parts = raw.split('=');
      name = parts[0].trim();
      const val = parseFloat(parts[1].trim());
      if (!isNaN(val)) {
        objType = 'variable';
        setScope((prev) => ({ ...prev, [name]: val }));
      }
    }

    const color = DEFAULT_COLORS[objects.length % DEFAULT_COLORS.length];

    const newObj: MathObject = {
      id: Date.now().toString(),
      project_id: projectId || 'local',
      object_type: objType,
      name,
      raw_expression: raw,
      variables: isFunction ? ['x'] : [],
      dependencies: symbols,
      style_json: { color, visible: true, lineWidth: 2 },
      sort_order: objects.length + 1,
    };

    setObjects((prev) => [...prev, newObj]);
    setNewExprInput('');
  };

  const toggleVisibility = (id: string) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, style_json: { ...obj.style_json, visible: !obj.style_json.visible } }
          : obj
      )
    );
  };

  const deleteObject = (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
  };

  const handleSliderChange = (varName: string, val: number) => {
    setScope((prev) => ({ ...prev, [varName]: val }));
  };

  // Canvas Renderer
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    const originX = width / 2 + view.centerX;
    const originY = height / 2 - view.centerY;

    ctx.lineWidth = 1;
    const step = view.scale;
    const startX = Math.floor(-originX / step) * step + originX;
    const endX = width;

    ctx.strokeStyle = '#1E293B';
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';

    for (let x = startX; x < endX; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const mathX = Math.round((x - originX) / view.scale);
      if (mathX !== 0) {
        ctx.fillText(mathX.toString(), x - 4, originY + 14);
      }
    }

    const startY = Math.floor(-originY / step) * step + originY;
    for (let y = startY; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const mathY = Math.round((originY - y) / view.scale);
      if (mathY !== 0) {
        ctx.fillText(mathY.toString(), originX + 6, y + 4);
      }
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    objects.forEach((obj) => {
      if (!obj.style_json.visible || obj.object_type === 'variable') return;

      ctx.strokeStyle = obj.style_json.color;
      ctx.lineWidth = obj.style_json.lineWidth || 2;
      ctx.beginPath();

      let isPlotting = false;

      for (let px = 0; px <= width; px += 2) {
        const mathX = (px - originX) / view.scale;
        const mathY = evaluateMathObject(obj, scope, mathX);

        if (mathY !== null) {
          const py = originY - mathY * view.scale;

          if (py >= -500 && py <= height + 500) {
            if (!isPlotting) {
              ctx.moveTo(px, py);
              isPlotting = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            isPlotting = false;
          }
        } else {
          isPlotting = false;
        }
      }
      ctx.stroke();
    });
  }, [objects, scope, view]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        drawCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - view.centerX, y: e.clientY + view.centerY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setView((prev) => ({
      ...prev,
      centerX: e.clientX - dragStartRef.current.x,
      centerY: dragStartRef.current.y - e.clientY,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setView((prev) => ({
      ...prev,
      scale: Math.max(10, Math.min(prev.scale * zoomFactor, 300)),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-hidden">
      <div>
        <Navbar />

        {/* HEADER TOP BAR WITH AUTOSAVE INDICATOR */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Math Studio 2D
            </span>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent text-sm font-black text-white focus:outline-none border-b border-transparent focus:border-emerald-500 px-1 py-0.5"
            />
            {/* AUTOSAVE BADGE */}
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-500'
                    : saveStatus === 'saving'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              {saveStatus === 'saved' ? 'Tersimpan (Lokal)' : saveStatus === 'saving' ? 'Menyimpan...' : 'Perubahan Belum Disimpan'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloudSave}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 transition cursor-pointer"
            >
              Simpan ke Cloud
            </button>
            <button
              onClick={() => setView({ centerX: 0, centerY: 0, scale: 40 })}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              Reset View
            </button>
            <Link
              href="/knowledge-atlas"
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm"
            >
              Ke Knowledge Atlas
            </Link>
          </div>
        </div>

        {/* WORKSPACE LAYOUT */}
        <div className="flex h-[calc(100vh-105px)] overflow-hidden">
          {/* PANEL KIRI */}
          <div className="w-80 sm:w-96 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 z-10">
            <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(100vh-190px)]">
              {/* FORM TAMBAH EKSPRESI */}
              <form onSubmit={handleAddObject} className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Tambah Fungsi / Variabel</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExprInput}
                    onChange={(e) => setNewExprInput(e.target.value)}
                    placeholder="misal: f(x) = x^2 - a  atau  a = 3"
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </form>

              {/* LIST OBJEK MATEMATIKA */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Daftar Objek ({objects.length})
                </span>

                {objects.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVisibility(obj.id)}
                          style={{ backgroundColor: obj.style_json.visible ? obj.style_json.color : '#475569' }}
                          className="w-4 h-4 rounded-full transition transform active:scale-95 shadow-sm cursor-pointer"
                          title="Toggle Visibilitas"
                        />
                        <span className="font-mono text-xs font-bold text-white">{obj.name}</span>
                      </div>

                      <button
                        onClick={() => deleteObject(obj.id)}
                        className="text-slate-500 hover:text-red-400 text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="font-mono text-xs text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {obj.raw_expression}
                    </p>

                    {obj.object_type === 'variable' && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Nilai {obj.name}:</span>
                          <span className="text-amber-400 font-bold">{scope[obj.name] ?? 0}</span>
                        </div>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          step="0.1"
                          value={scope[obj.name] ?? 0}
                          onChange={(e) => handleSliderChange(obj.name, parseFloat(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              <p>Sistem menyimpan perubahan secara otomatis ke draft lokal.</p>
            </div>
          </div>

          {/* KANVAS VISUAL UTAMA */}
          <div className="flex-1 relative bg-slate-950 cursor-crosshair">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}