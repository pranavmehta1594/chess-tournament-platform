import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import { QueryProvider } from '../providers/query-provider';
import { AuthProvider } from '../providers/auth-context';
import { Navbar } from '../components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Kingdom of Chess | Live Tournament Platform',
  description:
    'Online chess academy live tournament module with real-time 1-on-1 play, shared clocks, and live leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
