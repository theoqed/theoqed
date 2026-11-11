// src/lib/puzzle-stats.ts (Versi Bersih Tanpa Supabase Sync)

export type GameId =
  | 'lights-out'
  | '2048'
  | 'sliding-puzzle'
  | 'minesweeper'
  | 'tower-of-hanoi'
  | 'sudoku'
  | 'wordle'
  | 'nonogram';

export interface GameStats {
  bestTime: number | null;
  fewestMoves: number | null;
  gamesPlayed: number;
  gamesWon: number;
  bestScore?: number | null;
  highestTile?: number | null;
}

const STORAGE_KEY = 'theoqed_puzzle_arcade_stats';

export function getAllStats(): Record<string, GameStats> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function getGameStats(gameId: GameId): GameStats {
  const all = getAllStats();
  return (
    all[gameId] || {
      bestTime: null,
      fewestMoves: null,
      gamesPlayed: 0,
      gamesWon: 0,
    }
  );
}

export function saveGameWin(
  gameId: GameId,
  timeSeconds: number,
  moves: number
): { isNewTimeRecord: boolean; isNewMovesRecord: boolean; updatedStats: GameStats } {
  const currentStats = getGameStats(gameId);

  const isNewTimeRecord =
    currentStats.bestTime === null || timeSeconds < currentStats.bestTime;
  const isNewMovesRecord =
    currentStats.fewestMoves === null || moves < currentStats.fewestMoves;

  const updatedStats: GameStats = {
    ...currentStats,
    bestTime: isNewTimeRecord ? timeSeconds : currentStats.bestTime,
    fewestMoves: isNewMovesRecord ? moves : currentStats.fewestMoves,
    gamesPlayed: currentStats.gamesPlayed + 1,
    gamesWon: currentStats.gamesWon + 1,
  };

  const allStats = getAllStats();
  allStats[gameId] = updatedStats;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStats));
  } catch (e) {
    console.error('Gagal menyimpan statistik puzzle:', e);
  }

  return { isNewTimeRecord, isNewMovesRecord, updatedStats };
}

export function save2048Stats(
  score: number,
  highestTileVal: number
): { isNewScoreRecord: boolean; updatedStats: GameStats } {
  const currentStats = getGameStats('2048');

  const isNewScoreRecord =
    currentStats.bestScore === null || score > (currentStats.bestScore ?? 0);
  const isNewTileRecord =
    currentStats.highestTile === null || highestTileVal > (currentStats.highestTile ?? 0);

  const updatedStats: GameStats = {
    ...currentStats,
    bestScore: isNewScoreRecord ? score : currentStats.bestScore,
    highestTile: isNewTileRecord ? highestTileVal : currentStats.highestTile,
    gamesPlayed: currentStats.gamesPlayed + 1,
  };

  const allStats = getAllStats();
  allStats['2048'] = updatedStats;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStats));
  } catch (e) {
    console.error('Gagal menyimpan skor 2048:', e);
  }

  return { isNewScoreRecord, updatedStats };
}