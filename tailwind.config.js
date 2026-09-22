/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2f6fed",
          600: "#2559c9",
          700: "#1d47a3",
        },
      },
    },
  },
  plugins: [],
};
