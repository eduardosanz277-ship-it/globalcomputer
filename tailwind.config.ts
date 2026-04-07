import type { Config } from "tailwindcss";

/**
 * Marca:
 * - Principal — Blue #357fd2 (primary, admin, focos)
 * - Secundario — Gray orange #b19655 (acentos cálidos, botones secondary, badges admin)
 * - Gray #6e7073 — texto muted; light gray #aeaeae — bordes / placeholders
 * - Fondo página (`background`) — gris más oscuro que el blanco puro para dar relieve a cards
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        roboto: ["var(--font-roboto)", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 24px -6px rgba(15, 23, 42, 0.07), 0 8px 28px -10px rgba(15, 23, 42, 0.06)",
        "soft-lg": "0 12px 48px -12px rgba(15, 23, 42, 0.12)",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1400px",
        },
      },
      colors: {
        border: "#d8d8d9",
        input: "#d8d8d9",
        ring: "#357fd2",
        /** Lienzo general: gris neutro (no blanco puro) para contraste con card/popover */
        background: "#e4e7ec",
        foreground: "#2a2c30",
        primary: {
          DEFAULT: "#357fd2",
          foreground: "#ffffff",
        },
        /** Secundario oficial: gray orange #b19655 */
        secondary: {
          DEFAULT: "#b19655",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(0 72.8% 50.6%)",
          foreground: "hsl(210 40% 98%)",
        },
        muted: {
          DEFAULT: "#eef0f4",
          foreground: "#6e7073",
        },
        /** Superficies suaves (hover outline/ghost); texto alineado al secundario */
        accent: {
          DEFAULT: "#efe9df",
          foreground: "#8a6d38",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#2a2c30",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#2a2c30",
        },
        brand: {
          gray: "#6e7073",
          "gray-light": "#aeaeae",
          /** Mismo hex que `secondary` (alias documentado) */
          secondary: "#b19655",
          /** Tono más oscuro solo si hace falta más contraste */
          "secondary-dark": "#a3812f",
          blue: "#357fd2",
          hero: {
            from: "#141820",
            via: "#1c2430",
            to: "#152a45",
          },
        },
        admin: {
          DEFAULT: "#357fd2",
          foreground: "#ffffff",
          muted: "#e8eef6",
          ring: "#357fd2",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      keyframes: {
        "slide-over-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-over-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-over-left-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-over-left-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(24px, -18px) scale(1.04)" },
          "66%": { transform: "translate(-16px, 12px) scale(0.97)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-over-in":
          "slide-over-in 0.38s cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-over-out":
          "slide-over-out 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "slide-over-left-in":
          "slide-over-left-in 0.38s cubic-bezier(0.2, 0.8, 0.2, 1)",
        "slide-over-left-out":
          "slide-over-left-out 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "fade-in": "fade-in 0.22s ease-out forwards",
        blob: "blob 20s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
