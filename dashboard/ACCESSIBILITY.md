# Accessibility (a11y) Documentation

## Overview

This document describes the current accessibility state of the Pi Sensor Dashboard and provides guidelines for maintaining and improving accessibility compliance. The application aims to meet WCAG 2.1 Level AA standards.

## Current Accessibility State

### ✅ Strengths

#### 1. **ARIA Attributes Coverage**
- **535 ARIA attributes** across 181 TSX files
- Good coverage in data table components:
  - `aria-label` for buttons and controls
  - `aria-controls` for interactive elements
  - `aria-live` for dynamic content
  - `aria-describedby` and `aria-labelledby` for associations
  - `aria-hidden` for decorative icons

#### 2. **Focus Management**
- **63 focus indicators** implemented (`focus-visible:` classes)
- Button component has comprehensive focus styles:
  ```tsx
  focus-visible:border-ring
  focus-visible:ring-ring/50
  focus-visible:ring-[3px]
  ```
- Focus-visible used instead of focus for better keyboard-only indication

#### 3. **Semantic Roles**
- **82 role attributes** properly implemented
- Data tables use proper ARIA roles for complex widgets

#### 4. **Keyboard Navigation**
- **47 keyboard event handlers** (tabIndex, onKeyDown, onKeyUp)
- shadcn/ui components have built-in keyboard support
- Data table supports keyboard navigation

#### 5. **Screen Reader Support**
- **22 screen reader-only elements** (sr-only class)
- Decorative icons properly hidden with `aria-hidden="true"`

#### 6. **Semantic HTML**
- Proper heading hierarchy (h1, h2, h3, h4) in most components
- Semantic HTML5 elements used where appropriate

---

## 🚨 Accessibility Gaps Identified (Problem #13)

### Critical Issues

#### 1. **Missing Language Attribute**
**Impact:** HIGH - Affects screen readers and translation tools

**Problem:**
- No `lang` attribute on `<html>` tag
- Bilingual application (EN/DE) without language indication

**Current State:**
```tsx
// app/layout.tsx
<html suppressHydrationWarning={true} data-lt-installed="true">
```

**Required Fix:**
```tsx
<html lang={locale} suppressHydrationWarning={true}>
```

**Files to Update:**
- `app/layout.tsx` (root layout)
- `app/[locale]/layout.tsx` (if exists)

---

#### 2. **Missing Skip Links**
**Impact:** HIGH - Affects keyboard-only users

**Problem:**
- No "Skip to main content" link
- Keyboard users must tab through entire sidebar/navigation

**Required Implementation:**
```tsx
// Add to app/layout.tsx or dashboard layout
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
  Skip to main content
</a>
...
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Files to Update:**
- `app/dashboard/layout.tsx`

---

#### 3. **Missing Image Alt Text**
**Impact:** MEDIUM - Affects screen reader users

**Problem:**
- Only **6 `alt` attributes** found across all components
- File upload previews may lack alt text
- Test object images missing descriptions

**Files to Check:**
- `components/file-upload.tsx` (if exists)
- `app/dashboard/test-objects/_components/test-object-form.tsx`
- Any image rendering components

**Required Fix:**
```tsx
// Decorative images
<img src={...} alt="" role="presentation" />

// Informative images
<img src={...} alt={testObject.title || "Test object image"} />
```

---

#### 4. **Insufficient Live Regions**
**Impact:** MEDIUM - Affects screen reader users

**Problem:**
- Only **2 `aria-live` attributes** found
- Dynamic content updates (sensor readings, measurements) not announced
- Toast notifications may not be announced properly

**Required Additions:**
- Sensor reading updates
- Measurement progress
- Form validation messages
- Loading states

**Implementation:**
```tsx
// Sensor readings card
<div aria-live="polite" aria-atomic="true">
  <span className="sr-only">Current reading: {value} {unit}</span>
  {value} {unit}
</div>

// Measurement progress
<div role="status" aria-live="polite" aria-atomic="true">
  <span className="sr-only">
    Measurement {status}, {readingsCount} readings collected
  </span>
