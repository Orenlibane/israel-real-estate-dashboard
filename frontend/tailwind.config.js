/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9bff',
          400: '#1a7eff',
          500: '#0066e6',
          600: '#0052b3',
          700: '#003d80',
          800: '#00294d',
          900: '#00141a',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          dark: '#0f172a',
          darker: '#0a0f1a',
          card: '#1e293b',
          hover: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Rubik', 'system-ui', 'sans-serif'],
        hebrew: ['Rubik', 'Heebo', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        'neon': '0 0 20px rgba(0, 102, 230, 0.3)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      }
    },
  },
  plugins: [],
}
