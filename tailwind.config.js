/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF0000',
          dark: '#CC0000',
        },
        secondary: {
          DEFAULT: '#000000',
          light: '#333333',
        }
      }
    },
  },
  plugins: [],
};