import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  disabled?: boolean
  preventDefault?: boolean
}

/**
 * Hook for managing global keyboard shortcuts
 * Provides a centralized way to handle application-wide keyboard navigation
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.isContentEditable
    ) {
      return
    }

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const metaMatches = !!shortcut.metaKey === !!event.metaKey
      const ctrlMatches = !!shortcut.ctrlKey === !!event.ctrlKey
      const shiftMatches = !!shortcut.shiftKey === !!event.shiftKey
      const altMatches = !!shortcut.altKey === !!event.altKey

      if (keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook for Pipeline Pulse specific keyboard shortcuts
 * Includes navigation, search, and common actions
 */
export function usePipelinePulseShortcuts(options: {
  onOpenCommandPalette?: () => void
  onToggleTheme?: () => void
  onRefreshData?: () => void
  onOpenHelp?: () => void
  enabled?: boolean
} = {}) {
  const navigate = useNavigate()
  const { 
    onOpenCommandPalette,
    onToggleTheme,
    onRefreshData,
    onOpenHelp,
    enabled = true 
  } = options

  const shortcuts: KeyboardShortcut[] = [
    // Command Palette
    {
      key: 'k',
      metaKey: true,
      description: 'Open command palette',
      action: () => onOpenCommandPalette?.()
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open command palette (Windows/Linux)',
      action: () => onOpenCommandPalette?.()
    },
    
    // Navigation shortcuts
    {
      key: '1',
      altKey: true,
      description: 'Go to Dashboard',
      action: () => navigate('/')
    },
    {
      key: '2',
      altKey: true,
      description: 'Go to CRM Sync',
      action: () => navigate('/crm-sync')
    },
    {
      key: '3',
      altKey: true,
      description: 'Go to CRM Sync',
      action: () => navigate('/crm-sync')
    },
    {
      key: '4',
      altKey: true,
      description: 'Go to O2R Tracker',
      action: () => navigate('/o2r')
    },
    {
      key: '5',
      altKey: true,
      description: 'Go to Live Sync Control',
      action: () => navigate('/live-sync')
    },

    // Data actions
    {
      key: 'r',
      metaKey: true,
      shiftKey: true,
      description: 'Refresh data',
      action: () => onRefreshData?.()
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      description: 'Refresh data (Windows/Linux)',
      action: () => onRefreshData?.()
    },

    // UI actions
    {
      key: 'd',
      metaKey: true,
      description: 'Toggle dark mode',
      action: () => onToggleTheme?.()
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Toggle dark mode (Windows/Linux)',
      action: () => onToggleTheme?.()
    },

    // Help
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts help',
      action: () => onOpenHelp?.()
    },
    {
      key: 'h',
      metaKey: true,
      description: 'Show help',
      action: () => onOpenHelp?.()
    },

    // Quick search
    {
      key: '/',
      description: 'Quick search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          onOpenCommandPalette?.()
        }
      }
    }
  ]

  useKeyboardShortcuts(shortcuts, enabled)

  return shortcuts
}

/**
 * Hook for managing table/grid keyboard navigation
 * Provides comprehensive keyboard support for data tables
 */
export function useTableKeyboardNavigation(options: {
  rowCount: number
  columnCount: number
  onCellSelect?: (row: number, col: number) => void
  onRowSelect?: (row: number) => void
  onEdit?: (row: number, col: number) => void
  enabled?: boolean
}) {
  const {
    rowCount,
    columnCount,
    onCellSelect,
    onRowSelect,
    onEdit,
    enabled = true
  } = options

  const { activeIndex, handleKeyDown, setActiveIndex } = useKeyboardNavigation(
    rowCount * columnCount,
    {
      orientation: 'grid',
      gridColumns: columnCount,
      wrap: false,
      onSelect: (index) => {
        const row = Math.floor(index / columnCount)
        const col = index % columnCount
        onCellSelect?.(row, col)
      }
    }
  )

  const enhancedHandleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    const currentRow = Math.floor(activeIndex / columnCount)
    const currentCol = activeIndex % columnCount

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        onEdit?.(currentRow, currentCol)
        break

      case ' ':
        e.preventDefault()
        onRowSelect?.(currentRow)
        break

      case 'PageDown':
        e.preventDefault()
        const nextPageRow = Math.min(currentRow + 10, rowCount - 1)
        setActiveIndex(nextPageRow * columnCount + currentCol)
        break

      case 'PageUp':
        e.preventDefault()
        const prevPageRow = Math.max(currentRow - 10, 0)
        setActiveIndex(prevPageRow * columnCount + currentCol)
        break

      default:
        handleKeyDown(e)
        break
    }
  }, [activeIndex, columnCount, rowCount, enabled, onEdit, onRowSelect, handleKeyDown, setActiveIndex])

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown: enhancedHandleKeyDown,
    getCurrentPosition: () => ({
      row: Math.floor(activeIndex / columnCount),
      col: activeIndex % columnCount
    })
  }
}

/**
 * Hook for modal/dialog keyboard management
 * Provides escape key handling and focus management
 */
export function useModalKeyboardHandling(options: {
  isOpen: boolean
  onClose: () => void
  closeOnEscape?: boolean
  closeOnBackdropClick?: boolean
}) {
  const { isOpen, onClose, closeOnEscape = true, closeOnBackdropClick = true } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'Escape' && closeOnEscape) {
      e.preventDefault()
      onClose()
    }
  }, [isOpen, closeOnEscape, onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }, [closeOnBackdropClick, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isOpen])

  return {
    handleBackdropClick
  }
}

/**
 * Hook for search/filter keyboard navigation
 * Provides keyboard support for search interfaces
 */
export function useSearchKeyboardNavigation(options: {
  results: unknown[]
  onSelect: (index: number) => void
  onClear?: () => void
  enabled?: boolean
}) {
  const { results, onSelect, onClear, enabled = true } = options

  const { activeIndex, handleKeyDown, setActiveIndex } = useKeyboardNavigation(
    results.length,
    {
      wrap: true,
      onSelect,
      onEscape: onClear
    }
  )

  const enhancedHandleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          onClear?.()
        } else {
          // Let the input handle normal backspace
        }
        break

      default:
        handleKeyDown(e)
        break
    }
  }, [enabled, handleKeyDown, onClear])

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown: enhancedHandleKeyDown
  }
}