'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  GitCompare,
  Menu,
  X,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  Info,
} from 'lucide-react';
import { BenchleyLogo } from './Logo';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const workflowUrl = process.env.NEXT_PUBLIC_WORKFLOW_URL || 'https://workflow.ssh.net.in';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Test Runner', href: '/test-runner', icon: Zap },
    { label: 'Compare Runs', href: '/compare', icon: GitCompare },
    { label: 'About Benchley', href: '/benchley', icon: Info },
  ];

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

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

        {/* Desktop CTA & Auth */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-xs text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span>k6 Engine Ready</span>
          </div>

          <Link
            href="/test-runner"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold bg-yellow-400 text-black hover:bg-yellow-300 transition-all duration-150 shadow-glow-sm active:scale-[0.98]"
          >
            New Test
            <Zap className="h-3.5 w-3.5 fill-current" />
          </Link>

          {/* User Profile / Login Buttons */}
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all text-xs font-mono text-zinc-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center text-[10px]">
                      {getInitials(user.name, user.email)}
                    </div>
                    <span className="max-w-[120px] truncate font-medium">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.1] bg-black/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>

                      <a
                        href={workflowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutGrid className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Workflow Workspace</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-white/[0.1]">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </>
          )}
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
          mobileMenuOpen ? 'max-h-[360px] opacity-100' : 'max-h-0 opacity-0'
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

          <div className="pt-2 mt-2 border-t border-white/[0.08]">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-1.5 text-xs font-mono text-zinc-400">
                  Logged in as <span className="text-white font-semibold">{user.name || user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono text-red-400 bg-red-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-xs font-mono font-medium bg-white/[0.06] text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg text-xs font-mono font-bold bg-yellow-400 text-black"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
