'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminNavbar } from '@/components/AdminNavbar';

// --- SVG ICON HELPERS ---
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function EditIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function ArrowUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function BookOpenIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function LayersIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// --- INTERFACES ---
interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  description: string;
  thumbnail_url?: string;
  instructor_name: string;
  status: 'draft' | 'published';
  is_free: boolean;
  order_index: number;
  created_at: string;
}

interface ModuleItem {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface LessonItem {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  lesson_type: 'article' | 'video' | 'practice' | 'tryout';
  content?: string;
  video_url?: string;
  problem_ids: string[];
  tryout_id?: string | null;
  duration_minutes: number;
  is_preview: boolean;
  order_index: number;
}

interface ProblemSummary {
  id: string;
  title: string;
  topic: string;
  problem_type?: string;
}

interface TryoutSummary {
  id: string;
  title: string;
  category?: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [allProblems, setAllProblems] = useState<ProblemSummary[]>([]);
  const [allTryouts, setAllTryouts] = useState<TryoutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Course Info
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Matematika');
  const [level, setLevel] = useState('Umum');
  const [instructorName, setInstructorName] = useState('Dave Marcellino');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Modal 2: Curriculum Builder (Modul & Lesson)
  const [activeCourse, setActiveCourse] = useState<CourseItem | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');

  // Form Tambah / Edit Lesson
  const [lessonFormModuleId, setLessonFormModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'article' | 'video' | 'practice' | 'tryout'>('article');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonProblemIds, setLessonProblemIds] = useState<string[]>([]);
  const [lessonTryoutId, setLessonTryoutId] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(15);
  const [lessonIsPreview, setLessonIsPreview] = useState<boolean>(false);
  const [problemSearch, setProblemSearch] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    const [coursesRes, modulesRes, lessonsRes, problemsRes, tryoutsRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('course_modules').select('*').order('order_index', { ascending: true }),
      supabase.from('course_lessons').select('*').order('order_index', { ascending: true }),
      supabase.from('problems').select('id, title, topic, problem_type').order('title', { ascending: true }),
      supabase.from('tryouts').select('id, title, category').order('title', { ascending: true }),
    ]);

