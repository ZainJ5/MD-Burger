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
          50:  '#f4f5fb',
          100: '#e8eaf7',
          200: '#c9cfee',
          300: '#93a0dc',
          400: '#596cc9',
          500: '#33449b',
          600: '#28367b',
          700: '#1f2a60',
          800: '#182049',
          900: '#101632',
          950: '#0a0e1f',
        },
      },
    },
  },
  plugins: [],
};
