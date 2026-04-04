---
name: pp-design-tokens
description: Pipeline Pulse v2 design token system — spacing, typography, color, chart, AG Grid, animation, and tab tokens with usage rules.
version: 1.0.0
---

# Design Tokens (Pipeline Pulse v2)

This skill documents the complete design token system for Pipeline Pulse. All visual styling must use these tokens — never hardcode pixel values, color codes, or font sizes.

## Golden Rule

> **Always use tokens. Never hardcode values. No inline styles with raw pixel values.**

If a value isn't covered by an existing token, propose a new token rather than hardcoding.

## Spacing Tokens

Based on a 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-space-0` | 0 | Reset |
| `--pp-space-1` | 4px | Tight inline spacing |
| `--pp-space-2` | 8px | Default inline spacing, icon gaps |
| `--pp-space-3` | 12px | Compact padding |
| `--pp-space-4` | 16px | Default padding, card padding |
| `--pp-space-5` | 20px | Section spacing |
| `--pp-space-6` | 24px | Component gaps |
| `--pp-space-8` | 32px | Section gaps |
| `--pp-space-10` | 40px | Large section gaps |
| `--pp-space-12` | 48px | Page-level spacing |
| `--pp-space-16` | 64px | Layout spacing |
| `--pp-space-20` | 80px | Hero/feature spacing |

## Typography Tokens

### Font Size

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-font-size-xs` | 11px | Grid cells, micro labels |
| `--pp-font-size-sm` | 13px | Secondary text, table headers |
| `--pp-font-size-base` | 14px | Body text, form inputs |
| `--pp-font-size-md` | 16px | Subheadings, emphasis |
| `--pp-font-size-lg` | 18px | Section headers |
| `--pp-font-size-xl` | 20px | Page titles |
| `--pp-font-size-2xl` | 24px | Dashboard KPI values |
| `--pp-font-size-3xl` | 30px | Hero numbers |
| `--pp-font-size-4xl` | 36px | Feature headers (rare) |

### Font Weight

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-font-weight-normal` | 400 | Body text |
| `--pp-font-weight-medium` | 500 | Labels, table headers |
| `--pp-font-weight-semibold` | 600 | Subheadings, emphasis |
| `--pp-font-weight-bold` | 700 | Page titles, KPI values |

### Line Height

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-line-height-tight` | 1.25 | Grid cells, compact UI |
| `--pp-line-height-normal` | 1.5 | Body text |
| `--pp-line-height-relaxed` | 1.75 | Long-form content |

### Font Family

| Token | Value |
|-------|-------|
| `--pp-font-family` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--pp-font-family-mono` | `'JetBrains Mono', 'Fira Code', monospace` |

## Color Tokens

All colors use oklch for perceptual uniformity.

### Primary (Purple)

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-primary-50` | `oklch(0.97 0.01 280)` | Selected row background, hover tints |
| `--pp-primary-100` | `oklch(0.93 0.03 280)` | Light accent backgrounds |
| `--pp-primary-500` | `oklch(0.55 0.20 280)` | Primary buttons, links, active states |
| `--pp-primary-600` | `oklch(0.48 0.20 280)` | Primary button hover |
| `--pp-primary-700` | `oklch(0.40 0.20 280)` | Primary button active/pressed |
| `--pp-primary-rgb` | RGB equivalent | For rgba() alpha compositing only |

### Success (Green — Health: Green)

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-success-50` | `oklch(0.97 0.03 145)` | Health green cell background |
| `--pp-success-500` | `oklch(0.55 0.18 145)` | Success icons, positive indicators |
| `--pp-success-600` | `oklch(0.48 0.18 145)` | Success text on light backgrounds |

### Warning (Amber — Health: Yellow)

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-warning-50` | `oklch(0.97 0.03 85)` | Health yellow cell background |
| `--pp-warning-500` | `oklch(0.70 0.15 85)` | Warning icons |
| `--pp-warning-600` | `oklch(0.60 0.15 85)` | Warning text |

