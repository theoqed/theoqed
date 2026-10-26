import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import 'katex/dist/katex.min.css';

// Inisialisasi font Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TheoQED — Platform Bank Soal Olimpiade Matematika",
  description: "Arsip dan pembahasan soal olimpiade matematika terstruktur.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakartaSans.className} suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}