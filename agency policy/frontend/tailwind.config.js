/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          page: '#0A0A0A',
          card: '#121212',
          hover: '#1A1A1A',
        },
        border: {
          default: '#27272A',
          focus: '#52525B',
        },
        accent: {
          primary: '#E4E4E7',
          success: '#10B981',
          warning: '#F59E0B',
          destructive: '#EF4444',
        },
        chart: {
          1: '#FFFFFF',
          2: '#71717A',
          3: '#3F3F46',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