### Danger (Red — Health: Red)

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-danger-50` | `oklch(0.97 0.03 25)` | Health red cell background |
| `--pp-danger-500` | `oklch(0.55 0.20 25)` | Error icons, critical indicators |
| `--pp-danger-600` | `oklch(0.48 0.20 25)` | Error text, destructive actions |

### Neutral (Gray)

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-neutral-50` | `oklch(0.98 0 0)` | Page background, grid background |
| `--pp-neutral-100` | `oklch(0.96 0 0)` | Grid header, card backgrounds |
| `--pp-neutral-200` | `oklch(0.90 0 0)` | Borders, dividers, blocked cell background |
| `--pp-neutral-300` | `oklch(0.85 0 0)` | Disabled state backgrounds |
| `--pp-neutral-400` | `oklch(0.70 0 0)` | Placeholder text |
| `--pp-neutral-500` | `oklch(0.55 0 0)` | Secondary text |
| `--pp-neutral-600` | `oklch(0.45 0 0)` | Primary text (body) |
| `--pp-neutral-700` | `oklch(0.35 0 0)` | Headings |
| `--pp-neutral-800` | `oklch(0.25 0 0)` | High-emphasis text |
| `--pp-neutral-900` | `oklch(0.15 0 0)` | Maximum contrast text |

## Chart Tokens

For Recharts and any data visualization:

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-chart-1` | `oklch(0.55 0.20 280)` | Primary series (purple) |
| `--pp-chart-2` | `oklch(0.55 0.18 145)` | Secondary series (green) |
| `--pp-chart-3` | `oklch(0.70 0.15 85)` | Tertiary series (amber) |
| `--pp-chart-4` | `oklch(0.55 0.20 25)` | Quaternary series (red) |
| `--pp-chart-5` | `oklch(0.55 0.15 200)` | Quinary series (teal) |

**Rules:**
- Always use chart tokens in order (chart-1 first, then chart-2, etc.)
- For more than 5 series, cycle tokens with reduced opacity
- Never use random or hardcoded hex colors in charts

## AG Grid Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-grid-row-height` | 30px | Compact row height for data density |
| `--pp-grid-header-height` | 32px | Column header height |
| `--pp-grid-frozen-shadow` | `2px 0 4px rgba(0,0,0,0.08)` | Shadow on pinned left columns |
| `--pp-grid-cell-padding` | 0 8px | Cell content padding |
| `--pp-grid-edit-border` | `2px solid var(--pp-primary-500)` | Active cell edit indicator |

These tokens are consumed by the `ag-theme-pp` class (see pp-ag-grid-patterns skill).

## Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-duration-fast` | 150ms | Hover states, button feedback |
| `--pp-duration-normal` | 200ms | Expand/collapse, tab transitions |
| `--pp-duration-slow` | 250ms | Modal open, drawer slide |
| `--pp-duration-slower` | 300ms | Page transitions, chart animations |
| `--pp-ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing (Material standard) |
| `--pp-ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
| `--pp-ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |

**Usage:**
```css
.pp-transition {
  transition: all var(--pp-duration-normal) var(--pp-ease-standard);
}
```

## Tab Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--pp-tab-height` | 40px | Tab bar height |
| `--pp-tab-indicator-height` | 2px | Active tab underline thickness |
| `--pp-tab-indicator-color` | `var(--pp-primary-500)` | Active tab underline color |
| `--pp-tab-font-size` | `var(--pp-font-size-sm)` | Tab label size |
| `--pp-tab-font-weight-active` | `var(--pp-font-weight-semibold)` | Active tab weight |
| `--pp-tab-font-weight-inactive` | `var(--pp-font-weight-normal)` | Inactive tab weight |
| `--pp-tab-padding` | `0 var(--pp-space-4)` | Horizontal padding per tab |

## Usage Rules

1. **CSS custom properties only** — all tokens are CSS variables defined in `:root` or a theme scope
2. **No magic numbers** — if you write `margin: 12px`, use `margin: var(--pp-space-3)` instead
3. **No inline color codes** — `color: #6B21A8` must be `color: var(--pp-primary-600)`
4. **Tailwind integration** — tokens are mapped to Tailwind's `theme.extend` in `tailwind.config.ts`:
   ```ts
   extend: {
     colors: {
       primary: {
         50: 'var(--pp-primary-50)',
         500: 'var(--pp-primary-500)',
         // ...
       }
     },
     spacing: {
       'pp-1': 'var(--pp-space-1)',
       'pp-2': 'var(--pp-space-2)',
       // ...
     }
   }
   ```
5. **Dark mode** — tokens are overridden in a `.dark` scope. Components that use tokens get dark mode automatically.
6. **Component libraries** — shadcn/ui components must be restyled using tokens, not their default CSS variables.
