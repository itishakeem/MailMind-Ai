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
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        indigo: {
          950: "#1e1b4b",
          900: "#312e81",
          800: "#3730a3",
          700: "#4338ca",
          600: "#4f46e5",
          500: "#6366f1",
        },
        violet: {
          700: "#6d28d9",
          600: "#7c3aed",
          500: "#8b5cf6",
        },
        slate: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
        },
      },
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":     "linear-gradient(135deg, #0a0f1e 0%, #1e1b4b 50%, #0a0f1e 100%)",
        "brand-gradient":    "linear-gradient(135deg, #1e40af, #4f46e5, #7c3aed)",
        "sidebar-active":    "linear-gradient(90deg, rgba(37,99,235,0.18), rgba(79,70,229,0.18))",
      },
      animation: {
        "fade-in-up":     "fadeInUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in":        "fadeIn 0.45s ease-out forwards",
        "gradient-shift": "gradientShift 5s ease infinite",
        "float":          "float 7s ease-in-out infinite",
        "pulse-glow":     "pulseGlow 2.2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%":       { "background-position": "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-24px)" },
        },
        pulseGlow: {
          "0%, 100%": { "box-shadow": "0 0 0 0 rgba(79,70,229,0.45)" },
          "50%":       { "box-shadow": "0 0 0 14px rgba(79,70,229,0)" },
        },
      },
      boxShadow: {
        "brand-sm": "0 4px 14px 0 rgba(79,70,229,0.25)",
        "brand-md": "0 8px 30px 0 rgba(79,70,229,0.35)",
        "brand-lg": "0 16px 48px 0 rgba(79,70,229,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
