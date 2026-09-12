/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Brand colours ────────────────────────────────────────────────────────
      colors: {
        kisan: {
          50:  '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        earth: {
          50:  '#fdf8f0', 100: '#faecd8', 200: '#f5d8ac', 300: '#eebe76',
          400: '#e6a043', 500: '#d4861e', 600: '#b86a15', 700: '#964f14',
          800: '#7a3f17', 900: '#633415',
        },
        sky: {
          400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7',
        },
        // Semantic gradient stops exposed as colours
        dawn:   '#e07b54',
        dusk:   '#c0392b',
      },

      // ── Radius scale (sm / md / lg / xl / 2xl / full) ─────────────────────
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'24px',
        '3xl':'32px',
      },

      // ── Elevation shadow scale ─────────────────────────────────────────────
      // Each level = soft ambient shadow (large, low opacity) + tight contact shadow
      boxShadow: {
        // Level 0 — just a border-like ring
        'elev-0': '0 0 0 1px rgba(0,0,0,0.06)',
        // Level 1 — card resting on surface
        'elev-1': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        // Level 2 — hovered card / floating pill
        'elev-2': '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.07)',
        // Level 3 — modal / dropdown
        'elev-3': '0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.09)',
        // Level 4 — full-screen overlay card
        'elev-4': '0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)',
        // Dark-mode variants (lighter base, more subtle)
        'elev-1-dark': '0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20)',
        'elev-2-dark': '0 4px 16px rgba(0,0,0,0.40), 0 2px 6px rgba(0,0,0,0.25)',
        'elev-3-dark': '0 12px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.30)',
        // Glow variants for status indicators
        'glow-green':  '0 0 0 1px rgba(22,163,74,0.3),  0 4px 20px rgba(22,163,74,0.25)',
        'glow-amber':  '0 0 0 1px rgba(217,119,6,0.3),  0 4px 20px rgba(217,119,6,0.20)',
        'glow-red':    '0 0 0 1px rgba(220,38,38,0.3),  0 4px 20px rgba(220,38,38,0.22)',
        'glow-blue':   '0 0 0 1px rgba(14,165,233,0.3), 0 4px 20px rgba(14,165,233,0.20)',
        // Inner glow for buttons on hover
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.08)',
      },

      // ── Background gradients exposed as backgroundImage tokens ────────────
      backgroundImage: {
        // Primary button gradient
        'btn-primary':  'linear-gradient(135deg, #22c55e 0%, #16a34a 60%, #15803d 100%)',
        'btn-primary-h':'linear-gradient(135deg, #4ade80 0%, #22c55e 60%, #16a34a 100%)',
        // Warning / amber
        'btn-warn':     'linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)',
        // Danger / red
        'btn-danger':   'linear-gradient(135deg, #f87171 0%, #ef4444 60%, #dc2626 100%)',
        // Card header — healthy state
        'grad-health':  'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
        'grad-health-d':'linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(20,83,45,0.08) 100%)',
        // Card header — weather / sky
        'grad-sky':     'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #dbeafe 100%)',
        'grad-sky-d':   'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(30,58,138,0.08) 100%)',
        // Card header — market / earth
        'grad-market':  'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        'grad-market-d':'linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(99,52,21,0.08) 100%)',
        // Card header — warning / pest
        'grad-warn':    'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        'grad-warn-d':  'linear-gradient(135deg, rgba(234,88,12,0.12) 0%, rgba(99,52,21,0.08) 100%)',
        // Hero subtle grain overlay (pure CSS, no external asset)
        'noise':        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans:       ['"Inter"', 'system-ui', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Mangal"', 'serif'],
        mono:       ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        // Existing
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        wave: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        raindrop: {
          '0%':   { transform: 'translateY(-20px) translateX(0)', opacity: '0' },
          '10%':  { opacity: '0.7' },
          '90%':  { opacity: '0.5' },
          '100%': { transform: 'translateY(110vh) translateX(-30px)', opacity: '0' },
        },
        pulse_soft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        spin_slow: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // New
        // Gentle horizontal sway for crop stalks (CSS fallback)
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
        // Card entrance — fade up
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Scale pop — icon state change
        pop: {
          '0%':   { transform: 'scale(1)' },
          '45%':  { transform: 'scale(1.25)' },
          '65%':  { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        // Lightning flash overlay
        lightning: {
          '0%, 89%, 91%, 94%, 100%': { opacity: '0' },
          '90%, 93%':                { opacity: '0.18' },
        },
        // Sunrise/sunset horizontal sky shift
        skyshift: {
          '0%':   { opacity: '0' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // Glow pulse for fireflies / bees
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 4px 2px currentColor', opacity: '0.6' },
          '50%':      { boxShadow: '0 0 12px 6px currentColor', opacity: '1' },
        },
        // Stagger helper — used as CSS delay shorthand
        staggerFade: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        shimmer:    'shimmer 2s linear infinite',
        float:      'float 4s ease-in-out infinite',
        wave:       'wave 3s linear infinite',
        raindrop:   'raindrop 1.5s linear infinite',
        pulse_soft: 'pulse_soft 2s ease-in-out infinite',
        ticker:     'ticker 20s linear infinite',
        spin_slow:  'spin_slow 8s linear infinite',
        // New
        sway:       'sway 3s ease-in-out infinite',
        'fade-up':  'fadeUp 0.4s ease-out both',
        pop:        'pop 0.35s ease-out',
        lightning:  'lightning 6s ease-in-out infinite',
        'glow-pulse':'glowPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
