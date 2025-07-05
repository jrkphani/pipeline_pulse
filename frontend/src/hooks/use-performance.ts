import { useEffect, useCallback, useRef, useState } from 'react';

export interface PerformanceMetrics {
  memoryUsage?: number;
  componentRenderTime?: number;
  bundleSize?: number;
  cacheHitRate?: number;
  apiResponseTime?: number;
}

export interface PerformanceThresholds {
  memoryWarning: number; // MB
  memoryError: number; // MB
  renderTimeWarning: number; // ms
  renderTimeError: number; // ms
}

const defaultThresholds: PerformanceThresholds = {
  memoryWarning: 100, // 100MB
  memoryError: 500, // 500MB
  renderTimeWarning: 16, // 16ms for 60fps
  renderTimeError: 33 // 33ms for 30fps
};

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      totalRenderTime.current += duration;

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }

      // Report to performance monitoring service in production
      if (process.env.NODE_ENV === 'production' && duration > 100) {
        // reportPerformanceMetric('component_render', {
        //   component: componentName,
        //   duration,
        //   renderCount: renderCount.current
        // });
      }
    };
  });

  const getAverageRenderTime = useCallback(() => {
    return renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0;
  }, []);

  return {
    renderCount: renderCount.current,
    averageRenderTime: getAverageRenderTime(),
    lastRenderTime: performance.now() - renderStartTime.current
  };
}

// Hook for monitoring memory usage
export function useMemoryMonitoring(thresholds: Partial<PerformanceThresholds> = {}) {
  const [memoryInfo, setMemoryInfo] = useState<PerformanceMetrics>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const finalThresholds = { ...defaultThresholds, ...thresholds };

  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      setMemoryInfo({
        memoryUsage: usedMB
      });

      // Warn about high memory usage
      if (usedMB > finalThresholds.memoryWarning) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB`);
      }

      if (usedMB > finalThresholds.memoryError) {
        console.error(`Critical memory usage: ${usedMB.toFixed(2)}MB`);
        // Could trigger memory cleanup here
      }

      return { used: usedMB, total: totalMB, limit: limitMB };
    }
    return null;
  }, [finalThresholds]);

  const startMonitoring = useCallback((interval = 5000) => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    checkMemoryUsage();
    
    intervalRef.current = setInterval(checkMemoryUsage, interval);
  }, [isMonitoring, checkMemoryUsage]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    memoryInfo,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    checkMemoryUsage
  };
}

// Hook for API performance tracking
export function useApiPerformance() {
  const [metrics, setMetrics] = useState<Map<string, number[]>>(new Map());

  const trackApiCall = useCallback((endpoint: string, duration: number) => {
    setMetrics(prev => {
      const newMetrics = new Map(prev);
      const existing = newMetrics.get(endpoint) || [];
      existing.push(duration);
      
      // Keep only last 10 measurements per endpoint
      if (existing.length > 10) {
        existing.shift();
      }
      
      newMetrics.set(endpoint, existing);
      return newMetrics;
    });
  }, []);

  const getAverageResponseTime = useCallback((endpoint: string) => {
    const times = metrics.get(endpoint) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, [metrics]);

  const getAllMetrics = useCallback(() => {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    metrics.forEach((times, endpoint) => {
      if (times.length > 0) {
        result[endpoint] = {
          average: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length,
          latest: times[times.length - 1]
        };
      }
    });
    
    return result;
  }, [metrics]);

  return {
    trackApiCall,
    getAverageResponseTime,
    getAllMetrics
  };
}

// Hook for bundle size monitoring
export function useBundleAnalysis() {
  const [bundleInfo, setBundleInfo] = useState<{
    totalSize: number;
    gzipSize: number;
    chunks: Array<{ name: string; size: number }>;
  } | null>(null);

  useEffect(() => {
    // This would typically be populated by webpack-bundle-analyzer data
    // For now, we'll simulate it
    if (process.env.NODE_ENV === 'development') {
      setBundleInfo({
        totalSize: 2.5 * 1024 * 1024, // 2.5MB
        gzipSize: 800 * 1024, // 800KB
        chunks: [
          { name: 'main', size: 1.2 * 1024 * 1024 },
          { name: 'vendor', size: 1.0 * 1024 * 1024 },
          { name: 'async-routes', size: 300 * 1024 }
        ]
      });
    }
  }, []);

  return bundleInfo;
}

// Main performance monitoring hook
export function usePerformanceMonitoring(
  componentName?: string,
  options: {
    enableMemoryMonitoring?: boolean;
    enableRenderTracking?: boolean;
    enableApiTracking?: boolean;
    memoryThresholds?: Partial<PerformanceThresholds>;
  } = {}
) {
  const {
    enableMemoryMonitoring = true,
    enableRenderTracking = true,
    enableApiTracking = true,
    memoryThresholds = {}
  } = options;

  const renderMetrics = useRenderPerformance(componentName || 'Unknown');
  const memoryMonitoring = useMemoryMonitoring(memoryThresholds);
  const apiPerformance = useApiPerformance();
  const bundleInfo = useBundleAnalysis();

  useEffect(() => {
    if (enableMemoryMonitoring) {
      memoryMonitoring.startMonitoring();
    }

    return () => {
      if (enableMemoryMonitoring) {
        memoryMonitoring.stopMonitoring();
      }
    };
  }, [enableMemoryMonitoring, memoryMonitoring]);

  const getPerformanceReport = useCallback(() => {
    return {
      component: componentName,
      render: enableRenderTracking ? {
        count: renderMetrics.renderCount,
        averageTime: renderMetrics.averageRenderTime,
        lastRenderTime: renderMetrics.lastRenderTime
      } : null,
      memory: enableMemoryMonitoring ? memoryMonitoring.memoryInfo : null,
      api: enableApiTracking ? apiPerformance.getAllMetrics() : null,
      bundle: bundleInfo
    };
  }, [
    componentName,
    enableRenderTracking,
    enableMemoryMonitoring,
    enableApiTracking,
    renderMetrics,
    memoryMonitoring.memoryInfo,
    apiPerformance,
    bundleInfo
  ]);

  return {
    renderMetrics: enableRenderTracking ? renderMetrics : null,
    memoryMonitoring: enableMemoryMonitoring ? memoryMonitoring : null,
    apiPerformance: enableApiTracking ? apiPerformance : null,
    bundleInfo,
    getPerformanceReport
  };
}

// Performance optimization utilities
export const performanceUtils = {
  // Lazy load images
  lazyLoadImage: (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // Prefetch resources
  prefetchResource: (url: string, type: 'script' | 'style' | 'fetch' = 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    document.head.appendChild(link);
  },

  // Measure function execution time
  measureExecution: <T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
      
      return result;
    }) as T;
  },

  // Check if we should show performance warnings
  shouldShowPerformanceWarnings: () => {
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('pp-debug-performance') === 'true';
  }
};