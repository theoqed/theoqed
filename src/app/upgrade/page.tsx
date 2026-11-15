'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  getMembershipState,
  formatIndonesianDate,
  MembershipState,
} from '@/lib/premium';

interface PlanOption {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  priceFormatted: string;
  perMonthFormatted: string;
  badge?: string;
  highlight?: boolean;
}

interface PaymentBill {
  id: string;
  invoice_code: string;
  plan_id: string;
  plan_name: string;
  duration_months: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'rejected';
  created_at: string;
}

const PLANS: PlanOption[] = [
  {
    id: '1_month',
    name: 'Paket 1 Bulan',
    durationMonths: 1,
    price: 100000,
    priceFormatted: 'Rp100.000',
    perMonthFormatted: 'Rp100.000 / bulan',
  },
  {
    id: '3_months',
    name: 'Paket 3 Bulan',
    durationMonths: 3,
    price: 285000,
    priceFormatted: 'Rp285.000',
    perMonthFormatted: 'Rp95.000 / bulan',
    badge: 'Hemat 5%',
  },
  {
    id: '6_months',
    name: 'Paket 6 Bulan',
    durationMonths: 6,
    price: 550000,
    priceFormatted: 'Rp550.000',
    perMonthFormatted: 'Rp91.600 / bulan',
    badge: 'Hemat 8% • Populer',
    highlight: true,
  },
  {
    id: '12_months',
    name: 'Paket 1 Tahun',
    durationMonths: 12,
    price: 1000000,
    priceFormatted: 'Rp1.000.000',
    perMonthFormatted: 'Rp83.300 / bulan',
    badge: 'Hemat 17% • Paling Hemat',
  },
];

// --- SVG CUSTOM ICONS ---
function ArrowLeftIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function ExternalLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
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

function CrownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l3.5 6L12 4l3.5 5L19 3l-1 14H6L5 3zm1 17h12" />
    </svg>
  );
}

function ReceiptIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const openBillOnLoad = searchParams.get('bill') === 'open';

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string>('');
  const [membershipState, setMembershipState] = useState<MembershipState>('free');
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [pendingBill, setPendingBill] = useState<PaymentBill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creatingPlanId, setCreatingPlanId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData(openBillOnLoad);
  }, []);

  async function fetchData(autoOpenModal = false) {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const [{ data: profileData }, { data: billData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, is_premium, premium_until')
          .eq('id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileData?.full_name) setFullName(profileData.full_name);
      setPremiumUntil(profileData?.premium_until || null);
      setMembershipState(getMembershipState(profileData));

      const activeBill = (billData as PaymentBill) || null;
      setPendingBill(activeBill);
      if (autoOpenModal && activeBill) {
        setShowBillModal(true);
      }
    }

    setLoading(false);
  }

  const handleBack = () => {
    if (explicitRedirect) {
      router.push(explicitRedirect);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSelectPlan = async (plan: PlanOption) => {
    if (!user) {
      alert('Silakan masuk ke akun terlebih dahulu di beranda sebelum memilih paket.');
      return;
    }

    if (pendingBill) {
      setShowBillModal(true);
      return;
    }

    setCreatingPlanId(plan.id);

    const now = new Date();
    const datePart = `${now.getFullYear().toString().slice(-2)}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const invoiceCode = `INV-${datePart}-${randomPart}`;

    const resolvedName =
      fullName ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Pengguna TheoQED';

    const { data: insertedBill, error } = await supabase
      .from('payments')
      .insert({
        invoice_code: invoiceCode,
        user_id: user.id,
        user_email: user.email,
        user_name: resolvedName,
        plan_id: plan.id,
        plan_name: plan.name,
        duration_months: plan.durationMonths,
        amount: plan.price,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      alert(`Gagal membuat tagihan: ${error.message}`);
    } else if (insertedBill) {
      setPendingBill(insertedBill as PaymentBill);
      setShowBillModal(true);
    }

    setCreatingPlanId(null);
  };

  const handleCancelBill = async () => {
    if (!pendingBill) return;
    if (!confirm('Batalkan tagihan ini agar dapat memilih paket lain?')) return;

    setCancelling(true);
    const { error } = await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', pendingBill.id);

    if (error) {
      alert(`Gagal membatalkan tagihan: ${error.message}`);
    } else {
      setPendingBill(null);
      setShowBillModal(false);
    }
    setCancelling(false);
  };

  const getDmTemplate = (bill: PaymentBill) => {
    const resolvedName =
      fullName ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      '-';
    return `Halo Admin TheoQED, saya ingin konfirmasi pembayaran paket Premium:\nKode Tagihan: ${bill.invoice_code}\nAkun: ${resolvedName} (${user?.email || '-'})\nPaket: ${bill.plan_name}\nTotal: ${formatRupiah(bill.amount)}`;
  };

  const handleCopyTemplate = (bill: PaymentBill) => {
    navigator.clipboard.writeText(getDmTemplate(bill));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
              Paket Upgrade
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Tombol Buka Popup Tagihan Aktif (muncul saat ada transaksi pending) */}
            {!loading && pendingBill && (
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="h-9 px-3.5 text-xs font-bold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Tagihan Aktif</span>
              </button>
            )}

            {user && (
              <Link
                href="/transactions"
                className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition inline-flex items-center gap-1.5"
              >
                <ReceiptIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Riwayat Transaksi</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container — Lebar Standar max-w-7xl */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
            <CrownIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>TheoQED Premium</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {membershipState === 'active' ? 'Perpanjang Paket Premium' : 'Pilih Paket Akses Premium'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Buka seluruh arsip folder eksklusif, petunjuk penyelesaian, kunci jawaban resmi, serta beragam metode pembahasan lengkap.
          </p>
        </div>

        {/* Info Status Aktif (Jika User Sudah Premium) */}
        {!loading && user && membershipState === 'active' && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <CrownIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Status Premium Anda saat ini aktif hingga{' '}
              <strong>{formatIndonesianDate(premiumUntil)}</strong>. Memilih paket baru akan menambah durasi masa aktif Anda.
            </span>
          </div>
        )}

        {/* Alert Belum Login */}
        {!loading && !user && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-center text-xs text-amber-700 dark:text-amber-300">
            Anda belum masuk ke akun. Silakan{' '}
            <Link href="/" className="font-bold underline">
              masuk terlebih dahulu di halaman utama
            </Link>{' '}
            agar tagihan terhubung dengan akun Anda.
          </div>
        )}

        {/* DAFTAR PILIHAN PAKET */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pilih Durasi Paket
            </h2>
            {pendingBill && (
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                Tagihan #{pendingBill.invoice_code} menunggu konfirmasi →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isSelectedPending = pendingBill?.plan_id === plan.id;
              const isOtherPlanDisabled = Boolean(pendingBill) && !isSelectedPending;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border transition ${
                    plan.highlight
                      ? 'bg-white dark:bg-slate-900 border-indigo-500/90 ring-1 ring-indigo-500/20 relative'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="min-h-[24px]">
                      {plan.badge ? (
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            plan.highlight
                              ? 'bg-indigo-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Standar
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {plan.priceFormatted}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {plan.perMonthFormatted}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Akses seluruh soal &amp; folder Premium</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Semua metode pembahasan &amp; kunci jawaban</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Kontribusi solusi pada soal eksklusif</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      !user ||
                      isOtherPlanDisabled ||
                      creatingPlanId === plan.id
                    }
                    onClick={() =>
                      isSelectedPending ? setShowBillModal(true) : handleSelectPlan(plan)
                    }
                    className={`w-full h-10 rounded-xl text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed ${
                      isSelectedPending
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        : plan.highlight
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40'
                        : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white disabled:opacity-40'
                    }`}
                  >
                    {creatingPlanId === plan.id
                      ? 'Membuat Tagihan...'
                      : isSelectedPending
                      ? 'Lihat Detail Tagihan'
                      : 'Pilih Paket Ini'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* POPUP MODAL TAGIHAN & KONFIRMASI PEMBAYARAN */}
      {showBillModal && pendingBill && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowBillModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                  <ClockIcon className="w-3 h-3 text-amber-500" />
                  <span>Menunggu Pembayaran</span>
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Tagihan #{pendingBill.invoice_code}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup Popup Tagihan"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Ringkasan Paket & Total */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Paket Dipilih</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {pendingBill.plan_name} ({pendingBill.duration_months} Bln)
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Total Tagihan</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {formatRupiah(pendingBill.amount)}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Akun Terdaftar</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Instruksi Konfirmasi */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Langkah Penyelesaian
              </h3>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Salin format konfirmasi di bawah ini.</li>
                <li>
                  Kirim melalui DM Instagram ke{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">@theoqed.id</strong> untuk metode transfer/QRIS.
                </li>
                <li>Admin akan mengaktifkan akses Premium setelah bukti diterima.</li>
              </ol>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {getDmTemplate(pendingBill)}
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelBill}
                disabled={cancelling}
                className="h-9 px-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition cursor-pointer"
              >
                {cancelling ? 'Membatalkan...' : 'Batalkan Tagihan'}
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyTemplate(pendingBill)}
                  className="h-9 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Salin Format'}</span>
                </button>

                <a
                  href="https://ig.me/m/theoqed.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <span>DM @theoqed.id</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-400">
          Memuat halaman paket...
        </div>
      }
    >
      <UpgradeContent />
    </Suspense>
  );
}