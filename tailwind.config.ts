import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#060505",
          lime: "#CAE51B",
          mint: "#86D6C9",
          lavender: "#D9B9F2",
          neutral: "#FAFAFA",
          gray: "#212121",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(6,5,5,0.06)",
        md: "0 4px 12px rgba(6,5,5,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
