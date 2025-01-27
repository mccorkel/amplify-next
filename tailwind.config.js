/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "patriotic-blue": "#0E2A50",
        "patriotic-red": "#B72B2B",
        "patriotic-white": "#FFFFFF",
      },
      backgroundImage: {
        // Subtle diagonal stripes of red and white
        "subtle-stripes":
          "repeating-linear-gradient(45deg, #B72B2B 0, #B72B2B 10px, #FFFFFF 10px, #FFFFFF 20px)"
      },
    }
  },
  plugins: []
};