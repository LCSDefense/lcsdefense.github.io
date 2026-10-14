/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A6B',
        gold: '#C9A227',
        'light-gray': '#F4F4F4',
      },
    },
  },
  plugins: [],
};
