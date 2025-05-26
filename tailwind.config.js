/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f8f9fa",
          100: "#e9ecef",
          500: "#3498db",
          600: "#2980b9",
          700: "#2471a3",
          900: "#2c3e50",
        },
        danger: {
          500: "#e74c3c",
          600: "#c0392b",
        },
        success: {
          500: "#27ae60",
          600: "#229954",
        },
        dark: {
          bg: "#1a1a1a",
          card: "#2d2d2d",
          input: "#333333",
          border: "#404040",
          hover: "#3a3a3a",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        shimmer: "shimmer 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
      },
      boxShadow: {
        primary: "0 4px 12px rgba(52, 152, 219, 0.3)",
        danger: "0 4px 12px rgba(231, 76, 60, 0.3)",
        success: "0 4px 12px rgba(39, 174, 96, 0.3)",
        soft: "0 2px 8px rgba(0, 0, 0, 0.1)",
        strong: "0 8px 32px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
};
