import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Person colors
        dana: {
          DEFAULT: "#C7E6A3",
          light: "#EAF5D8",
          dark: "#8DBF5A",
          text: "#3A6B1A",
        },
        jenny: {
          DEFAULT: "#D4A017",
          light: "#F5E8C0",
          dark: "#A07810",
          text: "#6B4E0A",
        },
        lia: {
          DEFAULT: "#E8A0A6",
          light: "#F7DCDE",
          dark: "#C45E67",
          text: "#7A2730",
        },
        ahuva: {
          DEFAULT: "#C9C3E6",
          light: "#EAE8F7",
          dark: "#8B82C4",
          text: "#3A3370",
        },
        // App colors
        surface: "#F7F5F2",
        card: "#FFFFFF",
        border: "#EBEBEB",
        muted: "#9B9B9B",
        heading: "#1A1A2E",
        body: "#4A4A6A",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.1)",
        soft: "0 1px 8px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
