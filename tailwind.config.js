/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050505',
          900: '#0a0a0c',
          850: '#111115',
          800: '#18181f',
          700: '#23232c',
          600: '#32323e',
        },
        yellow: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          glow: '#ffe600',
        },
        cyber: {
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(250, 204, 21, 0.2)',
        'glow': '0 0 20px rgba(250, 204, 21, 0.25)',
        'glow-lg': '0 0 35px rgba(250, 204, 21, 0.35)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.25)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(250, 204, 21, 0.45)' },
        }
      }
    },
  },
  plugins: [],
};
