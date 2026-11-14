export interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_admin?: boolean;
  is_premium?: boolean;
  premium_until?: string | null;
  updated_at?: string | null;
}

export interface SolutionItem {
  id: string;
  title: string;       // misal: "Solusi 1 (Resmi)", "Solusi Alternatif"
  author: string;      // misal: "Dave Marcellino", "Official IMO"
  brief: string;       // Ide ringkas
  steps: string[];     // Langkah rinci (1 baris per langkah)
  final_answer?: string;
}

export interface Problem {
  id: string;
  prob_slug?: string;
  title: string;
  competition: string;
  year: number;
  level: string;
  topic: string;
  category?: string;
  section?: string;
  statement: string;
  solutions: SolutionItem[];
  folder_id?: string | null;
  order_index: number;
  is_premium?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
  is_premium?: boolean;
}

export interface Solution {
  title?: string;
  author?: string;
  brief?: string;
  steps?: string[] | string;
  detailed_steps?: string[] | string;
  content?: string;
  solution?: string;
  full_solution?: string;
  text?: string;
  final_answer?: string;
  answer?: string;
  result?: string;
  finalAnswer?: string;
}

export interface Note {
  id: string;
  title: string;
  slug: string;
  description?: string;
  topic: string;
  pattern_type: 'algebra' | 'calculus' | 'geometry' | 'number_theory';
  gradient_theme: string;
  order_index: number;
  is_premium?: boolean;
  created_at?: string;
}

export interface NoteChapter {
  id: string;
  note_id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
  parent_id?: string | null;
  children?: NoteChapter[];
}