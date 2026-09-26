import type { Config } from "tailwindcss";

// Tokens extraídos de spec-tecnica.md — identidade visual da IP Ebenézer Taubaté
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A6648", // Verde Primário
          dark: "#0F3D2A", // Verde Escuro
          light: "#E8F4EE",
        },
        bg: "#F7F7F5",
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#555555",
          soft: "#9B9B9B",
        },
        border: "#E8E8E6",
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
