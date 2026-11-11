'use client';

import { useState, useEffect } from 'react';
import { GameShell } from '../../GameShell';

const GRID_SIZE = 5;

interface LightsOutGameProps {
  onBackToCatalog?: () => void;
}

export default function LightsOutGame({ onBackToCatalog }: LightsOutGameProps) {
  const [board, setBoard] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const initBoard = () => {
    const newBoard: boolean[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));

    const randomClicks = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < randomClicks; i++) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      toggleLights(newBoard, r, c);
    }

    setBoard(newBoard);
    setMoves(0);
    setIsWon(false);
    setResetKey((prev) => prev + 1);
  };

  useEffect(() => {
    initBoard();
  }, []);

  const toggleLights = (grid: boolean[][], r: number, c: number) => {
    const coords = [
      [r, c],
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    coords.forEach(([row, col]) => {
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        grid[row][col] = !grid[row][col];
      }
    });
  };

  const handleCellClick = (r: number, c: number) => {
    if (isWon) return;

    const newBoard = board.map((row) => [...row]);
    toggleLights(newBoard, r, c);
    setBoard(newBoard);
    setMoves((prev) => prev + 1);

    const hasActiveLight = newBoard.some((row) => row.some((cell) => cell === true));
    if (!hasActiveLight) {
      setIsWon(true);
    }
  };

  if (board.length === 0) return <div className="text-xs text-slate-400">Memuat puzzle...</div>;

  return (
    <GameShell
      title="Lights Out"
      gameId="lights-out"
      category="Logic"
      difficulty="Easy"
      instructions="Matikan seluruh lampu yang menyala di papan. Setiap kali kamu mengklik sebuah ubin, lampu ubin tersebut dan lampu di sekelilingnya (atas, bawah, kiri, kanan) akan terbalik."
      moves={moves}
      isCompleted={isWon}
      onReset={initBoard}
      resetKey={resetKey}
      onBackToCatalog={onBackToCatalog}
    >
      <div className="grid grid-cols-5 gap-2 sm:gap-3 p-2 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
        {board.map((row, rIdx) =>
          row.map((isOn, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              onClick={() => handleCellClick(rIdx, cIdx)}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl transition-all duration-200 transform active:scale-95 flex items-center justify-center ${
                isOn
                  ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] border-2 border-amber-200'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/60'
              }`}
            />
          ))
        )}
      </div>
    </GameShell>
  );
}