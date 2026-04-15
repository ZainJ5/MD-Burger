/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50:  '#eef2fb',
          100: '#d5dfF5',
          200: '#adbfeb',
          300: '#7b97db',
          400: '#5572c9',
          500: '#3a56a6',
          600: '#2e4585',
          700: '#253669',
          800: '#1c2850',
          900: '#131c38',
          950: '#0b1121',
        },
      },
    },
  },
  plugins: [],
};
