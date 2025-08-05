/**
 * Accessibility testing utilities
 */

export interface AccessibilityTestResult {
  element: HTMLElement
  issues: string[]
  severity: 'low' | 'medium' | 'high'
}

export interface TouchTargetResult {
  element: HTMLElement
  meets44px: boolean
  size: {
    width: number
    height: number
  }
}

export interface AccessibilityReport {
  ariaIssues: {
    element: HTMLElement
    issue: string
    severity: 'error' | 'warning'
  }[]
}

export const runAccessibilityTests = async (container: HTMLElement): Promise<AccessibilityTestResult[]> => {
  const results: AccessibilityTestResult[] = []
  
  // Check for missing alt text on images
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      results.push({
        element: img as HTMLElement,
        issues: ['Missing alt text'],
        severity: 'high'
      })
    }
  })
  
  // Check for missing form labels
  const inputs = container.querySelectorAll('input, textarea, select')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (!id && !ariaLabel && !ariaLabelledBy) {
      const label = container.querySelector(`label[for="${id}"]`)
      if (!label) {
        results.push({
          element: input as HTMLElement,
          issues: ['Missing form label'],
          severity: 'high'
        })
      }
    }
  })
  
  // Check for missing heading structure
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    results.push({
      element: container,
      issues: ['No heading structure found'],
      severity: 'medium'
    })
  }
  
  return results
}

export const validateTouchTargets = (container: HTMLElement = document.body): TouchTargetResult[] => {
  const results: TouchTargetResult[] = []
  const touchTargets = container.querySelectorAll('button, a, input, textarea, select')
  
  touchTargets.forEach(target => {
    const rect = target.getBoundingClientRect()
    results.push({
      element: target as HTMLElement,
      meets44px: rect.width >= 44 && rect.height >= 44,
      size: {
        width: rect.width,
        height: rect.height
      }
    })
  })
  
  return results
}

export const respectsReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const testFocusTrap = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = []
  const focusableElements = findFocusableElements(container)
  
  if (focusableElements.length === 0) {
    results.push({
      element: container,
      issues: ['No focusable elements found in container'],
      severity: 'high'
    })
  }
  
  return results
}

export const findFocusableElements = (container: HTMLElement = document.body): HTMLElement[] => {
  const focusableSelector = `
    a[href],
    button:not([disabled]),
    textarea:not([disabled]),
    input:not([disabled]),
    select:not([disabled]),
    [tabindex]:not([tabindex="-1"])
  `
  
  return Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[]
}

export const getTabOrder = (container: HTMLElement = document.body): HTMLElement[] => {
  const focusableElements = findFocusableElements(container)
  
  return focusableElements.sort((a, b) => {
    const aTabIndex = parseInt(a.getAttribute('tabindex') || '0')
    const bTabIndex = parseInt(b.getAttribute('tabindex') || '0')
    
    if (aTabIndex === bTabIndex) {
      // Use DOM order for elements with same tabindex
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    }
    
    return aTabIndex - bTabIndex
  })
}

export const generateAccessibilityReport = (container: HTMLElement = document.body): AccessibilityReport => {
  const ariaIssues: AccessibilityReport['ariaIssues'] = []
  
  // Check for missing alt text on images
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt') && img.getAttribute('role') !== 'presentation') {
      ariaIssues.push({
        element: img as HTMLElement,
        issue: `Image missing alt text: ${(img as HTMLImageElement).src}`,
        severity: 'error'
      })
    }
  })
  
  // Check for missing form labels
  const inputs = container.querySelectorAll('input, textarea, select')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (!ariaLabel && !ariaLabelledBy) {
      const label = id ? container.querySelector(`label[for="${id}"]`) : null
      if (!label) {
        ariaIssues.push({
          element: input as HTMLElement,
          issue: 'Form element missing label',
          severity: 'error'
        })
      }
    }
  })
  
  // Check for missing button text
  const buttons = container.querySelectorAll('button')
  buttons.forEach(button => {
    const text = button.textContent?.trim()
    const ariaLabel = button.getAttribute('aria-label')
    if (!text && !ariaLabel) {
      ariaIssues.push({
        element: button as HTMLElement,
        issue: 'Button missing accessible text',
        severity: 'error'
      })
    }
  })
  
  // Check for empty links
  const links = container.querySelectorAll('a[href]')
  links.forEach(link => {
    const text = link.textContent?.trim()
    const ariaLabel = link.getAttribute('aria-label')
    if (!text && !ariaLabel) {
      ariaIssues.push({
        element: link as HTMLElement,
        issue: 'Link missing accessible text',
        severity: 'error'
      })
    }
  })
  
  // Check heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let previousLevel = 0
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > previousLevel + 1) {
      ariaIssues.push({
        element: heading as HTMLElement,
        issue: `Heading level skipped (H${previousLevel} to H${level})`,
        severity: 'warning'
      })
    }
    previousLevel = level
  })
  
  return { ariaIssues }
}

