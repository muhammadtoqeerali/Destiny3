/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          50: '#F4F7FB',
          100: '#E6EDF5',
          200: '#C9D9E8',
          500: '#48719E',
          700: '#1D4570',
          800: '#102E4E',
          900: '#0B2038',
        },
        ntnu: {
          blue: '#00509E',
          dark: '#002F6C',
          light: '#E1EDF7',
        }
      }
    },
  },
  plugins: [],
}