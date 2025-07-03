import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook for managing focus trap in modals and dialogs
 * Ensures focus stays within the component when active
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)
  const previousFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the previously focused element
    previousFocusedElement.current = document.activeElement as HTMLElement

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus the first element
    if (firstFocusable) {
      firstFocusable.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        // Close the modal/dialog - this should be handled by the component
        const closeButton = container.querySelector('[data-close-modal]') as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to previously focused element
      if (previousFocusedElement.current) {
        previousFocusedElement.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for managing keyboard navigation in lists/grids
 * Supports arrow key navigation with optional wrap-around
 */
export function useKeyboardNavigation(itemCount: number, options: {
  initialIndex?: number
  wrap?: boolean
  orientation?: 'horizontal' | 'vertical' | 'grid'
  gridColumns?: number
  onSelect?: (index: number) => void
  onEscape?: () => void
} = {}) {
  const {
    initialIndex = 0,
    wrap = true,
    orientation = 'vertical',
    gridColumns = 1,
    onSelect,
    onEscape
  } = options

  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (orientation === 'vertical' || orientation === 'grid') {
          const nextIndex = orientation === 'grid'
            ? activeIndex + gridColumns
            : activeIndex + 1
          
          if (nextIndex < itemCount) {
            setActiveIndex(nextIndex)
          } else if (wrap) {
            setActiveIndex(orientation === 'grid' ? activeIndex % gridColumns : 0)
          }
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (orientation === 'vertical' || orientation === 'grid') {
          const nextIndex = orientation === 'grid'
            ? activeIndex - gridColumns
            : activeIndex - 1
          
          if (nextIndex >= 0) {
            setActiveIndex(nextIndex)
          } else if (wrap) {
            const lastRowStart = Math.floor((itemCount - 1) / gridColumns) * gridColumns
            setActiveIndex(orientation === 'grid' 
              ? lastRowStart + (activeIndex % gridColumns)
              : itemCount - 1
            )
          }
        }
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (orientation === 'horizontal' || orientation === 'grid') {
          const nextIndex = activeIndex - 1
          if (nextIndex >= 0) {
            setActiveIndex(nextIndex)
          } else if (wrap) {
            setActiveIndex(itemCount - 1)
          }
        }
        break

      case 'ArrowRight':
        e.preventDefault()
        if (orientation === 'horizontal' || orientation === 'grid') {
          const nextIndex = activeIndex + 1
          if (nextIndex < itemCount) {
            setActiveIndex(nextIndex)
          } else if (wrap) {
            setActiveIndex(0)
          }
        }
        break

      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break

      case 'End':
        e.preventDefault()
        setActiveIndex(itemCount - 1)
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect?.(activeIndex)
        break

      case 'Escape':
        e.preventDefault()
        onEscape?.()
        break
    }
  }, [activeIndex, itemCount, orientation, gridColumns, wrap, onSelect, onEscape])

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown
  }
}

/**
 * Hook for announcing screen reader messages
 * Creates a live region for dynamic content updates
 */
export function useScreenReaderAnnouncer() {
  const [announcement, setAnnouncement] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set the announcement
    setAnnouncement(message)

    // Clear the announcement after a delay to allow for re-announcements
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('')
    }, 1000)
  }, [])

  // Create the live region element
  const LiveRegion = useCallback(({ priority = 'polite' }: { priority?: 'polite' | 'assertive' }) => (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  ), [announcement])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { announce, LiveRegion }
}

/**
 * Hook for managing unique IDs for ARIA relationships
 * Ensures consistent and unique IDs across the application
 */
export function useUniqueId(prefix: string = 'pp') {
  const [id] = useState(() => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${prefix}-${timestamp}-${random}`
  })

  return id
}

/**
 * Hook for managing ARIA expanded state and related attributes
 * Useful for dropdowns, accordions, and collapsible content
 */
export function useExpandable(initialExpanded: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const triggerId = useUniqueId('trigger')
  const contentId = useUniqueId('content')

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  return {
    isExpanded,
    setIsExpanded,
    toggle,
    expand,
    collapse,
    triggerProps: {
      id: triggerId,
      'aria-expanded': isExpanded,
      'aria-controls': contentId,
    },
    contentProps: {
      id: contentId,
      'aria-labelledby': triggerId,
      hidden: !isExpanded,
    }
  }
}

/**
 * Hook for managing roving tabindex pattern
 * Useful for toolbar-like components where only one item should be tabbable
 */
export function useRovingTabIndex(itemCount: number, initialIndex: number = 0) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex)

  const getTabIndex = useCallback((index: number) => {
    return index === focusedIndex ? 0 : -1
  }, [focusedIndex])

  const setFocus = useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setFocusedIndex(index)
    }
  }, [itemCount])

  return {
    focusedIndex,
    setFocus,
    getTabIndex
  }
}

/**
 * Hook for detecting reduced motion preference
 * Helps respect user's motion preferences for animations
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for managing skip links
 * Provides functionality for keyboard users to skip to main content
 */
export function useSkipLinks() {
  const skipToMain = useCallback(() => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const skipToNavigation = useCallback(() => {
    const navigation = document.getElementById('main-navigation')
    if (navigation) {
      navigation.focus()
      navigation.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return {
    skipToMain,
    skipToNavigation
  }
}