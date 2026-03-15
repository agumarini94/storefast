/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   'var(--color-primary, #3B82F6)',
        secondary: 'var(--color-secondary, #F9FAFB)',
      },
      fontFamily: {
        main: ['var(--font-main, Inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
