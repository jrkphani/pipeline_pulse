# Pipeline Pulse Accessibility Guide

## Overview

Pipeline Pulse is designed to be fully accessible to all users, including those who rely on assistive technologies such as screen readers, keyboard navigation, and other accessibility tools. This guide outlines our accessibility features, testing procedures, and compliance standards.

## Accessibility Standards

We aim to meet **WCAG 2.1 AA** compliance standards, ensuring:

- **Perceivable**: Information is presentable in ways users can perceive
- **Operable**: Interface components and navigation are operable
- **Understandable**: Information and UI operation are understandable
- **Robust**: Content is robust enough for interpretation by assistive technologies

## Key Accessibility Features

### 1. Keyboard Navigation

**Complete keyboard accessibility** without requiring a mouse:

- **Tab navigation** through all interactive elements
- **Arrow key navigation** in lists, tables, and grids
- **Enter/Space** to activate buttons and select items
- **Escape** to close modals and cancel operations

#### Global Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘/Ctrl + K` | Open command palette | Global |
| `Alt + 1-5` | Navigate to main sections | Global |
| `/` | Focus search input | Global |
| `⌘/Ctrl + Shift + R` | Refresh data | Global |
| `⌘/Ctrl + D` | Toggle dark mode | Global |
| `?` | Show keyboard shortcuts | Global |
| `Escape` | Close modals/dialogs | Modals |

#### Table Navigation

| Shortcut | Action |
|----------|--------|
| `↑/↓` | Navigate rows |
| `←/→` | Navigate columns |
| `Home/End` | First/last item |
| `Page Up/Down` | Page navigation |
| `Enter` | Edit/select item |
| `Space` | Select row |

### 2. Screen Reader Support

**Comprehensive screen reader compatibility** with proper semantic markup:

- **ARIA labels** for all interactive elements
- **Live regions** for dynamic content updates
- **Proper heading hierarchy** (h1, h2, h3)
- **Landmark roles** (banner, navigation, main, contentinfo)
- **Status announcements** for loading states and actions

#### Supported Screen Readers

- **VoiceOver** (macOS/iOS)
- **NVDA** (Windows)
- **JAWS** (Windows)
- **TalkBack** (Android)

### 3. Visual Accessibility

**High contrast and customizable visual experience**:

- **Dark mode** support with system preference detection
- **High contrast mode** for improved visibility
- **Scalable font sizes** (small, medium, large)
- **Minimum touch targets** of 44px for interactive elements
- **Color contrast ratios** meeting WCAG AA standards

### 4. Focus Management

**Clear and logical focus indicators**:

- **Visible focus rings** on all interactive elements
- **Focus trapping** in modals and dialogs
- **Skip links** to main content and navigation
- **Focus restoration** after modal close

### 5. Motion and Animation

**Respect for motion preferences**:

- **Reduced motion** support for users with vestibular disorders
- **Optional animations** that can be disabled
- **Smooth transitions** that don't cause seizures

## Component Accessibility

### Layout Components

#### Navigation
- **Landmark roles** for banner, navigation, main content
- **Skip links** for keyboard users
- **ARIA current** indicators for active pages
- **Descriptive link text** with context

#### Command Palette
- **Combobox role** with proper ARIA attributes
- **Live search results** announcements
- **Keyboard navigation** with arrow keys
- **Escape key** to close

### Form Components

#### Input Fields
- **Label association** with htmlFor/id
- **Required field** indicators
- **Error message** associations with aria-describedby
- **Input validation** with aria-invalid

#### Form Validation
- **Real-time validation** with screen reader announcements
- **Error summaries** at form submission
- **Success confirmations** for completed actions

### Data Components

#### Tables
- **Table headers** with scope attributes
- **Row/column navigation** with arrow keys
- **Sortable columns** with ARIA sort attributes
- **Loading states** with live regions

#### Charts and Graphs
- **Alternative text** descriptions
- **Data tables** as fallbacks
- **Keyboard navigation** through data points

## Testing Procedures

### Automated Testing

Run accessibility tests as part of the development workflow:

```bash
# Install testing dependencies
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npm run test:a11y

# Run specific component tests
npm run test:a11y -- --grep "Dashboard"
```

### Manual Testing Checklist

#### Keyboard Navigation Testing

- [ ] Can navigate entire app using only keyboard
- [ ] Tab order is logical and intuitive
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] Skip links function correctly
- [ ] Keyboard shortcuts work as expected

#### Screen Reader Testing

- [ ] All content is announced correctly
- [ ] Heading structure is logical (h1 → h2 → h3)
- [ ] ARIA labels provide sufficient context
- [ ] Dynamic content updates are announced
- [ ] Form labels and errors are associated correctly
- [ ] Loading states are communicated

#### Visual Testing

- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Text is readable at 200% zoom
- [ ] High contrast mode works correctly
- [ ] Dark mode provides sufficient contrast
- [ ] Interactive elements meet minimum size requirements

#### Motor Accessibility Testing

