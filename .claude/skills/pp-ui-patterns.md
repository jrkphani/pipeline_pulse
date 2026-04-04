---
name: pp-ui-patterns
description: Enforces shadcn/ui component usage over raw HTML primitives — maps every installed shadcn component to the HTML element it replaces, with an explicit escape hatch for edge cases.
version: 1.0.0
---

# UI Component Patterns (Pipeline Pulse v2)

## Core Rule

> **If a shadcn/ui component exists for a given UI element, use it. No raw HTML primitives.**

Before using any raw HTML element, check the mapping table below. If a shadcn equivalent is installed, use it. If you believe an exception applies, state why in a code comment.

## Installed shadcn/ui Components → HTML Replacements

### Form & Input Elements

| Raw HTML | shadcn Component | Import Path | Notes |
|----------|-----------------|-------------|-------|
| `<button>` | `<Button>` | `@/components/ui/button` | All variants: default, destructive, outline, secondary, ghost, link |
| `<input type="text">` | `<Input>` | `@/components/ui/input` | Also covers email, password, search, url, tel |
| `<input type="checkbox">` | `<Checkbox>` | `@/components/ui/checkbox` | Radix-based, accessible |
| `<input type="radio">` | `<RadioGroup>` + `<RadioGroupItem>` | `@/components/ui/radio-group` | Wrap items in RadioGroup |
| `<input type="range">` | `<Slider>` | `@/components/ui/slider` | Radix-based slider |
| `<textarea>` | `<Textarea>` | `@/components/ui/textarea` | Auto-resize variant available |
| `<select>` | `<Select>` | `@/components/ui/select` | With SelectTrigger, SelectContent, SelectItem |
| `<label>` | `<Label>` | `@/components/ui/label` | Pairs with form controls |
| `<input type="date">` | `<Calendar>` + `<Popover>` | `@/components/ui/calendar`, `@/components/ui/popover` | DatePicker pattern: Calendar inside a Popover |
| `<form>` | `<Form>` | `@/components/ui/form` | React Hook Form + Zod integration |
| `<input[type=toggle]>` / toggle button | `<Switch>` | `@/components/ui/switch` | Boolean on/off toggle |
| Toggle button group | `<ToggleGroup>` | `@/components/ui/toggle-group` | Multi-option toggle set |

### Layout & Container Elements

| Raw HTML | shadcn Component | Import Path | Notes |
|----------|-----------------|-------------|-------|
| `<table>` | `<Table>` | `@/components/ui/table` | With TableHeader, TableBody, TableRow, TableHead, TableCell. **Exception: AG Grid handles all data grids — Table is for non-data tables only (settings, summaries, static info).** |
| `<dialog>` | `<Dialog>` | `@/components/ui/dialog` | With DialogTrigger, DialogContent, DialogHeader, DialogFooter |
| Confirmation dialog | `<AlertDialog>` | `@/components/ui/alert-dialog` | For destructive/confirmation actions — never use `window.alert()` or `window.confirm()` |
| Bottom sheet (mobile) | `<Drawer>` | `@/components/ui/drawer` | Vaul-based, swipeable |
| Side panel | `<Sheet>` | `@/components/ui/sheet` | Slides in from edge — for detail panels, settings |
| `<nav>` dropdown | `<NavigationMenu>` | `@/components/ui/navigation-menu` | Top-level nav with dropdowns |
| `<nav>` menu bar | `<Menubar>` | `@/components/ui/menubar` | Application-style menu bar |
| `overflow: scroll` container | `<ScrollArea>` | `@/components/ui/scroll-area` | Radix-based with custom scrollbar styling |
| Split pane / resizable panels | `<ResizablePanelGroup>` | `@/components/ui/resizable` | For DocAI review split view, side-by-side layouts |
| Image/video container | `<AspectRatio>` | `@/components/ui/aspect-ratio` | Maintains aspect ratio — use for document previews |
| `<details>` / `<summary>` | `<Accordion>` | `@/components/ui/accordion` | Expandable sections |
| `<details>` (single) | `<Collapsible>` | `@/components/ui/collapsible` | Single expand/collapse |
| `<hr>` | `<Separator>` | `@/components/ui/separator` | Horizontal or vertical divider |

### Feedback & Overlay Elements

| Raw HTML | shadcn Component | Import Path | Notes |
|----------|-----------------|-------------|-------|
| `window.alert()` | `<AlertDialog>` | `@/components/ui/alert-dialog` | **Banned: never use browser alert()** |
| `window.confirm()` | `<AlertDialog>` | `@/components/ui/alert-dialog` | With cancel + confirm actions |
| Toast / snackbar | `<Sonner>` (toast) | `@/components/ui/sonner` | Sonner-based toast notifications |
| Tooltip (`title` attr) | `<Tooltip>` | `@/components/ui/tooltip` | Never rely on HTML `title` attribute |
| Popover / dropdown | `<Popover>` | `@/components/ui/popover` | Generic popover container |
| Hover info card | `<HoverCard>` | `@/components/ui/hover-card` | Rich content on hover |
| Right-click menu | `<ContextMenu>` | `@/components/ui/context-menu` | Custom context menus |
| `<ul>` command list | `<Command>` | `@/components/ui/command` | Searchable command palette (cmdk) |
| Loading placeholder | `<Skeleton>` | `@/components/ui/skeleton` | Animated loading placeholder |
| `<progress>` | `<Progress>` | `@/components/ui/progress` | Radix-based progress bar |

