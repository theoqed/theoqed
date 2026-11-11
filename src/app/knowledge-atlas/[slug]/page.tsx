import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getNodeBySlug, getNodeEdges } from '@/lib/knowledge-atlas/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KnowledgeNodeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { node, page } = await getNodeBySlug(slug);

  if (!node) {
    notFound();
  }

  const { outgoing, incoming } = await getNodeEdges(node.id);
  const content = page?.content_json || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 my-8 space-y-8">
          {/* BREADCRUMB */}
          <Link
            href="/knowledge-atlas"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Katalog Atlas</span>
          </Link>

          {/* HEADER ENTITAS */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
                {node.node_type}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {node.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {node.summary}
            </p>
          </div>

          {/* ENSIKLOPEDIA CONTENT BODY */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Penjelasan & Definisi Resmi
            </h2>

            {/* DEFINISI & FORMULA LATEX */}
            {content.equation_latex && (
  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center font-mono text-base text-emerald-600 dark:text-emerald-400 overflow-x-auto">
    {`$$${content.equation_latex}$$`}
  </div>
)}

            {content.explanation ? (
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {content.explanation}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Penjelasan detail belum ditambahkan oleh penyunting.
              </p>
            )}

            {/* PENGGUNAAN & APLIKASI */}
            {content.applications && content.applications.length > 0 && (
              <div className="space-y-2 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Aplikasi Utama
                </h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  {content.applications.map((app, idx) => (
                    <li key={idx}>{app}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* PANEL KONEKSI RELASI GRAF LINTAS BIDANG */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-black tracking-tight">
                Koneksi Graf & Relasi Lintas Bidang
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RELASI KELUAR */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Berdampak pada / Diterapkan pada:
                </span>
                {outgoing.length > 0 ? (
                  <div className="space-y-2">
                    {outgoing.map((edge) => (
                      <Link
                        key={edge.id}
                        href={`/knowledge-atlas/${edge.targetNode.slug}`}
                        className="block p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                      >
                        <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                          <span>{edge.targetNode.title}</span>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-900">
                            {edge.relation_type}
                          </span>
                        </div>
                        {edge.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {edge.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Belum ada koneksi keluar tercatat.
                  </p>
                )}
              </div>

              {/* RELASI MASUK */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Membutuhkan Prasyarat / Berasal dari:
                </span>
                {incoming.length > 0 ? (
                  <div className="space-y-2">
                    {incoming.map((edge) => (
                      <Link
                        key={edge.id}
                        href={`/knowledge-atlas/${edge.sourceNode.slug}`}
                        className="block p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                      >
                        <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                          <span>{edge.sourceNode.title}</span>
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-900">
                            {edge.relation_type}
                          </span>
                        </div>
                        {edge.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {edge.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Belum ada koneksi masuk tercatat.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}