/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");
const colors = require("tailwindcss/colors");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'text-[9px]',
    'text-xs',
    'text-sm',
    'text-base',
    'text-lg',
    'text-2xl',
    'leading-3',
    'leading-none',
    'leading-tight',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // withMT swaps Tailwind's default palette for Material's, so the
        // ramps the new design uses must be added back explicitly.
        slate: colors.slate,
        emerald: colors.emerald,
        amber: colors.amber,
        red: colors.red,
        // Brand primary: petrol teal (#0F766E). Material Tailwind components
        // render color="teal" through shades 400-600, so those steps carry the
        // brand; 700/800 hold the same values for plain utility classes.
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#14B8A6",
          500: "#0F766E",
          600: "#115E59",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        // The template used Material's blue-gray for nearly all text/borders;
        // mapping it to the slate ramp moves every existing color="blue-gray"
        // prop onto the new neutral palette without touching each page.
        "blue-gray": {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        scaleIn: "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
});
