'use client';

interface NoteCoverProps {
  title: string;
  topic: string;
  patternType?: string;
  gradientTheme?: string;
  className?: string;
}

export function NoteCover({
  title,
  topic,
  patternType = 'algebra',
  gradientTheme = 'from-blue-600 to-indigo-700',
  className = "h-48 sm:h-56",
}: NoteCoverProps) {

  // Pola Vektor Matematika Abstrak berdasarkan Topik
  const renderPattern = () => {
    switch (patternType) {
      case 'calculus': // Gelombang Fungsi Sine & Tangen
        return (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 250" fill="none">
            <path d="M-50 125 Q 50 25, 150 125 T 350 125 T 550 125" stroke="white" strokeWidth="3" fill="none" />
            <path d="M-50 150 Q 75 50, 200 150 T 450 150" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <circle cx="150" cy="125" r="5" fill="white" />
            <circle cx="250" cy="75" r="5" fill="white" />
          </svg>
        );
      case 'geometry': // Simpul Graf & Jaringan Vektor
        return (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 250" fill="none">
            <polygon points="50,40 180,90 120,200 30,160" stroke="white" strokeWidth="1.5" />
            <polygon points="180,90 320,50 350,180 120,200" stroke="white" strokeWidth="1.5" />
            <circle cx="180" cy="90" r="4" fill="white" />
            <circle cx="120" cy="200" r="4" fill="white" />
            <circle cx="320" cy="50" r="4" fill="white" />
          </svg>
        );
      case 'number_theory': // Kisi Kartesius & Matriks Dots
        return (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 250" fill="none">
            <pattern id="grid-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2" fill="white" />
            </pattern>
            <rect width="400" height="250" fill="url(#grid-dots)" />
            <circle cx="180" cy="120" r="45" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
        );
      case 'algebra':
      default: // Simbol Vektor Akar / Sumasi Abstrak
        return (
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 250" fill="none">
            <path d="M30 180 L80 180 L120 70 L340 70" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <text x="140" y="160" fill="white" fontSize="72" fontWeight="bold" fontFamily="serif" opacity="0.6">∑</text>
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientTheme} p-6 flex flex-col justify-between text-white shadow-md group transition-all duration-300 hover:shadow-lg ${className}`}>
      {/* Dynamic Background Pattern */}
      {renderPattern()}

      {/* Layer Ambient Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition duration-500" />

      {/* Top Badge Topic */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-md border border-white/15">
          {topic}
        </span>
        <span className="text-xs font-mono opacity-80">TheoNotes</span>
      </div>

      {/* Bottom Title Area */}
      <div className="relative z-10 space-y-1 mt-auto">
        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug line-clamp-2 drop-shadow-sm">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-[11px] font-medium text-white/80 group-hover:text-white transition">
          <span>Baca Catatan</span>
          <span className="group-hover:translate-x-1 transition duration-200">→</span>
        </div>
      </div>
    </div>
  );
}