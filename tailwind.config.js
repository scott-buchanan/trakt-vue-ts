import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import aspectRatio from "@tailwindcss/aspect-ratio";

// tailwind.config.js
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: '"Inter Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      display: ['"Inter Variable", sans-serif'],
    },
    extend: {
      colors: {
        pprimary: "#fca311",
        "dark-list": "#a7a7a7",
        imdb: "#F5C518",
        trakt: "#ed1c24",
      },
      screens: {
        "3xl": "2561px",
      },
      keyframes: {
        animateBgPulse: {
          "0%": { opacity: 0 },
          "50%": { opacity: 0.15 },
          "100%": { opacity: 0 },
        },
      },
      animation: {
        "bg-pulse": "animateBgPulse 2s ease-in-out infinite",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [typography, forms, aspectRatio],
};
