/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#7dd3fc',
          500: '#60a5fa',
          600: '#60a5fa',
          700: '#3b82f6',
          800: '#2563eb',
          900: '#1d4ed8',
          950: '#172554',
        },
      },
    },
  },
  plugins: [],
};
