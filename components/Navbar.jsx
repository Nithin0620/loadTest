'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Activity, GitCompare, Compass, Database } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Launch Test', href: '/', icon: Zap },
    { name: 'Compare Runs', href: '/compare', icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-950/80 border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-black text-lg shadow-glow-sm group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5 font-mono">
                LOAD<span className="text-yellow-400">CHECK</span>
              </span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">
                k6 load engine
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-dark-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-dark-850 border border-dark-700 text-xs text-zinc-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>DB Online</span>
          </div>

          <a
            href="https://k6.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-colors shadow-glow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            k6 Engine
          </a>
        </div>
      </div>
    </header>
  );
}
