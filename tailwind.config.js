/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/views/**/*.{hbs,html,js}",
    "./public/**/*.{html,js}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#111827',
          surface: '#1f2937',
          border: '#374151'
        }
      }
    },
  },
  plugins: [],
}

