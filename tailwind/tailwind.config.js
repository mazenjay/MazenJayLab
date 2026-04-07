/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../template.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#141414', muted: '#5c5c5c', faint: '#9a9a9a' },
        paper: { DEFAULT: '#faf7f2', raised: '#ffffff', line: '#e8e4dc' },
        accent: { DEFAULT: '#c45c3e', soft: '#f4e8e4', deep: '#8f3d28' },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
