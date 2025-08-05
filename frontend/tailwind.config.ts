/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
      spacing: {
        '0': 'var(--pp-space-0)',
        '1': 'var(--pp-space-1)',
        '2': 'var(--pp-space-2)',
        '3': 'var(--pp-space-3)',
        '4': 'var(--pp-space-4)',
        '5': 'var(--pp-space-5)',
        '6': 'var(--pp-space-6)',
        '8': 'var(--pp-space-8)',
        '10': 'var(--pp-space-10)',
        '12': 'var(--pp-space-12)',
        '16': 'var(--pp-space-16)',
        '20': 'var(--pp-space-20)',
      },
      fontSize: {
        'xs': 'var(--pp-font-size-xs)',
        'sm': 'var(--pp-font-size-sm)',
        'base': 'var(--pp-font-size-md)',
        'lg': 'var(--pp-font-size-lg)',
        'xl': 'var(--pp-font-size-xl)',
        '2xl': 'var(--pp-font-size-2xl)',
        '3xl': 'var(--pp-font-size-3xl)',
        '4xl': 'var(--pp-font-size-4xl)',
      },
      fontWeight: {
        'normal': 'var(--pp-font-weight-normal)',
        'medium': 'var(--pp-font-weight-medium)',
        'semibold': 'var(--pp-font-weight-semibold)',
        'bold': 'var(--pp-font-weight-bold)',
      },
      lineHeight: {
        'tight': 'var(--pp-line-height-tight)',
        'normal': 'var(--pp-line-height-normal)',
        'relaxed': 'var(--pp-line-height-relaxed)',
      },
      borderRadius: {
        'none': 'var(--pp-radius-none)',
        'sm': 'var(--pp-radius-sm)',
        'DEFAULT': 'var(--pp-radius-md)',
        'md': 'var(--pp-radius-md)',
        'lg': 'var(--pp-radius-lg)',
        'xl': 'var(--pp-radius-xl)',
        '2xl': 'var(--pp-radius-2xl)',
        'full': 'var(--pp-radius-full)',
      },
      boxShadow: {
        'sm': 'var(--pp-shadow-sm)',
        'DEFAULT': 'var(--pp-shadow-md)',
        'md': 'var(--pp-shadow-md)',
        'lg': 'var(--pp-shadow-lg)',
        'xl': 'var(--pp-shadow-xl)',
      },
      colors: {
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
        // Pipeline Pulse specific colors
        'pp-primary': {
          50: 'var(--pp-color-primary-50)',
          100: 'var(--pp-color-primary-100)',
          500: 'var(--pp-color-primary-500)',
          600: 'var(--pp-color-primary-600)',
          900: 'var(--pp-color-primary-900)',
        },
        'pp-success': {
          50: 'var(--pp-color-success-50)',
          500: 'var(--pp-color-success-500)',
          600: 'var(--pp-color-success-600)',
        },
        'pp-warning': {
          50: 'var(--pp-color-warning-50)',
          500: 'var(--pp-color-warning-500)',
          600: 'var(--pp-color-warning-600)',
        },
        'pp-danger': {
          50: 'var(--pp-color-danger-50)',
          500: 'var(--pp-color-danger-500)',
          600: 'var(--pp-color-danger-600)',
        },
        'pp-neutral': {
          50: 'var(--pp-color-neutral-50)',
          100: 'var(--pp-color-neutral-100)',
          500: 'var(--pp-color-neutral-500)',
          600: 'var(--pp-color-neutral-600)',
          900: 'var(--pp-color-neutral-900)',
        },
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;