export type KnowledgeNodeType =
  | 'concept'
  | 'formula'
  | 'theorem'
  | 'algorithm'
  | 'person'
  | 'scientific_event'
  | 'method_technology';

export type KnowledgeStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type KnowledgeRelationType =
  | 'prerequisite_of'
  | 'part_of'
  | 'derived_from'
  | 'generalization_of'
  | 'specialization_of'
  | 'applied_in'
  | 'related_to'
  | 'developed_by'
  | 'contrasts_with';

export interface KnowledgeDomain {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tier: number; // 1: Math, 2: STEM, 3: General
  sort_order: number;
}

export interface KnowledgeField {
  id: string;
  domain_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  description: string | null;
}

export interface KnowledgeNode {
  id: string;
  slug: string;
  title: string;
  node_type: KnowledgeNodeType;
  primary_field_id: string | null;
  summary: string;
  status: KnowledgeStatus;
  created_at: string;
  updated_at: string;
}

export interface KnowledgePageContent {
  definition?: string;
  explanation?: string;
  properties?: string[];
  equation_latex?: string;
  symbol_definitions?: Record<string, string>;
  proof_or_derivation?: string;
  examples?: Array<{ title: string; body: string }>;
  applications?: string[];
}

export interface KnowledgePage {
  id: string;
  node_id: string;
  content_format: string;
  content_json: KnowledgePageContent;
  version: number;
  reviewed_at: string | null;
}

export interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: KnowledgeRelationType;
  description: string | null;
  is_bidirectional: boolean;
}