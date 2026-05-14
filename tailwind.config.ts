import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
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
        cream: {
          DEFAULT: "#FDF8F0",
          50: "#FFFEF9",
          100: "#FDF8F0",
          200: "#F7EDDA",
          300: "#EFDFBF",
          400: "#E5CC9D",
          500: "#D4B47A",
        },
        honey: {
          DEFAULT: "#E8A44A",
          50: "#FFFBF0",
          100: "#FEF3D3",
          200: "#FCE4A3",
          300: "#F9CF6B",
          400: "#F5B83A",
          500: "#E8A44A",
          600: "#CC8A2E",
          700: "#A86E1C",
          800: "#84540F",
          900: "#623D06",
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
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
      },
      boxShadow: {
        "honey": "0 4px 24px -4px rgba(232, 164, 74, 0.25)",
        "honey-lg": "0 8px 32px -4px rgba(232, 164, 74, 0.35)",
        "soft": "0 2px 16px -2px rgba(0,0,0,0.06), 0 1px 4px -1px rgba(0,0,0,0.04)",
        "soft-lg": "0 8px 32px -4px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px -4px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 24px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.04)",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "60%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "progress-fill": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(var(--progress-value, -100%))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "tab-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-3px)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "sparkle-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(10px, -12px, 0) rotate(8deg)" },
        },
        "cute-pop": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "45%": { transform: "translateY(-4px) scale(1.04)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-right": "slide-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2s linear infinite",
        "progress-fill": "progress-fill 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 3s ease-in-out infinite",
        "tab-bounce": "tab-bounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-gentle": "pulse-gentle 2s ease-in-out infinite",
        "sparkle-drift": "sparkle-drift 5s ease-in-out infinite",
        "cute-pop": "cute-pop 2.5s ease-in-out infinite",
      },
      transitionDuration: {
        250: "250ms",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
