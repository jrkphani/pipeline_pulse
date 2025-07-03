import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command as CommandIcon, Clock, Star, ArrowRight, Hash } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  CommandSeparator
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useNavigation } from '@/contexts/NavigationContext'
import { useScreenReaderAnnouncer } from '@/hooks/useAccessibility'
import { CommandPaletteItem } from '@/types/navigation.types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface RecentItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<any>
  lastUsed: Date
}

interface FavoriteItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<any>
}

// Helper function to get recent items from localStorage
const getRecentItems = (): RecentItem[] => {
  try {
    const stored = localStorage.getItem('pipeline-pulse-recent-items')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper function to save recent items to localStorage
const saveRecentItem = (item: { id: string; label: string; href: string; icon?: React.ComponentType<any> }) => {
  try {
    const recent = getRecentItems()
    const newItem: RecentItem = {
      ...item,
      lastUsed: new Date()
    }
    
    // Remove existing item if present
    const filtered = recent.filter(r => r.id !== item.id)
    
    // Add to beginning and limit to 10 items
    const updated = [newItem, ...filtered].slice(0, 10)
    
    localStorage.setItem('pipeline-pulse-recent-items', JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}

// Helper function to get favorite items from localStorage
const getFavoriteItems = (): FavoriteItem[] => {
  try {
    const stored = localStorage.getItem('pipeline-pulse-favorite-items')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const navigate = useNavigate()
  const { navigation, commandItems } = useNavigation()
  const { announce, LiveRegion } = useScreenReaderAnnouncer()

  // Load recent and favorite items on mount
  useEffect(() => {
    setRecentItems(getRecentItems())
    setFavoriteItems(getFavoriteItems())
  }, [isOpen])

  // Create comprehensive command items from all navigation items
  const allCommandItems = React.useMemo(() => {
    const items: CommandPaletteItem[] = [...commandItems]
    
    // Add all navigation items from domains
    navigation.forEach(domain => {
      domain.items.forEach(item => {
        // Skip if already exists in commandItems
        if (!items.find(ci => ci.href === item.href)) {
          items.push({
            id: item.id,
            label: item.label,
            description: item.description,
            href: item.href,
            icon: item.icon,
            keywords: [item.label.toLowerCase(), domain.label.toLowerCase()],
            section: domain.label,
            priority: 5
          })
        }
      })
    })
    
    return items
  }, [navigation, commandItems])

  // Filter and group items based on search query
  const { filteredItems, groupedItems, totalResults } = React.useMemo(() => {
    if (!query.trim()) {
      // When no query, show recent, favorites, and top items
      const topItems = allCommandItems
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8)
      
      const total = recentItems.slice(0, 5).length + favoriteItems.slice(0, 5).length + topItems.length
      
      return {
        filteredItems: [],
        groupedItems: {
          recent: recentItems.slice(0, 5),
          favorites: favoriteItems.slice(0, 5),
          top: topItems
        },
        totalResults: total
      }
    }

    const searchTerms = query.toLowerCase().split(' ')
    const filtered = allCommandItems
      .filter(item => {
        const searchText = [
          item.label,
          item.description || '',
          item.section,
          ...item.keywords
        ].join(' ').toLowerCase()

        return searchTerms.every(term => searchText.includes(term))
      })
      .sort((a, b) => calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query))
      .slice(0, 12)

    // Group filtered items by section
    const grouped = filtered.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = []
      }
      acc[item.section].push(item)
      return acc
    }, {} as Record<string, CommandPaletteItem[]>)

    return {
      filteredItems: filtered,
      groupedItems: grouped,
      totalResults: filtered.length
    }
  }, [query, allCommandItems, recentItems, favoriteItems])

  // Announce search results for screen readers
  useEffect(() => {
    if (query.trim()) {
      const resultsText = totalResults === 0 
        ? 'No results found'
        : `${totalResults} result${totalResults === 1 ? '' : 's'} found`
      announce(resultsText, 'polite')
    }
  }, [totalResults, query, announce])

  const calculateRelevanceScore = (item: CommandPaletteItem, searchQuery: string): number => {
    const query = searchQuery.toLowerCase()
    let score = 0

    // Exact label match gets highest score
    if (item.label.toLowerCase() === query) {
      score += 100
    } else if (item.label.toLowerCase().startsWith(query)) {
      score += 75
    } else if (item.label.toLowerCase().includes(query)) {
      score += 50
    }

    // Section match
    if (item.section.toLowerCase().includes(query)) {
      score += 30
    }

    // Keyword matches
    item.keywords.forEach(keyword => {
      if (keyword.toLowerCase() === query) {
        score += 40
      } else if (keyword.toLowerCase().includes(query)) {
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

  const handleItemSelect = useCallback((item: CommandPaletteItem | RecentItem) => {
    // Announce selection for screen readers
    announce(`Navigating to ${item.label}`, 'assertive')
    
    // Save to recent items
    saveRecentItem({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon
    })
    
    navigate(item.href)
    onClose()
    setQuery('')
  }, [navigate, onClose, announce])

  // Reset query when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  // Quick action shortcuts
  const quickActions = [
    {
      key: 'r',
      label: 'Recent',
      action: () => {
        // Focus on recent items - handled by cmdk
      }
    },
    {
      key: 'f',
      label: 'Favorites',
      action: () => {
        // Focus on favorites - handled by cmdk
      }
    }
  ]

  return (
    <>
      <LiveRegion priority="polite" />
      <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <CommandInput 
          placeholder="Search commands, pages, and features..." 
          value={query}
          onValueChange={setQuery}
          aria-describedby="command-help-text"
        />
        
        <div id="command-help-text" className="sr-only">
          Use arrow keys to navigate, Enter to select, Escape to close
        </div>
        
        <CommandList className="max-h-96">
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Hash className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              {query.trim() ? 'No results found' : 'Start typing to search...'}
            </p>
            {!query.trim() && (
              <p className="text-xs text-muted-foreground">
                Try searching for "dashboard", "revenue", or "analytics"
              </p>
            )}
          </div>
        </CommandEmpty>

        {/* Recent Items (shown when no search query) */}
        {!query.trim() && recentItems.length > 0 && (
          <CommandGroup heading="Recent" role="group" aria-label="Recently visited pages">
            {recentItems.slice(0, 5).map((item) => {
              const ItemIcon = item.icon
              return (
                <CommandItem
                  key={item.id}
                  value={`recent-${item.label}`}
                  onSelect={() => handleItemSelect(item)}
                  className="flex items-center justify-between"
                  aria-label={`Go to ${item.label} (recently visited)`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">{item.label}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Favorite Items (shown when no search query) */}
        {!query.trim() && favoriteItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Favorites">
              {favoriteItems.slice(0, 5).map((item) => {
                const ItemIcon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={`favorite-${item.label}`}
                    onSelect={() => handleItemSelect(item)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{item.label}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {/* Top Items (shown when no search query) */}
        {!query.trim() && groupedItems.top && (
          <>
            {(recentItems.length > 0 || favoriteItems.length > 0) && <CommandSeparator />}
            <CommandGroup heading="Suggestions">
              {groupedItems.top.map((item) => {
                const ItemIcon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleItemSelect(item)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {ItemIcon && (
                        <ItemIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{item.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.section}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {/* Search Results (grouped by section) */}
        {query.trim() && Object.entries(groupedItems as Record<string, CommandPaletteItem[]>).map(([section, items], index) => (
          <div key={section}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={section}>
              {items.map((item) => {
                const ItemIcon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description} ${item.section} ${item.keywords.join(' ')}`}
                    onSelect={() => handleItemSelect(item)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {ItemIcon && (
                        <ItemIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{item.label}</span>
                          {item.section && (
                            <Badge variant="secondary" className="text-xs">
                              {item.section}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CommandShortcut>⏎</CommandShortcut>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </div>
        ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}