/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f3f4f8",
        "surface-bone": "#eef0f5",
        "surface-card": "#ffffff",
        "surface-dark": "#18181b",
        "surface-deep": "#0f0f11",
        "pastel-purple": "#e0d7ff",
        "pastel-green": "#d2f1e4",
        "pastel-yellow": "#fef0b3",
        "pastel-blue": "#d6e2e9",
        "pastel-pink": "#ffe4e6",
        ink: "#18181b",
        body: "#27272a",
        charcoal: "#52525b",
        mute: "#71717a",
        ash: "#a1a1aa",
        stone: "#d4d4d8",
        primary: {
          DEFAULT: "#ea2804",
          deep: "#c82203",
          glow: "#ff7056",
          pink: "#f43f5e",
        },
        badge: {
          success: "#10b981",
        },
        hairline: "rgba(24, 24, 27, 0.08)",
        "hairline-strong": "#18181b",
      },
      borderRadius: {
        full: "9999px",
        '3xl': '28px',
        '2xl': '20px',
        xl: '16px',
        lg: "14px",
        md: "10px",
        sm: "6px",
        xs: "4px",
      },
      fontFamily: {
        sans: ["Basier Square", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["rb-freigeist-neue", "Bricolage Grotesque", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
      },
      ringWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
