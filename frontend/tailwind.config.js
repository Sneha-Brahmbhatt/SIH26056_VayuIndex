/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A192F',
          800: '#1E3A8A',
          700: '#1E293B',
          600: '#334155',
        },
        accent: {
          blue: '#2563EB',
          light: '#3B82F6',
          muted: '#93C5FD',
        }
      }
    },
  },
  plugins: [],
}
