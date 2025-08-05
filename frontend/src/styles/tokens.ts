/**
 * Design Tokens for Pipeline Pulse
 * This file is the single source of truth for all design-related constants.
 */

export const colors = {
  primary: 'hsl(var(--pp-primary))',
  primaryForeground: 'hsl(var(--pp-primary-foreground))',
  primaryDark: 'hsl(var(--pp-primary-dark))',
  primaryLight: 'hsl(var(--pp-primary-light))',

  success: 'hsl(var(--pp-success))',
  successForeground: 'hsl(var(--pp-success-foreground))',
  successLight: 'hsl(var(--pp-success-light))',

  warning: 'hsl(var(--pp-warning))',
  warningForeground: 'hsl(var(--pp-warning-foreground))',
  warningLight: 'hsl(var(--pp-warning-light))',

  destructive: 'hsl(var(--pp-destructive))',
  destructiveForeground: 'hsl(var(--pp-destructive-foreground))',
  destructiveLight: 'hsl(var(--pp-destructive-light))',

  background: 'hsl(var(--pp-background))',
  foreground: 'hsl(var(--pp-foreground))',
  muted: 'hsl(var(--pp-muted))',
  mutedForeground: 'hsl(var(--pp-muted-foreground))',
  border: 'hsl(var(--pp-border))',
  input: 'hsl(var(--pp-input))',
  ring: 'hsl(var(--pp-ring))',

  revenue: 'hsl(var(--pp-revenue))',
  pipeline: 'hsl(var(--pp-pipeline))',
  opportunity: 'hsl(var(--pp-opportunity))',
  risk: 'hsl(var(--pp-risk))',
  forecast: 'hsl(var(--pp-forecast))',

  // Navigation Domain Colors (mapped to new palette)
  navIntelligence: 'hsl(var(--pp-nav-intelligence))',
  navO2r: 'hsl(var(--pp-nav-o2r))',
  navAnalytics: 'hsl(var(--pp-nav-analytics))',
  navData: 'hsl(var(--pp-nav-data))',
  navCrm: 'hsl(var(--pp-nav-crm))',
  navWorkflow: 'hsl(var(--pp-nav-workflow))',
  navAdmin: 'hsl(var(--pp-nav-admin))',
} as const;

export const typography = {
  fonts: {
    sans: 'var(--pp-font-sans)',
    mono: 'var(--pp-font-mono)',
  },
  fontSizes: {
    '2xs': 'var(--pp-text-2xs)',
    xs: 'var(--pp-text-xs)',
    sm: 'var(--pp-text-sm)',
    base: 'var(--pp-text-base)',
    lg: 'var(--pp-text-lg)',
    xl: 'var(--pp-text-xl)',
    '2xl': 'var(--pp-text-2xl)',
    '3xl': 'var(--pp-text-3xl)',
    '4xl': 'var(--pp-text-4xl)',
    '5xl': 'var(--pp-text-5xl)',
  },
  fontWeights: {
    light: 'var(--pp-font-weight-light)',
    normal: 'var(--pp-font-weight-normal)',
    medium: 'var(--pp-font-weight-medium)',
    semibold: 'var(--pp-font-weight-semibold)',
    bold: 'var(--pp-font-weight-bold)',
    extrabold: 'var(--pp-font-weight-extrabold)',
  },
} as const;

export const spacing = {
  px: 'var(--pp-space-px)',
  0: 'var(--pp-space-0)',
  1: 'var(--pp-space-1)',
  2: 'var(--pp-space-2)',
  3: 'var(--pp-space-3)',
  4: 'var(--pp-space-4)',
  5: 'var(--pp-space-5)',
  6: 'var(--pp-space-6)',
  8: 'var(--pp-space-8)',
  10: 'var(--pp-space-10)',
  12: 'var(--pp-space-12)',
  16: 'var(--pp-space-16)',
  20: 'var(--pp-space-20)',
  24: 'var(--pp-space-24)',
} as const;

export const radii = {
  none: 'var(--pp-radius-none)',
  sm: 'var(--pp-radius-sm)',
  DEFAULT: 'var(--pp-radius)',
  md: 'var(--pp-radius-md)',
  lg: 'var(--pp-radius-lg)',
  xl: 'var(--pp-radius-xl)',
  '2xl': 'var(--pp-radius-2xl)',
  full: 'var(--pp-radius-full)',
} as const;

export const shadows = {
  sm: 'var(--pp-shadow-sm)',
  DEFAULT: 'var(--pp-shadow)',
  md: 'var(--pp-shadow-md)',
  lg: 'var(--pp-shadow-lg)',
  xl: 'var(--pp-shadow-xl)',
  '2xl': 'var(--pp-shadow-2xl)',
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} as const;
