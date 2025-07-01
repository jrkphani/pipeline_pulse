import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Command } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { commandPaletteItems } from '@/data/navigation.data'
import { CommandPaletteItem } from '@/types/navigation.types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandItemProps {
  item: CommandPaletteItem
  isSelected: boolean
  onClick: () => void
}

function CommandItem({ item, isSelected, onClick }: CommandItemProps) {
  const ItemIcon = item.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 text-left rounded-md transition-colors",
        isSelected 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-accent"
      )}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {ItemIcon && (
          <ItemIcon className="h-4 w-4 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium truncate">{item.label}</span>
            <EnhancedBadge variant="secondary" className="text-xs">
              {item.section}
            </EnhancedBadge>
          </div>
          {item.description && (
            <p className="text-sm opacity-70 truncate">{item.description}</p>
          )}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0" />
    </button>
  )
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return commandPaletteItems
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10)
    }

    const searchTerms = query.toLowerCase().split(' ')
    
    return commandPaletteItems
      .filter(item => {
        const searchText = [
          item.label,
          item.description || '',
          item.section,
          ...item.keywords
        ].join(' ').toLowerCase()

        return searchTerms.every(term => searchText.includes(term))
      })
      .sort((a, b) => {
        const aScore = calculateRelevanceScore(a, query)
        const bScore = calculateRelevanceScore(b, query)
        return bScore - aScore
      })
      .slice(0, 8)
  }, [query])

  const calculateRelevanceScore = (item: CommandPaletteItem, searchQuery: string): number => {
    const query = searchQuery.toLowerCase()
    let score = 0

    // Exact label match gets highest score
    if (item.label.toLowerCase() === query) {
      score += 100
    } else if (item.label.toLowerCase().includes(query)) {
      score += 50
    }

    // Section match
    if (item.section.toLowerCase().includes(query)) {
      score += 30
    }

    // Keyword matches
    item.keywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(query)) {
        score += 20
      }
    })

    // Description match
    if (item.description?.toLowerCase().includes(query)) {
      score += 10
    }

    // Priority boost
    score += item.priority

    return score
  }

  const handleItemSelect = (item: CommandPaletteItem) => {
    navigate(item.href)
    onClose()
    setQuery('')
    setSelectedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          handleItemSelect(filteredItems[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // This would trigger opening from parent component
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/4 w-full max-w-2xl -translate-x-1/2 transform">
        <div className="mx-4 overflow-hidden rounded-lg border bg-background shadow-lg">
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search commands, pages, and features..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ESC
              </kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query.trim() ? 'No results found' : 'Start typing to search...'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredItems.map((item, index) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    isSelected={index === selectedIndex}
                    onClick={() => handleItemSelect(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Navigate with ↑↓ keys, select with Enter</span>
              <div className="flex items-center space-x-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <Command className="h-3 w-3" />
                </kbd>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  K
                </kbd>
                <span className="ml-1">to search</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}