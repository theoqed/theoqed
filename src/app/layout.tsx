import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CommandPalette } from '@/components/CommandPalette';
import './globals.css';
import 'katex/dist/katex.min.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'TheoQED — Platform Bank Soal & Pembelajaran Matematika',
  description: 'Arsip soal olimpiade, modul perkuliahan TheoNotes, dan generator lembar kerja.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakartaSans.className} suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CommandPalette />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}