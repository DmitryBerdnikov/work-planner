import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        "accent-pink": "var(--color-accent-pink)",
        "accent-green": "var(--color-accent-green)",
        "accent-blue": "var(--color-accent-blue)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)"
      },
      borderRadius: {
        input: "14px",
        card: "16px",
        sheet: "24px"
      }
    }
  },
  plugins: []
} satisfies Config;

