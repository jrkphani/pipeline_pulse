import React, { useState, useEffect, useMemo, useCallback } from 'react';

export interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  enabled?: boolean;
}

export interface VirtualScrollingResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollElementRef: React.RefObject<HTMLDivElement | null>;
  isScrolling: boolean;
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
): VirtualScrollingResult<T> {
  const { itemHeight, containerHeight, overscan = 5, enabled = true } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  // If virtual scrolling is disabled, render all items
  if (!enabled || items.length <= 50) {
    const allItems = items.map((item, index) => ({
      index,
      item,
      style: {
        position: 'relative' as const,
        height: itemHeight,
        width: '100%'
      }
    }));

    return {
      virtualItems: allItems,
      totalHeight: items.length * itemHeight,
      scrollElementRef,
      isScrolling: false
    };
  }

  const totalHeight = items.length * itemHeight;
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);

  // Calculate which items should be visible
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + visibleItemCount + overscan * 2,
      items.length - 1
    );
    
    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: end
    };
  }, [scrollTop, itemHeight, visibleItemCount, overscan, items.length]);

  // Create virtual items for rendering
  const virtualItems = useMemo(() => {
    const result = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
          width: '100%'
        }
      });
    }
    
    return result;
  }, [startIndex, endIndex, items, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    if (!target) return;

    setScrollTop(target.scrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set new timeout to detect scroll end
    const timeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    setScrollTimeout(timeout);
  }, [scrollTimeout]);

  // Attach scroll listener
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [handleScroll, scrollTimeout]);

  return {
    virtualItems,
    totalHeight,
    scrollElementRef,
    isScrolling
  };
}

// Performance optimization hook for heavy computations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling expensive operations
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const [lastRan, setLastRan] = useState(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        setThrottledValue(value);
        setLastRan(Date.now());
      }
    }, limit - (Date.now() - lastRan));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit, lastRan]);

  return throttledValue;
}

// Memory leak prevention for expensive operations
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: React.DependencyList
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = React.useRef(true);

  useEffect(() => {
    let cancelled = false;

    const runOperation = async () => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const result = await operation();
        
        if (!cancelled && mountedRef.current) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    runOperation();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { data, loading, error };
}