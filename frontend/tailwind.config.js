/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F9F8",
        surface: "#FFFFFF",
        ink: "#12211E",
        teal: { DEFAULT: "#0E6B63", deep: "#0A4A45", light: "#E4EDEB" },
        coral: { DEFAULT: "#F2543D", deep: "#D6402C" },
        gold: "#D9A441",
        mist: "#E4EDEB",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18,33,30,0.04), 0 8px 24px rgba(18,33,30,0.06)",
        card: "0 1px 2px rgba(18,33,30,0.05), 0 12px 32px rgba(18,33,30,0.08)",
      },
      keyframes: {
        scanRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.5" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
      },
      animation: {
        scanRing: "scanRing 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
