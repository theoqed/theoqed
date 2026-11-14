export interface ProofStep {
  step: number;
  tag?: string;
  content: string;
}

export interface Theorem {
  id: string;
  slug: string;
  title: string;
  field: string;
  topic: string;
  mathematicians: string | null;
  statement: string;
  intuition: string;
  proof_steps: ProofStep[];
  archive_topic_filter: string | null;
  order_index: number;
}