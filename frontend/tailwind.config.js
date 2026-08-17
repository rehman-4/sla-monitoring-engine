/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090d16',
          secondary: '#0e1422',
          tertiary: '#151d30',
          card: '#101728',
          hover: '#19233c',
        },
        border: {
          DEFAULT: '#1e293b',
          subtle: '#182234',
          accent: '#334155',
        },
        obsidian: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        status: {
          healthy: '#10b981',
          'healthy-glow': 'rgba(16, 185, 129, 0.2)',
          warning: '#f59e0b',
          'warning-glow': 'rgba(245, 158, 11, 0.2)',
          critical: '#ef4444',
          'critical-glow': 'rgba(239, 68, 68, 0.25)',
          info: '#06b6d4',
          'info-glow': 'rgba(6, 182, 212, 0.2)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-healthy': '0 0 15px -3px rgba(16, 185, 129, 0.3)',
        'glow-warning': '0 0 15px -3px rgba(245, 158, 11, 0.3)',
        'glow-critical': '0 0 20px -2px rgba(239, 68, 68, 0.4)',
        'glow-brand': '0 0 20px -3px rgba(99, 102, 241, 0.35)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'spin 4s linear infinite',
      }
    },
  },
  plugins: [],
}
