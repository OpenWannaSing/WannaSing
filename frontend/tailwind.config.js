/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6C63FF",
        secondary: "#00F2FE",
        background: "#121212",
        surface: "#1E1E1E",
        warning: "#FF7A00",
        error: "#FF4D4D",
        'text-primary': "#FFFFFF",
        'text-secondary': "#B0B0B0",
      },
      fontFamily: {
        poppins: ["'Poppins'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      animation: {
        "gradient-shift": "gradientShift 8s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