</div>
```

---

#### 5. **Form Accessibility Gaps**
**Impact:** MEDIUM - Affects all assistive technology users

**Problem:**
- Some forms missing proper error associations
- Validation messages not programmatically associated
- Required field indicators inconsistent

**Required Patterns:**
```tsx
// Proper error association
<Label htmlFor="title">
  Title <span aria-label="required">*</span>
</Label>
<Input
  id="title"
  aria-required="true"
  aria-invalid={!!errors.title}
  aria-describedby={errors.title ? "title-error" : undefined}
/>
{errors.title && (
  <p id="title-error" className="text-sm text-destructive" role="alert">
    {errors.title.message}
  </p>
)}
```

---

#### 6. **Inconsistent Keyboard Navigation Indicators**
**Impact:** MEDIUM - Affects keyboard-only users

**Problem:**
- Not all interactive elements have visible focus indicators
- Some custom components override default focus styles
- Focus indicators may be inconsistent across themes

**Components to Audit:**
- Custom drawers and sheets
- File upload drag-and-drop zones
- Data table cells
- Sensor control cards

**Required Standard:**
```css
/* Ensure all interactive elements have visible focus */
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-ring
.focus-visible:ring-offset-2
```

---

#### 7. **Color Contrast Issues (Potential)**
**Impact:** MEDIUM - Affects low vision users

**Problem:**
- Not audited for WCAG AA contrast ratios (4.5:1 for normal text)
- Theme variables should ensure sufficient contrast

**Required Action:**
- Audit all text/background combinations
- Check button states (hover, disabled, active)
- Verify badge and status colors

**Tools:**
- Chrome DevTools Lighthouse
- axe DevTools
- Contrast Checker browser extension

---

#### 8. **Missing Document Structure**
**Impact:** LOW-MEDIUM - Affects screen reader navigation

**Problem:**
- No landmark regions (`<nav>`, `<main>`, `<aside>`, `<footer>`)
- Sidebar missing `<nav role="navigation">` wrapper
- No "banner" role for header

**Required Fix:**
```tsx
// app/dashboard/layout.tsx
<div className="flex h-screen">
  <AppSidebar /> {/* Should wrap content in <nav> */}
  <main className="flex-1" id="main-content">
    {children}
  </main>
</div>
```

---

### Medium Priority Issues

#### 9. **Table Accessibility**
**Impact:** MEDIUM - Affects screen reader table navigation

**Current State:** TanStack Table with ARIA support
**Check Required:**
- Table headers properly associated with `<th scope="col">`
- Row headers use `scope="row"` where appropriate
- Complex tables have `aria-describedby` for summaries

---

#### 10. **Modal and Dialog Accessibility**
**Impact:** MEDIUM - Affects keyboard users

**Current State:** shadcn/ui dialogs should handle:
- Focus trapping
- Escape key to close
- Return focus on close

**Verification Required:**
- Test all drawers and dialogs
- Ensure focus management works correctly
- Verify backdrop click behavior is keyboard accessible

---

#### 11. **Dynamic Content Announcements**
**Impact:** MEDIUM - Affects screen reader users

**Missing Announcements For:**
- File upload progress
- Measurement start/stop
- Sensor enable/disable
- Data refresh/polling
- Form submission success/failure

---

#### 12. **Touch Target Size**
**Impact:** LOW - Affects mobile and motor-impaired users

**WCAG Requirement:** Minimum 44x44 CSS pixels for touch targets

**Components to Audit:**
- Icon-only buttons
- Checkbox/radio controls
- Mobile navigation
- Data table row actions

---

## Best Practices & Patterns

### 1. Button Accessibility

```tsx
// Icon-only button
<Button
  variant="ghost"
  size="icon"
  aria-label={t('buttons.delete')}
>
  <TrashIcon aria-hidden="true" />
</Button>

