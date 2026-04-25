/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ares: {
          50: "#f5f7fb",
          100: "#e5ebf3",
          500: "#3b5b8c",
          600: "#324c75",
          700: "#283d5e",
        },
      },
    },
  },
  plugins: [],
};
