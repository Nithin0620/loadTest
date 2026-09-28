'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';
import { BenchleyLogo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/';

  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const workflowUrl = process.env.NEXT_PUBLIC_WORKFLOW_URL || 'https://workflow.ssh.net.in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signup({ name, email, password });
      router.push(redirectUrl);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoRedirect = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://benchley.ssh.net.in';
    const callbackUrl = encodeURIComponent(`${currentOrigin}${redirectUrl}`);
    window.location.href = `${workflowUrl}/login?redirect_to=${callbackUrl}`;
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-black/80 backdrop-blur-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-3 p-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
            <BenchleyLogo className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-mono">
            Get access to Benchley & Workflow services
          </p>
        </div>

        {/* Workflow SSO Button */}
        <button
          type="button"
          onClick={handleSsoRedirect}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] hover:border-yellow-400/50 transition-all duration-200 group mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sign Up with Workflow SSO</span>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-white/[0.08] w-full" />
          <span className="bg-[#050505] px-3 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            Or with credentials
          </span>
          <div className="border-t border-white/[0.08] w-full" />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400/80 focus:ring-1 focus:ring-yellow-400/80 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400/80 focus:ring-1 focus:ring-yellow-400/80 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
              Password (min 6 chars)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400/80 focus:ring-1 focus:ring-yellow-400/80 transition-colors font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black transition-all duration-150 shadow-[0_0_20px_rgba(250,204,21,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <Zap className="w-4 h-4 fill-current" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-400 font-mono">
          Already have an account?{' '}
          <Link
            href={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="text-yellow-400 hover:underline font-semibold"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="text-zinc-500 font-mono text-sm">Loading signup...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
