/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#dc2626',
        'primary-dark': '#991b1b',
        accent: '#f97316',
        neutral: '#1f2937'
      }
    }
  },
  plugins: []
};
