import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'Benchley — High-Performance API Load Testing Platform',
  description: 'Developer-centric high-throughput HTTP load testing powered by k6, real-time telemetry, and performance benchmarks.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full min-h-screen bg-black text-white flex flex-col antialiased selection:bg-yellow-400 selection:text-black font-sans">
        <AuthProvider>
          <Navbar />

          <main className="flex-1 z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </AuthProvider>

        <footer className="border-t border-white/[0.06] py-6 text-xs text-zinc-500 z-10 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Benchley</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">High-Performance Load Engine</span>
            </div>
            <div className="text-zinc-500 font-mono text-[11px]">
              Orchestrated with k6 & Next.js
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
