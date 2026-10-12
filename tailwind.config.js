/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mesma identidade da DDS Inovação: azul elétrico sobre azul-marinho.
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#b5d8ff",
          300: "#8ec5ff",
          400: "#399cff",
          500: "#1a6fe0",
          600: "#1667d6",
          700: "#1252b0",
          800: "#123f80",
          900: "#0f2f5c",
        },
        navy: {
          950: "#070d1a",
          900: "#0b1426",
          800: "#101b30",
          700: "#172540",
          600: "#243552",
        },
        ink: { DEFAULT: "#0b1426", soft: "#3b4a66", muted: "#5b6b8c" },
        cyan: { glow: "#66e0ff" },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Manrope", "'DM Sans'", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,20,38,.04), 0 8px 24px -12px rgba(11,20,38,.12)",
        lift: "0 2px 4px rgba(11,20,38,.04), 0 24px 48px -20px rgba(11,20,38,.28)",
        glow: "0 0 0 1px rgba(57,156,255,.35), 0 12px 40px -8px rgba(57,156,255,.55)",
      },
    },
  },
  plugins: [],
};
