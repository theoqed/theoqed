export type GameCategory = 'Number & Math' | 'Logic' | 'Spatial & Visual' | 'Pattern & Sequence';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface GameMetadata {
  slug: string;
  title: string;
  description: string;
  category: GameCategory;
  difficultyOptions: GameDifficulty[];
  iconSvg?: React.ReactNode;
}

export interface GameStateSummary {
  score: number;
  moves: number;
  durationMs: number;
  isCompleted: boolean;
}