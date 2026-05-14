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
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        honey: {
          DEFAULT: "#F59E0B",
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        cream: {
          DEFAULT: "#FDF8F0",
          50:  "#FFFEF9",
          100: "#FDF8F0",
          200: "#F9EDD8",
          300: "#F4DEB8",
          400: "#EDCA8F",
          500: "#E4B15E",
        },
        sage: {
          DEFAULT: "#7FB685",
          50:  "#EFF6F0",
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
        bark: {
          DEFAULT: "#633806",
          light: "#854F0B",
          dark:  "#412402",
        },
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        xl:  "20px",
        "2xl": "24px",
      },
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)",    "Georgia",   "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "wobble": {
          "0%,100%": { transform: "rotate(-4deg)" },
          "50%":     { transform: "rotate(4deg)" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-10px)" },
        },
        "progress-fill": {
          from: { width: "0%" },
        },
        "count-up": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "bar-rise": {
          from: { transform: "scaleY(0)", transformOrigin: "bottom" },
          to:   { transform: "scaleY(1)", transformOrigin: "bottom" },
        },
        "spring-in": {
          "0%":   { opacity: "0", transform: "scale(0.9) translateY(8px)" },
          "70%":  { transform: "scale(1.02) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 0.5s ease both",
        "fade-in":        "fade-in 0.4s ease both",
        "slide-in":       "slide-in 0.35s ease both",
        "scale-in":       "scale-in 0.3s ease both",
        "wobble":         "wobble 4s ease-in-out infinite",
        "float":          "float 3s ease-in-out infinite",
        "progress-fill":  "progress-fill 1s cubic-bezier(0.34,1.56,0.64,1) both",
        "bar-rise":       "bar-rise 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
        "spring-in":      "spring-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
