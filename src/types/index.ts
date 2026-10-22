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
  title: string;
  competition: string;
  year: number;
  level: string;
  topic: string;
  statement: string;
  solutions: SolutionItem[];
  folder_id?: string | null;
  order_index: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string | null;
}