import { createClient } from '@supabase/supabase-js';
import {
  KnowledgeDomain,
  KnowledgeField,
  KnowledgeNode,
  KnowledgePage,
  KnowledgeEdge,
} from '@/types/knowledge-atlas';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. Ambil Semua Domain (Disusun Berdasarkan Tier: Math -> STEM -> General)
export async function getKnowledgeDomains(): Promise<KnowledgeDomain[]> {
  const { data, error } = await supabase
    .from('knowledge_domains')
    .select('*')
    .order('tier', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching domains:', error.message);
    return [];
  }
  return data || [];
}

// 2. Ambil Semua Fields / Sub-bidang
export async function getKnowledgeFields(domainId?: string): Promise<KnowledgeField[]> {
  let query = supabase.from('knowledge_fields').select('*');
  if (domainId) {
    query = query.eq('domain_id', domainId);
  }
  const { data, error } = await query.order('title', { ascending: true });

  if (error) {
    console.error('Error fetching fields:', error.message);
    return [];
  }
  return data || [];
}

// 3. Ambil Daftar Node yang Sudah Dipublikasi (Dapat difilter per Field/Cari Keyword)
export async function getPublishedNodes(options?: {
  fieldId?: string;
  searchQuery?: string;
}): Promise<KnowledgeNode[]> {
  let query = supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('status', 'published');

  if (options?.fieldId) {
    query = query.eq('primary_field_id', options.fieldId);
  }

  if (options?.searchQuery) {
    query = query.or(
      `title.ilike.%${options.searchQuery}%,summary.ilike.%${options.searchQuery}%`
    );
  }

  const { data, error } = await query.order('title', { ascending: true });

  if (error) {
    console.error('Error fetching nodes:', error.message);
    return [];
  }
  return data || [];
}

// 4. Ambil Detail Node & Konten Halaman Berdasarkan Slug
export async function getNodeBySlug(slug: string): Promise<{
  node: KnowledgeNode | null;
  page: KnowledgePage | null;
}> {
  const { data: node, error: nodeError } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (nodeError || !node) {
    return { node: null, page: null };
  }

  const { data: page } = await supabase
    .from('knowledge_pages')
    .select('*')
    .eq('node_id', node.id)
    .single();

  return { node, page: page || null };
}

// 5. Ambil Relasi Graf Lintas Bidang (Edges) Terhubung untuk Node Tertentu
export async function getNodeEdges(nodeId: string): Promise<{
  outgoing: (KnowledgeEdge & { targetNode: KnowledgeNode })[];
  incoming: (KnowledgeEdge & { sourceNode: KnowledgeNode })[];
}> {
  // Relasi Keluar (Outbound Edges)
  const { data: rawOut } = await supabase
    .from('knowledge_edges')
    .select('*, targetNode:knowledge_nodes!target_node_id(*)')
    .eq('source_node_id', nodeId);

  // Relasi Masuk (Inbound Edges)
  const { data: rawIn } = await supabase
    .from('knowledge_edges')
    .select('*, sourceNode:knowledge_nodes!source_node_id(*)')
    .eq('target_node_id', nodeId);

  return {
    outgoing: (rawOut as any) || [],
    incoming: (rawIn as any) || [],
  };
}

// --- Tambahan Fungsi Admin CRUD untuk MVP 1 ---

// Ambil Seluruh Node (Termasuk Draft & In Review untuk Admin)
export async function getAllAdminNodes(): Promise<KnowledgeNode[]> {
  const { data, error } = await supabase
    .from('knowledge_nodes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin nodes:', error.message);
    return [];
  }
  return data || [];
}

// Simpan atau Perbarui Node & Halaman Konten
export async function saveKnowledgeNode(
  nodeData: Partial<KnowledgeNode>,
  pageContent: any
): Promise<boolean> {
  try {
    let nodeId = nodeData.id;

    if (nodeId) {
      // Update Node
      const { error: nodeErr } = await supabase
        .from('knowledge_nodes')
        .update({
          title: nodeData.title,
          slug: nodeData.slug,
          node_type: nodeData.node_type,
          primary_field_id: nodeData.primary_field_id || null,
          summary: nodeData.summary,
          status: nodeData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nodeId);

      if (nodeErr) throw nodeErr;
    } else {
      // Insert Node Baru
      const { data: newNode, error: nodeErr } = await supabase
        .from('knowledge_nodes')
        .insert({
          title: nodeData.title,
          slug: nodeData.slug,
          node_type: nodeData.node_type || 'concept',
          primary_field_id: nodeData.primary_field_id || null,
          summary: nodeData.summary || '',
          status: nodeData.status || 'draft',
        })
        .select()
        .single();

      if (nodeErr) throw nodeErr;
      nodeId = newNode.id;
    }

    // Upsert Konten Halaman Ensiklopedia
    const { error: pageErr } = await supabase.from('knowledge_pages').upsert(
      {
        node_id: nodeId,
        content_format: 'json',
        content_json: pageContent,
        version: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'node_id' }
    );

    if (pageErr) throw pageErr;
    return true;
  } catch (err: any) {
    console.error('Save Node Error:', err.message || err);
    return false;
  }
}

// Tambah Relasi Graf Baru (Edge)
export async function saveKnowledgeEdge(edgeData: {
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  description?: string;
}): Promise<boolean> {
  const { error } = await supabase.from('knowledge_edges').insert({
    source_node_id: edgeData.source_node_id,
    target_node_id: edgeData.target_node_id,
    relation_type: edgeData.relation_type,
    description: edgeData.description || null,
  });

  if (error) {
    console.error('Error saving edge:', error.message);
    return false;
  }
  return true;
}

// 6. Ambil Seluruh Node Publik dan Relasi Graf (Untuk Canvas Visual)
export async function getFullGraphData(): Promise<{
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}> {
  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from('knowledge_nodes').select('*').eq('status', 'published'),
    supabase.from('knowledge_edges').select('*'),
  ]);

  return {
    nodes: nodesRes.data || [],
    edges: edgesRes.data || [],
  };
}