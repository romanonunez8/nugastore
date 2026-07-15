import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBF8F4",
        ink: "#211A2C",
        inkSoft: "#5B5266",
        marigold: "#E4A11B",
        marigoldDark: "#B87F12",
        teal: "#2F5D50",
        tealSoft: "#E4EEEA",
        berry: "#D63447",
        berrySoft: "#FBE4E7",
        whatsapp: "#25D366",
        line: "#E7E1D8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 2px 0 0 rgba(33,26,44,0.06), 0 10px 24px -12px rgba(33,26,44,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
