export type PlayerMark = 'X' | 'O' | 'BLACK' | 'WHITE' | 1 | 2;
export type GameMode = 'LOCAL_2P' | 'VS_AI';
export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GameOutcome {
  isGameOver: boolean;
  winner: PlayerMark | 'DRAW' | null;
  winningLine?: number[][];
}

export interface BaseGameState<TBoard, TMove> {
  board: TBoard;
  currentTurn: PlayerMark;
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  moveHistory: TMove[];
  outcome: GameOutcome;
}