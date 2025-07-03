import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePipelinePulseShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useReducedMotion } from '@/hooks/useAccessibility'
import KeyboardShortcutsDialog from '@/components/accessibility/KeyboardShortcutsDialog'

interface AccessibilityContextType {
  // Keyboard shortcuts
  showKeyboardShortcuts: () => void
  hideKeyboardShortcuts: () => void
  isKeyboardShortcutsOpen: boolean

  // Theme and preferences
  isDarkMode: boolean
  toggleDarkMode: () => void
  prefersReducedMotion: boolean
  
  // Focus management
  announceFocus: (message: string) => void
  setFocusedElement: (element: HTMLElement | null) => void
  focusedElement: HTMLElement | null

  // Screen reader
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void

  // High contrast mode
  isHighContrast: boolean
  toggleHighContrast: () => void

  // Font size
  fontSize: 'small' | 'medium' | 'large'
  setFontSize: (size: 'small' | 'medium' | 'large') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  // State management
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pp-dark-mode')
      if (saved) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pp-high-contrast')
      if (saved) return JSON.parse(saved)
      return window.matchMedia('(prefers-contrast: high)').matches
    }
    return false
  })
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pp-font-size')
      return (saved as 'small' | 'medium' | 'large') || 'medium'
    }
    return 'medium'
  })
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)
  const [announcements, setAnnouncements] = useState<string>('')

  const prefersReducedMotion = useReducedMotion()

  // Keyboard shortcuts handlers
  const showKeyboardShortcuts = useCallback(() => {
    setIsKeyboardShortcutsOpen(true)
  }, [])

  const hideKeyboardShortcuts = useCallback(() => {
    setIsKeyboardShortcutsOpen(false)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev
      localStorage.setItem('pp-dark-mode', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev
      localStorage.setItem('pp-high-contrast', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  const handleSetFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSize(size)
    localStorage.setItem('pp-font-size', size)
  }, [])

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(message)
    // Clear after a short delay to allow for re-announcements
    setTimeout(() => setAnnouncements(''), 1000)
  }, [])

  const announceFocus = useCallback((message: string) => {
    announceToScreenReader(`Focus moved to ${message}`, 'polite')
  }, [announceToScreenReader])

  const refreshData = useCallback(() => {
    announceToScreenReader('Refreshing data...', 'assertive')
    // Trigger refresh logic here
    window.location.reload()
  }, [announceToScreenReader])

  // Initialize keyboard shortcuts
  usePipelinePulseShortcuts({
    onOpenCommandPalette: () => {
      // This will be handled by the parent component that manages command palette
      announceToScreenReader('Opening command palette', 'assertive')
    },
    onToggleTheme: toggleDarkMode,
    onRefreshData: refreshData,
    onOpenHelp: showKeyboardShortcuts,
    enabled: !isKeyboardShortcutsOpen
  })

  // Apply theme classes
  useEffect(() => {
    const root = document.documentElement
    
    // Dark mode
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // High contrast
    if (isHighContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)
  }, [isDarkMode, isHighContrast, fontSize])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('pp-dark-mode')) {
        setIsDarkMode(e.matches)
      }
    }
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('pp-high-contrast')) {
        setIsHighContrast(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    contrastQuery.addEventListener('change', handleContrastChange)

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  const contextValue: AccessibilityContextType = {
    // Keyboard shortcuts
    showKeyboardShortcuts,
    hideKeyboardShortcuts,
    isKeyboardShortcutsOpen,

    // Theme and preferences
    isDarkMode,
    toggleDarkMode,
    prefersReducedMotion,

    // Focus management
    announceFocus,
    setFocusedElement,
    focusedElement,

    // Screen reader
    announceToScreenReader,

    // High contrast
    isHighContrast,
    toggleHighContrast,

    // Font size
    fontSize,
    setFontSize: handleSetFontSize
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen reader live region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {announcements}
      </div>

      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcutsDialog
        isOpen={isKeyboardShortcutsOpen}
        onClose={hideKeyboardShortcuts}
      />
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export default AccessibilityContext