// Additional test functions for specific accessibility checks
export const testTargetSize44x44 = (element: HTMLElement): AccessibilityTestResult => {
  const rect = element.getBoundingClientRect()
  const meets44px = rect.width >= 44 && rect.height >= 44
  
  return {
    element,
    issues: meets44px ? [] : [`Target size is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum 44x44px)`],
    severity: meets44px ? 'low' : 'medium',
    meets44px,
    size: {
      width: rect.width,
      height: rect.height
    }
  } as AccessibilityTestResult & { meets44px: boolean; size: { width: number; height: number } }
}

export const testColorContrast = (element: HTMLElement): AccessibilityTestResult => {
  // This is a simplified check - in production you'd use a proper contrast calculation
  const computedStyle = window.getComputedStyle(element)
  const color = computedStyle.color
  const backgroundColor = computedStyle.backgroundColor
  
  // Check if text and background are defined
  const hasDefinedColors = color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)'
  
  return {
    element,
    issues: hasDefinedColors ? [] : ['Unable to determine color contrast'],
    severity: 'low'
  }
}

export const testKeyboardAccess = (element: HTMLElement): AccessibilityTestResult => {
  const isKeyboardAccessible = 
    element.matches('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
  
  return {
    element,
    issues: isKeyboardAccessible ? [] : ['Element is not keyboard accessible'],
    severity: isKeyboardAccessible ? 'low' : 'high'
  }
}

export const testScreenReaderSupport = (element: HTMLElement): AccessibilityTestResult => {
  const issues: string[] = []
  
  // Check for appropriate ARIA attributes
  const role = element.getAttribute('role')
  const ariaLabel = element.getAttribute('aria-label')
  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  const ariaDescribedBy = element.getAttribute('aria-describedby')
  
  // Check interactive elements
  if (element.matches('button, a, input, select, textarea')) {
    const hasAccessibleName = ariaLabel || ariaLabelledBy || element.textContent?.trim()
    if (!hasAccessibleName) {
      issues.push('Missing accessible name')
    }
  }
  
  // Check images
  if (element.tagName === 'IMG') {
    const alt = element.getAttribute('alt')
    const isDecorative = element.getAttribute('role') === 'presentation'
    if (!alt && !isDecorative) {
      issues.push('Missing alt text')
    }
  }
  
  return {
    element,
    issues,
    severity: issues.length > 0 ? 'high' : 'low'
  }
}

export const testAccessibleForms = (element: HTMLElement): AccessibilityTestResult => {
  const issues: string[] = []
  
  if (element.matches('input, textarea, select')) {
    const id = element.getAttribute('id')
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    const label = id ? document.querySelector(`label[for="${id}"]`) : null
    
    if (!ariaLabel && !ariaLabelledBy && !label) {
      issues.push('Form element missing label')
    }
    
    // Check for required fields
    if (element.hasAttribute('required') && !element.getAttribute('aria-required')) {
      issues.push('Required field missing aria-required attribute')
    }
    
    // Check for error messages
    const ariaInvalid = element.getAttribute('aria-invalid')
    const ariaErrorMessage = element.getAttribute('aria-errormessage')
    if (ariaInvalid === 'true' && !ariaErrorMessage) {
      issues.push('Invalid field missing error message')
    }
  }
  
  return {
    element,
    issues,
    severity: issues.length > 0 ? 'high' : 'low'
  }
}
