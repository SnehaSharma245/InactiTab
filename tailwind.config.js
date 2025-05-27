/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        modern: {
          primary: "#1e3a8a", // blue-900
          secondary: "#1e40af", // blue-800
          accent: "#3b82f6", // blue-500
          surface: "#f8fafc", // slate-50
          text: "#0f172a", // slate-900
        },
        dark: {
          base: "#0f172a", // slate-900
          surface: "#1e293b", // slate-800
          card: "#334155", // slate-700
          border: "rgba(59, 130, 246, 0.2)",
        },
      },
      backgroundImage: {
        "modern-gradient": "linear-gradient(135deg, #1e3a8a, #3b82f6)",
        "modern-gradient-hover": "linear-gradient(135deg, #1e40af, #60a5fa)",
        "surface-gradient":
          "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        "gradient-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(51, 65, 85, 0.5), rgba(30, 41, 59, 0.8))",
        "gradient-button": "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
        "gradient-hover": "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
        "gradient-shine":
          "linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.03) 50%, transparent 100%)",
      },
      fontFamily: {
        brand: ["Poppins", "sans-serif"],
        display: ["Inter", "system-ui"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};