    if (coursesRes.data) setCourses(coursesRes.data as CourseItem[]);
    if (modulesRes.data) setModules(modulesRes.data as ModuleItem[]);
    if (lessonsRes.data) {
      const normalizedLessons = (lessonsRes.data as any[]).map((l) => ({
        ...l,
        problem_ids: Array.isArray(l.problem_ids)
          ? l.problem_ids
          : typeof l.problem_ids === 'string'
          ? JSON.parse(l.problem_ids || '[]')
          : [],
      }));
      setLessons(normalizedLessons);
    }
    if (problemsRes.data) setAllProblems(problemsRes.data as ProblemSummary[]);
    if (tryoutsRes.data) setAllTryouts(tryoutsRes.data as TryoutSummary[]);
    setLoading(false);
  }

  // --- HANDLERS: COURSE CRUD ---
  const handleOpenCreateCourse = () => {
    setEditingCourseId(null);
    setTitle('');
    setSlug('');
    setCategory('Matematika');
    setLevel('Umum');
    setInstructorName('Dave Marcellino');
    setThumbnailUrl('');
    setDescription('');
    setIsFree(true);
    setStatus('draft');
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (c: CourseItem) => {
    setEditingCourseId(c.id);
    setTitle(c.title || '');
    setSlug(c.slug || '');
    setCategory(c.category || 'Matematika');
    setLevel(c.level || 'Umum');
    setInstructorName(c.instructor_name || 'Dave Marcellino');
    setThumbnailUrl(c.thumbnail_url || '');
    setDescription(c.description || '');
    setIsFree(c.is_free ?? true);
    setStatus(c.status || 'draft');
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul Course wajib diisi!');
      return;
    }

    const generatedSlug = (slug.trim() || title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const payload = {
      title: title.trim(),
      slug: generatedSlug,
      category: category.trim() || 'Matematika',
      level: level.trim() || 'Umum',
      instructor_name: instructorName.trim() || 'Dave Marcellino',
      thumbnail_url: thumbnailUrl.trim() || null,
      description: description.trim(),
      is_free: isFree,
      status,
      updated_at: new Date().toISOString(),
    };

    if (editingCourseId) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editingCourseId);
      if (error) return alert(`Gagal memperbarui course: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([{ ...payload, order_index: courses.length }]);
      if (error) return alert(`Gagal membuat course: ${error.message}`);
    }

    setShowCourseModal(false);
    fetchAllData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Hapus kursus ini beserta seluruh bab dan materinya?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) alert(`Gagal menghapus: ${error.message}`);
    else fetchAllData();
  };

  // --- HANDLERS: MODULE (BAB) CRUD ---
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !newModuleTitle.trim()) return;

    const courseModules = modules.filter((m) => m.course_id === activeCourse.id);
    const { error } = await supabase.from('course_modules').insert([
      {
        course_id: activeCourse.id,
        title: newModuleTitle.trim(),
        description: newModuleDesc.trim(),
        order_index: courseModules.length,
      },
    ]);

    if (error) return alert(`Gagal menambah bab: ${error.message}`);
    setNewModuleTitle('');
    setNewModuleDesc('');
    fetchAllData();
  };

  const handleUpdateModuleTitle = async (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    const { error } = await supabase
      .from('course_modules')
      .update({ title: editModuleTitle.trim() })
      .eq('id', moduleId);
    if (error) return alert(`Gagal mengubah judul bab: ${error.message}`);
    setEditingModuleId(null);
    fetchAllData();
  };

  const handleMoveModule = async (
    courseModules: ModuleItem[],
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= courseModules.length) return;

    const current = courseModules[index];
    const target = courseModules[targetIdx];

    await Promise.all([
      supabase.from('course_modules').update({ order_index: targetIdx }).eq('id', current.id),
      supabase.from('course_modules').update({ order_index: index }).eq('id', target.id),
    ]);
    fetchAllData();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Hapus bab ini beserta semua materi di dalamnya?')) return;
    const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);
    if (error) alert(`Gagal menghapus bab: ${error.message}`);
    else fetchAllData();
  };

  // --- HANDLERS: LESSON (MATERI) CRUD ---
  const resetLessonForm = () => {
    setLessonFormModuleId(null);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonType('article');
    setLessonContent('');
    setLessonVideoUrl('');
    setLessonProblemIds([]);
    setLessonTryoutId('');
    setLessonDuration(15);
    setLessonIsPreview(false);
    setProblemSearch('');
  };

  const handleOpenAddLesson = (moduleId: string) => {
    resetLessonForm();
    setLessonFormModuleId(moduleId);
  };

  const handleOpenEditLesson = (lesson: LessonItem) => {
    setLessonFormModuleId(lesson.module_id);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title || '');
    setLessonType(lesson.lesson_type || 'article');
    setLessonContent(lesson.content || '');
    setLessonVideoUrl(lesson.video_url || '');
    setLessonProblemIds(lesson.problem_ids || []);
    setLessonTryoutId(lesson.tryout_id || '');
    setLessonDuration(lesson.duration_minutes || 15);
    setLessonIsPreview(lesson.is_preview ?? false);
    setProblemSearch('');
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !lessonFormModuleId || !lessonTitle.trim()) {
      alert('Judul materi wajib diisi!');
      return;
    }

    const moduleLessons = lessons.filter((l) => l.module_id === lessonFormModuleId);

    const payload = {
      course_id: activeCourse.id,
      module_id: lessonFormModuleId,
      title: lessonTitle.trim(),
      lesson_type: lessonType,
      content: lessonContent,
      video_url: lessonVideoUrl.trim() || null,
      problem_ids: lessonType === 'practice' ? lessonProblemIds : [],
      tryout_id: lessonType === 'tryout' && lessonTryoutId ? lessonTryoutId : null,
      duration_minutes: Number(lessonDuration) || 10,
      is_preview: lessonIsPreview,
    };

    if (editingLessonId) {
      const { error } = await supabase
        .from('course_lessons')
        .update(payload)
        .eq('id', editingLessonId);
      if (error) return alert(`Gagal memperbarui materi: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('course_lessons')
        .insert([{ ...payload, order_index: moduleLessons.length }]);
      if (error) return alert(`Gagal menambah materi: ${error.message}`);
    }

    resetLessonForm();
    fetchAllData();
  };

  const handleMoveLesson = async (
    moduleLessons: LessonItem[],
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= moduleLessons.length) return;

    const current = moduleLessons[index];
    const target = moduleLessons[targetIdx];

    await Promise.all([
      supabase.from('course_lessons').update({ order_index: targetIdx }).eq('id', current.id),
      supabase.from('course_lessons').update({ order_index: index }).eq('id', target.id),
    ]);
    fetchAllData();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Hapus materi ini?')) return;
    const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId);
    if (error) alert(`Gagal menghapus materi: ${error.message}`);
    else fetchAllData();
  };

  const toggleProblemInLesson = (probId: string) => {
    setLessonProblemIds((prev) =>
      prev.includes(probId) ? prev.filter((id) => id !== probId) : [...prev, probId]
    );
  };

  const getLessonTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return {
          label: 'Video',
          cls: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/70 dark:text-rose-400 dark:border-rose-900',
        };
      case 'practice':
        return {
          label: 'Latihan Soal',
          cls: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/70 dark:text-purple-400 dark:border-purple-900',
        };
      case 'tryout':
        return {
          label: 'Evaluasi CBT',
          cls: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-900',
        };
      default:
        return {
          label: 'Artikel LaTeX',
          cls: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/70 dark:text-sky-400 dark:border-sky-900',
        };
    }
  };

  const inputClass =
    'p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition w-full';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 pb-16">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Admin Panel
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Course &amp; Kurikulum
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateCourse}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Buat Course Baru</span>
          </button>
        </div>

        {/* GRID DAFTAR COURSE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 p-12 text-center text-slate-400 text-xs animate-pulse">
              Memuat daftar kursus...
            </div>
          ) : courses.length > 0 ? (
            courses.map((course) => {
              const courseModCount = modules.filter((m) => m.course_id === course.id).length;
              const courseLessonCount = lessons.filter((l) => l.course_id === course.id).length;
              const isPublished = course.status === 'published';

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-900'
                              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-900'
                          }`}
                        >
                          {isPublished ? '● Published' : '○ Draft'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          {course.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">{course.level}</span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Pengajar: {course.instructor_name}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {course.description || 'Belum ada deskripsi kursus.'}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <LayersIcon className="w-3.5 h-3.5 text-indigo-500" />
                        {courseModCount} Bab
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" />
                        {courseLessonCount} Materi
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetLessonForm();
                        setActiveCourse(course);
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition text-center cursor-pointer"
                    >
                      Kelola Kurikulum
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCourse(course)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
                      title="Edit Informasi Course"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition cursor-pointer"
                      title="Hapus Course"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Belum ada course. Klik &quot;Buat Course Baru&quot; untuk mulai menyusun kurikulum.
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: BUAT / EDIT INFO COURSE                          */}
      {/* ========================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingCourseId ? 'Edit Informasi Course' : 'Buat Course Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Course
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Pengantar Analisis Real I"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Slug (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="pengantar-analisis-real-1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pengajar
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="Matematika / Olimpiade / SKD / UTBK"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat / Level
                  </label>
                  <input
                    type="text"
                    placeholder="Dasar / Menengah / Kuliah / Olimpiade"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    className={inputClass}
                  >
                    <option value="draft">Draft (Disembunyikan)</option>
                    <option value="published">Published (Tampil di Katalog)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Akses Kursus
                  </label>
                  <select
                    value={isFree ? 'true' : 'false'}
                    onChange={(e) => setIsFree(e.target.value === 'true')}
                    className={inputClass}
                  >
                    <option value="true">Gratis / Terbuka untuk Siswa</option>
                    <option value="false">Khusus / Terbatas</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Banner / Thumbnail (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Kursus
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan cakupan materi dan tujuan pembelajaran kursus ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CURRICULUM BUILDER (BAB & MATERI)                */}
      {/* ========================================================= */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Curriculum Builder
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {activeCourse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* Form Tambah Bab / Modul Baru */}
            <form
              onSubmit={handleAddModule}
              className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                + Tambah Bab / Modul Baru
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Judul Bab (mis. Bab 1: Bilangan Real & Aksioma)"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Deskripsi singkat bab (opsional)"
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon />
                  <span>Tambah Bab</span>
                </button>
              </div>
            </form>

            {/* Daftar Bab & Materi */}
            <div className="space-y-5">
              {(() => {
                const courseModules = modules
                  .filter((m) => m.course_id === activeCourse.id)
                  .sort((a, b) => a.order_index - b.order_index);

                if (courseModules.length === 0) {
                  return (
                    <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      Belum ada bab di course ini. Tambahkan bab pertama di atas.
                    </div>
                  );
                }

                return courseModules.map((mod, mIdx) => {
                  const modLessons = lessons
                    .filter((l) => l.module_id === mod.id)
                    .sort((a, b) => a.order_index - b.order_index);

                  return (
                    <div
                      key={mod.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                    >
                      {/* Header Bab */}
                      <div className="p-4 bg-slate-100/70 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={mIdx === 0}
                              onClick={() => handleMoveModule(courseModules, mIdx, 'up')}
                              className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUpIcon />
                            </button>
                            <button
                              type="button"
                              disabled={mIdx === courseModules.length - 1}
                              onClick={() => handleMoveModule(courseModules, mIdx, 'down')}
                              className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDownIcon />
                            </button>
                          </div>

                          {editingModuleId === mod.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editModuleTitle}
                                onChange={(e) => setEditModuleTitle(e.target.value)}
                                className="p-1.5 border border-indigo-400 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateModuleTitle(mod.id)}
                                className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingModuleId(null)}
                                className="px-2 py-1 text-[11px] text-slate-500 cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                {mod.title}
                              </h4>
                              {mod.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {mod.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenAddLesson(mod.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>Tambah Materi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingModuleId(mod.id);
                              setEditModuleTitle(mod.title);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="Edit Judul Bab"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                            title="Hapus Bab"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      {/* Daftar Materi di dalam Bab */}
                      <div className="p-4 space-y-2.5">
                        {modLessons.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Belum ada materi di bab ini. Klik &quot;+ Tambah Materi&quot;.
                          </p>
                        ) : (
                          modLessons.map((les, lIdx) => {
                            const badge = getLessonTypeBadge(les.lesson_type);
                            return (
                              <div
                                key={les.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={lIdx === 0}
                                      onClick={() => handleMoveLesson(modLessons, lIdx, 'up')}
                                      className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowUpIcon />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={lIdx === modLessons.length - 1}
                                      onClick={() => handleMoveLesson(modLessons, lIdx, 'down')}
                                      className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowDownIcon />
                                    </button>
                                  </div>

                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${badge.cls}`}
                                  >
                                    {badge.label}
                                  </span>

                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {les.title}
                                  </span>

                                  {les.is_preview && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-[9px] font-bold shrink-0">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                                    {les.duration_minutes}m
                                    {les.lesson_type === 'practice' &&
                                      ` • ${les.problem_ids.length} Soal`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditLesson(les)}
                                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                    title="Edit Materi"
                                  >
                                    <EditIcon />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(les.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                                    title="Hapus Materi"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* FORM TAMBAH / EDIT MATERI INLINE DI BAWAH BAB */}
                        {lessonFormModuleId === mod.id && (
                          <form
                            onSubmit={handleSaveLesson}
                            className="mt-4 p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                                {editingLessonId ? 'Edit Materi' : `Tambah Materi ke ${mod.title}`}
                              </h5>
                              <button
                                type="button"
                                onClick={resetLessonForm}
                                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
                              >
                                Tutup Form
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block font-bold mb-1">Judul Materi</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="mis. 1.1 Sifat Kelengkapan (Completeness Axiom)"
                                  value={lessonTitle}
                                  onChange={(e) => setLessonTitle(e.target.value)}
                                  className={inputClass}
                                />
                              </div>

                              <div>
                                <label className="block font-bold mb-1">Tipe Materi</label>
                                <select
                                  value={lessonType}
                                  onChange={(e) => setLessonType(e.target.value as any)}
                                  className={inputClass}
                                >
                                  <option value="article">Artikel / Teori LaTeX</option>
                                  <option value="video">Video Pembelajaran</option>
                                  <option value="practice">Latihan Soal (Bank Soal)</option>
                                  <option value="tryout">Evaluasi Paket Try Out</option>
                                </select>
                              </div>
                            </div>

                            {/* Jika Tipe Video */}
                            {lessonType === 'video' && (
                              <div>
                                <label className="block font-bold mb-1">
                                  URL Video (YouTube / Link Embed)
                                </label>
                                <input
                                  type="text"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={lessonVideoUrl}
                                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            )}

                            {/* Jika Tipe Practice: Pilih Soal dari Bank Soal */}
                            {lessonType === 'practice' && (
                              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    Pilih Soal Latihan ({lessonProblemIds.length} Dipilih)
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Cari judul, topik, atau ID soal..."
                                  value={problemSearch}
                                  onChange={(e) => setProblemSearch(e.target.value)}
                                  className={inputClass}
                                />
                                {problemSearch.trim() && (
                                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 p-2 rounded-lg">
                                    {allProblems
                                      .filter((p) => {
                                        const q = problemSearch.toLowerCase();
                                        return (
                                          (p.title || '').toLowerCase().includes(q) ||
                                          (p.topic || '').toLowerCase().includes(q) ||
                                          (p.id || '').toLowerCase().includes(q)
                                        );
                                      })
                                      .map((p) => {
                                        const selected = lessonProblemIds.includes(p.id);
                                        return (
                                          <div
                                            key={p.id}
                                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                                          >
                                            <span className="truncate font-medium">
                                              {p.title || p.id} ({p.topic || 'Umum'})
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => toggleProblemInLesson(p.id)}
                                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                                selected
                                                  ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                                                  : 'bg-indigo-600 text-white'
                                              }`}
                                            >
                                              {selected ? 'Hapus' : '+ Pilih'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                                {lessonProblemIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {lessonProblemIds.map((pid, idx) => {
                                      const found = allProblems.find((p) => p.id === pid);
                                      return (
                                        <span
                                          key={pid}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold"
                                        >
                                          #{idx + 1} {found?.title || pid}
                                          <button
                                            type="button"
                                            onClick={() => toggleProblemInLesson(pid)}
                                            className="text-red-500 font-black cursor-pointer"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Jika Tipe Tryout: Tautkan ke Paket Try Out */}
                            {lessonType === 'tryout' && (
                              <div>
                                <label className="block font-bold mb-1">
                                  Pilih Paket Try Out
                                </label>
                                <select
                                  required
                                  value={lessonTryoutId}
                                  onChange={(e) => setLessonTryoutId(e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="">-- Pilih Paket Try Out --</option>
                                  {allTryouts.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.title} ({t.category || 'Umum'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Konten / Catatan Teori LaTeX */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="font-bold">
                                  {lessonType === 'article'
                                    ? 'Isi Materi (Mendukung LaTeX)'
                                    : 'Pengantar / Catatan Tambahan (Opsional)'}
                                </label>
                                <span className="text-[10px] text-slate-400">
                                  Inline: <code>$x^2$</code> • Display:{' '}
                                  <code>$$\int_a^b f(x)\,dx$$</code>
                                </span>
                              </div>
                              <textarea
                                rows={6}
                                placeholder="Tulis definisi, teorema, bukti, atau penjelasan materi di sini..."
                                value={lessonContent}
                                onChange={(e) => setLessonContent(e.target.value)}
                                className={inputClass}
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-500">
                                    Estimasi Durasi (menit):
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={lessonDuration}
                                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                                    className="w-20 p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-center font-bold"
                                  />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={lessonIsPreview}
                                    onChange={(e) => setLessonIsPreview(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>Jadikan Pratinjau Gratis (Preview)</span>
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={resetLessonForm}
                                  className="px-3.5 py-2 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow cursor-pointer"
                                >
                                  Simpan Materi
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}