import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        iron: {
          950: "#0b0d10",
          900: "#12151a",
          800: "#1a1e25",
          700: "#252b34",
          600: "#374049",
          500: "#4e5966",
          400: "#6b7684",
          300: "#94a0ac",
          200: "#bcc4cc",
          100: "#dde1e5",
          50: "#f5f6f7",
        },
        copper: {
          400: "#e0a668",
          500: "#c9863f",
          600: "#a66a2c",
          700: "#835223",
        },
        moss: {
          400: "#7fc99a",
          500: "#4fa870",
          600: "#38835a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 50% 0%, rgba(201,134,63,0.14), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(201,134,63,0.18), 0 8px 40px -8px rgba(201,134,63,0.35)",
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 60px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
