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
          // 500 and 400 were lightened from their original values (#4e5966,
          // #6b7684) - both fell short of WCAG AA against the app's dark
          // backgrounds (2.6-2.7:1 and 4.0-4.2:1 on iron-950/900, against a
          // 4.5:1 normal-text / 3:1 large-text-and-UI requirement), and
          // they're used throughout for real, meaningful text - build
          // timestamps, metric values, audit log entries - not decoration.
          // Same hue/saturation, just enough lighter to clear real
          // thresholds: 500 now 3.2-3.4:1 (large text/UI), 400 now
          // 4.7-5.0:1 (normal text).
          500: "#5b6776",
          400: "#748395",
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
