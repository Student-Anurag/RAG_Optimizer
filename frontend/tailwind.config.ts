import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: 'class',
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config