'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import QuickTestForm from '@/components/QuickTestForm';
import RecentRunsTable from '@/components/RecentRunsTable';
import { useAuth } from '@/lib/auth-context';

export default function TestRunnerPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="space-y-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Test Runner</h1>
            {user && (
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Signed in as <span className="text-zinc-300">{user.name || user.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Test Configuration Form */}
        <div className="max-w-4xl">
          <QuickTestForm />
        </div>

        {/* Recent Test History */}
        <div className="max-w-5xl">
          <RecentRunsTable />
        </div>
      </div>
    </AuthGuard>
  );
}
