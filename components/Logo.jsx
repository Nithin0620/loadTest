'use client';

import React from 'react';

export function BenchleyLogo({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Workflow base container */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="#0a0a0a"
        stroke="#262626"
        strokeWidth="2"
      />
      {/* Workflow geometry trace */}
      <path
        d="M13 22 L24 46 L32 30 L40 46 L51 22"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
      />
      {/* Benchley high-speed pulse / lightning bolt in Yellow */}
      <path
        d="M36 14 L22 35 L32 35 L28 50 L44 27 L34 27 Z"
        fill="#facc15"
        stroke="#eab308"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default BenchleyLogo;
