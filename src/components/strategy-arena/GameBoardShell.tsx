'use client';

import React from 'react';
import { GameMode, AIDifficulty } from '@/lib/strategy-arena/types';

interface GameBoardShellProps {
  title: string;
  category: string;
  instructions: string;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  currentTurnLabel: string;
  isGameOver: boolean;
  winnerText?: string | null;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (diff: AIDifficulty) => void;
  onReset: () => void;
  onBackToCatalog?: () => void;
  children: React.ReactNode;
}

export function GameBoardShell({
  title,
  category,
  instructions,
  mode,
  aiDifficulty,
  currentTurnLabel,
  isGameOver,
  winnerText,
  onModeChange,
  onDifficultyChange,
  onReset,
  onBackToCatalog,
  children,
}: GameBoardShellProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* HEADER CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-3">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            {category}
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* MODE TOGGLE */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => onModeChange('LOCAL_2P')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                mode === 'LOCAL_2P'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👥 2 Player
            </button>
            <button
              onClick={() => onModeChange('VS_AI')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                mode === 'VS_AI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🤖 vs AI
            </button>
          </div>

          {/* DIFFICULTY SELECTOR (HANYA JIKA MODE VS_AI) */}
          {mode === 'VS_AI' && (
            <select
              value={aiDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value as AIDifficulty)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <option value="EASY">Mudah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HARD">Sulit (AI)</option>
            </select>
          )}

          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950 border border-red-200 dark:border-red-900/50 rounded-xl transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* INDIKATOR GILIRAN */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
        <span>Status Permainan:</span>
        <span className="font-bold text-slate-900 dark:text-white">{currentTurnLabel}</span>
      </div>

      {/* CANVAS BOARD */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center relative min-h-[320px]">
        {children}

        {/* MODAL HASIL */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300 z-20">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {winnerText}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Main Lagi
              </button>
              {onBackToCatalog && (
                <button
                  onClick={onBackToCatalog}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Kembali ke Katalog
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PANDUAN RINGKAS */}
      <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
        <p className="font-bold">Aturan Permainan:</p>
        <p className="leading-relaxed font-medium">{instructions}</p>
      </div>
    </div>
  );
}