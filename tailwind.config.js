/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./artifacts/blogs/*.html",
    "./artifacts/usecases/*.html"
  ],
  theme: {
    extend: {
      colors: {
        brand:  'var(--clr-accent)',
        brand2: 'var(--clr-accent2)',
        ink:    'var(--clr-text)',
        muted:  'var(--clr-muted)',
        panel:  'var(--clr-darker)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
