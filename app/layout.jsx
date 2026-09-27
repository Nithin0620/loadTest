import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'LoadCheck ⚡ | Modern API Load Testing Platform',
  description: 'Developer-centric high-performance HTTP load testing powered by k6 and real-time telemetry',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-950 text-zinc-100 flex flex-col antialiased selection:bg-yellow-400 selection:text-black">
        {/* Background ambient radial glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-yellow-400/5 blur-[120px] rounded-full" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[300px] bg-yellow-400/3 blur-[100px] rounded-full" />
        </div>

        <Navbar />

        <main className="flex-1 z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="border-t border-dark-800 py-6 text-center text-xs text-zinc-500 z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-yellow-400">LoadCheck ⚡</span>
              <span>• Orchestrated with k6 & Next.js</span>
            </div>
            <div>
              Built for performance engineering & high-throughput API benchmarking
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
