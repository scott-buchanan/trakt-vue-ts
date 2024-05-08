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
    },
  },
  variants: {
    extend: {},
  },
  plugins: [typography, forms, aspectRatio],
};
