import { createClient } from '@/lib/supabase/client';

// Cek apakah soal sudah dibookmark oleh user
export async function checkIsBookmarked(userId: string, problemId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .maybeSingle();

  return !!data;
}

// Toggle Simpan / Hapus Bookmark
export async function toggleCloudBookmark(userId: string, problemId: string, isBookmarked: boolean) {
  const supabase = createClient();

  if (isBookmarked) {
    // Hapus dari Supabase
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('problem_id', problemId);
    return { success: !error, status: false };
  } else {
    // Tambah ke Supabase
    const { error } = await supabase
      .from('user_bookmarks')
      .insert({ user_id: userId, problem_id: problemId });
    return { success: !error, status: true };
  }
}