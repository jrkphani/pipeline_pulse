import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualScrolling, useDebounce, useThrottle } from '../use-virtual-scrolling'

describe('useVirtualScrolling', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: i * 10
  }))

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all items when virtualization is disabled', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems.slice(0, 10), {
        itemHeight: 50,
        containerHeight: 400,
        enabled: false
      })
    )

    expect(result.current.virtualItems).toHaveLength(10)
    expect(result.current.totalHeight).toBe(500) // 10 * 50
    expect(result.current.isScrolling).toBe(false)
  })

  it('returns all items when item count is low', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems.slice(0, 25), {
        itemHeight: 50,
        containerHeight: 400,
        enabled: true
      })
    )

    expect(result.current.virtualItems).toHaveLength(25)
    expect(result.current.totalHeight).toBe(1250) // 25 * 50
  })

  it('virtualizes large datasets', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        enabled: true
      })
    )

    // Should only render visible items + overscan
    expect(result.current.virtualItems.length).toBeLessThan(mockItems.length)
    expect(result.current.totalHeight).toBe(50000) // 1000 * 50
  })

  it('calculates virtual items with proper styles', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        enabled: true
      })
    )

    const firstItem = result.current.virtualItems[0]
    expect(firstItem).toMatchObject({
      index: 0,
      item: mockItems[0],
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        width: '100%'
      }
    })
  })

  it('handles overscan parameter', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 10,
        enabled: true
      })
    )

    // With overscan, should render more items than just visible
    const visibleItems = Math.ceil(400 / 50) // 8 visible items
    expect(result.current.virtualItems.length).toBeGreaterThan(visibleItems)
  })

  it('provides scrollElementRef', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        enabled: true
      })
    )

    expect(result.current.scrollElementRef).toBeDefined()
    expect(result.current.scrollElementRef.current).toBeNull() // Not attached in test
  })
})

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 300 })
    expect(result.current).toBe('initial') // Still old value

    // Advance timer but not enough
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('initial')

    // Advance timer past delay
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('updated')
  })

  it('cancels previous timeout on new value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    rerender({ value: 'second', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'third', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('first') // Should still be original

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('third') // Should be latest
  })
})

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throttles value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }) => useThrottle(value, limit),
      { initialProps: { value: 'initial', limit: 300 } }
    )

    expect(result.current).toBe('initial')

    // Change value rapidly
    rerender({ value: 'updated1', limit: 300 })
    expect(result.current).toBe('initial') // Should be throttled

    // Advance timer past limit
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current).toBe('updated1')
  })

  it('allows immediate first update', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }) => useThrottle(value, limit),
      { initialProps: { value: 'initial', limit: 300 } }
    )

    expect(result.current).toBe('initial')

    // First update should be immediate
    rerender({ value: 'first-update', limit: 300 })
    
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current).toBe('first-update')
  })
})