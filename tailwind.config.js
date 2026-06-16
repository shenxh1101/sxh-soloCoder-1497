/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        rose: {
          50: '#FDF8F5',
          100: '#F9EDE8',
          200: '#F2D8D0',
          300: '#E8BFB4',
          400: '#D4A5A5',
          500: '#C28B8B',
          600: '#A67070',
          700: '#875757',
          800: '#694040',
          900: '#4A2E2E',
        },
        sage: {
          50: '#F5F7F2',
          100: '#E8EDE2',
          200: '#D1DBC5',
          300: '#B5C4A3',
          400: '#9CAF88',
          500: '#84996D',
          600: '#6B7D56',
          700: '#556244',
          800: '#404A33',
          900: '#2E3426',
        },
        cream: {
          50: '#FDFCF9',
          100: '#FAF7F0',
          200: '#F5EEDF',
          300: '#F0E3CA',
          400: '#E8D4A8',
          500: '#D9BE82',
        },
        warm: {
          50: '#FDF8F5',
          100: '#F9EDE8',
          200: '#F2D8D0',
          300: '#E8BFB4',
          400: '#D4A5A5',
          500: '#C28B8B',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 30px -4px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 12px -2px rgba(212, 165, 165, 0.15)',
      },
      borderRadius: {
        'xl2': '14px',
        '3xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