// Button with loading state
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <span className="sr-only">{t('loading.saving')}</span>}
  {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
  {t('buttons.save')}
</Button>
```

### 2. Form Field Pattern

```tsx
<div>
  <Label htmlFor="username">
    Username <span aria-label="required">*</span>
  </Label>
  <Input
    id="username"
    name="username"
    type="text"
    required
    aria-required="true"
    aria-invalid={!!errors.username}
    aria-describedby={errors.username ? "username-error" : "username-hint"}
  />
  <p id="username-hint" className="text-sm text-muted-foreground">
    At least 3 characters
  </p>
  {errors.username && (
    <p id="username-error" role="alert" className="text-sm text-destructive">
      {errors.username.message}
    </p>
  )}
</div>
```

### 3. Live Region Pattern

```tsx
// Sensor reading updates
<div className="sensor-value" aria-live="polite" aria-atomic="true">
  <span className="sr-only">
    {sensor.name} reading: {value} {unit}
  </span>
  <span aria-hidden="true">{value}</span>
  <span className="text-muted-foreground">{unit}</span>
</div>
```

### 4. Data Table Accessibility

```tsx
// Column definition with proper labels
const columns = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting()}
        aria-label={`Sort by title ${
          column.getIsSorted() === "asc" ? "descending" : "ascending"
        }`}
      >
        Title
        <ArrowUpDown aria-hidden="true" />
      </Button>
    ),
  },
];

// Row selection
<Checkbox
  checked={row.getIsSelected()}
  onCheckedChange={row.toggleSelected}
  aria-label={`Select ${row.original.title}`}
/>
```

### 5. Keyboard Navigation Pattern

```tsx
// Custom keyboard navigation
function MyComponent() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleAction();
        break;
      case 'Escape':
        handleClose();
        break;
      case 'ArrowDown':
        focusNext();
        break;
      case 'ArrowUp':
        focusPrevious();
        break;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleAction}
    >
      ...
    </div>
  );
}
```

### 6. Focus Management

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function Dialog({ open, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus close button
      closeButtonRef.current?.focus();
    } else {
      // Restore focus on close
      previousFocusRef.current?.focus();
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Content>
        <DialogPrimitive.Close ref={closeButtonRef} aria-label="Close">
          <X />
        </DialogPrimitive.Close>
        ...
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}
```

---

## Testing Checklist

### Automated Testing

- [ ] **Lighthouse Accessibility Audit**
  ```bash
  # Run Lighthouse in Chrome DevTools
  # Target score: 90+ for accessibility
  ```

- [ ] **axe DevTools**
  ```bash
  npm install -D @axe-core/react
  # Add to development environment
  ```

- [ ] **ESLint Plugin**
  ```bash
  npm install -D eslint-plugin-jsx-a11y
  # Add to .eslintrc.json
  ```

### Manual Testing

#### Keyboard Navigation
- [ ] Tab through entire application
- [ ] All interactive elements reachable via keyboard
- [ ] Focus visible on all elements
- [ ] No keyboard traps
- [ ] Logical tab order
- [ ] Escape key closes modals/dialogs
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate lists/menus

#### Screen Reader Testing
- [ ] Test with NVDA (Windows, free)
- [ ] Test with JAWS (Windows, paid/trial)
- [ ] Test with VoiceOver (macOS/iOS, built-in)
- [ ] All content announced properly
- [ ] Form labels associated correctly
- [ ] Error messages announced
- [ ] Dynamic content updates announced
- [ ] Images have proper alt text

#### Visual Testing
- [ ] Zoom to 200% (text should reflow)
- [ ] Test color contrast with tools
- [ ] Test without color (grayscale mode)
- [ ] Ensure focus indicators visible
- [ ] Touch targets minimum 44x44px

#### Assistive Technology
- [ ] Test with high contrast mode
- [ ] Test with Windows Magnifier
- [ ] Test with browser zoom
- [ ] Test with reduced motion preference

---

## Implementation Priorities

### Phase 1: Critical Fixes (High Impact, Quick Wins)
1. ✅ Add `lang` attribute to `<html>` element
2. ✅ Add skip links for keyboard navigation
3. ✅ Fix missing alt text on images
4. ✅ Add proper form error associations
5. ✅ Ensure all buttons have accessible names

**Estimated Effort:** 2-4 hours
**Files to Update:** ~5-10 files

