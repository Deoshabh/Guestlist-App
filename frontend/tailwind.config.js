module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb'
        },
        secondary: {
          DEFAULT: '#6b7280',
          dark: '#4b5563'
        }
      }
    },
  },
  plugins: [],
}
