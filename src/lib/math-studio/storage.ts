import { createClient } from '@supabase/supabase-js';
import { MathObject, MathProject } from '@/types/math-studio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_STORAGE_KEY = 'theoqed_math_studio_draft';

// 1. SIMPAN DRAFT LOKAL (IndexedDB / LocalStorage Fallback)
export function saveLocalDraft(objects: MathObject[], scope: Record<string, number>, view: any) {
  try {
    const data = {
      objects,
      scope,
      view,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal menyimpan draft lokal:', err);
  }
}

// 2. MUAT DRAFT LOKAL
export function loadLocalDraft(): {
  objects: MathObject[];
  scope: Record<string, number>;
  view: any;
} | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Gagal membaca draft lokal:', err);
    return null;
  }
}

// 3. SINKRONISASI KE SUPABASE (PROYEK AWAN)
export async function saveProjectToCloud(
  title: string,
  objects: MathObject[],
  projectId?: string
): Promise<{ success: boolean; projectId?: string; message?: string }> {
  try {
    let targetProjectId = projectId;

    // A. Buat atau Update Proyek
    if (targetProjectId) {
      const { error: projErr } = await supabase
        .from('math_projects')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', targetProjectId);

      if (projErr) throw projErr;
    } else {
      const { data: newProj, error: projErr } = await supabase
        .from('math_projects')
        .insert({ title, visibility: 'private' })
        .select()
        .single();

      if (projErr) throw projErr;
      targetProjectId = newProj.id;

      // Buat Workspace Default
      await supabase.from('math_workspaces').insert({
        project_id: targetProjectId,
        name: 'Main Workspace',
        workspace_type: 'graphing_2d',
      });
    }

    // B. Bersihkan & Update Objek Matematika Proyek
    await supabase.from('math_objects').delete().eq('project_id', targetProjectId);

    const objectsToInsert = objects.map((obj, idx) => ({
      project_id: targetProjectId,
      object_type: obj.object_type,
      name: obj.name,
      raw_expression: obj.raw_expression,
      variables: obj.variables,
      dependencies: obj.dependencies,
      style_json: obj.style_json,
      sort_order: idx + 1,
    }));

    const { error: objErr } = await supabase.from('math_objects').insert(objectsToInsert);
    if (objErr) throw objErr;

    return { success: true, projectId: targetProjectId };
  } catch (err: any) {
    console.error('Cloud Sync Error:', err.message || err);
    return { success: false, message: err.message || 'Gagal menyimpan ke cloud' };
  }
}

// 4. MUAT PROYEK DARI SUPABASE
export async function loadProjectFromCloud(projectId: string): Promise<{
  project: MathProject | null;
  objects: MathObject[];
}> {
  try {
    const { data: project } = await supabase
      .from('math_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: objects } = await supabase
      .from('math_objects')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    return {
      project: project || null,
      objects: (objects as MathObject[]) || [],
    };
  } catch (err) {
    console.error('Error loading cloud project:', err);
    return { project: null, objects: [] };
  }
}