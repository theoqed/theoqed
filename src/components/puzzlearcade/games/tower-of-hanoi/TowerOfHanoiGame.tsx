'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameShell } from '../../GameShell';

interface TowerOfHanoiProps {
  onBackToCatalog?: () => void;
}

export default function TowerOfHanoiGame({ onBackToCatalog }: TowerOfHanoiProps) {
  const [diskCount, setDiskCount] = useState<number>(3); // Default 3 cakram
  const [towers, setTowers] = useState<number[][]>([[], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Minimum langkah teoretis (2^n - 1)
  const minMoves = Math.pow(2, diskCount) - 1;

  // Inisialisasi Permainan
  const initBoard = useCallback(() => {
    const initialTower = Array.from({ length: diskCount }, (_, i) => diskCount - i);
    setTowers([initialTower, [], []]);
    setSelectedTower(null);
    setMoves(0);
    setIsWon(false);
    setResetKey((prev) => prev + 1);
  }, [diskCount]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Handler Klik Tiang (Peg)
  const handleTowerClick = (towerIndex: number) => {
    if (isWon) return;

    if (selectedTower === null) {
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else {
      if (selectedTower === towerIndex) {
        setSelectedTower(null);
        return;
      }

      const sourceTower = [...towers[selectedTower]];
      const targetTower = [...towers[towerIndex]];

      const movingDisk = sourceTower[sourceTower.length - 1];
      const topTargetDisk = targetTower[targetTower.length - 1];

      // Validasi Aturan: Cakram besar tidak boleh di atas cakram kecil
      if (!topTargetDisk || movingDisk < topTargetDisk) {
        sourceTower.pop();
        targetTower.push(movingDisk);

        const newTowers = [...towers];
        newTowers[selectedTower] = sourceTower;
        newTowers[towerIndex] = targetTower;

        setTowers(newTowers);
        setMoves((m) => m + 1);
        setSelectedTower(null);

        // Cek Kondisi Menang: Seluruh cakram berhasil dipindah ke Tiang C (index 2)
        if (targetTower.length === diskCount && towerIndex === 2) {
          setIsWon(true);
        }
      } else {
        if (towers[towerIndex].length > 0) {
          setSelectedTower(towerIndex);
        } else {
          setSelectedTower(null);
        }
      }
    }
  };

  // Lebar Cakram Berbasis Persentase Slot Tiang (Mencegah Tabrakan)
  const getDiskWidthClass = (size: number) => {
    switch (size) {
      case 1: return 'w-[28%] bg-blue-500';
      case 2: return 'w-[42%] bg-emerald-500';
      case 3: return 'w-[56%] bg-amber-500';
      case 4: return 'w-[70%] bg-orange-500';
      case 5: return 'w-[84%] bg-red-500';
      default: return 'w-[90%] bg-purple-500';
    }
  };

  return (
    <GameShell
      title="Tower of Hanoi"
      gameId="tower-of-hanoi"
      category="Spatial & Visual"
      difficulty={diskCount === 3 ? 'Easy' : diskCount === 4 ? 'Medium' : 'Hard'}
      instructions="Pindahkan seluruh tumpukan cakram dari Tiang Pertama ke Tiang Ketiga. Kamu hanya bisa memindahkan 1 cakram teratas dalam satu waktu, dan cakram berukuran lebih besar tidak boleh diletakkan di atas cakram yang lebih kecil."
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="flex flex-col items-center space-y-5 w-full">
        
        {/* PILIHAN JUMLAH CAKRAM & MONITOR TARGET LANGKAH */}
        <div className="w-full flex flex-wrap justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Jumlah Cakram:</span>
            <div className="flex gap-1">
              {[3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setDiskCount(count)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    diskCount === count
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-500">
            Langkah Minimal: <span className="font-mono font-black text-blue-600 dark:text-blue-400">{minMoves}</span>
          </div>
        </div>

        {/* TOWER CANVAS AREA */}
        <div className="w-full max-w-lg p-4 sm:p-5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center">
          
          {/* AREA ARENA 3 TIANG */}
          <div className="w-full flex justify-around items-end h-48 sm:h-56 relative">
            
            {/* ALAS TIANG (BASE BOARD) */}
            <div className="absolute bottom-0 left-2 right-2 h-2.5 bg-slate-300 dark:bg-slate-800 rounded-md border border-slate-400/50 dark:border-slate-700/60 z-0" />

            {/* 3 TIANG (PEGS) */}
            {towers.map((tower, towerIdx) => {
              const isSelected = selectedTower === towerIdx;

              return (
                <div
                  key={towerIdx}
                  onClick={() => handleTowerClick(towerIdx)}
                  className={`relative flex flex-col items-center justify-end w-1/3 h-full cursor-pointer group pb-2.5 transition-all rounded-xl z-10 ${
                    isSelected
                      ? 'bg-blue-500/10 border-2 border-dashed border-blue-500/60'
                      : 'hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {/* BATANG TIANG VERTIKAL */}
                  <div className={`w-2.5 sm:w-3 h-36 sm:h-44 rounded-t-lg transition-colors ${
                    isSelected ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400'
                  }`} />

                  {/* STACK CAKRAM */}
                  <div className="absolute bottom-2.5 flex flex-col-reverse items-center gap-1 w-full z-10">
                    {tower.map((diskSize, diskIdx) => {
                      const isTopDisk = diskIdx === tower.length - 1;
                      const isDiskSelected = isSelected && isTopDisk;

                      return (
                        <div
                          key={diskSize}
                          className={`h-5 sm:h-6 rounded-lg border border-white/20 shadow-xs flex items-center justify-center font-mono font-bold text-xs text-white transition-all duration-150 ${getDiskWidthClass(
                            diskSize
                          )} ${isDiskSelected ? '-translate-y-2.5 shadow-lg ring-2 ring-blue-400' : ''}`}
                        >
                          {diskSize}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LABEL TIANG A, B, C DI DALAM KOTAK */}
          <div className="w-full flex justify-around mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            {['Tiang A', 'Tiang B', 'Tiang C'].map((label, i) => (
              <div key={label} className="w-1/3 text-center">
                <span className={`text-[11px] font-black uppercase tracking-wider ${
                  selectedTower === i
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </GameShell>
  );
}