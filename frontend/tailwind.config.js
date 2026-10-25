/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0c0d0f',
          900: '#14161a',
          800: '#1c1f26',
          700: '#2a2f3a',
        },
        ivory: {
          DEFAULT: '#f4f1ea',
          muted: '#c9c4b8',
        },
        bronze: {
          DEFAULT: '#b08d57',
          bright: '#d4a574',
        },
        accent: {
          DEFAULT: '#c43c3c',
          soft: '#e85d5d',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(ellipse at 20% 0%, rgba(176,141,87,0.18), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(196,60,60,0.12), transparent 45%)',
      },
    },
  },
  plugins: [],
};
