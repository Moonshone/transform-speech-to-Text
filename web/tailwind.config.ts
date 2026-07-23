import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#172033",
        accent: {
          50: "#eef8ff",
          100: "#d9efff",
          500: "#1685d1",
          600: "#0872b9",
          700: "#075b94",
        },
      },
      boxShadow: {
        card: "0 18px 50px -24px rgba(23, 32, 51, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
