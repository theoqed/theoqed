'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PaymentBill {
  id: string;
  invoice_code: string;
  user_email: string | null;
  user_name: string | null;
  plan_id: string;
  plan_name: string;
  duration_months: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'rejected';
  created_at: string;
  approved_at: string | null;
}

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function CopyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CrownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function LockIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [bills, setBills] = useState<PaymentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'closed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data) setBills(data as PaymentBill[]);
    }

    setLoading(false);
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleCopy = (bill: PaymentBill) => {
    const text = `Halo Admin TheoQED, saya ingin konfirmasi pembayaran paket Premium:\nKode Tagihan: ${bill.invoice_code}\nAkun: ${bill.user_name || '-'} (${bill.user_email || user?.email || '-'})\nPaket: ${bill.plan_name}\nTotal: ${formatRupiah(bill.amount)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(bill.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = async (bill: PaymentBill) => {
    if (!confirm(`Batalkan tagihan ${bill.invoice_code}?`)) return;
    setCancellingId(bill.id);

    const { error } = await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', bill.id);

    if (error) {
      alert(`Gagal membatalkan tagihan: ${error.message}`);
    } else {
      await fetchTransactions();
    }
    setCancellingId(null);
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (filter === 'pending') return b.status === 'pending';
      if (filter === 'paid') return b.status === 'paid';
      if (filter === 'closed') return b.status === 'cancelled' || b.status === 'rejected';
      return true;
    });
  }, [bills, filter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Header — Lebar Standar max-w-7xl */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Riwayat Transaksi
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/upgrade?redirect=/transactions"
              className="h-9 px-3.5 text-xs font-semibold bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border border-amber-200/90 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 rounded-xl transition inline-flex items-center gap-1.5"
            >
              <CrownIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Paket Upgrade</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Billing &amp; Invoices
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Riwayat Transaksi Akun
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Daftar seluruh pengajuan paket dan status pembayaran TheoQED Premium Anda.
          </p>
        </div>

        {!loading && !user ? (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto mt-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-200/80 dark:border-indigo-900">
              <LockIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Masuk ke Akun Diperlukan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Silakan masuk ke akun terlebih dahulu untuk melihat riwayat transaksi Anda.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              Masuk di Beranda
            </Link>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
              {(
                [
                  { id: 'all', label: `Semua (${bills.length})` },
                  {
                    id: 'pending',
                    label: `Menunggu (${bills.filter((b) => b.status === 'pending').length})`,
                  },
                  {
                    id: 'paid',
                    label: `Lunas (${bills.filter((b) => b.status === 'paid').length})`,
                  },
                  {
                    id: 'closed',
                    label: `Dibatalkan / Ditolak (${
                      bills.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`h-9 px-4 rounded-xl transition cursor-pointer ${
                    filter === tab.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span>Memuat riwayat transaksi...</span>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada catatan transaksi pada kategori ini.
                </p>
                <Link
                  href="/upgrade?redirect=/transactions"
                  className="inline-flex items-center justify-center h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Lihat Pilihan Paket Upgrade
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {bill.invoice_code}
                        </span>

                        {bill.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-amber-50/90 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-500/30">
                            Menunggu Konfirmasi
                          </span>
                        )}
                        {bill.status === 'paid' && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900">
                            Lunas &amp; Aktif
                          </span>
                        )}
                        {bill.status === 'cancelled' && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Dibatalkan
                          </span>
                        )}
                        {bill.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900">
                            Ditolak
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {bill.plan_name}{' '}
                        <span className="text-indigo-600 dark:text-indigo-400">
                          • {formatRupiah(bill.amount)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Dibuat:{' '}
                        {new Date(bill.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {bill.approved_at && (
                          <>
                            {' '}
                            • Disetujui:{' '}
                            {new Date(bill.approved_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </>
                        )}
                      </p>
                    </div>

                    {bill.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(bill)}
                          className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CopyIcon />
                          <span>{copiedId === bill.id ? 'Tersalin!' : 'Salin Format'}</span>
                        </button>
                        <a
                          href="https://ig.me/m/theoqed.id"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <span>DM Admin</span>
                          <ExternalLinkIcon />
                        </a>
                        <button
                          type="button"
                          disabled={cancellingId === bill.id}
                          onClick={() => handleCancel(bill)}
                          className="h-9 px-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-900/50 text-xs font-semibold transition cursor-pointer"
                        >
                          {cancellingId === bill.id ? '...' : 'Batalkan'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}