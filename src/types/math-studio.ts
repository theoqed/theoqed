export type MathObjectType =
  | 'variable'
  | 'expression'
  | 'function'
  | 'equation'
  | 'point'
  | 'curve'
  | 'matrix';

export type MathWorkspaceType =
  | 'graphing_2d'
  | 'graphing_3d'
  | 'cas'
  | 'geometry'
  | 'matrix_data'
  | 'notebook';

export interface ObjectStyle {
  color: string;
  visible: boolean;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  pointSize?: number;
}

export interface MathObject {
  id: string;
  project_id: string;
  object_type: MathObjectType;
  name: string; // e.g. "f", "a", "P"
  raw_expression: string; // e.g. "x^2 + a"
  ast_json?: Record<string, any>;
  variables: string[]; // e.g. ["x"]
  dependencies: string[]; // e.g. ["a"]
  style_json: ObjectStyle;
  metadata_json?: Record<string, any>;
  sort_order: number;
}

export interface MathProject {
  id: string;
  owner_id?: string | null;
  title: string;
  description?: string | null;
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
}

export interface EvaluationContext {
  scope: Record<string, number | any>; // Menyimpan nilai variabel aktif, misal { a: 2, b: 5 }
  errors: Record<string, string>; // Menyimpan error parsing/evaluasi per objek
}