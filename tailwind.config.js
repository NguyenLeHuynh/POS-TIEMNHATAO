/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        matcha: { 50: '#f4f8f4', 500: '#557c55', 600: '#416241', 700: '#324d32' },
        coffee: { 500: '#a0522d', 700: '#6f371d' }
      }
    },
  },
  plugins: [],
}