### Phase 2: Enhanced Navigation (Medium Impact)
1. ✅ Add landmark regions (`<nav>`, `<main>`, `<aside>`)
2. ✅ Improve keyboard focus indicators consistency
3. ✅ Add live regions for dynamic content
4. ✅ Audit and fix heading hierarchy

**Estimated Effort:** 4-8 hours
**Files to Update:** ~10-15 files

### Phase 3: Advanced Improvements (Lower Impact, Higher Effort)
1. ⏳ Comprehensive screen reader testing and fixes
2. ⏳ Color contrast audit and fixes
3. ⏳ Touch target size audit
4. ⏳ Advanced ARIA patterns for complex widgets
5. ⏳ Automated accessibility testing in CI/CD

**Estimated Effort:** 8-16 hours
**Files to Update:** ~20-30 files

---

## Component-Specific Guidelines

### Data Tables
- Use `<table>` with proper `<thead>`, `<tbody>`, `<th>`, `<td>`
- Add `scope` attribute to headers
- Use `aria-sort` for sortable columns
- Ensure row selection is keyboard accessible
- Provide `aria-label` for complex table operations

### Forms
- Every input must have an associated `<label>` or `aria-label`
- Use `aria-required` for required fields
- Use `aria-invalid` and `aria-describedby` for errors
- Group related inputs with `<fieldset>` and `<legend>`
- Provide helpful error messages with `role="alert"`

### Modals and Dialogs
- Trap focus within modal
- Return focus on close
- Provide close button with `aria-label`
- Use `role="dialog"` and `aria-modal="true"`
- Title with `aria-labelledby`

### Dynamic Content
- Use `aria-live="polite"` for non-urgent updates
- Use `aria-live="assertive"` for urgent updates
- Use `aria-atomic="true"` for complete announcements
- Consider `aria-relevant` for specific change types

### Icon Buttons
- Always provide `aria-label` or visible text
- Use `aria-hidden="true"` on decorative icons
- Ensure minimum 44x44px touch target
- Provide tooltip for additional context

---

## Resources

### Standards and Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Automated audits
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free, Windows
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Paid, Windows
- VoiceOver - Built-in, macOS/iOS
- TalkBack - Built-in, Android

### Libraries and Tools
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) - Linting
- [@axe-core/react](https://github.com/dequelabs/axe-core-npm) - Runtime checking
- [react-aria](https://react-spectrum.adobe.com/react-aria/) - Accessible components

---

## Maintenance

### Regular Audits
- Run Lighthouse accessibility audit weekly in development
- Manual keyboard testing before each release
- Screen reader testing for new features
- Color contrast check for new themes/components

### Documentation
- Document accessibility considerations in component README
- Include a11y checklist in PR templates
- Maintain this document with new patterns and fixes

### Team Training
- Share accessibility best practices
- Code review for a11y issues
- Pair programming on complex accessible components

---

## Migration Notes (Problem #13)

### Initial Assessment
- **535 ARIA attributes** found (good coverage in data tables)
- **181 TSX files** total
- **63 focus indicators** implemented
- **82 role attributes** properly used
- **47 keyboard event handlers**

### Gaps Identified
- **0 `lang` attributes** on HTML element (critical)
- **0 skip links** for keyboard navigation (critical)
- **6 alt attributes** only (needs expansion)
- **2 aria-live regions** only (needs expansion)
- **Inconsistent focus indicators** across custom components
- **Missing landmark regions** for screen reader navigation

### Recommended Approach
1. Implement critical fixes (lang, skip links, alt text)
2. Add landmark regions and improve semantic HTML
3. Expand live regions for dynamic content
4. Comprehensive keyboard navigation testing
5. Screen reader testing with NVDA/VoiceOver
6. Color contrast audit
7. Automated testing setup (eslint-plugin-jsx-a11y)

---

## See Also

- [I18N.md](I18N.md) - Internationalization (relates to lang attribute)
- [TYPE_SAFETY.md](TYPE_SAFETY.md) - Type definitions for accessible components
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Overall migration status
- [shadcn/ui Accessibility](https://ui.shadcn.com/docs/accessibility) - Component accessibility docs
