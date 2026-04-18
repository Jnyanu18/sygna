/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "#0a0a0f",
        panel: "#12121a",
        item: "#1a1a28",
        line: "#1e1e2e",
        purple: {
          DEFAULT: "#7c3aed",
          dim: "#4c1d95",
        },
        sygna: {
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
          blue: "#3b82f6",
          main: "#e2e8f0",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "stage-active": "0 0 12px rgba(124, 58, 237, 0.6)",
      },
    },
  },
  plugins: [],
};
