'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, GitCompare, Menu, X, ArrowUpRight } from 'lucide-react';
import { BenchleyLogo } from './Logo';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Test Runner', href: '/', icon: Zap },
    { label: 'Compare Runs', href: '/compare', icon: GitCompare },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 bg-black/80 text-white ${
        scrolled
          ? 'border-b border-white/[0.08] shadow-[0_1px_0_0_rgba(255,255,255,0.04)]'
          : 'border-b border-white/[0.04]'
      } backdrop-blur-xl`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative">
              <BenchleyLogo className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-[-0.01em] text-white">
                Benchley
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                Load
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 rounded-md ${
                    isActive
                      ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-xs text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span>k6 Engine Ready</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold bg-yellow-400 text-black hover:bg-yellow-300 transition-all duration-150 shadow-glow-sm active:scale-[0.98]"
          >
            New Test
            <Zap className="h-3.5 w-3.5 fill-current" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 -mr-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          mobileMenuOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-black/95 flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
