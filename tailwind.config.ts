import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FDF8F0",
          50: "#FFFEF9",
          100: "#FDF8F0",
          200: "#F9EDD8",
          300: "#F4DEB8",
          400: "#EDCA8F",
          500: "#E4B15E",
        },
        blush: {
          DEFAULT: "#F4A7B9",
          50: "#FEF0F4",
          100: "#FDE2EA",
          200: "#FAC5D4",
          300: "#F7A8BE",
          400: "#F4A7B9",
          500: "#EF7A9A",
          600: "#E84D7A",
          700: "#D02F5F",
          800: "#A8234A",
          900: "#821B39",
        },
        sage: {
          DEFAULT: "#7FB685",
          50: "#EFF6F0",
          100: "#DDEEE0",
          200: "#BCDDC0",
          300: "#9ACBA0",
          400: "#7FB685",
          500: "#63A06A",
          600: "#4D8554",
          700: "#3A6640",
          800: "#294930",
          900: "#1A2E1E",
        },
        lavender: {
          DEFAULT: "#C9B8E8",
          50: "#F5F2FB",
          100: "#EBE5F7",
          200: "#D9CEEF",
          300: "#C9B8E8",
          400: "#B49DDC",
          500: "#9A7FCF",
          600: "#7F60C0",
          700: "#6547A8",
          800: "#4E3682",
          900: "#38265E",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
