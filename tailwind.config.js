/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1E3A2B',
          dark: '#14271D',
        },
        moss: '#3E6B4F',
        wheat: '#C9962F',
        cream: '#F7F2E7',
        ink: '#1F2421',
        mist: '#6B756E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
