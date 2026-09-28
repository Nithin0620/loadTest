'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { BenchleyLogo } from '@/components/Logo';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const workflowUrl = process.env.NEXT_PUBLIC_WORKFLOW_URL || 'https://workflow.ssh.net.in';

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
          Verifying authorization session...
        </p>
      </div>
    );
  }

  if (!user) {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const returnUrl = encodeURIComponent(`${currentOrigin}${pathname}`);

    return (
      <div className="relative min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 p-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 w-fit">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-mono leading-relaxed">
            You must be signed in with your Workflow or Benchley account to access this page and execute load tests.
          </p>

          {/* Workflow SSO Button */}
          <a
            href={`${workflowUrl}/login?redirect_to=${returnUrl}`}
            className="w-full mt-6 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] hover:border-yellow-400/50 transition-all duration-200 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sign In with Workflow SSO</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
          </a>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#050505] px-3 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Or
            </span>
            <div className="border-t border-white/[0.08] w-full" />
          </div>

          {/* Native Auth Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white transition-all"
            >
              <span>Log In</span>
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(pathname)}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-glow-sm transition-all"
            >
              <span>Create Account</span>
              <Zap className="w-3.5 h-3.5 fill-current" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
