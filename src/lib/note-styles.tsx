import React from 'react';

export interface ModuleStyle {
  bg: string;
  svg: React.ReactNode;
}

export interface NoteStyleDefinition extends ModuleStyle {
  id: string;
  keywords: string[];
}

export const NOTE_MODULE_STYLES: NoteStyleDefinition[] = [
  // 1. Struktur Aljabar (ditempatkan sebelum 'aljabar' agar lebih spesifik)
  {
    id: 'struktur-aljabar',
    keywords: ['struktur aljabar', 'aljabar abstrak', 'grup', 'ring', 'gelanggang', 'galois'],
    bg: 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <polygon points="50,18 82,74 18,74" strokeWidth="2.5" className="fill-white/10" />
        {/* Sumbu simetri grup dihedral D3 */}
        <line x1="50" y1="14" x2="50" y2="82" strokeDasharray="3 3" opacity="0.65" />
        <line x1="85" y1="76" x2="31" y2="43" strokeDasharray="3 3" opacity="0.65" />
        <line x1="15" y1="76" x2="69" y2="43" strokeDasharray="3 3" opacity="0.65" />
        <circle cx="50" cy="18" r="4.5" className="fill-white" />
        <circle cx="82" cy="74" r="4.5" className="fill-white" />
        <circle cx="18" cy="74" r="4.5" className="fill-white" />
        <circle cx="50" cy="55" r="9" strokeWidth="2" opacity="0.85" />
      </svg>
    ),
  },

  // 2. Persamaan Diferensial
  {
    id: 'persamaan-diferensial',
    keywords: ['diferensial', 'pdb', 'pdp', 'dinamika'],
    bg: 'bg-gradient-to-br from-orange-500 via-red-600 to-rose-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Medan arah (slope field) */}
        <line x1="20" y1="30" x2="30" y2="24" opacity="0.5" />
        <line x1="45" y1="26" x2="55" y2="26" opacity="0.5" />
        <line x1="70" y1="24" x2="80" y2="30" opacity="0.5" />
        <line x1="20" y1="52" x2="30" y2="44" opacity="0.5" />
        <line x1="70" y1="56" x2="80" y2="48" opacity="0.5" />
        <line x1="20" y1="74" x2="30" y2="68" opacity="0.5" />
        <line x1="45" y1="74" x2="55" y2="74" opacity="0.5" />
        <line x1="70" y1="76" x2="80" y2="70" opacity="0.5" />
        {/* Kurva solusi integral */}
        <path d="M 16 74 C 34 72, 42 28, 84 26" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="4" className="fill-white" />
      </svg>
    ),
  },

  // 3. Analisis Kompleks
  {
    id: 'analisis-kompleks',
    keywords: ['kompleks', 'holomorfik', 'residu'],
    bg: 'bg-gradient-to-br from-indigo-500 via-blue-700 to-slate-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Sumbu Real & Imajiner */}
        <line x1="15" y1="50" x2="85" y2="50" opacity="0.45" />
        <line x1="50" y1="15" x2="50" y2="85" opacity="0.45" />
        {/* Kontur integral tertutup */}
        <circle cx="50" cy="50" r="26" strokeWidth="2.5" className="fill-white/10" />
        <polyline points="46,20 53,24 46,28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Titik singularitas (pole) */}
        <line x1="46" y1="46" x2="54" y2="54" strokeWidth="2.5" />
        <line x1="54" y1="46" x2="46" y2="54" strokeWidth="2.5" />
      </svg>
    ),
  },

  // 4. Metode Numerik & Komputasi
  {
    id: 'metode-numerik',
    keywords: ['numerik', 'komputasi', 'algoritma', 'pemrograman'],
    bg: 'bg-gradient-to-br from-cyan-600 via-slate-700 to-slate-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <line x1="15" y1="78" x2="85" y2="78" strokeWidth="2.5" />
        {/* Partisi aproksimasi trapesium/Riemann */}
        <rect x="22" y="56" width="14" height="22" className="fill-white/15" />
        <rect x="36" y="42" width="14" height="36" className="fill-white/20" />
        <rect x="50" y="30" width="14" height="48" className="fill-white/15" />
        <rect x="64" y="22" width="14" height="56" className="fill-white/20" />
        {/* Kurva fungsi eksak */}
        <path d="M 18 66 Q 48 34, 82 20" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },

  // 5. Statistika & Teori Peluang
  {
    id: 'statistika-peluang',
    keywords: ['statistika', 'peluang', 'probabilitas', 'stokastik', 'data'],
    bg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <line x1="14" y1="78" x2="86" y2="78" strokeWidth="2.5" />
        {/* Batang histogram */}
        <rect x="24" y="64" width="10" height="14" className="fill-white/15" />
        <rect x="35" y="46" width="10" height="32" className="fill-white/20" />
        <rect x="45" y="32" width="10" height="46" className="fill-white/25" />
        <rect x="55" y="46" width="10" height="32" className="fill-white/20" />
        <rect x="66" y="64" width="10" height="14" className="fill-white/15" />
        {/* Kurva distribusi normal */}
        <path d="M 16 76 C 32 76, 38 28, 50 28 C 62 28, 68 76, 84 76" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },

  // 6. Riset Operasi & Optimasi
  {
    id: 'riset-operasi',
    keywords: ['optimasi', 'program linear', 'riset operasi'],
    bg: 'bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <line x1="20" y1="80" x2="84" y2="80" strokeWidth="2.5" />
        <line x1="20" y1="80" x2="20" y2="18" strokeWidth="2.5" />
        {/* Daerah layak (feasible region) */}
        <polygon points="20,80 20,38 48,30 70,54 62,80" className="fill-white/20" strokeWidth="2.5" />
        {/* Garis kendala & titik optimum */}
        <line x1="16" y1="40" x2="78" y2="22" strokeDasharray="3 3" opacity="0.7" />
        <line x1="42" y1="22" x2="82" y2="68" strokeDasharray="3 3" opacity="0.7" />
        <circle cx="48" cy="30" r="5" className="fill-white" />
      </svg>
    ),
  },

  // 7. Trigonometri
  {
    id: 'trigonometri',
    keywords: ['trigonometri', 'sinus', 'kosinus'],
    bg: 'bg-gradient-to-br from-teal-400 via-cyan-600 to-sky-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Lingkaran satuan */}
        <circle cx="50" cy="50" r="30" strokeWidth="2.2" className="fill-white/10" />
        <line x1="14" y1="50" x2="86" y2="50" opacity="0.45" />
        <line x1="50" y1="14" x2="50" y2="86" opacity="0.45" />
        {/* Segitiga siku-siku proyeksi */}
        <polygon points="50,50 71,29 71,50" className="fill-white/25" strokeWidth="2.5" />
        <path d="M 60 50 A 10 10 0 0 0 57 43" strokeWidth="2" />
        <circle cx="71" cy="29" r="3.5" className="fill-white" />
      </svg>
    ),
  },

  // 8. Geometri Analitik & Vektor Ruang
  {
    id: 'geometri-analitik',
    keywords: ['vektor', 'analitik', 'multivariabel', 'dimensi tiga'],
    bg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Kubus 3D */}
        <rect x="24" y="36" width="38" height="38" className="fill-white/10" strokeWidth="2.2" />
        <rect x="40" y="22" width="38" height="38" strokeWidth="2.2" />
        <line x1="24" y1="36" x2="40" y2="22" />
        <line x1="62" y1="36" x2="78" y2="22" />
        <line x1="24" y1="74" x2="40" y2="60" strokeDasharray="3 3" opacity="0.7" />
        <line x1="62" y1="74" x2="78" y2="60" />
        {/* Diagonal ruang */}
        <line x1="24" y1="74" x2="78" y2="22" strokeWidth="2.8" />
        <circle cx="78" cy="22" r="3.5" className="fill-white" />
      </svg>
    ),
  },

  // 9. Topologi
  {
    id: 'topologi',
    keywords: ['topologi', 'ruang metrik', 'homeomorfisma'],
    bg: 'bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.3">
        {/* Torus */}
        <ellipse cx="50" cy="50" rx="34" ry="20" className="fill-white/15" />
        <path d="M 34 49 Q 50 58, 66 49" strokeLinecap="round" />
        <path d="M 38 51 Q 50 43, 62 51" strokeLinecap="round" />
        <ellipse cx="50" cy="50" rx="22" ry="11" strokeDasharray="3 3" opacity="0.7" />
      </svg>
    ),
  },

  // 10. Teori Graf
  {
    id: 'teori-graf',
    keywords: ['graf', 'jaringan'],
    bg: 'bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Pentagon luar + bintang dalam (motif graf Petersen) */}
        <polygon points="50,18 80,40 68,76 32,76 20,40" strokeWidth="2.2" className="fill-white/10" />
        <polygon points="50,18 68,76 20,40 80,40 32,76" strokeWidth="1.8" opacity="0.8" />
        <circle cx="50" cy="18" r="4.5" className="fill-white" />
        <circle cx="80" cy="40" r="4.5" className="fill-white" />
        <circle cx="68" cy="76" r="4.5" className="fill-white" />
        <circle cx="32" cy="76" r="4.5" className="fill-white" />
        <circle cx="20" cy="40" r="4.5" className="fill-white" />
      </svg>
    ),
  },

  // 11. Logika & Teori Himpunan
  {
    id: 'logika',
    keywords: ['logika', 'himpunan'],
    bg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
        <circle cx="38" cy="50" r="26" className="fill-white/10" />
        <circle cx="62" cy="50" r="26" className="fill-white/20" />
        <path d="M 50 26 A 26 26 0 0 1 50 74 A 26 26 0 0 1 50 26" className="fill-white/30" />
      </svg>
    ),
  },

  // 12. Aljabar & Aljabar Linear
  {
    id: 'aljabar',
    keywords: ['aljabar', 'linear', 'matriks', 'polinomial'],
    bg: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <line x1="20" y1="80" x2="80" y2="80" strokeWidth="3" />
        <line x1="20" y1="80" x2="20" y2="20" strokeWidth="3" />
        <line x1="20" y1="80" x2="75" y2="25" strokeWidth="3.5" className="stroke-amber-100" />
        <polygon points="75,25 65,28 72,35" className="fill-amber-100 stroke-none" />
        <line x1="20" y1="60" x2="80" y2="60" strokeDasharray="3 3" opacity="0.45" />
        <line x1="20" y1="40" x2="80" y2="40" strokeDasharray="3 3" opacity="0.45" />
        <line x1="40" y1="20" x2="40" y2="80" strokeDasharray="3 3" opacity="0.45" />
        <line x1="60" y1="20" x2="60" y2="80" strokeDasharray="3 3" opacity="0.45" />
      </svg>
    ),
  },

  // 13. Analisis Real & Kalkulus
  {
    id: 'analisis',
    keywords: ['analisis', 'kalkulus', 'real', 'limit', 'integral'],
    bg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
        <path d="M 15 75 Q 35 20, 50 50 T 85 25" />
        <line x1="10" y1="75" x2="90" y2="75" strokeWidth="2" opacity="0.55" />
        <path d="M 30 75 L 30 45 A 5 5 0 0 1 70 45 L 70 75 Z" className="fill-white/20 stroke-none" />
      </svg>
    ),
  },

  // 14. Teori Bilangan
  {
    id: 'teori-bilangan',
    keywords: ['bilangan', 'teori bilangan', 'aritmetika', 'kongruensi', 'modular'],
    bg: 'bg-gradient-to-br from-violet-500 via-purple-600 to-purple-900',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <circle cx="30" cy="30" r="6" className="fill-white" />
        <circle cx="70" cy="30" r="6" className="fill-white" />
        <circle cx="30" cy="70" r="6" className="fill-white" />
        <circle cx="70" cy="70" r="6" className="fill-white" />
        <line x1="30" y1="30" x2="70" y2="30" />
        <line x1="30" y1="30" x2="30" y2="70" />
        <line x1="70" y1="30" x2="70" y2="70" />
        <line x1="30" y1="70" x2="70" y2="70" />
        <line x1="30" y1="30" x2="70" y2="70" strokeDasharray="3 3" opacity="0.65" />
      </svg>
    ),
  },

  // 15. Geometri
  {
    id: 'geometri',
    keywords: ['geometri'],
    bg: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2.5">
        <polygon points="50,20 85,75 15,75" />
        <circle cx="50" cy="55" r="20" className="fill-white/15" />
      </svg>
    ),
  },

  // 16. Kombinatorika & Matematika Diskrit
  {
    id: 'kombinatorika',
    keywords: ['kombinatorika', 'diskrit', 'pencacahan'],
    bg: 'bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <circle cx="50" cy="25" r="5" className="fill-white" />
        <circle cx="30" cy="55" r="5" className="fill-white" />
        <circle cx="70" cy="55" r="5" className="fill-white" />
        <circle cx="20" cy="80" r="5" className="fill-white" />
        <circle cx="40" cy="80" r="5" className="fill-white" />
        <circle cx="80" cy="80" r="5" className="fill-white" />
        <line x1="50" y1="25" x2="30" y2="55" />
        <line x1="50" y1="25" x2="70" y2="55" />
        <line x1="30" y1="55" x2="20" y2="80" />
        <line x1="30" y1="55" x2="40" y2="80" />
        <line x1="70" y1="55" x2="80" y2="80" />
      </svg>
    ),
  },

  // 17. Metode Penelitian
  {
    id: 'metode-penelitian',
    keywords: ['metode', 'penelitian', 'metopel'],
    bg: 'bg-gradient-to-br from-sky-500 via-cyan-600 to-blue-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        <circle cx="45" cy="45" r="22" strokeWidth="2.5" className="fill-white/15" />
        <line x1="61" y1="61" x2="80" y2="80" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="33" y1="38" x2="55" y2="38" strokeWidth="2.5" className="stroke-sky-100" />
        <line x1="33" y1="46" x2="50" y2="46" strokeWidth="2" opacity="0.85" />
        <line x1="33" y1="54" x2="43" y2="54" strokeWidth="2" opacity="0.6" />
        <circle cx="55" cy="46" r="2" className="fill-sky-100 stroke-none" />
      </svg>
    ),
  },

  // 18. Pendidikan Matematika, Didaktik & Evaluasi
  {
    id: 'pendidikan-matematika',
    keywords: ['pendidikan', 'pembelajaran', 'kurikulum', 'evaluasi', 'didaktik', 'kapita'],
    bg: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-800',
    svg: (
      <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
        {/* Jangka konstruksi geometri & busur */}
        <circle cx="50" cy="24" r="5" strokeWidth="2.5" className="fill-white/20" />
        <line x1="50" y1="14" x2="50" y2="19" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="47" y1="28" x2="28" y2="78" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="53" y1="28" x2="72" y2="78" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M 32 58 A 34 34 0 0 0 68 58" strokeDasharray="3 3" opacity="0.8" />
        <line x1="18" y1="78" x2="82" y2="78" strokeWidth="2" opacity="0.55" />
      </svg>
    ),
  },
];

const DEFAULT_MODULE_STYLE: ModuleStyle = {
  bg: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-800',
  svg: (
    <svg className="w-20 h-20 sm:w-24 sm:h-24 opacity-90 stroke-white fill-none" viewBox="0 0 100 100" strokeWidth="2">
      <circle cx="50" cy="50" r="30" className="fill-white/10" />
      <line x1="20" y1="50" x2="80" y2="50" />
      <ellipse cx="50" cy="50" rx="30" ry="12" />
    </svg>
  ),
};

export function getModuleStyle(topic?: string, title?: string): ModuleStyle {
  const key = (topic || title || '').toLowerCase();
  const matched = NOTE_MODULE_STYLES.find((item) =>
    item.keywords.some((kw) => key.includes(kw))
  );
  return matched || DEFAULT_MODULE_STYLE;
}