- [ ] Touch targets are at least 44px
- [ ] Reduced motion preferences are respected
- [ ] Interface works with head/eye tracking devices
- [ ] Voice control software can interact with elements

### Testing Tools

#### Browser Extensions
- **axe DevTools** - Automated accessibility scanning
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Built-in Chrome accessibility audit

#### Screen Readers
- **VoiceOver** (macOS) - `Cmd + F5` to enable
- **NVDA** (Windows) - Free download from nvaccess.org
- **JAWS** (Windows) - Trial version available

#### Keyboard Testing
- **Tab key** - Test tab navigation
- **Shift + Tab** - Test reverse navigation
- **Arrow keys** - Test list/grid navigation
- **Enter/Space** - Test activation

## Implementation Guidelines

### For Developers

#### Semantic HTML
```html
<!-- Use semantic elements -->
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<article>
<section aria-labelledby="section-heading">
<footer role="contentinfo">
```

#### ARIA Attributes
```html
<!-- Button with description -->
<button aria-label="Delete item" aria-describedby="delete-help">
  Delete
</button>
<div id="delete-help" class="sr-only">
  This action cannot be undone
</div>

<!-- Loading state -->
<div role="status" aria-live="polite">
  Loading data...
</div>

<!-- Error message -->
<input aria-invalid="true" aria-describedby="email-error" />
<div id="email-error" role="alert">
  Please enter a valid email address
</div>
```

#### Focus Management
```tsx
// Focus trap hook
const focusTrapRef = useFocusTrap(isModalOpen)

// Skip links
const { skipToMain } = useSkipLinks()

// Keyboard navigation
const { activeIndex, handleKeyDown } = useKeyboardNavigation(items.length)
```

### Code Review Guidelines

When reviewing accessibility implementations:

- [ ] Check for semantic HTML usage
- [ ] Verify ARIA attributes are correct
- [ ] Test keyboard navigation flows
- [ ] Ensure proper heading hierarchy
- [ ] Validate color contrast ratios
- [ ] Test with screen reader

### Common Accessibility Patterns

#### Modal Dialogs
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">Confirm Action</DialogTitle>
    <DialogDescription id="dialog-description">
      Are you sure you want to proceed?
    </DialogDescription>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### Data Tables
```tsx
<table role="table" aria-label="Pipeline data">
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">
        Deal Name
      </th>
      <th scope="col">Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Acme Corp Deal</td>
      <td>$100,000</td>
    </tr>
  </tbody>
</table>
```

#### Form Fields
```tsx
<FormField>
  <FormFieldLabel required>Email Address</FormFieldLabel>
  <FormFieldControl>
    <Input
      type="email"
      required
      aria-invalid={!!error}
      aria-describedby="email-error email-help"
    />
  </FormFieldControl>
  <FormFieldDescription id="email-help">
    We'll use this to send you updates
  </FormFieldDescription>
  {error && (
    <FormFieldMessage id="email-error" type="error">
      {error}
    </FormFieldMessage>
  )}
</FormField>
```

## Accessibility Testing Checklist

### Pre-Release Testing

Before any release, ensure all items are tested and passing:

#### Automated Tests
- [ ] axe-core tests pass with 0 violations
- [ ] Lighthouse accessibility score ≥ 95
- [ ] Color contrast ratios verified
- [ ] HTML validation passes

#### Manual Tests
- [ ] Keyboard navigation complete walkthrough
- [ ] Screen reader testing (VoiceOver/NVDA)
- [ ] High contrast mode verification
- [ ] Reduced motion preference testing
- [ ] Mobile touch accessibility

#### User Testing
- [ ] Test with actual screen reader users
- [ ] Keyboard-only user testing
- [ ] Motor disability user testing
- [ ] Cognitive accessibility review

### Continuous Monitoring

- Run automated accessibility tests in CI/CD pipeline
- Regular manual testing with assistive technologies
- User feedback collection and response
- Annual accessibility audit by external expert

## Resources and Support

### Internal Resources
- **Accessibility Context**: `/src/contexts/AccessibilityContext.tsx`
- **Accessibility Hooks**: `/src/hooks/useAccessibility.ts`
- **Keyboard Shortcuts**: `/src/hooks/useKeyboardShortcuts.ts`
- **Testing Utilities**: `/src/utils/accessibility-testing.ts`

### External Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Getting Help

For accessibility questions or issues:

1. Check this documentation first
2. Review WCAG 2.1 guidelines
3. Test with assistive technologies
4. Consult with accessibility expert
5. File GitHub issue with `accessibility` label

## Compliance Statement

Pipeline Pulse strives to conform to WCAG 2.1 Level AA standards. We are committed to ensuring our application is accessible to all users, regardless of ability or assistive technology used.

If you encounter any accessibility barriers, please contact our team with details about:
- The page or feature affected
- The assistive technology being used
- The specific issue encountered
- Any error messages received

We will work to address accessibility issues promptly and provide alternative access methods when needed.