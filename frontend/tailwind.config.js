/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        // Base system colors (existing)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Enhanced Pipeline Pulse brand colors
        primary: {
          DEFAULT: "hsl(var(--pp-primary))",
          foreground: "hsl(var(--pp-primary-foreground))",
          dark: "hsl(var(--pp-primary-dark))",
          light: "hsl(var(--pp-primary-light))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--pp-destructive))",
          foreground: "hsl(var(--pp-destructive-foreground))",
          light: "hsl(var(--pp-destructive-light))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--pp-muted))",
          foreground: "hsl(var(--pp-muted-foreground))",
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

        // Business Intelligence colors
        success: {
          DEFAULT: "hsl(var(--pp-success))",
          foreground: "hsl(var(--pp-success-foreground))",
          light: "hsl(var(--pp-success-light))",
        },
        
        warning: {
          DEFAULT: "hsl(var(--pp-warning))",
          foreground: "hsl(var(--pp-warning-foreground))",
          light: "hsl(var(--pp-warning-light))",
        },
        
        // Pipeline Pulse business context colors
        revenue: "hsl(var(--pp-revenue))",
        pipeline: "hsl(var(--pp-pipeline))",
        opportunity: "hsl(var(--pp-opportunity))",
        risk: "hsl(var(--pp-risk))",
        forecast: "hsl(var(--pp-forecast))",

        // Navigation domain colors
        "nav-intelligence": "hsl(var(--pp-nav-intelligence))",
        "nav-o2r": "hsl(var(--pp-nav-o2r))",
        "nav-analytics": "hsl(var(--pp-nav-analytics))",
        "nav-data": "hsl(var(--pp-nav-data))",
        "nav-crm": "hsl(var(--pp-nav-crm))",
        "nav-workflow": "hsl(var(--pp-nav-workflow))",
        "nav-admin": "hsl(var(--pp-nav-admin))",
      },
      
      borderRadius: {
        lg: "var(--pp-radius-lg)",
        md: "var(--pp-radius-md)",
        sm: "var(--pp-radius-sm)",
        DEFAULT: "var(--pp-radius)",
        xl: "var(--pp-radius-xl)",
        "2xl": "var(--pp-radius-2xl)",
        full: "var(--pp-radius-full)",
      },
      
      fontSize: {
        xs: ["var(--pp-text-xs)", { lineHeight: "var(--pp-leading-normal)" }],
        sm: ["var(--pp-text-sm)", { lineHeight: "var(--pp-leading-normal)" }],
        base: ["var(--pp-text-base)", { lineHeight: "var(--pp-leading-normal)" }],
        lg: ["var(--pp-text-lg)", { lineHeight: "var(--pp-leading-relaxed)" }],
        xl: ["var(--pp-text-xl)", { lineHeight: "var(--pp-leading-snug)" }],
        "2xl": ["var(--pp-text-2xl)", { lineHeight: "var(--pp-leading-snug)" }],
        "3xl": ["var(--pp-text-3xl)", { lineHeight: "var(--pp-leading-tight)" }],
        "4xl": ["var(--pp-text-4xl)", { lineHeight: "var(--pp-leading-tight)" }],
        "5xl": ["var(--pp-text-5xl)", { lineHeight: "var(--pp-leading-tight)" }],
      },
      
      fontWeight: {
        light: "var(--pp-font-weight-light)",
        normal: "var(--pp-font-weight-normal)",
        medium: "var(--pp-font-weight-medium)",
        semibold: "var(--pp-font-weight-semibold)",
        bold: "var(--pp-font-weight-bold)",
        extrabold: "var(--pp-font-weight-extrabold)",
      },
      
      lineHeight: {
        tight: "var(--pp-leading-tight)",
        snug: "var(--pp-leading-snug)",
        normal: "var(--pp-leading-normal)",
        relaxed: "var(--pp-leading-relaxed)",
        loose: "var(--pp-leading-loose)",
      },
      
      spacing: {
        px: "var(--pp-space-px)",
        0: "var(--pp-space-0)",
        1: "var(--pp-space-1)",
        2: "var(--pp-space-2)",
        3: "var(--pp-space-3)",
        4: "var(--pp-space-4)",
        5: "var(--pp-space-5)",
        6: "var(--pp-space-6)",
        8: "var(--pp-space-8)",
        10: "var(--pp-space-10)",
        12: "var(--pp-space-12)",
        16: "var(--pp-space-16)",
        20: "var(--pp-space-20)",
        24: "var(--pp-space-24)",
      },
      
      boxShadow: {
        sm: "var(--pp-shadow-sm)",
        DEFAULT: "var(--pp-shadow)",
        md: "var(--pp-shadow-md)",
        lg: "var(--pp-shadow-lg)",
        xl: "var(--pp-shadow-xl)",
        "2xl": "var(--pp-shadow-2xl)",
        card: "var(--pp-shadow-card)",
        modal: "var(--pp-shadow-modal)",
        dropdown: "var(--pp-shadow-dropdown)",
        tooltip: "var(--pp-shadow-tooltip)",
      },
      
      transitionDuration: {
        fast: "var(--pp-duration-fast)",
        normal: "var(--pp-duration-normal)",
        slow: "var(--pp-duration-slow)",
      },
      
      transitionTimingFunction: {
        'ease-in': "var(--pp-ease-in)",
        'ease-out': "var(--pp-ease-out)",
        'ease-in-out': "var(--pp-ease-in-out)",
        'bounce': "var(--pp-ease-bounce)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pp-shimmer": {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
        "pp-fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pp-scale-in": {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pp-shimmer": "pp-shimmer 1.5s infinite",
        "pp-fade-in": "pp-fade-in 0.3s ease-out",
        "pp-scale-in": "pp-scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities, addComponents }) {
      // Add Pipeline Pulse utility classes
      addUtilities({
        '.pp-hover-lift': {
          transition: 'transform var(--pp-duration-normal) var(--pp-ease-out), box-shadow var(--pp-duration-normal) var(--pp-ease-out)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--pp-shadow-lg)',
          },
        },
        '.pp-loading': {
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            animation: 'pp-shimmer 1.5s infinite',
          },
        },
        '.pp-metric-text': {
          fontVariantNumeric: 'tabular-nums',
        },
      });

      // Add Pipeline Pulse component classes
      addComponents({
        '.pp-heading-hero': {
          fontSize: 'var(--pp-text-4xl)',
          fontWeight: 'var(--pp-font-weight-bold)',
          lineHeight: 'var(--pp-leading-tight)',
          letterSpacing: '-0.025em',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-heading-page': {
          fontSize: 'var(--pp-text-3xl)',
          fontWeight: 'var(--pp-font-weight-bold)',
          lineHeight: 'var(--pp-leading-tight)',
          letterSpacing: '-0.025em',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-heading-section': {
          fontSize: 'var(--pp-text-2xl)',
          fontWeight: 'var(--pp-font-weight-semibold)',
          lineHeight: 'var(--pp-leading-snug)',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-heading-card': {
          fontSize: 'var(--pp-text-xl)',
          fontWeight: 'var(--pp-font-weight-semibold)',
          lineHeight: 'var(--pp-leading-snug)',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-body-large': {
          fontSize: 'var(--pp-text-lg)',
          fontWeight: 'var(--pp-font-weight-normal)',
          lineHeight: 'var(--pp-leading-relaxed)',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-body': {
          fontSize: 'var(--pp-text-base)',
          fontWeight: 'var(--pp-font-weight-normal)',
          lineHeight: 'var(--pp-leading-normal)',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-body-small': {
          fontSize: 'var(--pp-text-sm)',
          fontWeight: 'var(--pp-font-weight-normal)',
          lineHeight: 'var(--pp-leading-normal)',
          color: 'hsl(var(--pp-muted-foreground))',
        },
        
        '.pp-metric-large': {
          fontSize: 'var(--pp-text-4xl)',
          fontWeight: 'var(--pp-font-weight-bold)',
          lineHeight: 'var(--pp-leading-tight)',
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-metric': {
          fontSize: 'var(--pp-text-2xl)',
          fontWeight: 'var(--pp-font-weight-bold)',
          lineHeight: 'var(--pp-leading-tight)',
          fontVariantNumeric: 'tabular-nums',
          color: 'hsl(var(--pp-foreground))',
        },
        
        '.pp-caption': {
          fontSize: 'var(--pp-text-xs)',
          fontWeight: 'var(--pp-font-weight-medium)',
          lineHeight: 'var(--pp-leading-normal)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--pp-muted-foreground))',
        },
        
        '.pp-page': {
          padding: 'var(--pp-space-page-padding)',
          maxWidth: '1400px',
          margin: '0 auto',
        },
        
        '.pp-grid': {
          display: 'grid',
          gap: 'var(--pp-space-6)',
        },
        
        '.pp-grid-2': {
          gridTemplateColumns: 'repeat(2, 1fr)',
        },
        
        '.pp-grid-3': {
          gridTemplateColumns: 'repeat(3, 1fr)',
        },
        
        '.pp-grid-4': {
          gridTemplateColumns: 'repeat(4, 1fr)',
        },
        
        '.pp-grid-responsive-2': {
          gridTemplateColumns: '1fr',
          '@media (min-width: 768px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
        },
        
        '.pp-grid-responsive-3': {
          gridTemplateColumns: '1fr',
          '@media (min-width: 768px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@media (min-width: 1024px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
        },
      });
    },
  ],
}