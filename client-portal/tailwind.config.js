/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A365D",
          light: "#2B6CB0"
        },
        ink: "#2D3748",
        mist: "#F7FAFC",
        border: "#E2E8F0",
        amber: "#B7791F",
        rose: "#C53030"
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
