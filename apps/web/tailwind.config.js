/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      colors: {
        night: {
          950: "#05070c",
          900: "#0a0f18",
          850: "#0d1422",
          800: "#111a2a",
          700: "#1a2740",
        },
        accent: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          rose: "#fb7185",
          lime: "#bef264",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 211, 238, 0.15)",
        card: "0 8px 32px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
