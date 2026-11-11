'use client';

import { useState, useEffect } from 'react';
import { GameId, getGameStats, saveGameWin, GameStats } from '@/lib/puzzle-stats';
import { puzzleAudio } from '@/lib/puzzle-audio';
import { triggerConfetti } from '@/lib/puzzle-effects';

interface GameShellProps {
  gameId?: GameId;
  title: string;
  category: string;
  difficulty: string;
  instructions: string;
  moves: number;
  isCompleted: boolean;
  onReset: () => void;
  resetKey?: number;
  onBackToCatalog?: () => void;
  children: React.ReactNode;
}

export function GameShell({
  gameId,
  title,
  category,
  difficulty,
  instructions,
  moves,
  isCompleted,
  onReset,
  resetKey = 0,
  onBackToCatalog,
  children,
}: GameShellProps) {
  const [seconds, setSeconds] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (gameId) {
      setStats(getGameStats(gameId));
    }
  }, [gameId]);

  useEffect(() => {
    setSeconds(0);
    setIsNewRecord(false);
  }, [resetKey]);

  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Efek Suara Win & Confetti saat Menang
  useEffect(() => {
    if (isCompleted && gameId) {
      const { isNewTimeRecord, isNewMovesRecord, updatedStats } = saveGameWin(
        gameId,
        seconds,
        moves
      );
      setStats(updatedStats);
      if (isNewTimeRecord || isNewMovesRecord) {
        setIsNewRecord(true);
      }

      // Triggers SFX + Visual Juice
      puzzleAudio.playWin();
      triggerConfetti();
    }
  }, [isCompleted, gameId, seconds, moves]);

  const handleToggleMute = () => {
    const muted = puzzleAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleResetGame = () => {
    puzzleAudio.playMove();
    setSeconds(0);
    setIsNewRecord(false);
    onReset();
  };

  const handleBackToCatalog = () => {
    if (onBackToCatalog) {
      onBackToCatalog();
    } else {
      window.location.href = '/puzzlearcade';
    }
  };

  const formatTime = (totalSec: number | null) => {
    if (totalSec === null) return '--:--';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* HEADER GAME CONTROL */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              {category}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {difficulty}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* MUTE / UNMUTE BUTTON */}
          <button
            onClick={handleToggleMute}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
            title={isMuted ? 'Unmute Suara' : 'Mute Suara'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Panduan</span>
          </button>

          <button
            onClick={handleResetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950 border border-red-200 dark:border-red-900/50 rounded-xl transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* BOX PANDUAN */}
      {showInstructions && (
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <p className="font-bold">Cara Bermain:</p>
          <p className="leading-relaxed font-medium">{instructions}</p>
        </div>
      )}

      {/* BOARD MONITOR */}
      <div className="flex flex-wrap justify-between items-center px-4 py-2.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Waktu:</span>
            <span className="font-mono text-slate-900 dark:text-white">{formatTime(seconds)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Langkah:</span>
            <span className="font-mono text-slate-900 dark:text-white">{moves}</span>
          </div>
        </div>

        {stats && (
          stats.bestScore !== undefined && stats.bestScore !== null ? (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>Skor Tertinggi: <span className="font-mono">{stats.bestScore}</span></span>
            </div>
          ) : (stats.bestTime !== null || stats.fewestMoves !== null) ? (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>Terbaik: <span className="font-mono">{formatTime(stats.bestTime)}</span> / <span className="font-mono">{stats.fewestMoves ?? '--'} lkg</span></span>
            </div>
          ) : null
        )}
      </div>

      {/* GAME CANVAS */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center relative min-h-[340px]">
        {children}

        {/* MODAL KEMENANGAN */}
        {isCompleted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300 z-20">
            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4a5 5 0 005 5h4a5 5 0 005-5V3M5 3h14M5 3H3v4a7 7 0 007 7h4a7 7 0 007-7V3h-2M12 17v4m-4 0h8" />
              </svg>
            </div>

            <div className="space-y-1">
              {isNewRecord && (
                <span className="inline-block px-3 py-1 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md">
                  🎉 Rekor Baru!
                </span>
              )}
              <h2 className="text-2xl font-black text-white tracking-tight">Puzzle Selesai!</h2>
              <p className="text-xs text-slate-300">
                Kamu berhasil menuntaskan permainan dalam <span className="font-bold text-amber-400">{moves} langkah</span> dengan waktu <span className="font-bold text-amber-400">{formatTime(seconds)}</span>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleResetGame}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Main Lagi
              </button>
              <button
                onClick={handleBackToCatalog}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Kembali ke Katalog
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}