### Navigation & Display Elements

| Raw HTML | shadcn Component | Import Path | Notes |
|----------|-----------------|-------------|-------|
| Breadcrumb `<nav>` | `<Breadcrumb>` | `@/components/ui/breadcrumb` | With BreadcrumbList, BreadcrumbItem, BreadcrumbLink |
| Tab `<nav>` | `<Tabs>` | `@/components/ui/tabs` | With TabsList, TabsTrigger, TabsContent |
| `<span class="badge">` | `<Badge>` | `@/components/ui/badge` | Status labels, tags, counts |
| User avatar `<img>` | `<Avatar>` | `@/components/ui/avatar` | With AvatarImage, AvatarFallback |
| Card container `<div>` | `<Card>` | `@/components/ui/card` | With CardHeader, CardContent, CardFooter |
| `<aside>` sidebar | `<Sidebar>` | `@/components/ui/sidebar` | Application sidebar with collapsible groups |
| Right-click / action menu | `<DropdownMenu>` | `@/components/ui/dropdown-menu` | With DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem |
| Chart container | `<ChartContainer>` | `@/components/ui/chart` | Recharts wrapper with design token integration |

## Pipeline Pulse Custom Components

These are project-specific components built on top of shadcn primitives. Use them where applicable:

| Component | Import | Use For |
|-----------|--------|---------|
| `<MetricCard>` | `@/components/ui/metric-card` | KPI display cards on dashboards |
| `<O2RPhaseIndicator>` | `@/components/ui/o2r-phase-indicator` | Phase lifecycle visualization |
| `<EmptyState>` | `@/components/ui/empty-state` | Empty data placeholders |
| `<LoadingSpinner>` | `@/components/ui/loading-spinner` | Inline loading indicator |
| `<PageLayout>` | `@/components/ui/page-layout` | Standard page wrapper |
| `<GridLayout>` | `@/components/ui/grid-layout` | Responsive grid container |
| `<FormField>` | `@/components/ui/form-field` | Labeled form field wrapper |

## Explicitly Allowed Raw HTML

These elements do **not** have shadcn equivalents and are fine to use raw:

- `<div>`, `<span>`, `<p>`, `<h1>`–`<h6>` — structural/text elements
- `<ul>`, `<ol>`, `<li>` — lists (unless command-palette-style, then use `<Command>`)
- `<a>` — only when using `@tanstack/react-router`'s `<Link>` component (which renders as `<a>`)
- `<img>` — for non-avatar images (product screenshots, logos). Use `<Avatar>` for user/account images
- `<svg>` — icon internals (prefer `lucide-react` icons)
- `<code>`, `<pre>` — code display blocks
- `<section>`, `<article>`, `<main>`, `<header>`, `<footer>` — semantic landmarks
- `<canvas>` — chart internals managed by Recharts
- AG Grid cell renderers — lightweight DOM is acceptable inside `cellRenderer` callbacks for performance, but prefer `cellClassRules` over React components in cells

## DatePicker Pattern

Since shadcn doesn't ship a standalone DatePicker, use this composition:

```tsx
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {value ? format(value, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
```

**Never use** `<input type="date">` — it renders differently across browsers and doesn't respect design tokens.

## Banned Patterns

| Pattern | Replacement |
|---------|-------------|
| `window.alert(...)` | `<AlertDialog>` or `toast()` from Sonner |
| `window.confirm(...)` | `<AlertDialog>` with confirm/cancel actions |
| `window.prompt(...)` | `<Dialog>` with `<Input>` inside |
| `<button className="...">` | `<Button variant="..." size="...">` |
| `<input type="date">` | `<Calendar>` + `<Popover>` DatePicker pattern |
| `<input type="range">` | `<Slider>` |
| `<select><option>` | `<Select>` with SelectTrigger/SelectContent/SelectItem |
| `<table>` for data grids | AG Grid (see pp-ag-grid-patterns skill) |
| HTML `title` attribute for tooltips | `<Tooltip>` with TooltipTrigger/TooltipContent |
| CSS `overflow: auto/scroll` for scrollable areas | `<ScrollArea>` |

## Review Enforcement

When reviewing any PR:

1. **Grep for raw HTML**: Search for `<button`, `<input`, `<select`, `<textarea`, `<table`, `<dialog`, `window.alert`, `window.confirm` in `.tsx` files outside `components/ui/`
2. **Check the mapping table**: If a shadcn equivalent exists, request the change
3. **Verify imports**: Components should import from `@/components/ui/*`, not from Radix directly (the shadcn wrappers add consistent styling)
4. **Exception review**: If raw HTML is used with a code comment explaining why, evaluate whether the exception is justified
